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

// Sample API keys you mentioned you had saved before
const SAMPLE_KEYS = [
  { key_name: 'OPENAI_API_KEY', sample: 'sk-...' },
  { key_name: 'COINMARKETCAP_API_KEY', sample: 'your-cmc-key' },
  { key_name: 'ALPHA_VANTAGE_API_KEY', sample: 'your-av-key' },
  { key_name: 'ETHERSCAN_API_KEY', sample: 'your-etherscan-key' }
];

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  
  try {
    const { action, keys } = await request.json();
    
    if (action === 'check') {
      // Check current state
      const { data, error } = await supabase
        .from('api_keys')
        .select('*');
      
      return NextResponse.json({
        success: true,
        currentKeys: data || [],
        error: error?.message
      });
    }
    
    if (action === 'create_table') {
      // Ensure table exists with correct structure
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS api_keys (
            id SERIAL PRIMARY KEY,
            key_name VARCHAR(100) UNIQUE NOT NULL,
            key_value TEXT NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `
      }).single();
      
      if (error && !error.message.includes('already exists')) {
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        message: 'Table created/verified'
      });
    }
    
    if (action === 'restore' && keys) {
      // Restore provided keys
      const results = [];
      
      for (const key of keys) {
        try {
          // First try to update
          const { data: updateData, error: updateError } = await supabase
            .from('api_keys')
            .update({
              key_value: key.value,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('key_name', key.name);
          
          if (updateError) {
            // If update fails, try insert
            const { data: insertData, error: insertError } = await supabase
              .from('api_keys')
              .insert({
                key_name: key.name,
                key_value: key.value,
                is_active: true
              });
            
            results.push({
              key: key.name,
              action: 'inserted',
              success: !insertError,
              error: insertError?.message
            });
          } else {
            results.push({
              key: key.name,
              action: 'updated',
              success: true
            });
          }
        } catch (e: any) {
          results.push({
            key: key.name,
            action: 'failed',
            success: false,
            error: e.message
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        results
      });
    }
    
    return NextResponse.json({
      error: 'Invalid action',
      availableActions: ['check', 'create_table', 'restore']
    }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      details: error
    }, { status: 500 });
  }
}