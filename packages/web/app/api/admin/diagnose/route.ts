import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
  
  const diagnosis: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    },
    supabase: {
      url: {
        fromEnv: process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
        hasLineBreaks: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('\n'),
        hasSpaces: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(' ')
      },
      anonKey: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
        hasLineBreaks: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('\n'),
        hasSpaces: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes(' '),
        firstChars: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
        lastChars: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(
          (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0) - 20
        )
      },
      serviceKey: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
        hasLineBreaks: process.env.SUPABASE_SERVICE_ROLE_KEY?.includes('\n'),
        hasSpaces: process.env.SUPABASE_SERVICE_ROLE_KEY?.includes(' ')
      }
    },
    tests: []
  };
  
  // Test 1: Try creating client with raw env vars
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (url && key) {
      const client = createClient(url, key);
      diagnosis.tests.push({
        test: 'Create client with raw env vars',
        success: true
      });
      
      // Try a simple query
      try {
        const { error } = await client.from('api_keys').select('count').single();
        diagnosis.tests.push({
          test: 'Query with raw env client',
          success: !error,
          error: error?.message
        });
      } catch (e: any) {
        diagnosis.tests.push({
          test: 'Query with raw env client',
          success: false,
          error: e.message
        });
      }
    }
  } catch (e: any) {
    diagnosis.tests.push({
      test: 'Create client with raw env vars',
      success: false,
      error: e.message
    });
  }
  
  // Test 2: Try with cleaned keys
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/[\s\n\r]+/g, '').trim();
    
    if (url && key) {
      const client = createClient(url, key);
      diagnosis.tests.push({
        test: 'Create client with cleaned env vars',
        success: true
      });
      
      // Try a simple query
      try {
        const { error } = await client.from('api_keys').select('count').single();
        diagnosis.tests.push({
          test: 'Query with cleaned env client',
          success: !error,
          error: error?.message
        });
      } catch (e: any) {
        diagnosis.tests.push({
          test: 'Query with cleaned env client',
          success: false,
          error: e.message
        });
      }
    }
  } catch (e: any) {
    diagnosis.tests.push({
      test: 'Create client with cleaned env vars',
      success: false,
      error: e.message
    });
  }
  
  // Test 3: Try with hardcoded values
  try {
    const url = 'https://gcrkijhkecsfafjbojey.supabase.co';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpamhrZWNzZmFmamJvamV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzOTE5MTUsImV4cCI6MjA0ODk2NzkxNX0.VsHcZtqR01JVsYMKZ5dvn2yB2zxUJFCvPqQQ7i5FQPA';
    
    const client = createClient(url, key);
    diagnosis.tests.push({
      test: 'Create client with hardcoded values',
      success: true
    });
    
    // Try a simple query
    try {
      const { error } = await client.from('api_keys').select('count').single();
      diagnosis.tests.push({
        test: 'Query with hardcoded client',
        success: !error,
        error: error?.message
      });
    } catch (e: any) {
      diagnosis.tests.push({
        test: 'Query with hardcoded client',
        success: false,
        error: e.message
      });
    }
  } catch (e: any) {
    diagnosis.tests.push({
      test: 'Create client with hardcoded values',
      success: false,
      error: e.message
    });
  }
  
  return NextResponse.json(diagnosis);
}