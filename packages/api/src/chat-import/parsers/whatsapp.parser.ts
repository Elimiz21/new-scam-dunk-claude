import { Injectable } from '@nestjs/common';
import { ChatPlatform, MessageType, ParticipantRole } from '@prisma/client';
import * as AdmZip from 'adm-zip';
import { ChatParser, ParsedMessage, ParsedParticipant, ParsedChatData, ParserResult, ParserOptions, MessageAttachment } from '../interfaces/parser.interface';
import { EntityExtractor } from '../utils/entity-extractor';

@Injectable()
export class WhatsAppParser extends ChatParser {
  readonly platform = ChatPlatform.WHATSAPP;
  readonly supportedFormats = ['.txt', '.zip'];
  readonly maxFileSize = 50 * 1024 * 1024; // 50MB

  private readonly messagePatterns = {
    // Standard WhatsApp format: [DD/MM/YYYY, HH:MM:SS] Contact Name: Message
    standard: /^\[(\d{1,2}\/\d{1,2}\/\d{4}), (\d{1,2}:\d{2}:\d{2})\] ([^:]+): (.+)$/,
    
    // Alternative format: DD/MM/YYYY, HH:MM - Contact Name: Message
    alternative: /^(\d{1,2}\/\d{1,2}\/\d{4}), (\d{1,2}:\d{2}) - ([^:]+): (.+)$/,
    
    // System messages: [DD/MM/YYYY, HH:MM:SS] Message (no contact name)
    system: /^\[(\d{1,2}\/\d{1,2}\/\d{4}), (\d{1,2}:\d{2}:\d{2})\] (.+)$/,
    
    // Media/attachment messages
    media: /<Media omitted>|<attached: (.+)>|<image omitted>|<video omitted>|<audio omitted>|<document omitted>/i,
    
    // Location messages
    location: /location: https:\/\/maps\.google\.com/i,
    
    // Contact messages
    contact: /contact card omitted/i,
    
    // Voice messages
    voice: /<voice message>|<audio omitted>/i,
    
    // Deleted messages
    deleted: /this message was deleted/i,
  };

  canParse(file: Buffer, fileName: string, mimeType: string): boolean {
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (!this.supportedFormats.includes(`.${extension}`)) {
      return false;
    }

    if (file.length > this.maxFileSize) {
      return false;
    }

    // For ZIP files, check if they contain WhatsApp chat files
    if (extension === 'zip') {
      try {
        const zip = new AdmZip(file);
        const entries = zip.getEntries();
        return entries.some(entry => 
          entry.entryName.toLowerCase().includes('whatsapp') ||
          entry.entryName.toLowerCase().includes('chat') ||
          entry.entryName.endsWith('.txt')
        );
      } catch {
        return false;
      }
    }

    // For TXT files, check if content matches WhatsApp format
    if (extension === 'txt') {
      const content = file.toString('utf-8').slice(0, 1000); // Check first 1000 chars
      return this.messagePatterns.standard.test(content) || 
             this.messagePatterns.alternative.test(content) ||
             content.includes('[') && content.includes(']') && content.includes(':');
    }

    return false;
  }

  async parse(file: Buffer, fileName: string, options: ParserOptions = {}): Promise<ParserResult> {
    try {
      const extension = fileName.toLowerCase().split('.').pop();
      let chatContent: string;
      let mediaFiles: Map<string, Buffer> = new Map();

      if (extension === 'zip') {
        const extractResult = await this.extractFromZip(file);
        chatContent = extractResult.chatContent;
        mediaFiles = extractResult.mediaFiles;
      } else {
        chatContent = file.toString('utf-8');
      }

      if (!chatContent) {
        return {
          success: false,
          error: 'No chat content found in the file',
        };
      }

      const parseResult = await this.parseWhatsAppContent(chatContent, mediaFiles, options);
      
      if (!parseResult.success) {
        return parseResult;
      }

      return {
        success: true,
        data: parseResult.data,
        warnings: parseResult.warnings,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse WhatsApp chat: ${error.message}`,
      };
    }
  }

  private async extractFromZip(zipBuffer: Buffer): Promise<{ chatContent: string; mediaFiles: Map<string, Buffer> }> {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    let chatContent = '';
    const mediaFiles = new Map<string, Buffer>();

    for (const entry of entries) {
      if (entry.entryName.endsWith('.txt') && !chatContent) {
        // First .txt file is likely the chat export
        chatContent = entry.getData().toString('utf-8');
      } else if (this.isMediaFile(entry.entryName)) {
        // Store media files for potential analysis
        mediaFiles.set(entry.entryName, entry.getData());
      }
    }

    return { chatContent, mediaFiles };
  }

  private isMediaFile(fileName: string): boolean {
    const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.mp3', '.m4a', '.pdf', '.doc', '.docx'];
    const extension = fileName.toLowerCase().split('.').pop();
    return mediaExtensions.includes(`.${extension}`);
  }

  private async parseWhatsAppContent(
    content: string, 
    mediaFiles: Map<string, Buffer>, 
    options: ParserOptions
  ): Promise<ParserResult> {
    const lines = content.split('\n').filter(line => line.trim());
    const messages: ParsedMessage[] = [];
    const participantsMap = new Map<string, ParsedParticipant>();
    const warnings: string[] = [];

    let currentMessage: Partial<ParsedMessage> | null = null;
    let messageIdCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Try to parse as a new message
      const messageMatch = this.parseMessageLine(line);
      
      if (messageMatch) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(this.finalizeMessage(currentMessage, messageIdCounter++, options));
        }

        // Start new message
        currentMessage = {
          messageId: messageIdCounter.toString(),
          timestamp: messageMatch.timestamp,
          senderId: this.normalizeSenderId(messageMatch.sender),
          senderName: messageMatch.sender,
          content: messageMatch.content,
          messageType: this.determineMessageType(messageMatch.content),
          attachments: [],
          urls: [],
          phoneNumbers: [],
          emails: [],
          walletAddresses: [],
          mentions: [],
          hashtags: [],
        };

        // Add participant if not exists
        if (!participantsMap.has(currentMessage.senderId)) {
          participantsMap.set(currentMessage.senderId, {
            participantId: currentMessage.senderId,
            name: currentMessage.senderName,
            role: this.determineParticipantRole(currentMessage.senderName),
            joinedAt: messageMatch.timestamp,
          });
        }

        // Extract entities if enabled
        if (options.extractEntities !== false) {
          const entities = EntityExtractor.extractEntities(messageMatch.content);
          currentMessage.urls = entities.urls;
          currentMessage.phoneNumbers = entities.phoneNumbers;
          currentMessage.emails = entities.emails;
          currentMessage.walletAddresses = entities.walletAddresses;
          currentMessage.mentions = entities.mentions;
          currentMessage.hashtags = entities.hashtags;
        }

        // Parse attachments if enabled
        if (options.parseAttachments !== false) {
          currentMessage.attachments = this.parseAttachments(messageMatch.content, mediaFiles);
        }

      } else if (currentMessage) {
        // Continuation of previous message (multiline)
        currentMessage.content += '\n' + line;
      } else {
        warnings.push(`Failed to parse line ${i + 1}: ${line.substring(0, 50)}...`);
      }
    }

    // Don't forget the last message
    if (currentMessage) {
      messages.push(this.finalizeMessage(currentMessage, messageIdCounter, options));
    }

    // Update participant statistics
    this.updateParticipantStats(participantsMap, messages);

    const participants = Array.from(participantsMap.values());
    const statistics = this.generateStatistics(messages, participants);

    const chatData: ParsedChatData = {
      messages,
      participants,
      metadata: {
        exportMethod: 'manual',
        language: options.language || 'en',
        timezone: options.timezone || 'UTC',
      },
      statistics,
    };

    return {
      success: true,
      data: chatData,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private parseMessageLine(line: string): { timestamp: Date; sender: string; content: string } | null {
    // Try standard format first
    let match = line.match(this.messagePatterns.standard);
    if (match) {
      const [, datePart, timePart, sender, content] = match;
      return {
        timestamp: this.parseWhatsAppTimestamp(datePart, timePart),
        sender: sender.trim(),
        content: content.trim(),
      };
    }

    // Try alternative format
    match = line.match(this.messagePatterns.alternative);
    if (match) {
      const [, datePart, timePart, sender, content] = match;
      return {
        timestamp: this.parseWhatsAppTimestamp(datePart, timePart),
        sender: sender.trim(),
        content: content.trim(),
      };
    }

    // Try system message format
    match = line.match(this.messagePatterns.system);
    if (match) {
      const [, datePart, timePart, content] = match;
      return {
        timestamp: this.parseWhatsAppTimestamp(datePart, timePart),
        sender: 'System',
        content: content.trim(),
      };
    }

    return null;
  }

  private parseWhatsAppTimestamp(datePart: string, timePart: string): Date {
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute, second = 0] = timePart.split(':').map(Number);
    
    return new Date(year, month - 1, day, hour, minute, second);
  }

  private determineMessageType(content: string): MessageType {
    const lowerContent = content.toLowerCase();

    if (this.messagePatterns.media.test(content)) {
      if (lowerContent.includes('image') || lowerContent.includes('photo')) {
        return MessageType.IMAGE;
      }
      if (lowerContent.includes('video')) {
        return MessageType.VIDEO;
      }
      if (lowerContent.includes('audio') || lowerContent.includes('voice')) {
        return MessageType.AUDIO;
      }
      if (lowerContent.includes('document')) {
        return MessageType.DOCUMENT;
      }
      return MessageType.FILE;
    }

    if (this.messagePatterns.location.test(content)) {
      return MessageType.LOCATION;
    }

    if (this.messagePatterns.contact.test(content)) {
      return MessageType.CONTACT;
    }

    if (this.messagePatterns.voice.test(content)) {
      return MessageType.VOICE_NOTE;
    }

    if (lowerContent.includes('sticker')) {
      return MessageType.STICKER;
    }

    // System messages
    if (content.includes('joined') || content.includes('left') || 
        content.includes('added') || content.includes('removed') ||
        content.includes('changed the subject') || content.includes('changed the group description')) {
      return MessageType.SYSTEM;
    }

    return MessageType.TEXT;
  }

  private parseAttachments(content: string, mediaFiles: Map<string, Buffer>): MessageAttachment[] {
    const attachments: MessageAttachment[] = [];

    // Check for media omitted messages
    if (this.messagePatterns.media.test(content)) {
      const type = this.getAttachmentType(content);
      attachments.push({
        type,
        fileName: 'Unknown',
      });
    }

    // Check for specific attachment references
    const attachedMatch = content.match(/<attached: (.+)>/);
    if (attachedMatch) {
      const fileName = attachedMatch[1];
      const mediaBuffer = mediaFiles.get(fileName);
      
      attachments.push({
        type: this.getAttachmentTypeFromFileName(fileName),
        fileName,
        fileSize: mediaBuffer?.length,
      });
    }

    return attachments;
  }

  private getAttachmentType(content: string): MessageAttachment['type'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('image') || lowerContent.includes('photo')) {
      return 'image';
    }
    if (lowerContent.includes('video')) {
      return 'video';
    }
    if (lowerContent.includes('audio') || lowerContent.includes('voice')) {
      return 'audio';
    }
    if (lowerContent.includes('sticker')) {
      return 'sticker';
    }
    
    return 'document';
  }

  private getAttachmentTypeFromFileName(fileName: string): MessageAttachment['type'] {
    const extension = fileName.toLowerCase().split('.').pop();
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    const audioExts = ['mp3', 'wav', 'm4a', 'ogg', 'aac'];
    
    if (imageExts.includes(extension)) return 'image';
    if (videoExts.includes(extension)) return 'video';
    if (audioExts.includes(extension)) return 'audio';
    
    return 'document';
  }

  private determineParticipantRole(senderName: string): ParticipantRole {
    if (senderName.toLowerCase() === 'system') {
      return ParticipantRole.BOT;
    }
    
    // WhatsApp doesn't provide role information in exports
    // Could be enhanced with additional logic
    return ParticipantRole.MEMBER;
  }

  private normalizeSenderId(senderName: string): string {
    // Create a consistent ID from the sender name
    return senderName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  private finalizeMessage(message: Partial<ParsedMessage>, messageId: number, options: ParserOptions): ParsedMessage {
    const finalMessage: ParsedMessage = {
      messageId: messageId.toString(),
      timestamp: message.timestamp || new Date(),
      senderId: message.senderId || 'unknown',
      senderName: message.senderName || 'Unknown',
      content: message.content || '',
      messageType: message.messageType || MessageType.TEXT,
      attachments: message.attachments || [],
      urls: message.urls || [],
      phoneNumbers: message.phoneNumbers || [],
      emails: message.emails || [],
      walletAddresses: message.walletAddresses || [],
      mentions: message.mentions || [],
      hashtags: message.hashtags || [],
    };

    // Check for deleted messages
    if (this.messagePatterns.deleted.test(finalMessage.content)) {
      finalMessage.deleted = true;
      finalMessage.content = '[This message was deleted]';
    }

    return finalMessage;
  }

  private updateParticipantStats(participantsMap: Map<string, ParsedParticipant>, messages: ParsedMessage[]): void {
    // Reset message counts
    for (const participant of participantsMap.values()) {
      participant.messageCount = 0;
    }

    // Count messages and update timestamps
    for (const message of messages) {
      const participant = participantsMap.get(message.senderId);
      if (participant) {
        participant.messageCount++;
        
        if (!participant.firstMessage || message.timestamp < participant.firstMessage) {
          participant.firstMessage = message.timestamp;
        }
        
        if (!participant.lastMessage || message.timestamp > participant.lastMessage) {
          participant.lastMessage = message.timestamp;
        }
      }
    }
  }
}