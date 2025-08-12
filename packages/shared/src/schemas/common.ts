import { z } from 'zod';

export const sortOrderSchema = z.enum(['asc', 'desc']);

export const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const riskScoreSchema = z.object({
  score: z.number().min(0).max(100),
  level: riskLevelSchema,
  confidence: z.number().min(0).max(1),
  factors: z.array(z.object({
    type: z.string(),
    description: z.string(),
    impact: z.number().min(-100).max(100),
    confidence: z.number().min(0).max(1),
  })),
});

export const paginationSchema = z.object({
  page: z.number().positive().optional().default(1),
  limit: z.number().positive().max(100).optional().default(20),
  sort: z.object({
    field: z.string(),
    order: sortOrderSchema,
  }).optional(),
  filters: z.record(z.any()).optional(),
  search: z.string().optional(),
});

export const locationSchema = z.object({
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export const contactInfoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  social: z.array(z.object({
    platform: z.string(),
    handle: z.string(),
    verified: z.boolean(),
  })).optional(),
});

export const apiResponseSchema = <T>(dataSchema: z.ZodType<T>) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  metadata: z.object({
    timestamp: z.string(),
    requestId: z.string(),
  }).optional(),
});

export const baseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8).max(128);
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');
export const urlSchema = z.string().url();
export const uuidSchema = z.string().uuid();