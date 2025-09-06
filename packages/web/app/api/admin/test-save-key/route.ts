import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded configuration - same as in supabase-admin.ts
const SUPABASE_URL = 'https://gcrkijhkecsfafjbojey.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpamhrZWNzZmFmamJvamV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzM5MTkxNSwiZXhwIjoyMDQ4OTY3OTE1fQ.7iQ4mPdAiCDO0SJX4hO-1G_xwi_Ge_xGqC1DJzDcPzc';

export async function POST(request: NextRequest) {
  try {
    const { keyName, keyValue } = await request.json();
    
    if (!keyName || !keyValue) {
      return NextResponse.json({
        error: 'Missing keyName or keyValue'
      }, { status: 400 });
    }
    
    console.log(`Attempting to save key: ${keyName}`);
    
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // First check if key exists
    const { data: existing, error: checkError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('key_name', keyName)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('Error checking existing key:', checkError);
      return NextResponse.json({
        error: 'Failed to check existing key',
        details: checkError.message
      }, { status: 500 });
    }
    
    let result;
    
    if (existing) {
      // Update existing key
      console.log(`Updating existing key: ${keyName}`);
      const { data, error } = await supabase
        .from('api_keys')
        .update({
          key_value: keyValue,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('key_name', keyName)
        .select()
        .single();
      
      if (error) {
        console.error('Update error:', error);
        return NextResponse.json({
          error: 'Failed to update key',
          details: error.message
        }, { status: 500 });
      }
      
      result = { action: 'updated', data };
    } else {
      // Insert new key
      console.log(`Inserting new key: ${keyName}`);
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          key_name: keyName,
          key_value: keyValue,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Insert error:', error);
        return NextResponse.json({
          error: 'Failed to insert key',
          details: error.message
        }, { status: 500 });
      }
      
      result = { action: 'inserted', data };
    }
    
    // Verify the save by reading it back
    const { data: verification } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_name', keyName)
      .single();
    
    return NextResponse.json({
      success: true,
      message: `Successfully ${result.action} ${keyName} in database`,
      result: result.data,
      verification: verification ? {
        ...verification,
        key_value: '••••••' + verification.key_value.slice(-6)
      } : null
    });
    
  } catch (error: any) {
    console.error('Test save error:', error);
    return NextResponse.json({
      error: 'Failed to save key',
      message: error.message
    }, { status: 500 });
  }
}