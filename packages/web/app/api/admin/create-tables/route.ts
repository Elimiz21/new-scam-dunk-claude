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
    
    // Create the api_keys table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        -- Create API Keys table if it doesn't exist
        CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          key_name VARCHAR(100) UNIQUE NOT NULL,
          key_value TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(key_name);
        CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
        
        -- Return success
        SELECT 'Tables created successfully' as result;
      `
    }).catch(async (rpcError: any) => {
      // If RPC doesn't exist, try direct approach
      console.log('RPC failed, trying direct SQL approach...');
      
      // Try to create table directly
      const createTableResult = await supabase
        .from('api_keys')
        .select('count')
        .limit(1);
      
      if (createTableResult.error?.code === 'PGRST204' || createTableResult.error?.code === 'PGRST205') {
        // Table doesn't exist, we need to create it via Supabase dashboard
        return {
          error: 'Table needs to be created',
          instructions: 'Please create the table manually in Supabase'
        };
      }
      
      return { data: null, error: rpcError };
    });
    
    if (error) {
      // If the direct SQL approach doesn't work, provide manual instructions
      return NextResponse.json({
        error: 'Could not create table automatically',
        message: 'Please run this SQL in your Supabase SQL editor',
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
    }
    
    // Check if table was created
    const { data: checkData, error: checkError } = await supabase
      .from('api_keys')
      .select('count')
      .limit(1);
    
    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Table api_keys exists and is ready!',
        nextSteps: 'You can now save API keys in the admin panel'
      });
    } else {
      return NextResponse.json({
        warning: 'Table might have been created but cannot verify',
        error: checkError.message,
        nextSteps: 'Try saving an API key to test'
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      message: error.message,
      solution: 'Please create the table manually in Supabase SQL editor'
    }, { status: 500 });
  }
}