import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import { config } from './lib/config';
import logger from './lib/logger';
import {
  detectionDurationHistogram,
  detectionRateLimitCounter,
  detectionRequestCounter,
  metricsRegister,
  telemetryBufferGauge,
} from './lib/metrics';
import { assessContact, analyzeChat, analyzeTrading, checkVeracity, riskLevelFromScore } from './utils/detection-helpers';
import type { RiskLevel } from './utils/detection-helpers';
import {
  combineScores,
  deriveRiskLevel,
  fetchChatProvider,
  fetchContactProvider,
  fetchTradingProvider,
  fetchVeracityProvider,
  mergeFlags,
} from './services/providers';

// Load environment variables
dotenv.config();

// Initialize Supabase
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY as string)
  .replace(/[\s\n\r]+/g, '')
  .trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = config.jwtSecret;

const DEFAULT_PREFERENCES = {
  theme: 'light' as 'light' | 'dark' | 'system',
  notifications: true,
  twoFactorEnabled: false,
};

const DEFAULT_SUBSCRIPTION = {
  plan: 'free' as 'free' | 'pro' | 'family',
  status: 'active' as 'active' | 'canceled' | 'past_due',
  expiresAt: undefined as string | undefined,
};

type SupabaseUserRecord = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  phone?: string | null;
  preferences?: {
    theme?: string | null;
    notifications?: boolean | null;
    twoFactorEnabled?: boolean | null;
  } | null;
  settings?: {
    subscription?: {
      plan?: string | null;
      status?: string | null;
      expiresAt?: string | null;
    } | null;
  } | null;
  profile?: Record<string, any> | null;
};

type SanitizedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    twoFactorEnabled: boolean;
  };
  subscription: {
    plan: 'free' | 'pro' | 'family';
    status: 'active' | 'canceled' | 'past_due';
    expiresAt?: string;
  };
  profile: Record<string, any>;
};

const sanitizeUser = (user: SupabaseUserRecord): SanitizedUser => {
  const firstName = user.first_name?.trim() ?? '';
  const lastName = user.last_name?.trim() ?? '';
  const name = `${firstName} ${lastName}`.trim() || user.email;

  const preferences = {
    ...DEFAULT_PREFERENCES,
    ...(user.preferences ?? {}),
  };

  const subscriptionOverrides = user.settings?.subscription ?? {};
  const subscription = {
    ...DEFAULT_SUBSCRIPTION,
    ...subscriptionOverrides,
  };

  return {
    id: user.id,
    email: user.email,
    name,
    role: (user.role ?? 'user').toString().toLowerCase(),
    phone: user.phone ?? undefined,
    preferences: {
      theme:
        preferences.theme === 'dark' || preferences.theme === 'system'
          ? preferences.theme
          : 'light',
      notifications: Boolean(preferences.notifications),
      twoFactorEnabled: Boolean(preferences.twoFactorEnabled),
    },
    subscription: {
      plan:
        subscription.plan === 'pro' || subscription.plan === 'family'
          ? subscription.plan
          : 'free',
      status:
        subscription.status === 'canceled' || subscription.status === 'past_due'
          ? subscription.status
          : 'active',
      expiresAt: subscription.expiresAt ?? undefined,
    },
    profile: user.profile ?? {},
  };
};

type DetectionTelemetryEvent = {
  id: string;
  route: string;
  userId: string;
  createdAt: string;
  durationMs: number;
  cached: boolean;
  success: boolean;
  statusCode: number;
  error?: string;
  metadata?: Record<string, unknown>;
};

const persistTelemetryEvent = async (event: DetectionTelemetryEvent) => {
  try {
    await supabase
      .from('detection_telemetry')
      .insert([
        {
          route: event.route,
          user_id: event.userId,
          created_at: event.createdAt,
          duration_ms: event.durationMs,
          cached: event.cached,
          success: event.success,
          status_code: event.statusCode,
          error: event.error ?? null,
          metadata: event.metadata ?? null,
        },
      ]);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      logger.warn({ err: error }, 'Telemetry persistence failed');
    }
  }
};

const DETECTION_RATE_LIMIT_WINDOW_MS = 60_000;
const DETECTION_RATE_LIMIT_MAX_REQUESTS = 15;
const DETECTION_CACHE_TTL_MS = 5 * 60_000;
const MAX_TELEMETRY_EVENTS = 200;

const detectionRateWindows = new Map<string, { windowStart: number; count: number }>();
const detectionCache = new Map<string, { expiresAt: number; payload: unknown }>();
const telemetryBuffer: DetectionTelemetryEvent[] = [];

const CHAT_IMPORT_BUCKET = process.env.CHAT_IMPORT_BUCKET || 'chat-imports';
const CHAT_IMPORT_CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const CHAT_IMPORT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const CHAT_IMPORT_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const multipartUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: CHAT_IMPORT_MAX_FILE_SIZE,
  },
});

type UploadSession = {
  userId: string;
  fileName: string;
  totalSize: number;
  totalChunks: number;
  chunkSize: number;
  createdAt: number;
  chunks: Map<number, Buffer>;
};

type FallbackChatImport = {
  id: string;
  userId: string;
  status: string;
  platform: string;
  overall_risk_score: number;
  risk_level: string;
  message_count: number;
  participant_count: number;
  metadata: Record<string, unknown>;
  summary: string;
  key_findings: string[];
  created_at: string;
  updated_at: string;
  file_path: string;
};

const uploadSessions = new Map<string, UploadSession>();
const fallbackChatImports = new Map<string, FallbackChatImport>();
let chatImportBucketInitialized = false;

const ensureChatImportBucket = async () => {
  if (chatImportBucketInitialized) {
    return;
  }

  const { data: existingBucket, error: bucketError } = await supabase.storage.getBucket(CHAT_IMPORT_BUCKET);
  if (bucketError) {
    // Some self-hosted installs return a 404 error for getBucket when it doesn't exist.
    // We'll fall back to attempting creation below.
    logger.debug({ err: bucketError }, 'getBucket returned error, attempting to create bucket');
  }

  if (!existingBucket) {
    const { error: createError } = await supabase.storage.createBucket(CHAT_IMPORT_BUCKET, {
      public: false,
      fileSizeLimit: CHAT_IMPORT_MAX_FILE_SIZE,
    });

    if (createError && !/already exists/i.test(createError.message || '')) {
      throw new Error(`Unable to ensure chat import bucket: ${createError.message}`);
    }
  }

  chatImportBucketInitialized = true;
};

const cleanupStaleUploads = () => {
  const now = Date.now();
  for (const [uploadId, session] of uploadSessions.entries()) {
    if (now - session.createdAt > CHAT_IMPORT_SESSION_TTL_MS) {
      uploadSessions.delete(uploadId);
    }
  }
};

const SUPPORTED_CHAT_PLATFORMS = new Set([
  'WHATSAPP',
  'TELEGRAM',
  'DISCORD',
  'INSTAGRAM',
  'SIGNAL',
  'IMESSAGE',
  'OTHER',
]);

const normalizeChatPlatform = (value?: string | null): string => {
  if (!value) {
    return 'OTHER';
  }

  const normalised = value.toString().trim().toUpperCase();
  return SUPPORTED_CHAT_PLATFORMS.has(normalised) ? normalised : 'OTHER';
};

const CONTENT_TYPE_MAP: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.log': 'text/plain',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.htm': 'text/html',
};

const guessContentType = (fileName: string) => {
  const ext = path.extname(fileName).toLowerCase();
  return CONTENT_TYPE_MAP[ext] ?? 'application/octet-stream';
};

const analyseChatImportBuffer = (buffer: Buffer) => {
  const text = buffer.toString('utf8');
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const participants = new Set<string>();
  const keywordCatalogue = ['urgent', 'wire', 'transfer', 'crypto', 'guaranteed', 'profit', 'password', 'otp', 'wallet'];
  const lower = text.toLowerCase();
  const keywordHits = keywordCatalogue.filter((keyword) => lower.includes(keyword));

  lines.forEach((line) => {
    const match = line.match(/^([^:]{1,64}):/);
    if (match) {
      participants.add(match[1].trim());
    }
  });

  const messageCount = lines.length;
  const participantCount = participants.size || (messageCount > 0 ? 1 : 0);

  let riskScore = Math.min(100, keywordHits.length * 20);
  if (messageCount > 200) {
    riskScore = Math.min(100, riskScore + 20);
  } else if (messageCount > 100) {
    riskScore = Math.min(100, riskScore + 10);
  }

  if (riskScore === 0 && messageCount > 0) {
    riskScore = 15;
  }

  const riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';
  const summary =
    riskLevel === 'HIGH'
      ? 'Conversation contains multiple high-risk indicators (keywords and volume).'
      : riskLevel === 'MEDIUM'
        ? 'Conversation includes potential risk signals. Review details carefully.'
        : 'Conversation appears low-risk based on heuristics.';

  const keyFindings = [
    `${messageCount} messages analysed`,
    `${participantCount} participants detected`,
  ];

  if (keywordHits.length) {
    keyFindings.push(`Keywords detected: ${keywordHits.join(', ')}`);
  }

  return {
    text,
    messageCount,
    participantCount,
    keywordHits,
    riskScore,
    riskLevel,
    summary,
    keyFindings,
  };
};

const persistChatImport = async (
  userId: string,
  fileName: string,
  fileBuffer: Buffer,
  options: {
    platform?: string;
    language?: string | null;
    timezone?: string | null;
    source: 'direct' | 'chunked';
    contentType?: string | null;
    startedAt?: number;
  },
) => {
  await ensureChatImportBucket();

  const startedAtMs = options.startedAt ?? Date.now();
  const finishedAtMs = Date.now();
  const processingTime = Math.max(1, finishedAtMs - startedAtMs);

  const analytics = analyseChatImportBuffer(fileBuffer);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const safeFileName = fileName.replace(/[^\w.-]+/g, '_');
  const storagePath = `${userId}/${fileHash.slice(0, 12)}-${Date.now()}-${safeFileName || 'chat-import.txt'}`;
  const contentType = options.contentType ?? guessContentType(fileName);

  const uploadResponse = await supabase.storage
    .from(CHAT_IMPORT_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (uploadResponse.error) {
    throw new Error(`Failed to upload chat transcript: ${uploadResponse.error.message}`);
  }

  const metadata: Record<string, unknown> = {
    source: options.source,
    language: options.language ?? null,
    timezone: options.timezone ?? null,
    keywords: analytics.keywordHits,
  };

  const platform = normalizeChatPlatform(options.platform);

  const { data: chatImportRecord, error: insertError } = await supabase
    .from('chat_imports')
    .insert([
      {
        user_id: userId,
        platform,
        status: 'COMPLETED',
        original_file_name: fileName,
        file_size: fileBuffer.length,
        file_path: storagePath,
        file_hash: fileHash,
        processing_started_at: new Date(startedAtMs).toISOString(),
        processing_ended_at: new Date(finishedAtMs).toISOString(),
        processing_time: processingTime,
        message_count: analytics.messageCount,
        participant_count: analytics.participantCount,
        metadata,
        overall_risk_score: analytics.riskScore,
        risk_level: analytics.riskLevel,
        key_findings: analytics.keyFindings,
        summary: analytics.summary,
      },
    ])
    .select(
      'id, status, overall_risk_score, risk_level, message_count, participant_count, metadata, summary, key_findings, created_at, updated_at, file_path',
    )
    .single();

  if (insertError || !chatImportRecord) {
    if (insertError && /chat_imports/i.test(insertError.message || '')) {
      const fallbackId = crypto.randomUUID();
      const fallbackRecord: FallbackChatImport = {
        id: fallbackId,
        userId,
        status: 'COMPLETED',
        platform,
        overall_risk_score: analytics.riskScore,
        risk_level: analytics.riskLevel,
        message_count: analytics.messageCount,
        participant_count: analytics.participantCount,
        metadata,
        summary: analytics.summary,
        key_findings: analytics.keyFindings,
        created_at: new Date(startedAtMs).toISOString(),
        updated_at: new Date(finishedAtMs).toISOString(),
        file_path: storagePath,
      };

      fallbackChatImports.set(fallbackId, fallbackRecord);
      setTimeout(() => {
        const existing = fallbackChatImports.get(fallbackId);
        if (existing && existing.userId === userId) {
          fallbackChatImports.delete(fallbackId);
        }
      }, CHAT_IMPORT_SESSION_TTL_MS);

      return {
        chatImportId: fallbackId,
        record: fallbackRecord,
        storagePath,
        fallback: true as const,
      };
    }

    throw new Error(insertError?.message || 'Failed to create chat import record');
  }

  return {
    chatImportId: chatImportRecord.id,
    record: chatImportRecord,
    storagePath,
  };
};

const recordTelemetry = (event: DetectionTelemetryEvent) => {
  telemetryBuffer.push(event);
  while (telemetryBuffer.length > MAX_TELEMETRY_EVENTS) {
    telemetryBuffer.shift();
  }

  telemetryBufferGauge.set(telemetryBuffer.length);

  const { route, userId, durationMs, cached, statusCode, success, error } = event;
  const context = JSON.stringify({ userId, cached, statusCode, success, error });
  logger.debug({ route, userId, durationMs, cached, statusCode, success, error }, 'detection telemetry');

  detectionRequestCounter.inc({
    route,
    cached: String(cached),
    statusCode: String(statusCode),
    success: String(success),
  });

  detectionDurationHistogram.observe({ route }, durationMs);

  void persistTelemetryEvent(event);
};

const createTelemetryId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');

const makeCacheKey = (route: string, userId: string, payload: unknown) => {
  return crypto
    .createHash('sha256')
    .update(`${route}|${userId}|${JSON.stringify(payload ?? {})}`)
    .digest('hex');
};

const getCachedResponse = <T>(cacheKey: string): T | null => {
  const cached = detectionCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    detectionCache.delete(cacheKey);
    return null;
  }

  return cached.payload as T;
};

const setCachedResponse = (cacheKey: string, payload: unknown) => {
  detectionCache.set(cacheKey, {
    expiresAt: Date.now() + DETECTION_CACHE_TTL_MS,
    payload,
  });
};

const enforceDetectionRateLimit = (userId: string) => {
  const window = detectionRateWindows.get(userId);
  const now = Date.now();

  if (!window || now - window.windowStart >= DETECTION_RATE_LIMIT_WINDOW_MS) {
    detectionRateWindows.set(userId, { windowStart: now, count: 1 });
    return { allowed: true } as const;
  }

  if (window.count < DETECTION_RATE_LIMIT_MAX_REQUESTS) {
    window.count += 1;
    return { allowed: true } as const;
  }

  const retryAfterMs = window.windowStart + DETECTION_RATE_LIMIT_WINDOW_MS - now;
  return { allowed: false, retryAfterMs } as const;
};

// Create Express app
const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://ocma.dev'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { error: 'Too many requests from this IP, please try again later.' }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth middleware
interface AuthRequest extends express.Request {
  user?: SanitizedUser;
  userRecord?: SupabaseUserRecord;
}

const authMiddleware = async (
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const authHeader = req.header('authorization') || req.header('Authorization');
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization required' });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, error: 'Server misconfiguration: missing JWT secret' });
    }

    const token = authHeader.substring(authHeader.indexOf(' ') + 1);

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    if (!decoded?.userId || !decoded?.email) {
      return res.status(401).json({ success: false, error: 'Invalid token payload' });
    }

    const { data: userRecord, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, preferences, settings, profile, phone')
      .eq('id', decoded.userId)
      .maybeSingle();

    if (error) {
      logger.error({ err: error }, 'Auth middleware Supabase error');
      return res.status(500).json({ success: false, error: 'Unable to load user account' });
    }

    if (!userRecord) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.userRecord = userRecord;
    req.user = sanitizeUser(userRecord);
    next();
  } catch (error) {
    logger.error({ err: error }, 'Auth middleware error');
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth routes
app.post('/api/auth/register', async (req: express.Request, res: express.Response) => {
  try {
    const { name, email, password, phone } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
    };

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, error: 'Server misconfiguration: missing JWT secret' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const emailLower = email.toLowerCase();

    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', emailLower)
      .maybeSingle();

    if (existingError && existingError.message !== 'No rows found') {
      logger.error({ err: existingError }, 'Registration lookup error');
      return res.status(500).json({ success: false, error: 'Unable to verify existing account' });
    }

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ');
    const passwordHash = await bcrypt.hash(password, 12);

    const defaultSettings = {
      subscription: { ...DEFAULT_SUBSCRIPTION },
    };

    const { data: createdUser, error } = await supabase
      .from('users')
      .insert([
        {
          email: emailLower,
          first_name: firstName,
          last_name: lastName || null,
          password_hash: passwordHash,
          phone: phone ?? null,
          role: 'user',
          preferences: { ...DEFAULT_PREFERENCES },
          settings: defaultSettings,
          created_at: new Date().toISOString(),
        },
      ])
      .select('id, email, first_name, last_name, role, preferences, settings, profile, phone')
      .single();

    if (error || !createdUser) {
      logger.error({ err: error }, 'Registration insert error');
      return res.status(500).json({ success: false, error: 'Unable to create account' });
    }

    const sanitizedUser = sanitizeUser(createdUser);
    const token = jwt.sign(
      {
        userId: sanitizedUser.id,
        email: sanitizedUser.email,
        role: sanitizedUser.role,
        name: sanitizedUser.name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ success: true, user: sanitizedUser, token });
  } catch (error) {
    logger.error({ err: error }, 'Registration error');
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, error: 'Server misconfiguration: missing JWT secret' });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const emailLower = email.toLowerCase();

    const { data: userRecord, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, preferences, settings, profile, password_hash, phone')
      .eq('email', emailLower)
      .maybeSingle();

    if (error) {
      logger.error({ err: error }, 'Login lookup error');
      return res.status(500).json({ success: false, error: 'Unable to verify credentials' });
    }

    if (!userRecord?.password_hash) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, userRecord.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const sanitizedUser = sanitizeUser(userRecord);
    const token = jwt.sign(
      {
        userId: sanitizedUser.id,
        email: sanitizedUser.email,
        role: sanitizedUser.role,
        name: sanitizedUser.name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, user: sanitizedUser, token });
  } catch (error) {
    logger.error({ err: error }, 'Login error');
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

app.get('/api/users/profile', authMiddleware, (req: AuthRequest, res: express.Response) => {
  if (!req.user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  return res.json({ success: true, user: req.user });
});

const updateUserProfile = async (req: AuthRequest, res: express.Response) => {
  if (!req.user || !req.userRecord) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const {
      name,
      preferences,
      profile,
      subscription,
      phone,
    } = req.body as {
      name?: string;
      preferences?: Partial<SanitizedUser['preferences']>;
      profile?: Record<string, any>;
      subscription?: Partial<SanitizedUser['subscription']>;
      phone?: string;
    };

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof name === 'string' && name.trim()) {
      const [firstName, ...rest] = name.trim().split(' ');
      updates.first_name = firstName;
      updates.last_name = rest.join(' ') || null;
    }

    if (typeof phone === 'string') {
      updates.phone = phone.trim();
    }

    if (preferences && typeof preferences === 'object') {
      const currentPrefs = {
        ...DEFAULT_PREFERENCES,
        ...(req.userRecord.preferences ?? {}),
      };

      if (typeof preferences.theme === 'string') {
        const theme = preferences.theme;
        currentPrefs.theme = theme === 'dark' || theme === 'system' ? theme : 'light';
      }

      if (typeof preferences.notifications === 'boolean') {
        currentPrefs.notifications = preferences.notifications;
      }

      if (typeof preferences.twoFactorEnabled === 'boolean') {
        currentPrefs.twoFactorEnabled = preferences.twoFactorEnabled;
      }

      updates.preferences = currentPrefs;
    }

    if (subscription && typeof subscription === 'object') {
      const currentSettings = req.userRecord.settings ?? {};
      const currentSubscription = {
        ...DEFAULT_SUBSCRIPTION,
        ...(currentSettings.subscription ?? {}),
      };

      if (typeof subscription.plan === 'string') {
        const plan = subscription.plan;
        currentSubscription.plan = plan === 'pro' || plan === 'family' ? plan : 'free';
      }

      if (typeof subscription.status === 'string') {
        const status = subscription.status;
        currentSubscription.status =
          status === 'canceled' || status === 'past_due' ? status : 'active';
      }

      if (typeof subscription.expiresAt === 'string' || subscription.expiresAt === undefined) {
        currentSubscription.expiresAt = subscription.expiresAt;
      }

      updates.settings = {
        ...currentSettings,
        subscription: currentSubscription,
      };
    }

    if (profile && typeof profile === 'object') {
      updates.profile = {
        ...(req.userRecord.profile ?? {}),
        ...profile,
      };
    }

    // Remove updated_at if it's the only property remaining
    const updateKeys = Object.keys(updates);
    if (updateKeys.length === 1 && updateKeys[0] === 'updated_at') {
      return res.status(400).json({ message: 'No valid profile fields supplied' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, first_name, last_name, role, preferences, settings, profile, phone')
      .single();

    if (error || !updatedUser) {
      logger.error({ err: error }, 'Profile update Supabase error');
      return res.status(500).json({ message: 'Unable to update profile' });
    }

    const sanitized = sanitizeUser(updatedUser);
    req.user = sanitized;
    req.userRecord = updatedUser;

    return res.json(sanitized);
  } catch (error) {
    logger.error({ err: error }, 'Profile update exception');
    return res.status(500).json({ message: 'Unexpected error updating profile' });
  }
};

app.patch('/api/users/profile', authMiddleware, updateUserProfile);
app.put('/api/users/profile', authMiddleware, updateUserProfile);

// Detection routes (using your existing service logic but simplified)
app.post('/api/contact-verification', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const startedAt = Date.now();
  const telemetryId = createTelemetryId();
  const userId = req.user!.id;
  const routeName = 'contact-verification';

  const rate = enforceDetectionRateLimit(userId);
  if (!rate.allowed) {
    const retryAfterMs = rate.retryAfterMs ?? DETECTION_RATE_LIMIT_WINDOW_MS;
    detectionRateLimitCounter.inc({ route: routeName });
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      cached: false,
      success: false,
      statusCode: 429,
      error: 'rate-limit',
      metadata: { retryAfterMs },
    });

    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      retryAfterMs,
    });
  }

  const cacheKey = makeCacheKey(routeName, userId, req.body);
  const cachedResult = getCachedResponse<{
    contactType: string;
    contactValue: string;
    isScammer: boolean;
    riskScore: number;
    riskLevel: string;
    confidence: number;
    verificationSources: string[];
    flags: string[];
    recommendations: string[];
    details?: string[];
  }>(cacheKey);

  if (cachedResult) {
    const durationMs = Date.now() - startedAt;
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: true,
      success: true,
      statusCode: 200,
      metadata: {
        riskScore: cachedResult.riskScore,
        source: 'cache',
      },
    });

    return res.json({ success: true, data: cachedResult, meta: { cached: true } });
  }

  try {
    const { contactType, contactValue } = req.body as {
      contactType: string;
      contactValue: string;
    };

    const assessment = assessContact(contactType, contactValue);
    let providerUsed = false;

    const result: {
      contactType: string;
      contactValue: string;
      isScammer: boolean;
      riskScore: number;
      riskLevel: RiskLevel;
      confidence: number;
      verificationSources: string[];
      flags: string[];
      recommendations: string[];
      details: string[];
    } = {
      contactType: assessment.contactType,
      contactValue: assessment.contactValue,
      isScammer: assessment.isScammer,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      confidence: assessment.confidence,
      verificationSources: assessment.verificationSources,
      flags: assessment.flags,
      recommendations: assessment.recommendations,
      details: assessment.details,
    };

    const providerResponse = await fetchContactProvider(contactType, contactValue);

    if (providerResponse) {
      providerUsed = true;

      if (typeof providerResponse.riskScore === 'number') {
        const combinedScore = combineScores(result.riskScore, providerResponse.riskScore);
        result.riskScore = combinedScore;
        result.riskLevel = deriveRiskLevel(combinedScore, result.riskLevel);
      }

      if (typeof providerResponse.confidence === 'number') {
        result.confidence = Math.max(result.confidence, providerResponse.confidence);
      }

      result.flags = mergeFlags(result.flags, providerResponse.flags);

      if (providerResponse.recommendations?.length) {
        result.recommendations = providerResponse.recommendations;
      }
    }

    const { error: insertError } = await supabase
      .from('contact_verifications')
      .insert([
        {
          contact_type: contactType,
          contact_value: contactValue,
          is_scammer: result.isScammer,
          risk_score: result.riskScore,
          risk_level: result.riskLevel,
          confidence: result.confidence,
          verification_sources: result.verificationSources,
          flags: result.flags,
          recommendations: result.recommendations,
          user_id: userId,
          recorded_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      logger.warn({ err: insertError }, 'Contact verification insert failed');
    }

    setCachedResponse(cacheKey, result);

    const durationMs = Date.now() - startedAt;
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: false,
      success: true,
      statusCode: 200,
      metadata: {
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        provider: providerUsed ? 'external' : 'heuristic',
      },
    });

    res.json({ success: true, data: result });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.error({ err: error }, 'Contact verification error');
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: false,
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'unknown-error',
    });
    res.status(500).json({ success: false, error: 'Contact verification failed' });
  }
});

app.post('/api/chat-analysis', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const startedAt = Date.now();
  const telemetryId = createTelemetryId();
  const userId = req.user!.id;
  const routeName = 'chat-analysis';

  const rate = enforceDetectionRateLimit(userId);
  if (!rate.allowed) {
    const retryAfterMs = rate.retryAfterMs ?? DETECTION_RATE_LIMIT_WINDOW_MS;
    detectionRateLimitCounter.inc({ route: routeName });
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      cached: false,
      success: false,
      statusCode: 429,
      error: 'rate-limit',
      metadata: { retryAfterMs },
    });

    return res.status(429).json({ success: false, error: 'Rate limit exceeded', retryAfterMs });
  }

 const cacheKey = makeCacheKey(routeName, userId, req.body);
 const cachedResult = getCachedResponse<{
    platform: string;
    overallRiskScore: number;
    riskLevel: string;
    confidence: number;
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    suspiciousMentions: string[];
  }>(cacheKey);

  if (cachedResult) {
    const durationMs = Date.now() - startedAt;
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: true,
      success: true,
      statusCode: 200,
      metadata: {
        source: 'cache',
        riskScore: cachedResult.overallRiskScore,
        riskLevel: cachedResult.riskLevel,
      },
    });

    return res.json({ success: true, data: cachedResult, meta: { cached: true } });
  }

  try {
    const { platform, messages } = req.body as { platform: string; messages?: { text: string }[] };

    const analysis = analyzeChat(platform, Array.isArray(messages) ? messages : []);
    let providerUsed = false;

    const result: {
      platform: string;
      overallRiskScore: number;
      riskLevel: RiskLevel;
      confidence: number;
      summary: string;
      keyFindings: string[];
      recommendations: string[];
      suspiciousMentions: string[];
    } = {
      platform: analysis.platform,
      overallRiskScore: analysis.overallRiskScore,
      riskLevel: analysis.riskLevel,
      confidence: analysis.confidence,
      summary: analysis.summary,
      keyFindings: analysis.keyFindings,
      recommendations: analysis.recommendations,
      suspiciousMentions: analysis.suspiciousMentions,
    };

    const providerResponse = await fetchChatProvider(platform, Array.isArray(messages) ? messages : []);

    if (providerResponse) {
      providerUsed = true;

      if (typeof providerResponse.overallRiskScore === 'number') {
        const combinedScore = combineScores(result.overallRiskScore, providerResponse.overallRiskScore);
        result.overallRiskScore = combinedScore;
        result.riskLevel = providerResponse.riskLevel ?? deriveRiskLevel(combinedScore, result.riskLevel);
      }

      if (typeof providerResponse.confidence === 'number') {
        result.confidence = Math.max(result.confidence, providerResponse.confidence);
      }

      if (providerResponse.summary) {
        result.summary = providerResponse.summary;
      }

      if (providerResponse.keyFindings?.length) {
        result.keyFindings = providerResponse.keyFindings;
      }

      if (providerResponse.recommendations?.length) {
        result.recommendations = providerResponse.recommendations;
      }
    }

    setCachedResponse(cacheKey, result);

    const durationMs = Date.now() - startedAt;
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: false,
      success: true,
      statusCode: 200,
      metadata: {
        riskScore: result.overallRiskScore,
        riskLevel: result.riskLevel,
        messageCount: Array.isArray(messages) ? messages.length : undefined,
        provider: providerUsed ? 'external' : 'heuristic',
      },
    });

    res.json({ success: true, data: result });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.error({ err: error }, 'Chat analysis error');
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: false,
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'unknown-error',
    });

    res.status(500).json({ success: false, error: 'Chat analysis failed' });
  }
});

app.post('/api/trading-analysis', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const startedAt = Date.now();
  const telemetryId = createTelemetryId();
  const userId = req.user!.id;
  const routeName = 'trading-analysis';

  const rate = enforceDetectionRateLimit(userId);
  if (!rate.allowed) {
    const retryAfterMs = rate.retryAfterMs ?? DETECTION_RATE_LIMIT_WINDOW_MS;
    detectionRateLimitCounter.inc({ route: routeName });
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      cached: false,
      success: false,
      statusCode: 429,
      error: 'rate-limit',
      metadata: { retryAfterMs },
    });

    return res.status(429).json({ success: false, error: 'Rate limit exceeded', retryAfterMs });
  }

  const cacheKey = makeCacheKey(routeName, userId, req.body);
  const cachedResult = getCachedResponse<{
    symbol: string;
    overallRiskScore: number;
    riskLevel: string;
    confidence: number;
    summary: string;
    keyFindings: string[];
    recommendations: string[];
  }>(cacheKey);

  if (cachedResult) {
    const durationMs = Date.now() - startedAt;
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: true,
      success: true,
      statusCode: 200,
      metadata: {
        source: 'cache',
        riskScore: cachedResult.overallRiskScore,
        riskLevel: cachedResult.riskLevel,
      },
    });

    return res.json({ success: true, data: cachedResult, meta: { cached: true } });
  }

  try {
    const { symbol } = req.body as { symbol: string };

    const assessment = analyzeTrading(symbol);
    let providerUsed = false;

    const result: {
      symbol: string;
      overallRiskScore: number;
      riskLevel: RiskLevel;
      confidence: number;
      summary: string;
      keyFindings: string[];
      recommendations: string[];
    } = {
      symbol: assessment.symbol,
      overallRiskScore: assessment.overallRiskScore,
      riskLevel: assessment.riskLevel,
      confidence: assessment.confidence,
      summary: assessment.summary,
      keyFindings: assessment.keyFindings,
      recommendations: assessment.recommendations,
    };

    const providerResponse = await fetchTradingProvider(symbol);

    if (providerResponse) {
      providerUsed = true;

      if (typeof providerResponse.riskScore === 'number') {
        const combinedScore = combineScores(result.overallRiskScore, providerResponse.riskScore);
        result.overallRiskScore = combinedScore;
        result.riskLevel = providerResponse.riskLevel ?? deriveRiskLevel(combinedScore, result.riskLevel);
      }

      if (typeof providerResponse.confidence === 'number') {
        result.confidence = Math.max(result.confidence, providerResponse.confidence);
      }

      if (providerResponse.summary) {
        result.summary = providerResponse.summary;
      }

      if (providerResponse.keyFindings?.length) {
        result.keyFindings = providerResponse.keyFindings;
      }

      if (providerResponse.recommendations?.length) {
        result.recommendations = providerResponse.recommendations;
      }
    }

    setCachedResponse(cacheKey, result);

    const durationMs = Date.now() - startedAt;
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: false,
      success: true,
      statusCode: 200,
      metadata: {
        riskScore: result.overallRiskScore,
        riskLevel: result.riskLevel,
        provider: providerUsed ? 'external' : 'heuristic',
      },
    });

    res.json({ success: true, data: result });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.error({ err: error }, 'Trading analysis error');
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: false,
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'unknown-error',
    });

    res.status(500).json({ success: false, error: 'Trading analysis failed' });
  }
});

app.post('/api/veracity-checking', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const startedAt = Date.now();
  const telemetryId = createTelemetryId();
  const userId = req.user!.id;
  const routeName = 'veracity-checking';

  const rate = enforceDetectionRateLimit(userId);
  if (!rate.allowed) {
    const retryAfterMs = rate.retryAfterMs ?? DETECTION_RATE_LIMIT_WINDOW_MS;
    detectionRateLimitCounter.inc({ route: routeName });
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      cached: false,
      success: false,
      statusCode: 429,
      error: 'rate-limit',
      metadata: { retryAfterMs },
    });

    return res.status(429).json({ success: false, error: 'Rate limit exceeded', retryAfterMs });
  }

  const cacheKey = makeCacheKey(routeName, userId, req.body);
  const cachedResult = getCachedResponse<{
    targetType: string;
    targetIdentifier: string;
    isVerified: boolean;
    verificationStatus: string;
    overallConfidence: number;
    riskLevel: string;
    summary: string;
    keyFindings: string[];
    recommendations: string[];
  }>(cacheKey);

  if (cachedResult) {
    const durationMs = Date.now() - startedAt;
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: true,
      success: true,
      statusCode: 200,
      metadata: { source: 'cache', confidence: cachedResult.overallConfidence, riskLevel: cachedResult.riskLevel },
    });

    return res.json({ success: true, data: cachedResult, meta: { cached: true } });
  }

  try {
    const { targetType, targetIdentifier } = req.body as {
      targetType: string;
      targetIdentifier: string;
    };

    const assessment = checkVeracity(targetIdentifier, targetType);
    let providerUsed = false;

    const result: {
      targetType: string;
      targetIdentifier: string;
      isVerified: boolean;
      verificationStatus: string;
      overallConfidence: number;
      riskLevel: RiskLevel;
      summary: string;
      keyFindings: string[];
      recommendations: string[];
    } = {
      targetType: assessment.targetType,
      targetIdentifier: assessment.targetIdentifier,
      isVerified: assessment.isVerified,
      verificationStatus: assessment.verificationStatus,
      overallConfidence: assessment.overallConfidence,
      riskLevel: assessment.riskLevel,
      summary: assessment.summary,
      keyFindings: assessment.keyFindings,
      recommendations: assessment.recommendations,
    };

    const providerResponse = await fetchVeracityProvider(targetType, targetIdentifier);

    if (providerResponse) {
      providerUsed = true;

      result.isVerified = providerResponse.isVerified;
      result.verificationStatus = providerResponse.verificationStatus ?? (providerResponse.isVerified ? 'VERIFIED' : 'UNVERIFIED');

      if (typeof providerResponse.overallConfidence === 'number') {
        result.overallConfidence = providerResponse.overallConfidence;
      }

      if (providerResponse.riskLevel) {
        result.riskLevel = providerResponse.riskLevel;
      }

      if (providerResponse.summary) {
        result.summary = providerResponse.summary;
      }

      if (providerResponse.keyFindings?.length) {
        result.keyFindings = providerResponse.keyFindings;
      }

      if (providerResponse.recommendations?.length) {
        result.recommendations = providerResponse.recommendations;
      }
    }

    setCachedResponse(cacheKey, result);

    const durationMs = Date.now() - startedAt;
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: false,
      success: true,
      statusCode: 200,
      metadata: {
        confidence: result.overallConfidence,
        riskLevel: result.riskLevel,
        provider: providerUsed ? 'external' : 'heuristic',
      },
    });

    res.json({ success: true, data: result });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.error({ err: error }, 'Veracity checking error');
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: false,
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'unknown-error',
    });

    res.status(500).json({ success: false, error: 'Veracity checking failed' });
  }
});

app.post('/api/chat-import/upload', authMiddleware, multipartUpload.single('file'), async (req: AuthRequest, res: express.Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authorization required' });
  }

  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file || !file.buffer) {
    return res.status(400).json({ success: false, error: 'File is required' });
  }

  try {
    const { platform, language, timezone } = (req.body ?? {}) as Record<string, string | undefined>;
    const startedAt = Date.now();
    const result = await persistChatImport(user.id, file.originalname || 'chat-import.txt', file.buffer, {
      platform,
      language: language ?? null,
      timezone: timezone ?? null,
      source: 'direct',
      contentType: file.mimetype || guessContentType(file.originalname || 'chat-import.txt'),
      startedAt,
    });

    res.json({
      success: true,
      data: {
        chatImportId: result.chatImportId,
        status: result.record.status,
        summary: result.record.summary,
        riskLevel: result.record.risk_level,
        riskScore: result.record.overall_risk_score,
        message: 'Upload processed successfully.',
        filePath: result.storagePath,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Chat import upload failed');
    const message = error instanceof Error ? error.message : 'Unable to process chat upload';
    res.status(400).json({ success: false, error: message });
  }
});

app.post('/api/chat-import/initialize', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authorization required' });
  }

  const { fileName, totalSize } = req.body as { fileName?: string; totalSize?: number };

  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ success: false, error: 'fileName is required' });
  }

  if (typeof totalSize !== 'number' || Number.isNaN(totalSize) || totalSize <= 0) {
    return res.status(400).json({ success: false, error: 'totalSize must be a positive number' });
  }

  cleanupStaleUploads();

  const uploadId = crypto.randomUUID();
  const chunkSize = CHAT_IMPORT_CHUNK_SIZE;
  const totalChunks = Math.max(1, Math.ceil(totalSize / chunkSize));

  uploadSessions.set(uploadId, {
    userId: user.id,
    fileName,
    totalSize,
    totalChunks,
    chunkSize,
    createdAt: Date.now(),
    chunks: new Map(),
  });

  res.json({
    success: true,
    data: {
      uploadId,
      chunkSize,
      totalChunks,
    },
  });
});

app.post(
  '/api/chat-import/upload-chunk/:uploadId/:chunkIndex',
  authMiddleware,
  multipartUpload.single('chunk'),
  async (req: AuthRequest, res: express.Response) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authorization required' });
    }

    const { uploadId, chunkIndex: chunkIndexParam } = req.params;

    cleanupStaleUploads();

    const chunkIndex = Number(chunkIndexParam);
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return res.status(400).json({ success: false, error: 'Invalid chunk index' });
    }

    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Upload session not found' });
    }

    if (session.userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Upload session belongs to a different user' });
    }

    if (chunkIndex >= session.totalChunks) {
      return res.status(400).json({ success: false, error: 'Chunk index exceeds expected total' });
    }

    const chunkFile = (req as any).file as Express.Multer.File | undefined;
    if (!chunkFile || !chunkFile.buffer) {
      return res.status(400).json({ success: false, error: 'Chunk payload is required' });
    }

    session.chunks.set(chunkIndex, Buffer.from(chunkFile.buffer));

    const progressRatio = session.chunks.size / session.totalChunks;
    const progress = Math.min(100, Math.round(progressRatio * 100));
    const isComplete = session.chunks.size === session.totalChunks;

    res.json({
      success: true,
      data: {
        uploadId,
        chunkIndex,
        progress,
        isComplete,
      },
    });
  },
);

app.post('/api/chat-import/finalize', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authorization required' });
  }

  const { uploadId, platform, language, timezone } = req.body as {
    uploadId?: string;
    platform?: string;
    language?: string | null;
    timezone?: string | null;
  };

  if (!uploadId || typeof uploadId !== 'string') {
    return res.status(400).json({ success: false, error: 'uploadId is required' });
  }

  cleanupStaleUploads();

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Upload session not found' });
  }

  if (session.userId !== user.id) {
    return res.status(403).json({ success: false, error: 'Upload session belongs to a different user' });
  }

  if (session.chunks.size !== session.totalChunks) {
    return res.status(400).json({ success: false, error: 'Upload is incomplete. Missing chunks.' });
  }

  try {
    const orderedBuffers = Array.from(session.chunks.entries())
      .sort(([a], [b]) => a - b)
      .map(([, buffer]) => buffer);
    const combinedBuffer = Buffer.concat(orderedBuffers);

    const result = await persistChatImport(user.id, session.fileName, combinedBuffer, {
      platform,
      language: language ?? null,
      timezone: timezone ?? null,
      source: 'chunked',
      contentType: guessContentType(session.fileName),
      startedAt: session.createdAt,
    });

    uploadSessions.delete(uploadId);

    res.json({
      success: true,
      data: {
        chatImportId: result.chatImportId,
        status: result.record.status,
        summary: result.record.summary,
        riskLevel: result.record.risk_level,
        riskScore: result.record.overall_risk_score,
        filePath: result.storagePath,
        message: 'File upload completed. Processing finished.',
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Chat import finalize failed');
    const message = error instanceof Error ? error.message : 'Unable to finalize chat upload';
    res.status(400).json({ success: false, error: message });
  }
});

app.delete('/api/chat-import/upload/:uploadId', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authorization required' });
  }

  const { uploadId } = req.params;
  const session = uploadSessions.get(uploadId);

  if (session && session.userId !== user.id) {
    return res.status(403).json({ success: false, error: 'Upload session belongs to a different user' });
  }

  if (session) {
    uploadSessions.delete(uploadId);
  }

  res.json({
    success: true,
    data: {
      uploadId,
      cancelled: Boolean(session),
    },
  });
});

app.get('/api/chat-import/upload/:uploadId/progress', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authorization required' });
  }

  const { uploadId } = req.params;

  cleanupStaleUploads();

  const session = uploadSessions.get(uploadId);

  if (!session) {
    return res.json({
      success: true,
      data: {
        progress: 100,
        isComplete: true,
      },
    });
  }

  if (session.userId !== user.id) {
    return res.status(403).json({ success: false, error: 'Upload session belongs to a different user' });
  }

  const progressRatio = session.chunks.size / session.totalChunks;
  const progress = Math.min(100, Math.round(progressRatio * 100));
  const isComplete = session.chunks.size === session.totalChunks;

  res.json({
    success: true,
    data: {
      progress,
      isComplete,
    },
  });
});

app.get('/api/chat-import/status/:chatImportId', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authorization required' });
  }

  const { chatImportId } = req.params;

  const { data, error } = await supabase
    .from('chat_imports')
    .select(
      'id, status, platform, overall_risk_score, risk_level, message_count, participant_count, metadata, summary, key_findings, created_at, updated_at',
    )
    .eq('id', chatImportId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error && !/chat_imports/i.test(error.message || '')) {
    logger.error({ err: error }, 'Failed to fetch chat import status');
    return res.status(500).json({ success: false, error: 'Failed to load chat import status' });
  }

  let record: any = data;

  if (!record) {
    const fallback = fallbackChatImports.get(chatImportId);
    if (fallback && fallback.userId === user.id) {
      const { userId: _ignore, ...rest } = fallback;
      record = rest;
    } else {
      return res.status(404).json({ success: false, error: 'Chat import not found' });
    }
  }

  res.json({
    success: true,
    data: record,
  });
});

app.get('/api/chat-import/results/:chatImportId', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authorization required' });
  }

  const { chatImportId } = req.params;

  const { data, error } = await supabase
    .from('chat_imports')
    .select(
      'id, status, platform, overall_risk_score, risk_level, message_count, participant_count, metadata, summary, key_findings, file_path, created_at, updated_at',
    )
    .eq('id', chatImportId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error && !/chat_imports/i.test(error.message || '')) {
    logger.error({ err: error }, 'Failed to fetch chat import results');
    return res.status(500).json({ success: false, error: 'Failed to load chat import results' });
  }

  let record: any = data;

  if (!record) {
    const fallback = fallbackChatImports.get(chatImportId);
    if (fallback && fallback.userId === user.id) {
      const { userId: _ignore, ...rest } = fallback;
      record = rest;
    } else {
      return res.status(404).json({ success: false, error: 'Chat import not found' });
    }
  }

  let downloadUrl: string | null = null;
  if (record.file_path) {
    const signedUrlResponse = await supabase.storage.from(CHAT_IMPORT_BUCKET).createSignedUrl(record.file_path, 60 * 60);
    if (signedUrlResponse.error) {
      logger.warn({ err: signedUrlResponse.error }, 'Failed to create signed URL for chat import');
    } else {
      downloadUrl = signedUrlResponse.data?.signedUrl ?? null;
    }
  }

  res.json({
    success: true,
    data: {
      ...record,
      downloadUrl,
    },
  });
});

// Comprehensive scan endpoint
app.post('/api/scans/comprehensive', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  const startedAt = Date.now();
  const telemetryId = createTelemetryId();
  const userId = req.user!.id;
  const routeName = 'scans-comprehensive';

  const rate = enforceDetectionRateLimit(userId);
  if (!rate.allowed) {
    const retryAfterMs = rate.retryAfterMs ?? DETECTION_RATE_LIMIT_WINDOW_MS;
    detectionRateLimitCounter.inc({ route: routeName });
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      cached: false,
      success: false,
      statusCode: 429,
      error: 'rate-limit',
      metadata: { retryAfterMs },
    });

    return res.status(429).json({ success: false, error: 'Rate limit exceeded', retryAfterMs });
  }

  try {
    const { input } = req.body as { input?: unknown };
    
    // Create scan record
    const { data: scan, error: insertError } = await supabase
      .from('scans')
      .insert([
        {
          user_id: userId,
          type: 'COMPREHENSIVE',
          status: 'PROCESSING',
          input,
          processing_started_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError || !scan) {
      throw new Error(insertError?.message || 'Unable to create scan');
    }

    const deriveComprehensiveSummary = () => {
      const contactInput = (input as any)?.contact ?? {};
      const chatInput = (input as any)?.chat ?? {};
      const tradingInput = (input as any)?.trading ?? {};
      const veracityInput = (input as any)?.veracity ?? {};

      const contactAssessment = assessContact(
        contactInput.type ?? 'email',
        contactInput.value ?? String((input as any)?.contact ?? '')
      );
      const chatAssessment = analyzeChat(chatInput.platform ?? 'unknown', chatInput.messages ?? []);
      const tradingAssessment = analyzeTrading(tradingInput.symbol ?? 'UNKNOWN');
      const veracityAssessment = checkVeracity(veracityInput.identifier ?? 'unknown', veracityInput.type ?? 'entity');

      const riskScores = [
        contactAssessment.riskScore,
        chatAssessment.overallRiskScore,
        tradingAssessment.overallRiskScore,
        100 - veracityAssessment.overallConfidence,
      ];

      const overallRiskScore = Math.round(riskScores.reduce((acc, value) => acc + value, 0) / riskScores.length);
      const overallRiskLevel = riskLevelFromScore(overallRiskScore);

      return {
        contactAssessment,
        chatAssessment,
        tradingAssessment,
        veracityAssessment,
        overallRiskScore,
        overallRiskLevel,
      };
    };

    const comprehensive = deriveComprehensiveSummary();

    // Simulate processing
    setTimeout(async () => {
      const result = {
        contactVerification: {
          riskScore: comprehensive.contactAssessment.riskScore,
          riskLevel: comprehensive.contactAssessment.riskLevel,
        },
        chatAnalysis: {
          riskScore: comprehensive.chatAssessment.overallRiskScore,
          riskLevel: comprehensive.chatAssessment.riskLevel,
        },
        tradingAnalysis: {
          riskScore: comprehensive.tradingAssessment.overallRiskScore,
          riskLevel: comprehensive.tradingAssessment.riskLevel,
        },
        veracityChecking: {
          riskScore: 100 - comprehensive.veracityAssessment.overallConfidence,
          riskLevel: comprehensive.veracityAssessment.riskLevel,
        },
        overallRiskScore: comprehensive.overallRiskScore,
        overallRiskLevel: comprehensive.overallRiskLevel,
        recommendations:
          comprehensive.overallRiskLevel === 'HIGH'
            ? [
                'Suspend new engagements until due diligence is completed',
                'Escalate to compliance team',
                'Verify counterparties with secondary sources',
              ]
            : comprehensive.overallRiskLevel === 'MEDIUM'
              ? [
                  'Proceed with caution',
                  'Collect additional documentation',
                  'Monitor interactions closely',
                ]
              : [
                  'Maintain standard vigilance',
                  'Log findings for historical reference',
                  'Review periodically for changes',
                ],
      };

      await supabase
        .from('scans')
        .update({
          status: 'COMPLETED',
          result,
          processing_ended_at: new Date().toISOString(),
        })
        .eq('id', scan.id);
    }, 2000);

    const durationMs = Date.now() - startedAt;
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: false,
      success: true,
      statusCode: 202,
      metadata: {
        scanId: scan.id,
        overallRiskScore: comprehensive.overallRiskScore,
        overallRiskLevel: comprehensive.overallRiskLevel,
      },
    });

    res.json({
      success: true,
      data: {
        scanId: scan.id,
        status: 'PROCESSING',
        message: 'Comprehensive scan started',
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.error({ err: error }, 'Comprehensive scan error');
    recordTelemetry({
      id: telemetryId,
      route: routeName,
      userId,
      createdAt: new Date().toISOString(),
      durationMs,
      cached: false,
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'unknown-error',
    });

    res.status(500).json({ success: false, error: 'Comprehensive scan failed' });
  }
});

// Get scan results
app.get('/api/scans/:id', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    
    const { data: scan, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    res.json({
      success: true,
      data: scan
    });
  } catch (error) {
    logger.error({ err: error }, 'Get scan error');
    res.status(500).json({ error: 'Failed to retrieve scan' });
  }
});

app.get('/metrics', async (_req, res) => {
  try {
    const body = await metricsRegister.metrics();
    res.setHeader('Content-Type', metricsRegister.contentType);
    res.send(body);
  } catch (error) {
    logger.error({ err: error }, 'Failed to render metrics');
    res.status(500).send('unable to collect metrics');
  }
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err: error }, 'Unhandled server error');
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const server = app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'test') {
    logger.info(
      {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        healthCheck: `http://localhost:${PORT}/health`,
      },
      'API server started'
    );
  }
});

export { app, server };
export default app;
