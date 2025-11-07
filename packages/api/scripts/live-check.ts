import 'dotenv/config';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import { app, server } from '../src/simple-index';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined');
}

const adminClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY.replace(/\s+/g, '')
);

const CHAT_IMPORT_BUCKET = process.env.CHAT_IMPORT_BUCKET || 'chat-imports';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ResultEntry = { name: string; status: number; body: unknown } | { name: string; error: string };

async function run() {
  const results: ResultEntry[] = [];
  const timestamp = Date.now();
  const email = `integration+${timestamp}@example.com`;
  const password = 'Test1234!';
  const name = 'Integration User';

  let createdUserId: string | null = null;
  const generatedChatImportIds: string[] = [];
  const chatStoragePaths: string[] = [];

  try {
    const health = await request(app).get('/health');
    results.push({ name: 'health', status: health.status, body: health.body });

    const register = await request(app)
      .post('/api/auth/register')
      .send({ name, email, password });
    results.push({ name: 'register', status: register.status, body: register.body });

    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ name, email, password });
    results.push({ name: 'register-duplicate', status: duplicate.status, body: duplicate.body });

    const invalidLogin = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'WrongPass123!' });
    results.push({ name: 'login-invalid', status: invalidLogin.status, body: invalidLogin.body });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    results.push({ name: 'login', status: login.status, body: login.body });

    const token = login.body?.token || login.body?.data?.token || register.body?.token;
    createdUserId = login.body?.user?.id || register.body?.user?.id || null;

    if (!token) {
      throw new Error('Missing JWT token after login');
    }

    const profileUnauthorized = await request(app).get('/api/users/profile');
    results.push({ name: 'profile-unauthorized', status: profileUnauthorized.status, body: profileUnauthorized.body });

    const headers = { Authorization: `Bearer ${token}` };

    const profile = await request(app).get('/api/users/profile').set(headers);
    results.push({ name: 'profile', status: profile.status, body: profile.body });

    const contactPayload = {
      contactType: 'email',
      contactValue: `contact+${timestamp}@example.com`,
    };

    const contactFirst = await request(app).post('/api/contact-verification').set(headers).send(contactPayload);
    results.push({ name: 'contact-first', status: contactFirst.status, body: contactFirst.body });

    const contactCached = await request(app).post('/api/contact-verification').set(headers).send(contactPayload);
    results.push({ name: 'contact-cached', status: contactCached.status, body: contactCached.body });

    const chatPayload = {
      platform: 'whatsapp',
      messages: [
        { text: 'Send the funds to me right now.' },
        { text: 'This is guaranteed profit, do not miss it.' },
      ],
    };

    const chatFirst = await request(app).post('/api/chat-analysis').set(headers).send(chatPayload);
    results.push({ name: 'chat-analysis', status: chatFirst.status, body: chatFirst.body });

    const chatCached = await request(app).post('/api/chat-analysis').set(headers).send(chatPayload);
    results.push({ name: 'chat-analysis-cached', status: chatCached.status, body: chatCached.body });

    const tradingPayload = { symbol: 'BTC' };
    const tradingFirst = await request(app).post('/api/trading-analysis').set(headers).send(tradingPayload);
    results.push({ name: 'trading-analysis', status: tradingFirst.status, body: tradingFirst.body });

    const tradingCached = await request(app).post('/api/trading-analysis').set(headers).send(tradingPayload);
    results.push({ name: 'trading-analysis-cached', status: tradingCached.status, body: tradingCached.body });

    const veracityPayload = { targetType: 'entity', targetIdentifier: 'Example Holdings LLC' };
    const veracityFirst = await request(app).post('/api/veracity-checking').set(headers).send(veracityPayload);
    results.push({ name: 'veracity-check', status: veracityFirst.status, body: veracityFirst.body });

    const veracityCached = await request(app).post('/api/veracity-checking').set(headers).send(veracityPayload);
    results.push({ name: 'veracity-check-cached', status: veracityCached.status, body: veracityCached.body });

    const directTranscript = Buffer.from(
      ['Alice: Hey Bob, can you transfer the funds now?', 'Bob: Urgent! Send it via crypto please.'].join('\n'),
      'utf8',
    );

    const directUpload = await request(app)
      .post('/api/chat-import/upload')
      .set(headers)
      .attach('file', directTranscript, 'direct-chat.txt')
      .field('platform', 'whatsapp');
    results.push({ name: 'chat-import-direct-upload', status: directUpload.status, body: directUpload.body });

    const directChatImportId = directUpload.body?.data?.chatImportId as string | undefined;
    if (directChatImportId) {
      generatedChatImportIds.push(directChatImportId);
      if (directUpload.body?.data?.filePath) {
        chatStoragePaths.push(directUpload.body.data.filePath);
      }

      const directStatus = await request(app)
        .get(`/api/chat-import/status/${directChatImportId}`)
        .set(headers);
      results.push({ name: 'chat-import-direct-status', status: directStatus.status, body: directStatus.body });

      const directResults = await request(app)
        .get(`/api/chat-import/results/${directChatImportId}`)
        .set(headers);
      results.push({ name: 'chat-import-direct-results', status: directResults.status, body: directResults.body });
    }

    const chunkedTranscript = Buffer.from(
      ['Alice: Reminder about the payment.', 'Bob: This is guaranteed profit, act fast!'].join('\n'),
      'utf8',
    );

    const initUpload = await request(app)
      .post('/api/chat-import/initialize')
      .set(headers)
      .send({ fileName: 'chunked-chat.txt', totalSize: chunkedTranscript.length });
    results.push({ name: 'chat-import-initialize', status: initUpload.status, body: initUpload.body });

    const uploadId: string | undefined = initUpload.body?.data?.uploadId;
    if (!uploadId) {
      throw new Error('Upload initialization did not return an uploadId');
    }

    const chunkResponse = await request(app)
      .post(`/api/chat-import/upload-chunk/${uploadId}/0`)
      .set(headers)
      .attach('chunk', chunkedTranscript, 'chunk-0.bin');
    results.push({ name: 'chat-import-upload-chunk', status: chunkResponse.status, body: chunkResponse.body });

    const chunkProgress = await request(app)
      .get(`/api/chat-import/upload/${uploadId}/progress`)
      .set(headers);
    results.push({ name: 'chat-import-progress', status: chunkProgress.status, body: chunkProgress.body });

    const finalizeUpload = await request(app)
      .post('/api/chat-import/finalize')
      .set(headers)
      .send({
        uploadId,
        platform: 'telegram',
        language: 'en',
        timezone: 'UTC',
      });
    results.push({ name: 'chat-import-finalize', status: finalizeUpload.status, body: finalizeUpload.body });

    const chunkedChatImportId = finalizeUpload.body?.data?.chatImportId as string | undefined;
    if (chunkedChatImportId) {
      generatedChatImportIds.push(chunkedChatImportId);
      if (finalizeUpload.body?.data?.filePath) {
        chatStoragePaths.push(finalizeUpload.body.data.filePath);
      }

      const chunkedStatus = await request(app)
        .get(`/api/chat-import/status/${chunkedChatImportId}`)
        .set(headers);
      results.push({ name: 'chat-import-chunked-status', status: chunkedStatus.status, body: chunkedStatus.body });

      const chunkedResults = await request(app)
        .get(`/api/chat-import/results/${chunkedChatImportId}`)
        .set(headers);
      results.push({ name: 'chat-import-chunked-results', status: chunkedResults.status, body: chunkedResults.body });
    }

    const comprehensivePayload = {
      input: {
        contact: { type: 'email', value: `analysis+${timestamp}@example.com` },
        chat: chatPayload,
        trading: tradingPayload,
        veracity: { identifier: 'Sample Entity LLC', type: 'entity' },
      },
    };

    const comprehensiveStart = await request(app)
      .post('/api/scans/comprehensive')
      .set(headers)
      .send(comprehensivePayload);
    results.push({ name: 'scan-comprehensive-start', status: comprehensiveStart.status, body: comprehensiveStart.body });

    const scanId: string | undefined = comprehensiveStart.body?.data?.scanId;
    if (!scanId) {
      throw new Error('Comprehensive scan did not return a scanId');
    }

    await sleep(3500);

    const scanResult = await request(app).get(`/api/scans/${scanId}`).set(headers);
    results.push({ name: 'scan-comprehensive-result', status: scanResult.status, body: scanResult.body });

    const metricsResponse = await request(app).get('/metrics');
    results.push({
      name: 'metrics',
      status: metricsResponse.status,
      body: {
        containsCounter: metricsResponse.text.includes('scam_dunk_detection_requests_total'),
        length: metricsResponse.text.length,
      },
    });

    for (let i = 0; i < 14; i += 1) {
      await request(app)
        .post('/api/contact-verification')
        .set(headers)
        .send({
          contactType: 'email',
          contactValue: `burst-${i}+${timestamp}@example.com`,
        });
    }

    const contactLimited = await request(app)
      .post('/api/contact-verification')
      .set(headers)
      .send({
        contactType: 'email',
        contactValue: `limit+${timestamp}@example.com`,
      });
    results.push({ name: 'contact-rate-limit', status: contactLimited.status, body: contactLimited.body });

    console.log(JSON.stringify({ success: true, results }, null, 2));
  } catch (error: any) {
    results.push({ name: 'error', error: error.message });
    console.error(JSON.stringify({ success: false, error: error.message, stack: error.stack, results }, null, 2));
    process.exitCode = 1;
  } finally {
    if (generatedChatImportIds.length) {
      try {
        await adminClient.from('chat_imports').delete().in('id', generatedChatImportIds);
      } catch (cleanupError) {
        console.warn('Failed to remove chat imports:', cleanupError);
      }
    }

    if (chatStoragePaths.length) {
      try {
        await adminClient.storage.from(CHAT_IMPORT_BUCKET).remove(chatStoragePaths);
      } catch (cleanupError) {
        console.warn('Failed to delete chat import files:', cleanupError);
      }
    }

    if (createdUserId) {
      try {
        await adminClient.from('users').delete().eq('id', createdUserId);
      } catch (cleanupError) {
        console.warn('Failed to clean up integration user:', cleanupError);
      }
    }

    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

run();
