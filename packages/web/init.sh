#!/bin/sh
echo "Initializing Web service..."

# Remove any existing package-lock
rm -f package-lock.json

# Create simplified package.json
cat > package.json << 'EOF'
{
  "name": "@scam-dunk/web",
  "version": "1.0.0",
  "description": "Next.js web application for Scam Dunk",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.8.4",
    "axios": "^1.6.2",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0",
    "framer-motion": "^10.16.5",
    "lucide-react": "^0.294.0",
    "socket.io-client": "^4.7.4",
    "tailwind-merge": "^2.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.53.0",
    "eslint-config-next": "14.0.3",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2"
  }
}
EOF

# Install dependencies
npm install

# Create pages directory if not exists
mkdir -p pages

# Create a simple index page if needed
if [ ! -f "pages/index.tsx" ] && [ ! -f "app/page.tsx" ]; then
  cat > pages/index.tsx << 'EOF'
import React, { useEffect, useState } from 'react';

export default function Home() {
  const [apiStatus, setApiStatus] = useState('checking...');
  
  useEffect(() => {
    fetch('http://localhost:4000/health')
      .then(res => res.json())
      .then(data => setApiStatus('connected'))
      .catch(() => setApiStatus('disconnected'));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯 Scam Dunk</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          AI-Native Anti-Scam Investment Protection Platform
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '1rem',
          borderRadius: '10px',
          marginTop: '2rem'
        }}>
          <h2>System Status</h2>
          <p>Web Server: ✅ Online</p>
          <p>API Status: {apiStatus === 'connected' ? '✅' : '⚠️'} {apiStatus}</p>
        </div>
      </div>
    </div>
  );
}
EOF
fi

# Try to build
npm run build || true

# Start the server
echo "Starting Web server..."
npm run dev || npm run start || npx next dev