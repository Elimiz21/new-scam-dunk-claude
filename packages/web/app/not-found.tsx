import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold holo-text mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="holo-button inline-flex items-center">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
          <Link href="/scan" className="glass-button inline-flex items-center">
            <Search className="mr-2 h-4 w-4" />
            Start Scan
          </Link>
        </div>
      </div>
    </div>
  );
}