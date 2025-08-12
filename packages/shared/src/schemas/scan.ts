import { z } from 'zod';
import { baseEntitySchema, riskScoreSchema } from './common';

export const scanTypeSchema = z.enum(['text', 'url', 'image', 'chat_import', 'file']);
export const scanStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']);

export const messageAttachmentSchema = z.object({
  type: z.enum(['image', 'document', 'audio', 'video']),
  fileName: z.string(),
  fileSize: z.number().optional(),
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  content: z.string(),
  timestamp: z.date(),
  messageType: z.enum(['text', 'image', 'file', 'link', 'contact']),
  attachments: z.array(messageAttachmentSchema).optional(),
  replyToId: z.string().optional(),
  edited: z.boolean().optional(),
  deleted: z.boolean().optional(),
});

export const chatParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  joinedAt: z.date().optional(),
  leftAt: z.date().optional(),
  role: z.enum(['admin', 'member', 'bot']).optional(),
});

export const chatImportDataSchema = z.object({
  platform: z.enum(['telegram', 'whatsapp', 'discord', 'other']),
  messages: z.array(chatMessageSchema),
  participants: z.array(chatParticipantSchema),
  groupInfo: z.object({
    name: z.string(),
    description: z.string().optional(),
    memberCount: z.number(),
    createdAt: z.date().optional(),
  }).optional(),
});

export const scanInputSchema = z.object({
  content: z.string().optional(),
  url: z.string().url().optional(),
  imageData: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  chatData: chatImportDataSchema.optional(),
  additionalContext: z.string().optional(),
});

export const flaggedElementSchema = z.object({
  type: z.enum(['text', 'url', 'phone', 'email', 'wallet', 'image']),
  content: z.string(),
  position: z.object({
    start: z.number(),
    end: z.number(),
  }).optional(),
  riskScore: riskScoreSchema,
  description: z.string(),
});

export const scanMetadataSchema = z.object({
  source: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  processingStartedAt: z.date().optional(),
  processingCompletedAt: z.date().optional(),
  aiModelVersion: z.string().optional(),
  blockchainChecksPerformed: z.array(z.string()).optional(),
  externalServicesUsed: z.array(z.string()).optional(),
});

export const scanResultSchema = z.object({
  riskScore: riskScoreSchema,
  detections: z.array(z.any()), // Will be defined in detection schema
  summary: z.string(),
  recommendations: z.array(z.string()),
  processingTime: z.number(),
  confidence: z.number().min(0).max(1),
  flaggedElements: z.array(flaggedElementSchema),
});

export const scanSchema = baseEntitySchema.extend({
  userId: z.string(),
  type: scanTypeSchema,
  status: scanStatusSchema,
  input: scanInputSchema,
  result: scanResultSchema.optional(),
  metadata: scanMetadataSchema,
  tags: z.array(z.string()).optional(),
});

export const createScanRequestSchema = z.object({
  type: scanTypeSchema,
  input: scanInputSchema,
  additionalContext: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => {
  // Validate that the input matches the scan type
  switch (data.type) {
    case 'text':
      return data.input.content !== undefined;
    case 'url':
      return data.input.url !== undefined;
    case 'image':
      return data.input.imageData !== undefined;
    case 'chat_import':
      return data.input.chatData !== undefined;
    case 'file':
      return data.input.fileName !== undefined && data.input.fileType !== undefined;
    default:
      return false;
  }
}, {
  message: 'Input must match the scan type',
  path: ['input'],
});

export const scanFiltersSchema = z.object({
  type: scanTypeSchema.optional(),
  status: scanStatusSchema.optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  tags: z.array(z.string()).optional(),
});

export const scanStatisticsSchema = z.object({
  total: z.number(),
  byType: z.record(scanTypeSchema, z.number()),
  byStatus: z.record(scanStatusSchema, z.number()),
  byRiskLevel: z.record(z.string(), z.number()),
  averageProcessingTime: z.number(),
  totalScamsDetected: z.number(),
  mostRecentScan: z.date().optional(),
});