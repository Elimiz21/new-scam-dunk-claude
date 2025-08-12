import { ChatPlatform, MessageType, ParticipantRole } from '@prisma/client';

export interface ParsedMessage {
  messageId: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  content: string;
  messageType: MessageType;
  edited?: boolean;
  editedAt?: Date;
  deleted?: boolean;
  forwarded?: boolean;
  replyToId?: string;
  threadId?: string;
  attachments: MessageAttachment[];
  urls: string[];
  phoneNumbers: string[];
  emails: string[];
  walletAddresses: string[];
  mentions: string[];
  hashtags: string[];
}

export interface MessageAttachment {
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  thumbnailData?: string;
  extractedText?: string;
}

export interface ParsedParticipant {
  participantId: string;
  name: string;
  username?: string;
  phoneNumber?: string;
  avatar?: string;
  role: ParticipantRole;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface ParsedChatData {
  messages: ParsedMessage[];
  participants: ParsedParticipant[];
  metadata: ChatMetadata;
  statistics: ChatStatistics;
}

export interface ChatMetadata {
  version?: string;
  exportMethod: 'manual' | 'api' | 'backup';
  encryptionType?: string;
  language?: string;
  timezone?: string;
  groupInfo?: {
    id: string;
    name: string;
    description?: string;
    type: 'group' | 'channel' | 'private';
    memberCount?: number;
    admins?: string[];
  };
}

export interface ChatStatistics {
  totalMessages: number;
  dateRange: {
    from: Date;
    to: Date;
  };
  messagesByType: Record<MessageType, number>;
  messagesByParticipant: Record<string, number>;
  messagesByDay: Array<{
    date: string;
    count: number;
  }>;
  mostActiveHours: number[];
  averageMessageLength: number;
  urlsShared: number;
  filesShared: number;
  mediaShared: number;
}

export interface ParserResult {
  success: boolean;
  data?: ParsedChatData;
  error?: string;
  warnings?: string[];
}

export interface ParserOptions {
  validateStructure?: boolean;
  extractMetadata?: boolean;
  parseAttachments?: boolean;
  extractEntities?: boolean;
  timezone?: string;
  language?: string;
}

export abstract class ChatParser {
  abstract readonly platform: ChatPlatform;
  abstract readonly supportedFormats: string[];
  abstract readonly maxFileSize: number;

  abstract canParse(file: Buffer, fileName: string, mimeType: string): boolean;
  abstract parse(file: Buffer, fileName: string, options?: ParserOptions): Promise<ParserResult>;
  
  protected extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return text.match(urlRegex) || [];
  }

  protected extractPhoneNumbers(text: string): string[] {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})|(?:\+[1-9]\d{0,3}[-.\s]?)?(?:\(\d{1,3}\)[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    return text.match(phoneRegex) || [];
  }

  protected extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  }

  protected extractWalletAddresses(text: string): string[] {
    const addresses: string[] = [];
    
    // Bitcoin addresses
    const btcRegex = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b|bc1[a-z0-9]{39,59}\b/g;
    const btcMatches = text.match(btcRegex) || [];
    addresses.push(...btcMatches);
    
    // Ethereum addresses
    const ethRegex = /0x[a-fA-F0-9]{40}\b/g;
    const ethMatches = text.match(ethRegex) || [];
    addresses.push(...ethMatches);
    
    return addresses;
  }

  protected extractMentions(text: string): string[] {
    const mentionRegex = /@\w+/g;
    return text.match(mentionRegex) || [];
  }

  protected extractHashtags(text: string): string[] {
    const hashtagRegex = /#\w+/g;
    return text.match(hashtagRegex) || [];
  }

  protected parseTimestamp(timestampStr: string, timezone?: string): Date {
    // Try different timestamp formats
    const formats = [
      // ISO format
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
      // Unix timestamp
      /^\d{10}$|^\d{13}$/,
      // WhatsApp format: [DD/MM/YYYY, HH:MM:SS]
      /^\[(\d{1,2})\/(\d{1,2})\/(\d{4}), (\d{1,2}):(\d{2}):(\d{2})\]/,
      // Telegram format: YYYY-MM-DD HH:MM:SS
      /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
    ];

    // Try parsing as ISO date first
    let date = new Date(timestampStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try Unix timestamp
    if (/^\d{10}$/.test(timestampStr)) {
      return new Date(parseInt(timestampStr) * 1000);
    }
    if (/^\d{13}$/.test(timestampStr)) {
      return new Date(parseInt(timestampStr));
    }

    // WhatsApp format
    const whatsAppMatch = timestampStr.match(/^\[(\d{1,2})\/(\d{1,2})\/(\d{4}), (\d{1,2}):(\d{2}):(\d{2})\]/);
    if (whatsAppMatch) {
      const [, day, month, year, hour, minute, second] = whatsAppMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
    }

    // Telegram format
    const telegramMatch = timestampStr.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (telegramMatch) {
      const [, year, month, day, hour, minute, second] = telegramMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
    }

    // Fallback to current date if parsing fails
    console.warn(`Failed to parse timestamp: ${timestampStr}`);
    return new Date();
  }

  protected generateStatistics(messages: ParsedMessage[], participants: ParsedParticipant[]): ChatStatistics {
    if (messages.length === 0) {
      return {
        totalMessages: 0,
        dateRange: { from: new Date(), to: new Date() },
        messagesByType: {} as Record<MessageType, number>,
        messagesByParticipant: {},
        messagesByDay: [],
        mostActiveHours: [],
        averageMessageLength: 0,
        urlsShared: 0,
        filesShared: 0,
        mediaShared: 0,
      };
    }

    const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const dateRange = {
      from: sortedMessages[0].timestamp,
      to: sortedMessages[sortedMessages.length - 1].timestamp,
    };

    const messagesByType: Record<MessageType, number> = {} as Record<MessageType, number>;
    const messagesByParticipant: Record<string, number> = {};
    const messagesByDay: Map<string, number> = new Map();
    const hourCounts: number[] = new Array(24).fill(0);
    let totalContentLength = 0;
    let urlsShared = 0;
    let filesShared = 0;
    let mediaShared = 0;

    messages.forEach(message => {
      // Count by type
      messagesByType[message.messageType] = (messagesByType[message.messageType] || 0) + 1;

      // Count by participant
      messagesByParticipant[message.senderId] = (messagesByParticipant[message.senderId] || 0) + 1;

      // Count by day
      const dayKey = message.timestamp.toISOString().split('T')[0];
      messagesByDay.set(dayKey, (messagesByDay.get(dayKey) || 0) + 1);

      // Count by hour
      hourCounts[message.timestamp.getHours()]++;

      // Content length
      totalContentLength += message.content.length;

      // Count URLs, files, media
      urlsShared += message.urls.length;
      if (message.messageType === MessageType.FILE || message.messageType === MessageType.DOCUMENT) {
        filesShared++;
      }
      if ([MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO, MessageType.VOICE_NOTE].includes(message.messageType)) {
        mediaShared++;
      }
    });

    // Find most active hours (top 3)
    const mostActiveHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    return {
      totalMessages: messages.length,
      dateRange,
      messagesByType,
      messagesByParticipant,
      messagesByDay: Array.from(messagesByDay.entries()).map(([date, count]) => ({ date, count })),
      mostActiveHours,
      averageMessageLength: totalContentLength / messages.length,
      urlsShared,
      filesShared,
      mediaShared,
    };
  }
}