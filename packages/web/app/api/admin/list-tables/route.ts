import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Listing all tables in database...');
    
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Could not connect to Supabase' 
      }, { status: 500 });
    }
    
    // Query to get all tables in the public schema
    const { data, error } = await supabase
      .rpc('get_tables', {})
      .catch(async () => {
        // If RPC doesn't work, try querying information_schema
        console.log('Trying alternative method to list tables...');
        
        // Try to query a system table to get table names
        const result = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
          
        return result;
      })
      .catch(() => {
        // Last resort - try known tables
        console.log('Checking for known tables...');
        return { data: null, error: 'Cannot query information_schema' };
      });
    
    // If we can't query system tables, try checking specific tables
    if (error || !data) {
      const tables = [];
      const tableNames = [
        'api_keys',
        'users',
        'scans',
        'admin_logs',
        'contact_verifications',
        'chat_analyses',
        'trading_analyses',
        'veracity_checks',
        'user_subscriptions',
        'pricing_tiers',
        'payment_transactions'
      ];
      
      for (const tableName of tableNames) {
        try {
          const { error: checkError } = await supabase
            .from(tableName)
            .select('count')
            .limit(1)
            .single();
          
          if (!checkError || checkError.code !== 'PGRST205') {
            tables.push({
              name: tableName,
              exists: !checkError,
              error: checkError?.message || null
            });
          }
        } catch (e) {
          tables.push({
            name: tableName,
            exists: false,
            error: 'Table does not exist'
          });
        }
      }
      
      return NextResponse.json({
        method: 'manual_check',
        tables_found: tables.filter(t => t.exists).map(t => t.name),
        tables_missing: tables.filter(t => !t.exists).map(t => t.name),
        all_tables: tables,
        important: {
          api_keys_exists: tables.find(t => t.name === 'api_keys')?.exists || false
        },
        recommendation: tables.find(t => t.name === 'api_keys')?.exists 
          ? 'api_keys table exists! You can save keys now.'
          : 'api_keys table is MISSING. Please create it using the SQL provided.'
      });
    }
    
    return NextResponse.json({
      method: 'information_schema',
      tables: data,
      total: data?.length || 0
    });
    
  } catch (error: any) {
    console.error('❌ Error listing tables:', error);
    return NextResponse.json({ 
      error: 'Failed to list tables',
      message: error.message,
      hint: 'Check Supabase dashboard directly at: https://supabase.com/dashboard/project/gcrkijxkecsfafjbojey/editor'
    }, { status: 500 });
  }
}