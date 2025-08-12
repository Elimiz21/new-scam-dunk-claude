import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebsocketGateway } from '../../websocket/websocket.gateway';
import { ChatPlatform, ChatImportStatus, MessageType } from '@prisma/client';
import { FileProcessorService, ProcessingProgress } from './file-processor.service';
import { WhatsAppParser } from '../parsers/whatsapp.parser';
import { TelegramParser } from '../parsers/telegram.parser';
import { ChatParser, ParsedChatData, ParserOptions } from '../interfaces/parser.interface';
import { EntityExtractor, RiskAssessment } from '../utils/entity-extractor';

export interface CreateChatImportDto {
  userId: string;
  fileName: string;
  fileSize: number;
  platform?: ChatPlatform;
}

export interface ChatImportResult {
  id: string;
  status: ChatImportStatus;
  messageCount: number;
  participantCount: number;
  overallRiskScore?: number;
  processingTime?: number;
  error?: string;
}

@Injectable()
export class ChatImportService {
  private readonly parsers: Map<ChatPlatform, ChatParser>;

  constructor(
    private prisma: PrismaService,
    private fileProcessor: FileProcessorService,
    private websocketGateway: WebsocketGateway,
    private whatsappParser: WhatsAppParser,
    private telegramParser: TelegramParser
  ) {
    this.parsers = new Map([
      [ChatPlatform.WHATSAPP, this.whatsappParser],
      [ChatPlatform.TELEGRAM, this.telegramParser],
    ]);
  }

  async createChatImport(data: CreateChatImportDto): Promise<string> {
    const chatImport = await this.prisma.chatImport.create({
      data: {
        userId: data.userId,
        platform: data.platform || ChatPlatform.OTHER,
        status: ChatImportStatus.UPLOADING,
        originalFileName: data.fileName,
        fileSize: data.fileSize,
        fileHash: '', // Will be set when file is processed
        metadata: {},
        keyFindings: [],
      },
    });

    return chatImport.id;
  }

  async processUploadedFile(
    chatImportId: string,
    file: Buffer,
    options: ParserOptions = {}
  ): Promise<void> {
    const chatImport = await this.prisma.chatImport.findUnique({
      where: { id: chatImportId },
    });

    if (!chatImport) {
      throw new NotFoundException('Chat import not found');
    }

    try {
      await this.updateStatus(chatImportId, ChatImportStatus.VALIDATING, 'Validating file...');

      // Generate file hash
      const fileHash = this.fileProcessor.generateFileHash(file);
      
      // Check for duplicate
      const existingImport = await this.prisma.chatImport.findFirst({
        where: {
          userId: chatImport.userId,
          fileHash,
          status: ChatImportStatus.COMPLETED,
        },
      });

      if (existingImport) {
        throw new BadRequestException('This file has already been imported');
      }

      // Validate file
      const validationResult = await this.fileProcessor.validateFile(
        file,
        chatImport.originalFileName
      );

      if (!validationResult.isValid) {
        throw new BadRequestException(`File validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Update chat import with detected platform and file hash
      const detectedPlatform = validationResult.detectedPlatform || chatImport.platform;
      await this.prisma.chatImport.update({
        where: { id: chatImportId },
        data: {
          platform: detectedPlatform,
          fileHash,
          processingStartedAt: new Date(),
        },
      });

      await this.updateStatus(chatImportId, ChatImportStatus.PARSING, 'Parsing chat data...');

      // Parse the file
      const parser = this.getParser(detectedPlatform);
      const parseResult = await parser.parse(file, chatImport.originalFileName, options);

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse chat file');
      }

      await this.updateStatus(chatImportId, ChatImportStatus.ANALYZING, 'Analyzing chat content...');

      // Process and save the parsed data
      await this.saveParsedData(chatImportId, parseResult.data!);

      // Perform risk analysis
      const riskAnalysis = await this.performRiskAnalysis(chatImportId, parseResult.data!);

      // Update final status
      await this.prisma.chatImport.update({
        where: { id: chatImportId },
        data: {
          status: ChatImportStatus.COMPLETED,
          processingEndedAt: new Date(),
          processingTime: Date.now() - chatImport.createdAt.getTime(),
          messageCount: parseResult.data!.messages.length,
          participantCount: parseResult.data!.participants.length,
          overallRiskScore: riskAnalysis.overallRiskScore,
          riskLevel: riskAnalysis.riskLevel,
          keyFindings: riskAnalysis.keyFindings,
          summary: riskAnalysis.summary,
          dateRange: {
            from: parseResult.data!.statistics.dateRange.from,
            to: parseResult.data!.statistics.dateRange.to,
          },
          metadata: parseResult.data!.metadata,
        },
      });

      await this.updateStatus(chatImportId, ChatImportStatus.COMPLETED, 'Analysis completed successfully');

    } catch (error) {
      await this.prisma.chatImport.update({
        where: { id: chatImportId },
        data: {
          status: ChatImportStatus.FAILED,
          errorMessage: error.message,
          processingEndedAt: new Date(),
        },
      });

      await this.updateStatus(chatImportId, ChatImportStatus.FAILED, `Failed: ${error.message}`);
      throw error;
    }
  }

  private getParser(platform: ChatPlatform): ChatParser {
    const parser = this.parsers.get(platform);
    if (!parser) {
      throw new BadRequestException(`No parser available for platform: ${platform}`);
    }
    return parser;
  }

  private async saveParsedData(chatImportId: string, data: ParsedChatData): Promise<void> {
    // Save participants
    await this.prisma.chatParticipant.createMany({
      data: data.participants.map(participant => ({
        chatImportId,
        participantId: participant.participantId,
        name: participant.name,
        username: participant.username,
        phoneNumber: participant.phoneNumber,
        avatar: participant.avatar,
        role: participant.role,
        messageCount: participant.messageCount || 0,
        firstMessage: participant.firstMessage,
        lastMessage: participant.lastMessage,
        joinedAt: participant.joinedAt,
        leftAt: participant.leftAt,
        riskScore: 0, // Will be calculated during risk analysis
        riskFlags: [],
      })),
    });

    // Save messages in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < data.messages.length; i += batchSize) {
      const batch = data.messages.slice(i, i + batchSize);
      
      await this.prisma.chatMessage.createMany({
        data: batch.map(message => ({
          chatImportId,
          messageId: message.messageId,
          timestamp: message.timestamp,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          messageType: message.messageType,
          edited: message.edited || false,
          editedAt: message.editedAt,
          deleted: message.deleted || false,
          forwarded: message.forwarded || false,
          replyToId: message.replyToId,
          threadId: message.threadId,
          urls: message.urls,
          phoneNumbers: message.phoneNumbers,
          emails: message.emails,
          walletAddresses: message.walletAddresses,
          mentions: message.mentions,
          hashtags: message.hashtags,
          riskScore: 0, // Will be calculated during risk analysis
          riskFlags: [],
          attachments: message.attachments,
        })),
      });

      // Update progress
      const progress = Math.round(((i + batch.length) / data.messages.length) * 50); // 50% of analyzing phase
      await this.updateProgress(chatImportId, ChatImportStatus.ANALYZING, progress, `Saving messages (${i + batch.length}/${data.messages.length})`);
    }
  }

  private async performRiskAnalysis(chatImportId: string, data: ParsedChatData) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { chatImportId },
      orderBy: { timestamp: 'asc' },
    });

    const participants = await this.prisma.chatParticipant.findMany({
      where: { chatImportId },
    });

    let totalRiskScore = 0;
    const keyFindings: string[] = [];
    const participantRisks = new Map<string, { score: number; flags: string[] }>();

    // Analyze each message
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const entities = EntityExtractor.extractEntities(message.content);
      
      const participant = participants.find(p => p.participantId === message.senderId);
      const senderInfo = participant ? {
        messageCount: participant.messageCount,
        timeSpan: participant.lastMessage && participant.firstMessage 
          ? participant.lastMessage.getTime() - participant.firstMessage.getTime()
          : 0,
      } : undefined;

      const riskResult = RiskAssessment.calculateMessageRisk(
        message.content,
        entities,
        message.messageType,
        senderInfo
      );

      // Update message with risk assessment
      await this.prisma.chatMessage.update({
        where: { id: message.id },
        data: {
          riskScore: riskResult.score,
          riskFlags: riskResult.flags,
        },
      });

      totalRiskScore += riskResult.score;

      // Collect high-risk findings
      if (riskResult.score > 50) {
        keyFindings.push(`High-risk message from ${message.senderName}: ${riskResult.flags.join(', ')}`);
      }

      // Update progress
      if (i % 100 === 0) {
        const progress = 50 + Math.round((i / messages.length) * 30); // 30% of analyzing phase
        await this.updateProgress(chatImportId, ChatImportStatus.ANALYZING, progress, `Analyzing messages (${i + 1}/${messages.length})`);
      }
    }

    // Analyze participants
    for (const participant of participants) {
      const participantMessages = messages.filter(m => m.senderId === participant.participantId);
      const avgRiskScore = participantMessages.length > 0 
        ? participantMessages.reduce((sum, m) => sum + m.riskScore, 0) / participantMessages.length
        : 0;
      
      const suspiciousMessageCount = participantMessages.filter(m => m.riskScore > 30).length;
      const timeSpan = participant.lastMessage && participant.firstMessage
        ? participant.lastMessage.getTime() - participant.firstMessage.getTime()
        : 0;

      const participantRisk = RiskAssessment.calculateParticipantRisk({
        messageCount: participant.messageCount,
        suspiciousMessageCount,
        avgRiskScore,
        hasPhoneNumber: !!participant.phoneNumber,
        hasUsername: !!participant.username,
        timeSpan,
      });

      participantRisks.set(participant.participantId, participantRisk);

      // Update participant with risk assessment
      await this.prisma.chatParticipant.update({
        where: { id: participant.id },
        data: {
          riskScore: participantRisk.score,
          riskFlags: participantRisk.flags,
        },
      });

      if (participantRisk.score > 60) {
        keyFindings.push(`High-risk participant ${participant.name}: ${participantRisk.flags.join(', ')}`);
      }
    }

    const overallRiskScore = messages.length > 0 ? Math.round(totalRiskScore / messages.length) : 0;
    const riskLevel = this.calculateRiskLevel(overallRiskScore);

    // Generate summary
    const summary = this.generateSummary({
      messageCount: messages.length,
      participantCount: participants.length,
      overallRiskScore,
      riskLevel,
      topRisks: Array.from(participantRisks.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
      dateRange: data.statistics.dateRange,
    });

    await this.updateProgress(chatImportId, ChatImportStatus.ANALYZING, 100, 'Risk analysis completed');

    return {
      overallRiskScore,
      riskLevel,
      keyFindings: keyFindings.slice(0, 10), // Limit to top 10 findings
      summary,
    };
  }

  private calculateRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }

  private generateSummary(analysis: {
    messageCount: number;
    participantCount: number;
    overallRiskScore: number;
    riskLevel: string;
    topRisks: Array<{ score: number; flags: string[] }>;
    dateRange: { from: Date; to: Date };
  }): string {
    const duration = Math.ceil((analysis.dateRange.to.getTime() - analysis.dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    
    let summary = `Chat analysis of ${analysis.messageCount} messages from ${analysis.participantCount} participants over ${duration} days. `;
    
    summary += `Overall risk level: ${analysis.riskLevel} (${analysis.overallRiskScore}/100). `;
    
    if (analysis.overallRiskScore > 50) {
      summary += 'Multiple suspicious indicators detected. ';
    } else if (analysis.overallRiskScore > 25) {
      summary += 'Some concerning patterns identified. ';
    } else {
      summary += 'No significant risk indicators found. ';
    }

    if (analysis.topRisks.length > 0 && analysis.topRisks[0].score > 50) {
      summary += `High-risk participants detected with concerning behavior patterns.`;
    }

    return summary;
  }

  private async updateStatus(chatImportId: string, status: ChatImportStatus, message: string): Promise<void> {
    // Emit WebSocket event for real-time updates
    this.websocketGateway.emitToUser(chatImportId, 'chat-import-status', {
      chatImportId,
      status,
      message,
      timestamp: new Date(),
    });
  }

  private async updateProgress(
    chatImportId: string, 
    status: ChatImportStatus, 
    progress: number, 
    message: string
  ): Promise<void> {
    this.websocketGateway.emitToUser(chatImportId, 'chat-import-progress', {
      chatImportId,
      status,
      progress,
      message,
      timestamp: new Date(),
    });
  }

  async getChatImportStatus(chatImportId: string): Promise<ChatImportResult> {
    const chatImport = await this.prisma.chatImport.findUnique({
      where: { id: chatImportId },
      include: {
        _count: {
          select: {
            messages: true,
            participants: true,
          },
        },
      },
    });

    if (!chatImport) {
      throw new NotFoundException('Chat import not found');
    }

    return {
      id: chatImport.id,
      status: chatImport.status,
      messageCount: chatImport._count.messages,
      participantCount: chatImport._count.participants,
      overallRiskScore: chatImport.overallRiskScore,
      processingTime: chatImport.processingTime,
      error: chatImport.errorMessage,
    };
  }

  async getChatImportResults(chatImportId: string, userId: string) {
    const chatImport = await this.prisma.chatImport.findFirst({
      where: { id: chatImportId, userId },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 100, // Limit to recent messages for performance
        },
        participants: {
          orderBy: { riskScore: 'desc' },
        },
      },
    });

    if (!chatImport) {
      throw new NotFoundException('Chat import not found');
    }

    if (chatImport.status !== ChatImportStatus.COMPLETED) {
      throw new BadRequestException('Chat import is not yet completed');
    }

    return {
      id: chatImport.id,
      status: chatImport.status,
      platform: chatImport.platform,
      messageCount: chatImport.messageCount,
      participantCount: chatImport.participantCount,
      overallRiskScore: chatImport.overallRiskScore,
      riskLevel: chatImport.riskLevel,
      summary: chatImport.summary,
      keyFindings: chatImport.keyFindings,
      dateRange: chatImport.dateRange,
      processingTime: chatImport.processingTime,
      messages: chatImport.messages,
      participants: chatImport.participants,
    };
  }

  async deleteChatImport(chatImportId: string, userId: string): Promise<void> {
    const chatImport = await this.prisma.chatImport.findFirst({
      where: { id: chatImportId, userId },
    });

    if (!chatImport) {
      throw new NotFoundException('Chat import not found');
    }

    // Delete all related data (cascade delete should handle this, but being explicit)
    await this.prisma.chatMessage.deleteMany({
      where: { chatImportId },
    });

    await this.prisma.chatParticipant.deleteMany({
      where: { chatImportId },
    });

    await this.prisma.chatImport.delete({
      where: { id: chatImportId },
    });
  }

  async getUserChatImports(userId: string, limit = 20, offset = 0) {
    const chatImports = await this.prisma.chatImport.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        status: true,
        originalFileName: true,
        fileSize: true,
        messageCount: true,
        participantCount: true,
        overallRiskScore: true,
        riskLevel: true,
        summary: true,
        createdAt: true,
        processingTime: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.chatImport.count({
      where: { userId },
    });

    return {
      chatImports,
      total,
      hasMore: offset + limit < total,
    };
  }
}