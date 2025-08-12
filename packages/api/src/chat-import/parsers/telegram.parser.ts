import { Injectable } from '@nestjs/common';
import { ChatPlatform, MessageType, ParticipantRole } from '@prisma/client';
import { ChatParser, ParsedMessage, ParsedParticipant, ParsedChatData, ParserResult, ParserOptions, MessageAttachment } from '../interfaces/parser.interface';
import { EntityExtractor } from '../utils/entity-extractor';

interface TelegramExport {
  name: string;
  type: string;
  id: number;
  messages: TelegramMessage[];
}

interface TelegramMessage {
  id: number;
  type: string;
  date: string;
  date_unixtime: number;
  from?: string;
  from_id?: string;
  text?: string | TelegramTextEntity[];
  media_type?: string;
  file?: string;
  thumbnail?: string;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  forwarded_from?: string;
  reply_to_message_id?: number;
  via_bot?: string;
  edited?: string;
  edited_unixtime?: number;
  location_information?: {
    latitude: number;
    longitude: number;
  };
  contact_information?: {
    first_name: string;
    last_name?: string;
    phone_number?: string;
  };
  poll?: {
    question: string;
    answers: Array<{
      text: string;
      voters: number;
    }>;
  };
  sticker_emoji?: string;
}

interface TelegramTextEntity {
  type: string;
  text: string;
  href?: string;
}

@Injectable()
export class TelegramParser extends ChatParser {
  readonly platform = ChatPlatform.TELEGRAM;
  readonly supportedFormats = ['.json'];
  readonly maxFileSize = 100 * 1024 * 1024; // 100MB

  canParse(file: Buffer, fileName: string, mimeType: string): boolean {
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (extension !== 'json') {
      return false;
    }

    if (file.length > this.maxFileSize) {
      return false;
    }

    // Try to parse as JSON and check if it looks like a Telegram export
    try {
      const content = file.toString('utf-8');
      const data = JSON.parse(content);
      
      return (
        data.type === 'personal_chat' ||
        data.type === 'private_supergroup' ||
        data.type === 'private_group' ||
        data.type === 'public_supergroup' ||
        data.type === 'public_channel'
      ) && Array.isArray(data.messages);
      
    } catch {
      return false;
    }
  }

  async parse(file: Buffer, fileName: string, options: ParserOptions = {}): Promise<ParserResult> {
    try {
      const content = file.toString('utf-8');
      const telegramData: TelegramExport = JSON.parse(content);

      if (!this.validateTelegramExport(telegramData)) {
        return {
          success: false,
          error: 'Invalid Telegram export format',
        };
      }

      const parseResult = await this.parseTelegramData(telegramData, options);
      
      return {
        success: true,
        data: parseResult.data,
        warnings: parseResult.warnings,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse Telegram chat: ${error.message}`,
      };
    }
  }

  private validateTelegramExport(data: any): data is TelegramExport {
    return (
      data &&
      typeof data.name === 'string' &&
      typeof data.type === 'string' &&
      Array.isArray(data.messages) &&
      data.messages.every((msg: any) => 
        typeof msg.id === 'number' &&
        typeof msg.date === 'string' &&
        typeof msg.date_unixtime === 'number'
      )
    );
  }

  private async parseTelegramData(
    telegramData: TelegramExport,
    options: ParserOptions
  ): Promise<{ data: ParsedChatData; warnings?: string[] }> {
    const messages: ParsedMessage[] = [];
    const participantsMap = new Map<string, ParsedParticipant>();
    const warnings: string[] = [];

    // Process each message
    for (const telegramMessage of telegramData.messages) {
      try {
        const parsedMessage = this.parseTelegramMessage(telegramMessage, options);
        if (parsedMessage) {
          messages.push(parsedMessage);

          // Add participant if not exists
          if (parsedMessage.senderId && !participantsMap.has(parsedMessage.senderId)) {
            const participant = this.createParticipantFromMessage(telegramMessage, parsedMessage);
            participantsMap.set(parsedMessage.senderId, participant);
          }
        }
      } catch (error) {
        warnings.push(`Failed to parse message ${telegramMessage.id}: ${error.message}`);
      }
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
        groupInfo: this.extractGroupInfo(telegramData),
      },
      statistics,
    };

    return {
      data: chatData,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private parseTelegramMessage(telegramMessage: TelegramMessage, options: ParserOptions): ParsedMessage | null {
    // Skip service messages without content
    if (!telegramMessage.from && telegramMessage.type === 'service') {
      return null;
    }

    const messageId = telegramMessage.id.toString();
    const timestamp = new Date(telegramMessage.date_unixtime * 1000);
    const senderId = this.normalizeSenderId(telegramMessage.from_id || telegramMessage.from || 'Unknown');
    const senderName = telegramMessage.from || 'Unknown';
    
    // Extract text content
    let content = this.extractTextContent(telegramMessage.text || '');
    const messageType = this.determineMessageType(telegramMessage);
    
    // Handle special message types
    if (messageType === MessageType.LOCATION && telegramMessage.location_information) {
      const { latitude, longitude } = telegramMessage.location_information;
      content = `Location: ${latitude}, ${longitude}`;
    } else if (messageType === MessageType.CONTACT && telegramMessage.contact_information) {
      const contact = telegramMessage.contact_information;
      content = `Contact: ${contact.first_name} ${contact.last_name || ''} ${contact.phone_number || ''}`.trim();
    } else if (messageType === MessageType.POLL && telegramMessage.poll) {
      content = `Poll: ${telegramMessage.poll.question}`;
    } else if (!content && telegramMessage.media_type) {
      content = `[${telegramMessage.media_type}]`;
    }

    const parsedMessage: ParsedMessage = {
      messageId,
      timestamp,
      senderId,
      senderName,
      content,
      messageType,
      edited: !!telegramMessage.edited,
      editedAt: telegramMessage.edited_unixtime ? new Date(telegramMessage.edited_unixtime * 1000) : undefined,
      forwarded: !!telegramMessage.forwarded_from,
      replyToId: telegramMessage.reply_to_message_id?.toString(),
      attachments: this.parseAttachments(telegramMessage),
      urls: [],
      phoneNumbers: [],
      emails: [],
      walletAddresses: [],
      mentions: [],
      hashtags: [],
    };

    // Extract entities if enabled
    if (options.extractEntities !== false) {
      const entities = EntityExtractor.extractEntities(content);
      parsedMessage.urls = entities.urls;
      parsedMessage.phoneNumbers = entities.phoneNumbers;
      parsedMessage.emails = entities.emails;
      parsedMessage.walletAddresses = entities.walletAddresses;
      parsedMessage.mentions = entities.mentions;
      parsedMessage.hashtags = entities.hashtags;

      // Also extract from text entities (Telegram specific)
      if (Array.isArray(telegramMessage.text)) {
        for (const entity of telegramMessage.text) {
          if (entity.type === 'text_link' && entity.href) {
            parsedMessage.urls.push(entity.href);
          } else if (entity.type === 'mention') {
            parsedMessage.mentions.push(entity.text);
          } else if (entity.type === 'hashtag') {
            parsedMessage.hashtags.push(entity.text);
          } else if (entity.type === 'phone_number') {
            parsedMessage.phoneNumbers.push(entity.text);
          } else if (entity.type === 'email') {
            parsedMessage.emails.push(entity.text);
          }
        }
      }
    }

    return parsedMessage;
  }

  private extractTextContent(text: string | TelegramTextEntity[]): string {
    if (typeof text === 'string') {
      return text;
    }

    if (Array.isArray(text)) {
      return text.map(entity => entity.text || '').join('');
    }

    return '';
  }

  private determineMessageType(telegramMessage: TelegramMessage): MessageType {
    // Service messages
    if (telegramMessage.type === 'service') {
      return MessageType.SYSTEM;
    }

    // Media types
    if (telegramMessage.media_type) {
      switch (telegramMessage.media_type) {
        case 'animation':
        case 'video_file':
          return MessageType.VIDEO;
        case 'video_message':
        case 'voice_message':
          return MessageType.VOICE_NOTE;
        case 'audio_file':
          return MessageType.AUDIO;
        case 'photo':
          return MessageType.IMAGE;
        case 'sticker':
          return MessageType.STICKER;
        default:
          return MessageType.FILE;
      }
    }

    // Special content types
    if (telegramMessage.location_information) {
      return MessageType.LOCATION;
    }

    if (telegramMessage.contact_information) {
      return MessageType.CONTACT;
    }

    if (telegramMessage.poll) {
      return MessageType.POLL;
    }

    // File attachments
    if (telegramMessage.file) {
      return MessageType.DOCUMENT;
    }

    return MessageType.TEXT;
  }

  private parseAttachments(telegramMessage: TelegramMessage): MessageAttachment[] {
    const attachments: MessageAttachment[] = [];

    if (telegramMessage.file || telegramMessage.media_type) {
      const attachment: MessageAttachment = {
        type: this.getAttachmentType(telegramMessage.media_type || 'document'),
        fileName: telegramMessage.file,
        mimeType: telegramMessage.mime_type,
        duration: telegramMessage.duration_seconds,
        dimensions: telegramMessage.width && telegramMessage.height ? {
          width: telegramMessage.width,
          height: telegramMessage.height,
        } : undefined,
        thumbnailData: telegramMessage.thumbnail,
      };

      attachments.push(attachment);
    }

    return attachments;
  }

  private getAttachmentType(mediaType: string): MessageAttachment['type'] {
    switch (mediaType) {
      case 'animation':
      case 'video_file':
        return 'video';
      case 'video_message':
      case 'voice_message':
      case 'audio_file':
        return 'audio';
      case 'photo':
        return 'image';
      case 'sticker':
        return 'sticker';
      default:
        return 'document';
    }
  }

  private createParticipantFromMessage(telegramMessage: TelegramMessage, parsedMessage: ParsedMessage): ParsedParticipant {
    return {
      participantId: parsedMessage.senderId,
      name: parsedMessage.senderName,
      username: this.extractUsername(telegramMessage.from_id),
      role: this.determineParticipantRole(telegramMessage),
      joinedAt: parsedMessage.timestamp,
    };
  }

  private extractUsername(fromId?: string): string | undefined {
    if (fromId && fromId.startsWith('user')) {
      return fromId;
    }
    return undefined;
  }

  private determineParticipantRole(telegramMessage: TelegramMessage): ParticipantRole {
    if (telegramMessage.via_bot) {
      return ParticipantRole.BOT;
    }

    // Telegram exports don't typically include admin/role information
    // This could be enhanced with additional logic
    return ParticipantRole.MEMBER;
  }

  private normalizeSenderId(identifier?: string): string {
    if (!identifier) return 'unknown';
    
    // Remove spaces and special characters, convert to lowercase
    return identifier.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  private extractGroupInfo(telegramData: TelegramExport) {
    if (telegramData.type === 'personal_chat') {
      return undefined;
    }

    return {
      id: telegramData.id?.toString() || 'unknown',
      name: telegramData.name,
      type: this.mapTelegramTypeToGeneric(telegramData.type),
    };
  }

  private mapTelegramTypeToGeneric(telegramType: string): 'group' | 'channel' | 'private' {
    switch (telegramType) {
      case 'personal_chat':
        return 'private';
      case 'public_channel':
      case 'private_channel':
        return 'channel';
      case 'private_supergroup':
      case 'public_supergroup':
      case 'private_group':
      default:
        return 'group';
    }
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