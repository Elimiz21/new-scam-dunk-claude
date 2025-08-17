import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Release Tracking
    release: process.env.NEXT_PUBLIC_COMMIT_SHA || 'development',
    environment: process.env.NODE_ENV || 'development',
    
    // Error Filtering
    ignoreErrors: [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
    ],
    
    // Server Context
    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.request) {
        if (event.request.cookies) {
          event.request.cookies = {};
        }
        if (event.request.headers) {
          const headers = { ...event.request.headers };
          delete headers['authorization'];
          delete headers['cookie'];
          delete headers['x-api-key'];
          event.request.headers = headers;
        }
      }
      
      // Add server context
      event.contexts = {
        ...event.contexts,
        runtime: {
          name: 'node',
          version: process.version,
        },
        app: {
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          build_time: process.env.NEXT_PUBLIC_BUILD_TIME,
        },
      };
      
      return event;
    },
    
    // Profiling (optional, requires additional setup)
    // profilesSampleRate: 1.0,
  });
}