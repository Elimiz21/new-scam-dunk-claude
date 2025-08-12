export interface ChatExport {
  id: string;
  platform: ChatPlatform;
  exportedAt: Date;
  fileSize: number;
  fileName: string;
  messageCount: number;
  participantCount: number;
  dateRange: {
    from: Date;
    to: Date;
  };
  metadata: ChatMetadata;
}

export type ChatPlatform = 'telegram' | 'whatsapp' | 'discord' | 'signal' | 'other';

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

export interface ParsedChatData {
  messages: ParsedMessage[];
  participants: ChatParticipant[];
  statistics: ChatStatistics;
  suspiciousElements: SuspiciousElement[];
}

export interface ParsedMessage {
  id: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  attachments: MessageAttachment[];
  metadata: MessageMetadata;
  risk?: {
    score: number;
    reasons: string[];
  };
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'location' | 'contact' | 'poll' | 'system';

export interface MessageMetadata {
  edited?: boolean;
  editedAt?: Date;
  deleted?: boolean;
  forwarded?: boolean;
  replyToId?: string;
  mentions?: string[];
  hashtags?: string[];
  urls?: string[];
  phoneNumbers?: string[];
  emails?: string[];
  walletAddresses?: string[];
}

export interface MessageAttachment {
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number; // for audio/video
  dimensions?: {
    width: number;
    height: number;
  };
  thumbnailData?: string;
  extractedText?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  username?: string;
  phone?: string;
  avatar?: string;
  joinedAt?: Date;
  leftAt?: Date;
  role: ParticipantRole;
  messageCount: number;
  firstMessage?: Date;
  lastMessage?: Date;
  riskScore?: number;
}

export type ParticipantRole = 'admin' | 'moderator' | 'member' | 'bot' | 'unknown';

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

export interface SuspiciousElement {
  type: 'message' | 'participant' | 'pattern';
  elementId: string;
  riskScore: number;
  reasons: string[];
  description: string;
  evidence: any;
  recommendations: string[];
}

export interface ChatAnalysisResult {
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  keyFindings: string[];
  suspiciousElements: SuspiciousElement[];
  recommendations: string[];
  reportGenerated: Date;
  processingTime: number;
}