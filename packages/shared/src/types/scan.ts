import { BaseEntity, RiskScore } from './common';
import { DetectionResult } from './detection';

export type ScanType = 'text' | 'url' | 'image' | 'chat_import' | 'file';

export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Scan extends BaseEntity {
  userId: string;
  type: ScanType;
  status: ScanStatus;
  input: ScanInput;
  result?: ScanResult;
  metadata: ScanMetadata;
  tags?: string[];
}

export interface ScanInput {
  content?: string;
  url?: string;
  imageData?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  chatData?: ChatImportData;
  additionalContext?: string;
}

export interface ChatImportData {
  platform: 'telegram' | 'whatsapp' | 'discord' | 'other';
  messages: ChatMessage[];
  participants: ChatParticipant[];
  groupInfo?: {
    name: string;
    description?: string;
    memberCount: number;
    createdAt?: Date;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  messageType: 'text' | 'image' | 'file' | 'link' | 'contact';
  attachments?: MessageAttachment[];
  replyToId?: string;
  edited?: boolean;
  deleted?: boolean;
}

export interface MessageAttachment {
  type: 'image' | 'document' | 'audio' | 'video';
  fileName: string;
  fileSize?: number;
  url?: string;
  thumbnailUrl?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  username?: string;
  phone?: string;
  avatar?: string;
  joinedAt?: Date;
  leftAt?: Date;
  role?: 'admin' | 'member' | 'bot';
}

export interface ScanResult {
  riskScore: RiskScore;
  detections: DetectionResult[];
  summary: string;
  recommendations: string[];
  processingTime: number;
  confidence: number;
  flaggedElements: FlaggedElement[];
}

export interface FlaggedElement {
  type: 'text' | 'url' | 'phone' | 'email' | 'wallet' | 'image';
  content: string;
  position?: {
    start: number;
    end: number;
  };
  riskScore: RiskScore;
  description: string;
}

export interface ScanMetadata {
  source?: string;
  userAgent?: string;
  ipAddress?: string;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  aiModelVersion?: string;
  blockchainChecksPerformed?: string[];
  externalServicesUsed?: string[];
}

export interface CreateScanRequest {
  type: ScanType;
  input: ScanInput;
  additionalContext?: string;
  tags?: string[];
}

export interface ScanFilters {
  type?: ScanType;
  status?: ScanStatus;
  riskLevel?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
}

export interface ScanStatistics {
  total: number;
  byType: Record<ScanType, number>;
  byStatus: Record<ScanStatus, number>;
  byRiskLevel: Record<string, number>;
  averageProcessingTime: number;
  totalScamsDetected: number;
  mostRecentScan?: Date;
}