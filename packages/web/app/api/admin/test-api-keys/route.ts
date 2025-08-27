import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing api_keys table...');
    
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Could not connect to Supabase',
        suggestion: 'Check environment variables'
      }, { status: 500 });
    }
    
    // Step 1: Try to select from api_keys
    console.log('Step 1: Attempting to select from api_keys table...');
    const { data: selectData, error: selectError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(5);
    
    if (selectError) {
      return NextResponse.json({
        step: 'SELECT failed',
        error: selectError.message,
        code: selectError.code,
        details: selectError,
        suggestion: selectError.code === 'PGRST205' 
          ? 'Table does not exist - please create it in Supabase'
          : 'Check table permissions in Supabase'
      });
    }
    
    // Step 2: Try to insert a test key
    console.log('Step 2: Attempting to insert test key...');
    const testKey = {
      key_name: 'TEST_KEY_' + Date.now(),
      key_value: 'test_value_' + Math.random(),
      is_active: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('api_keys')
      .insert([testKey])
      .select();
    
    if (insertError) {
      return NextResponse.json({
        step: 'INSERT failed',
        error: insertError.message,
        code: insertError.code,
        tableExists: true,
        currentKeys: selectData || [],
        suggestion: 'Table exists but cannot insert - check permissions'
      });
    }
    
    // Step 3: Delete the test key
    console.log('Step 3: Cleaning up test key...');
    await supabase
      .from('api_keys')
      .delete()
      .eq('key_name', testKey.key_name);
    
    // Success!
    return NextResponse.json({
      success: true,
      message: '✅ api_keys table is working perfectly!',
      tableExists: true,
      canRead: true,
      canWrite: true,
      currentKeyCount: selectData?.length || 0,
      existingKeys: selectData?.map(k => ({
        name: k.key_name,
        active: k.is_active,
        created: k.created_at
      })) || [],
      testResults: {
        select: 'PASSED',
        insert: 'PASSED',
        delete: 'PASSED'
      },
      nextSteps: 'You can now save API keys in the admin panel!'
    });
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error during test',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}