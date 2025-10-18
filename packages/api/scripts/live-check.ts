import 'dotenv/config';
import request from 'supertest';
import { app, server } from '../src/simple-index';

async function run() {
  const results: Array<{ name: string; status: number; body: any } | { name: string; error: string }> = [];
  const timestamp = Date.now();
  const email = `integration+${timestamp}@example.com`;
  const password = 'Test1234!';
  const name = 'Integration User';

  try {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name, email, password });
    results.push({ name: 'register', status: register.status, body: register.body });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    results.push({ name: 'login', status: login.status, body: login.body });

    const token = login.body?.token || login.body?.data?.token || register.body?.token;
    if (!token) {
      throw new Error('Missing JWT token after login');
    }

    const profile = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    results.push({ name: 'profile', status: profile.status, body: profile.body });

    const contactPayload = {
      contactType: 'email',
      contactValue: `contact+${timestamp}@example.com`,
    };

    const contactFirst = await request(app)
      .post('/api/contact-verification')
      .set('Authorization', `Bearer ${token}`)
      .send(contactPayload);
    results.push({ name: 'contact-first', status: contactFirst.status, body: contactFirst.body });

    const contactCached = await request(app)
      .post('/api/contact-verification')
      .set('Authorization', `Bearer ${token}`)
      .send(contactPayload);
    results.push({ name: 'contact-cached', status: contactCached.status, body: contactCached.body });

    for (let i = 0; i < 14; i += 1) {
      await request(app)
        .post('/api/contact-verification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contactType: 'email',
          contactValue: `bulk-${i}+${timestamp}@example.com`,
        });
    }

    const contactLimited = await request(app)
      .post('/api/contact-verification')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contactType: 'email',
        contactValue: `limit+${timestamp}@example.com`,
      });
    results.push({ name: 'contact-rate-limit', status: contactLimited.status, body: contactLimited.body });

    const metricsResponse = await request(app).get('/metrics');
    results.push({
      name: 'metrics',
      status: metricsResponse.status,
      body: {
        containsCounter: metricsResponse.text.includes('scam_dunk_detection_requests_total'),
        length: metricsResponse.text.length,
      },
    });

    console.log(JSON.stringify({ success: true, results }, null, 2));
  } catch (error: any) {
    console.error(JSON.stringify({ success: false, error: error.message, stack: error.stack }, null, 2));
    process.exitCode = 1;
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

run();
