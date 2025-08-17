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
    
    // Edge Runtime specific configuration
    beforeSend(event, hint) {
      // Add edge context
      event.contexts = {
        ...event.contexts,
        runtime: {
          name: 'edge',
        },
        app: {
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          build_time: process.env.NEXT_PUBLIC_BUILD_TIME,
        },
      };
      
      return event;
    },
  });
}