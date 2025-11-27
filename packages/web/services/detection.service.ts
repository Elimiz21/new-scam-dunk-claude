import axios, { AxiosError } from 'axios';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type ApiResponse<T> =
  | { success: true; data: T; meta?: Record<string, any> }
  | { success: false; error: string };

const normalizeRiskLevel = (value: unknown, fallbackScore?: number): RiskLevel => {
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (upper === 'LOW' || upper === 'MEDIUM' || upper === 'HIGH' || upper === 'CRITICAL') {
      return upper;
    }
  }

  if (typeof fallbackScore === 'number') {
    return deriveRiskLevel(fallbackScore);
  }

  return 'LOW';
};

const deriveRiskLevel = (score: number): RiskLevel => {
  if (Number.isNaN(score)) return 'LOW';
  if (score >= 85) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
};

interface BaseDetectionResult {
  riskScore: number;
  riskLevel: RiskLevel;
  confidence?: number;
  summary?: string;
  keyFindings?: string[];
  flags?: string[];
  recommendations?: string[];
  metadata?: Record<string, any>;
  raw?: any;
}

interface ContactApiResponse {
  contactType: string;
  contactValue: string;
  isScammer: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  verificationSources: string[];
  flags: string[];
  recommendations: string[];
  details?: string[];
}

interface ChatApiResponse {
  platform: string;
  overallRiskScore: number;
  riskLevel: RiskLevel;
  confidence?: number;
  summary?: string;
  keyFindings?: string[];
  recommendations?: string[];
  suspiciousMentions?: string[];
}

interface TradingApiResponse {
  symbol: string;
  overallRiskScore: number;
  riskLevel: RiskLevel;
  confidence?: number;
  summary?: string;
  keyFindings?: string[];
  recommendations?: string[];
}

interface VeracityApiResponse {
  targetType: string;
  targetIdentifier: string;
  isVerified: boolean;
  verificationStatus?: string;
  overallConfidence?: number;
  riskLevel: RiskLevel;
  summary?: string;
  keyFindings?: string[];
  recommendations?: string[];
}

export interface ContactVerificationRequest {
  contacts: Array<{
    name?: string;
    phone?: string;
    email?: string;
    workplace?: string;
  }>;
}

export interface ChatAnalysisRequest {
  messages: string[];
  platform?: string;
  metadata?: Record<string, any>;
}

export interface TradingAnalysisRequest {
  ticker: string;
  timeframe: '1W' | '2W' | '1M' | '3M';
  assetType: 'stock' | 'crypto';
}

export interface VeracityCheckRequest {
  ticker: string;
  assetType: 'stock' | 'crypto';
  exchangeName?: string;
}

export interface ComprehensiveScanRequest {
  contacts?: ContactVerificationRequest['contacts'];
  chatContent?: string;
  ticker?: string;
  assetType?: 'stock' | 'crypto';
  enabledTests: {
    contactVerification: boolean;
    chatAnalysis: boolean;
    tradingAnalysis: boolean;
    veracityCheck: boolean;
  };
}

interface ContactCheckResult {
  type: 'email' | 'phone';
  value: string;
  result?: BaseDetectionResult & {
    isScammer?: boolean;
    verificationSources?: string[];
  };
  error?: string;
}

export interface ContactVerificationResult extends BaseDetectionResult {
  checks: ContactCheckResult[];
}

export interface ChatAnalysisResult extends BaseDetectionResult {
  platform: string;
  suspiciousMentions?: string[];
}

export interface TradingAnalysisResult extends BaseDetectionResult {
  symbol: string;
  summary: string;
  keyFindings: string[];
}

export interface VeracityCheckResult extends BaseDetectionResult {
  targetType: string;
  targetIdentifier: string;
  verificationStatus?: string;
  isVerified?: boolean;
}

export interface ComprehensiveScanResult {
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  contactVerification?: ContactVerificationResult;
  chatAnalysis?: ChatAnalysisResult;
  tradingAnalysis?: TradingAnalysisResult;
  veracityCheck?: VeracityCheckResult;
  metadata: {
    processedAt: string;
    completedChecks: string[];
  };
}

export interface StreamUpdate {
  step: 'bert' | 'pattern' | 'sentiment' | 'ensemble' | 'explanation' | 'final';
  status: 'running' | 'completed' | 'error';
  message?: string;
  result?: any;
}

declare global {
  interface Window {
    __scamDunkMocks?: {
      contactVerification?: (request: ContactVerificationRequest) => ContactVerificationResult | Promise<ContactVerificationResult>;
      chatAnalysis?: (request: ChatAnalysisRequest) => ChatAnalysisResult | Promise<ChatAnalysisResult>;
      tradingAnalysis?: (request: TradingAnalysisRequest) => TradingAnalysisResult | Promise<TradingAnalysisResult>;
      veracityCheck?: (request: VeracityCheckRequest) => VeracityCheckResult | Promise<VeracityCheckResult>;
      comprehensiveScan?: (request: ComprehensiveScanRequest) => ComprehensiveScanResult | Promise<ComprehensiveScanResult>;
    };
  }
}

class DetectionService {
  private static getMocks(): {
    contactVerification?: (request: ContactVerificationRequest) => ContactVerificationResult | Promise<ContactVerificationResult>;
    chatAnalysis?: (request: ChatAnalysisRequest) => ChatAnalysisResult | Promise<ChatAnalysisResult>;
    tradingAnalysis?: (request: TradingAnalysisRequest) => TradingAnalysisResult | Promise<TradingAnalysisResult>;
    veracityCheck?: (request: VeracityCheckRequest) => VeracityCheckResult | Promise<VeracityCheckResult>;
    comprehensiveScan?: (request: ComprehensiveScanRequest) => ComprehensiveScanResult | Promise<ComprehensiveScanResult>;
  } | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    return (window as any).__scamDunkMocks;
  }

  private readonly api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  constructor() {
    this.api.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });
  }

  private static extractData<T>(response: ApiResponse<T>): T {
    if ('success' in response && response.success) {
      return response.data;
    }

    const message = 'error' in response ? response.error : 'Request failed';
    throw new Error(message);
  }

  private static normaliseError(error: unknown): Error {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      const message = axiosError.response?.data && 'error' in axiosError.response.data
        ? axiosError.response.data.error
        : axiosError.message;
      return new Error(message || 'Request failed');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unexpected error');
  }

  async verifyContacts(request: ContactVerificationRequest): Promise<ContactVerificationResult> {
    const mock = DetectionService.getMocks()?.contactVerification;
    if (mock) {
      return Promise.resolve(mock(request));
    }

    const details = request.contacts || [];
    const queue: Array<{ type: 'email' | 'phone'; value: string }> = [];
    const seen = new Set<string>();

    details.forEach((entry) => {
      if (entry.email) {
        const key = `email:${entry.email.trim().toLowerCase()}`;
        if (!seen.has(key)) {
          queue.push({ type: 'email', value: entry.email.trim() });
          seen.add(key);
        }
      }

      if (entry.phone) {
        const phone = entry.phone.replace(/\s+/g, '');
        const key = `phone:${phone}`;
        if (!seen.has(key)) {
          queue.push({ type: 'phone', value: phone });
          seen.add(key);
        }
      }
    });

    if (queue.length === 0) {
      throw new Error('No contact details provided');
    }

    const checks = await Promise.all(
      queue.map(async ({ type, value }): Promise<ContactCheckResult> => {
        try {
          const response = await this.api.post<ApiResponse<ContactApiResponse>>('/contact-verification', {
            contactType: type,
            contactValue: value,
          });
          const data = DetectionService.extractData(response.data);
          return {
            type,
            value,
            result: {
              riskScore: data.riskScore ?? 0,
              riskLevel: normalizeRiskLevel(data.riskLevel, data.riskScore),
              confidence: data.confidence,
              summary: data.isScammer
                ? 'High-risk indicators detected for this contact.'
                : 'No critical scam indicators detected for this contact.',
              keyFindings: data.details ?? [],
              flags: data.flags ?? [],
              recommendations: data.recommendations ?? [],
              metadata: {
                contactType: data.contactType,
                verificationSources: data.verificationSources ?? [],
                isScammer: data.isScammer,
              },
              raw: data,
              isScammer: data.isScammer,
              verificationSources: data.verificationSources ?? [],
            },
          };
        } catch (error) {
          return {
            type,
            value,
            error: DetectionService.normaliseError(error).message,
          };
        }
      })
    );

    const validResults = checks.filter((check) => check.result) as Array<Required<ContactCheckResult>>;

    if (validResults.length === 0) {
      return {
        riskScore: 0,
        riskLevel: 'LOW',
        confidence: 0,
        summary: 'Unable to verify any contact details. Please try again later.',
        keyFindings: [],
        flags: [],
        recommendations: [],
        checks,
        metadata: { checkCount: checks.length },
      };
    }

    const aggregateScore = validResults.reduce((acc, current) => acc + (current.result.riskScore ?? 0), 0);
    const riskScore = Math.round(aggregateScore / validResults.length);
    const riskLevel = deriveRiskLevel(riskScore);
    const confidence = Math.round(
      Math.max(...validResults.map((check) => check.result.confidence ?? 0))
    );
    const flags = Array.from(new Set(validResults.flatMap((check) => check.result.flags ?? [])));
    const recommendations = Array.from(
      new Set(validResults.flatMap((check) => check.result.recommendations ?? []))
    );
    const keyFindings = Array.from(
      new Set(validResults.flatMap((check) => check.result.keyFindings ?? []))
    ).slice(0, 8);

    const hasHighRisk = validResults.some((check) => {
      const score = check.result.riskScore ?? 0;
      return score >= 70 || check.result.isScammer;
    });

    const summary = hasHighRisk
      ? 'Contact verification flagged significant risk indicators.'
      : riskLevel === 'MEDIUM'
        ? 'Contact verification identified cautionary signals.'
        : 'No high-risk indicators detected across provided contacts.';

    return {
      riskScore,
      riskLevel,
      confidence,
      summary,
      keyFindings,
      flags,
      recommendations,
      checks,
      metadata: {
        checkCount: checks.length,
        highestRiskScore: Math.max(...validResults.map((check) => check.result.riskScore ?? 0)),
      },
    };
  }



  async analyzeChatStream(
    request: ChatAnalysisRequest,
    onUpdate: (update: StreamUpdate) => void
  ): Promise<void> {
    const mock = DetectionService.getMocks()?.chatAnalysis;
    if (mock) {
      const result = await Promise.resolve(mock(request));
      onUpdate({ step: 'final', status: 'completed', result });
      return;
    }

    if (!request.messages || request.messages.length === 0) {
      throw new Error('At least one message is required for analysis');
    }

    const payload = {
      platform: request.platform ?? 'unknown',
      messages: request.messages.map((text) => ({ text })),
      stream: true,
    };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch(`${API_BASE_URL}/chat-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      // Check for regular JSON response (e.g. error or fallback) first
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
           // It was a successful fallback response, not a stream
           onUpdate({ step: 'final', status: 'completed', result: data.data });
           return;
        } else {
           throw new Error(data.error || 'Analysis failed');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onUpdate(data);
            } catch (e) {
              console.warn('Failed to parse SSE message:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming analysis failed:', error);
      throw error;
    }
  }

  async analyzeChat(request: ChatAnalysisRequest): Promise<ChatAnalysisResult> {
    const mock = DetectionService.getMocks()?.chatAnalysis;
    if (mock) {
      return Promise.resolve(mock(request));
    }

    if (!request.messages || request.messages.length === 0) {
      throw new Error('At least one message is required for analysis');
    }

    const payload = {
      platform: request.platform ?? 'unknown',
      messages: request.messages.map((text) => ({ text })),
    };

    const response = await this.api.post<ApiResponse<ChatApiResponse>>('/chat-analysis', payload);
    const data = DetectionService.extractData(response.data);

    const riskScore = data.overallRiskScore ?? 0;
    const riskLevel = normalizeRiskLevel(data.riskLevel, riskScore);

    return {
      platform: data.platform,
      riskScore,
      riskLevel,
      confidence: data.confidence ?? 0,
      summary:
        data.summary ||
        (riskLevel === 'HIGH'
          ? 'The conversation contains multiple high-risk indicators.'
          : riskLevel === 'MEDIUM'
            ? 'Potential scam indicators detected in the conversation.'
            : 'Conversation appears routine with limited risk factors.'),
      keyFindings: data.keyFindings ?? [],
      flags: data.suspiciousMentions ?? [],
      suspiciousMentions: data.suspiciousMentions ?? [],
      recommendations: data.recommendations ?? [],
      metadata: {
        messageCount: request.messages.length,
      },
      raw: data,
    };
  }

  async analyzeTradingActivity(request: TradingAnalysisRequest): Promise<TradingAnalysisResult> {
    const mock = DetectionService.getMocks()?.tradingAnalysis;
    if (mock) {
      return Promise.resolve(mock(request));
    }

    if (!request.ticker) {
      throw new Error('Ticker symbol is required');
    }

    const response = await this.api.post<ApiResponse<TradingApiResponse>>('/trading-analysis', {
      symbol: request.ticker.trim().toUpperCase(),
    });

    const data = DetectionService.extractData(response.data);
    const riskScore = data.overallRiskScore ?? 0;
    const riskLevel = normalizeRiskLevel(data.riskLevel, riskScore);

    return {
      symbol: data.symbol,
      riskScore,
      riskLevel,
      confidence: data.confidence ?? 0,
      summary:
        data.summary ||
        (riskLevel === 'HIGH'
          ? 'Trading analysis indicates significant volatility or manipulation risk.'
          : riskLevel === 'MEDIUM'
            ? 'Trading analysis highlights moderate volatility patterns.'
            : 'Trading activity appears within normal parameters.'),
      keyFindings: data.keyFindings ?? [],
      flags: [],
      recommendations: data.recommendations ?? [],
      raw: data,
    };
  }

  async checkVeracity(request: VeracityCheckRequest): Promise<VeracityCheckResult> {
    const mock = DetectionService.getMocks()?.veracityCheck;
    if (mock) {
      return Promise.resolve(mock(request));
    }

    if (!request.ticker) {
      throw new Error('Ticker or identifier is required');
    }

    const identifier = request.ticker.trim();
    const targetType = request.assetType === 'crypto' ? 'token' : 'entity';

    const response = await this.api.post<ApiResponse<VeracityApiResponse>>('/veracity-checking', {
      targetType,
      targetIdentifier: identifier,
    });

    const data = DetectionService.extractData(response.data);
    const confidence = data.overallConfidence ?? 0;
    const riskScore = Math.max(0, Math.min(100, Math.round(100 - confidence)));
    const riskLevel = normalizeRiskLevel(data.riskLevel, riskScore);

    return {
      targetType: data.targetType,
      targetIdentifier: data.targetIdentifier,
      verificationStatus: data.verificationStatus,
      isVerified: data.isVerified,
      riskScore,
      riskLevel,
      confidence,
      summary:
        data.summary ||
        (data.isVerified
          ? 'Entity passes verification checks.'
          : 'Entity failed verification checks or appears in breach records.'),
      keyFindings: data.keyFindings ?? [],
      recommendations: data.recommendations ?? [],
      metadata: {
        providerConfidence: confidence,
      },
      raw: data,
    };
  }

  async runComprehensiveScan(request: ComprehensiveScanRequest): Promise<ComprehensiveScanResult> {
    const mock = DetectionService.getMocks()?.comprehensiveScan;
    if (mock) {
      return Promise.resolve(mock(request));
    }

    const completedChecks: string[] = [];
    const subScores: number[] = [];

    let contactVerification: ContactVerificationResult | undefined;
    let chatAnalysis: ChatAnalysisResult | undefined;
    let tradingAnalysis: TradingAnalysisResult | undefined;
    let veracityCheck: VeracityCheckResult | undefined;

    if (request.enabledTests.contactVerification && request.contacts && request.contacts.length > 0) {
      contactVerification = await this.verifyContacts({ contacts: request.contacts });
      completedChecks.push('contactVerification');
      subScores.push(contactVerification.riskScore);
    }

    if (request.enabledTests.chatAnalysis && request.chatContent) {
      const messages = request.chatContent
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (messages.length > 0) {
        chatAnalysis = await this.analyzeChat({
          messages,
          platform: 'comprehensive-scan',
        });
        completedChecks.push('chatAnalysis');
        subScores.push(chatAnalysis.riskScore);
      }
    }

    if (request.enabledTests.tradingAnalysis && request.ticker) {
      tradingAnalysis = await this.analyzeTradingActivity({
        ticker: request.ticker,
        timeframe: '1M',
        assetType: request.assetType || 'stock',
      });
      completedChecks.push('tradingAnalysis');
      subScores.push(tradingAnalysis.riskScore);
    }

    if (request.enabledTests.veracityCheck && request.ticker) {
      veracityCheck = await this.checkVeracity({
        ticker: request.ticker,
        assetType: request.assetType || 'stock',
        exchangeName: undefined,
      });
      completedChecks.push('veracityCheck');
      subScores.push(veracityCheck.riskScore);
    }

    const overallRiskScore = subScores.length > 0
      ? Math.round(subScores.reduce((acc, current) => acc + current, 0) / subScores.length)
      : 0;

    return {
      overallRiskScore,
      overallRiskLevel: deriveRiskLevel(overallRiskScore),
      contactVerification,
      chatAnalysis,
      tradingAnalysis,
      veracityCheck,
      metadata: {
        processedAt: new Date().toISOString(),
        completedChecks,
      },
    };
  }
}

export const detectionService = new DetectionService();
