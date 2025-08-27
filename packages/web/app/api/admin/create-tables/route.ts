import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔨 Creating database tables...');
    
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Could not connect to Supabase' 
      }, { status: 500 });
    }
    
    // Try to check if the table exists first
    const { data: tableCheck, error: checkError } = await supabase
      .from('api_keys')
      .select('count')
      .limit(1);
    
    let tableExists = false;
    if (!checkError || (checkError.code !== 'PGRST205' && checkError.code !== 'PGRST204')) {
      tableExists = true;
    }
    
    if (tableExists) {
      return NextResponse.json({
        success: true,
        message: 'Table api_keys already exists!',
        nextSteps: 'You can now save API keys in the admin panel'
      });
    }
    
    // Table doesn't exist, provide instructions to create it
    return NextResponse.json({
      error: 'Table api_keys does not exist',
      message: 'Please create it by running this SQL in your Supabase SQL editor',
        sql: `
-- Create API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,
  key_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(key_name);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Grant permissions
GRANT ALL ON api_keys TO postgres;
GRANT ALL ON api_keys TO anon;
GRANT ALL ON api_keys TO authenticated;
GRANT ALL ON api_keys TO service_role;
        `,
        instructions: [
          '1. Go to https://supabase.com/dashboard/project/gcrkijxkecsfafjbojey/sql/new',
          '2. Copy the SQL above',
          '3. Paste it in the SQL editor',
          '4. Click "Run" to create the table',
          '5. Then come back and refresh the admin panel'
        ]
      });
    
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      message: error.message,
      solution: 'Please create the table manually in Supabase SQL editor'
    }, { status: 500 });
  }
}