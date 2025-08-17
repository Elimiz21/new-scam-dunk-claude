'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <AlertTriangle className="w-12 h-12 text-holo-red mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong!</h2>
        <p className="text-gray-400 mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="holo-button w-full"
          aria-label="Try again"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}