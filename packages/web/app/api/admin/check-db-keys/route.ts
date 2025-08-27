import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database for existing API keys...');
    
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Could not connect to Supabase',
        message: 'No Supabase client available' 
      }, { status: 500 });
    }
    
    // Query the api_keys table
    const { data, error, count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    // Format the response
    const response = {
      success: true,
      totalKeys: count || 0,
      keys: data ? data.map(key => ({
        name: key.key_name,
        valueMasked: key.key_value ? '••••••' + key.key_value.slice(-4) : 'null',
        isActive: key.is_active,
        created: key.created_at,
        updated: key.updated_at
      })) : [],
      message: data && data.length > 0 
        ? `Found ${data.length} API keys in the database!` 
        : 'No API keys found in the database (table is empty)'
    };
    
    console.log(`✅ Database check complete: ${response.totalKeys} keys found`);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Error checking database:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      message: error.message 
    }, { status: 500 });
  }
}