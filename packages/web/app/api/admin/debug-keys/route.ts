import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSupabaseClient } from '@/lib/supabase-admin';

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
  
  const debugInfo: any = {
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
    },
    database: {
      connected: false,
      tables: [],
      apiKeys: []
    }
  };
  
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    debugInfo.error = 'Supabase client initialization failed';
    return NextResponse.json(debugInfo);
  }
  
  try {
    
    // Check if api_keys table exists and has data
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('*');
    
    if (apiKeysError) {
      debugInfo.database.error = apiKeysError.message;
      debugInfo.database.errorDetails = apiKeysError;
    } else {
      debugInfo.database.connected = true;
      debugInfo.database.apiKeys = apiKeys?.map(k => ({
        key_name: k.key_name,
        is_active: k.is_active,
        has_value: !!k.key_value,
        created_at: k.created_at
      })) || [];
      debugInfo.database.totalKeys = apiKeys?.length || 0;
    }
    
    // Check if the table structure is correct
    const { data: tableInfo, error: tableError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(0);
    
    if (!tableError) {
      debugInfo.database.tableExists = true;
    }
    
  } catch (error: any) {
    debugInfo.error = error.message;
  }
  
  return NextResponse.json(debugInfo);
}
