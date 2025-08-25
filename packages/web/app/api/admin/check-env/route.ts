import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key-2025';

function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.email === 'elimizroch@gmail.com' && decoded.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Get first and last 10 chars of keys for debugging
  const maskKey = (key: string | undefined) => {
    if (!key) return 'NOT SET';
    if (key.length < 20) return 'INVALID (too short)';
    return `${key.substring(0, 10)}...${key.substring(key.length - 10)}`;
  };
  
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: maskKey(supabaseAnonKey),
      SUPABASE_SERVICE_ROLE_KEY: maskKey(supabaseServiceKey),
      keyLengths: {
        anon: supabaseAnonKey?.length || 0,
        service: supabaseServiceKey?.length || 0
      },
      hasNewlines: {
        anon: supabaseAnonKey?.includes('\n') || false,
        service: supabaseServiceKey?.includes('\n') || false
      }
    }
  });
}