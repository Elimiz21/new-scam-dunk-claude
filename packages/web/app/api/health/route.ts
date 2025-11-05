import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
      version:
        process.env.NEXT_PUBLIC_GIT_SHA ??
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.NEXT_PUBLIC_APP_VERSION ??
        'local',
    },
    { status: 200 }
  );
}

export const dynamic = 'force-dynamic';
