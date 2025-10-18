import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'scam_dunk_' });

export const detectionRequestCounter = new client.Counter({
  name: 'scam_dunk_detection_requests_total',
  help: 'Number of detection requests handled',
  labelNames: ['route', 'cached', 'statusCode', 'success'],
  registers: [register],
});

export const detectionDurationHistogram = new client.Histogram({
  name: 'scam_dunk_detection_duration_ms',
  help: 'Duration histogram for detection requests (milliseconds)',
  labelNames: ['route'],
  buckets: [10, 50, 100, 250, 500, 1000, 2000],
  registers: [register],
});

export const detectionRateLimitCounter = new client.Counter({
  name: 'scam_dunk_detection_rate_limited_total',
  help: 'Number of detection requests rejected due to rate limiting',
  labelNames: ['route'],
  registers: [register],
});

export const telemetryBufferGauge = new client.Gauge({
  name: 'scam_dunk_detection_telemetry_buffer',
  help: 'Current number of telemetry events held in memory buffer',
  registers: [register],
});

export const metricsRegister = register;

export default register;
