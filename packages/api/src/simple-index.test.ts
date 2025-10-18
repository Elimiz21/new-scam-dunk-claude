import request from 'supertest';
import jwt from 'jsonwebtoken';
import { config } from './lib/config';
import { assessContact, analyzeChat, analyzeTrading } from './utils/detection-helpers';

jest.mock('@prisma/client', () => {
  const mockInstance = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  const PrismaClient = jest.fn(() => mockInstance);

  return { PrismaClient };
});

jest.mock('@supabase/supabase-js', () => {
  const userRecord = {
    id: 'test-user-id',
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    preferences: {},
    settings: {},
    profile: {},
  };

  const telemetryEvents: any[] = [];
  const apiKeyStore: Record<string, string> = {};

  const buildQuery = (table: string) => {
    let lastEqField: string | null = null;
    let lastEqValue: string | null = null;

    const builder: any = {
      select: jest.fn().mockImplementation(() => builder),
      insert: jest.fn().mockImplementation(async (rows: any[]) => {
        if (table === 'detection_telemetry') {
          telemetryEvents.push(...rows);
        }
        return { data: rows, error: null };
      }),
      update: jest.fn().mockImplementation(() => builder),
      eq: jest.fn().mockImplementation((field: string, value: string) => {
        lastEqField = field;
        lastEqValue = value;
        return builder;
      }),
      gte: jest.fn().mockImplementation(() => builder),
      limit: jest.fn().mockImplementation(() => builder),
      order: jest.fn().mockImplementation(() => builder),
      head: jest.fn().mockImplementation(() => builder),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    if (table === 'users') {
      const resolveUser = () => ({
        data: {
          ...userRecord,
          id: lastEqField === 'id' && lastEqValue ? lastEqValue : userRecord.id,
          email: userRecord.email,
        },
        error: null,
      });

      builder.maybeSingle.mockImplementation(async () => resolveUser());
      builder.single.mockImplementation(async () => resolveUser());
    }

    if (table === 'scans') {
      builder.single.mockResolvedValue({ data: { id: 'test-scan-id' }, error: null });
    }

    if (table === 'api_keys') {
      builder.maybeSingle.mockImplementation(async () => {
        if (lastEqField === 'key_name' && lastEqValue) {
          const value = apiKeyStore[lastEqValue] ?? null;
          return value
            ? { data: { key_value: value }, error: null }
            : { data: null, error: null };
        }

        return { data: null, error: null };
      });
    }

    if (table === 'detection_telemetry') {
      // insert already records telemetry; no further overrides needed
    }

    return builder;
  };

  return {
    __telemetry: telemetryEvents,
    __setApiKey: (name: string, value: string | null) => {
      if (!value) {
        delete apiKeyStore[name];
        return;
      }
      apiKeyStore[name] = value;
    },
    __resetApiKeys: () => {
      Object.keys(apiKeyStore).forEach((key) => delete apiKeyStore[key]);
    },
    createClient: jest.fn(() => ({
      from: jest.fn((table: string) => buildQuery(table)),
    })),
  };
});

const createToken = (overrides: Partial<{ userId: string; email: string; name: string }> = {}) => {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(
    {
      userId: 'test-user-id',
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
      ...overrides,
    },
    secret,
    { expiresIn: '1h' }
  );
};

const originalFetch = global.fetch;

describe('Express API bootstrap', () => {
  let appModule: typeof import('./simple-index');
  let app: typeof import('./simple-index').default;

  beforeAll(async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-token';
    process.env.NODE_ENV = 'test';

    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as any;

    appModule = await import('./simple-index');
    app = appModule.default;
  });

  beforeEach(() => {
    const supabaseMock: any = jest.requireMock('@supabase/supabase-js');
    supabaseMock.__telemetry.length = 0;
    supabaseMock.__resetApiKeys();

    config.featureFlags.useContactProvider = false;
    config.featureFlags.useChatProvider = false;
    config.featureFlags.useTradingProvider = false;
    config.featureFlags.useVeracityProvider = false;
    config.providers.contact = null;
    config.providers.chat = null;
    config.providers.trading = null;
    config.providers.veracity = null;

    (global.fetch as jest.Mock).mockReset().mockResolvedValue({ ok: false, json: async () => ({}) });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => appModule.server.close(() => resolve()));
    global.fetch = originalFetch;
  });

  it('responds to health checks', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  describe('contact verification', () => {
    const route = '/api/contact-verification';
    const payload = {
      contactType: 'email',
      contactValue: 'contact@example.com',
    };

    it('caches repeated payloads per user', async () => {
      const token = createToken({ userId: 'cache-user' });
      const headers = { Authorization: `Bearer ${token}` };

      const first = await request(app).post(route).set(headers).send(payload);
      expect(first.status).toBe(200);
      expect(first.body.success).toBe(true);
      expect(first.body.meta).toBeUndefined();
      expect(first.body.data.riskLevel).toBeDefined();

      const second = await request(app).post(route).set(headers).send(payload);
      expect(second.status).toBe(200);
      expect(second.body.meta).toEqual({ cached: true });
      expect(second.body.data.riskScore).toBe(first.body.data.riskScore);
      expect(second.body.data.riskLevel).toBe(first.body.data.riskLevel);
    });

    it('enforces per-user rate limiting after the configured threshold', async () => {
      const token = createToken({ userId: 'rate-limit-user', email: 'rate@example.com' });
      const headers = { Authorization: `Bearer ${token}` };

      for (let i = 0; i < 15; i += 1) {
        const res = await request(app).post(route).set(headers).send({
          contactType: 'email',
          contactValue: `user-${i}@example.com`,
        });
        expect(res.status).toBe(200);
      }

      const limited = await request(app)
        .post(route)
        .set(headers)
        .send({ contactType: 'email', contactValue: 'limit@example.com' });

      expect(limited.status).toBe(429);
      expect(limited.body).toMatchObject({ success: false, error: 'Rate limit exceeded' });
      expect(typeof limited.body.retryAfterMs).toBe('number');

      const supabaseMock: any = jest.requireMock('@supabase/supabase-js');
      expect(supabaseMock.__telemetry.length).toBeGreaterThan(0);
      expect(
        supabaseMock.__telemetry.some(
          (entry: any) => entry.status_code === 429 && entry.route === 'contact-verification'
        )
      ).toBe(true);
    });
  });

  describe('trading analysis', () => {
    it('produces deterministic trading risk assessments', async () => {
      const token = createToken({ userId: 'trading-user' });
      const headers = { Authorization: `Bearer ${token}` };

      const first = await request(app)
        .post('/api/trading-analysis')
        .set(headers)
        .send({ symbol: 'GME' });

      expect(first.status).toBe(200);
      expect(first.body.data.riskLevel).toBeDefined();
      expect(first.body.data.keyFindings.length).toBeGreaterThan(0);

      const second = await request(app)
        .post('/api/trading-analysis')
        .set(headers)
        .send({ symbol: 'GME' });

      expect(second.status).toBe(200);
      expect(second.body.data.overallRiskScore).toBe(first.body.data.overallRiskScore);
      expect(second.body.meta?.cached).toBe(true);

      const supabaseMock: any = jest.requireMock('@supabase/supabase-js');
      expect(
        supabaseMock.__telemetry.some(
          (entry: any) => entry.route === 'trading-analysis' && entry.status_code === 200
        )
      ).toBe(true);
    });
  });

  it('exposes Prometheus metrics', async () => {
    const response = await request(app).get('/metrics');
    expect(response.status).toBe(200);
    expect(response.text).toContain('scam_dunk_detection_requests_total');
  });

  describe('external providers', () => {
    it('merges contact provider risk when enabled', async () => {
      config.featureFlags.useContactProvider = true;
      config.providers.contact = 'https://provider.test/contact';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          riskScore: 90,
          confidence: 88,
          flags: ['external-flag'],
          recommendations: ['Do not engage'],
        }),
      });

      const payload = { contactType: 'email', contactValue: 'external@example.com' };
      const baseline = assessContact(payload.contactType, payload.contactValue);

      const token = createToken({ userId: 'provider-user' });
      const headers = { Authorization: `Bearer ${token}` };

      const response = await request(app).post('/api/contact-verification').set(headers).send(payload);

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://provider.test/contact',
        expect.objectContaining({ method: 'POST' })
      );

      const expectedScore = Math.round((baseline.riskScore + 90) / 2);
      expect(response.body.data.riskScore).toBe(expectedScore);
      expect(response.body.data.recommendations).toEqual(['Do not engage']);

      const telemetry: any[] = jest.requireMock('@supabase/supabase-js').__telemetry;
      expect(telemetry.some((entry) => entry.metadata?.provider === 'external')).toBe(true);
    });

    it('merges trading provider risk when enabled', async () => {
      config.featureFlags.useTradingProvider = true;
      config.providers.trading = 'https://provider.test/trading';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          riskScore: 20,
          summary: 'Provider supplied outlook',
          recommendations: ['Hold position'],
        }),
      });

      const baseline = analyzeTrading('GME');

      const token = createToken({ userId: 'trading-provider' });
      const headers = { Authorization: `Bearer ${token}` };

      const response = await request(app)
        .post('/api/trading-analysis')
        .set(headers)
        .send({ symbol: 'GME' });

      expect(response.status).toBe(200);
      expect(response.body.data.summary).toBe('Provider supplied outlook');

      const expectedScore = Math.round((baseline.overallRiskScore + 20) / 2);
      expect(response.body.data.overallRiskScore).toBe(expectedScore);

      const telemetry: any[] = jest.requireMock('@supabase/supabase-js').__telemetry;
      expect(telemetry.some((entry) => entry.route === 'trading-analysis' && entry.metadata?.provider === 'external')).toBe(
        true
      );
    });

    it('falls back to OpenAI when chat provider URL is not configured', async () => {
      config.featureFlags.useChatProvider = true;
      config.providers.chat = null;

      const supabaseMock: any = jest.requireMock('@supabase/supabase-js');
      supabaseMock.__setApiKey('OPENAI_API_KEY', 'test-openai');

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    overallRiskScore: 82,
                    riskLevel: 'HIGH',
                    confidence: 91,
                    summary: 'High risk conversation',
                    keyFindings: ['Multiple suspicious claims'],
                    recommendations: ['Cease communication'],
                  }),
                },
              },
            ],
          }),
        })
        .mockResolvedValue({ ok: false, json: async () => ({}) });

      const payload = { platform: 'telegram', messages: [{ text: 'Guaranteed return if you wire now' }] };
      const baseline = analyzeChat(payload.platform, payload.messages);

      const token = createToken({ userId: 'chat-provider' });
      const headers = { Authorization: `Bearer ${token}` };

      const response = await request(app)
        .post('/api/chat-analysis')
        .set(headers)
        .send(payload);

      expect(response.status).toBe(200);
      const expectedScore = Math.round((baseline.overallRiskScore + 82) / 2);
      expect(response.body.data.overallRiskScore).toBe(expectedScore);
      expect(response.body.data.summary).toBe('High risk conversation');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-openai' }),
        })
      );

      const telemetry: any[] = jest.requireMock('@supabase/supabase-js').__telemetry;
      expect(
        telemetry.some(
          (entry) => entry.route === 'chat-analysis' && entry.metadata?.provider === 'external'
        )
      ).toBe(true);
    });

    it('queries Have I Been Pwned for veracity checks when API key is present', async () => {
      config.featureFlags.useVeracityProvider = true;
      config.providers.veracity = null;

      const supabaseMock: any = jest.requireMock('@supabase/supabase-js');
      supabaseMock.__setApiKey('HIBP_API_KEY', 'test-hibp');

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [
            {
              Name: 'ExampleBreach',
              BreachDate: '2022-01-01',
              DataClasses: ['Email addresses', 'Passwords'],
            },
          ],
        })
        .mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

      const token = createToken({ userId: 'veracity-provider' });
      const headers = { Authorization: `Bearer ${token}` };

      const response = await request(app)
        .post('/api/veracity-checking')
        .set(headers)
        .send({ targetType: 'email', targetIdentifier: 'breached@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.data.verificationStatus).toBe('BREACHED');
      expect(response.body.data.keyFindings[0]).toContain('ExampleBreach');
      expect(response.body.data.recommendations.length).toBeGreaterThan(0);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('haveibeenpwned.com/api/v3/breachedaccount'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'hibp-api-key': 'test-hibp',
          }),
        })
      );

      const telemetry: any[] = jest.requireMock('@supabase/supabase-js').__telemetry;
      expect(
        telemetry.some(
          (entry) => entry.route === 'veracity-checking' && entry.metadata?.provider === 'external'
        )
      ).toBe(true);
    });
  });
});
