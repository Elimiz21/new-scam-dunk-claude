import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Release Tracking
    release: process.env.NEXT_PUBLIC_COMMIT_SHA || 'development',
    environment: process.env.NODE_ENV || 'development',
    
    // Error Filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random network errors
      'Network request failed',
      'NetworkError',
      'Failed to fetch',
      // User cancellations
      'AbortError',
      'Non-Error promise rejection captured',
    ],
    
    // User Context
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        if (event.request.cookies) {
          event.request.cookies = '[Filtered]';
        }
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
      }
      
      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          build_time: process.env.NEXT_PUBLIC_BUILD_TIME,
        },
      };
      
      return event;
    },
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          'scam-dunk-production.vercel.app',
          /^\//,
        ],
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
  });
}