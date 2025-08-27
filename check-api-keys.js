const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gcrkijxkecsfafjbojey.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.log('⚠️  No SUPABASE_SERVICE_ROLE_KEY found in environment');
  console.log('Checking with fallback credentials...');
}

// Create Supabase client
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpanhrZWNzZmFmamJvamV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNzcxMzYsImV4cCI6MjA1MjY1MzEzNn0.l7E7uAv1lguno9vDMjNGJ0GVkonCSpyi1dM-hc5SH5s'
);

async function checkApiKeys() {
  console.log('🔍 Checking Supabase database for existing API keys...\n');
  console.log(`Database URL: ${supabaseUrl}\n`);

  try {
    // Query the api_keys table
    const { data, error, count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying database:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('📭 No API keys found in the database.');
      console.log('The api_keys table is empty.\n');
    } else {
      console.log(`✅ Found ${data.length} API keys in the database:\n`);
      
      data.forEach((key, index) => {
        console.log(`${index + 1}. ${key.key_name}`);
        console.log(`   Value: ${key.key_value ? '••••••' + key.key_value.slice(-4) : 'null'}`);
        console.log(`   Active: ${key.is_active ? '✅' : '❌'}`);
        console.log(`   Created: ${new Date(key.created_at).toLocaleString()}`);
        console.log(`   Updated: ${new Date(key.updated_at).toLocaleString()}\n`);
      });
    }

    // Also check the table structure
    console.log('📊 Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(0);

    if (!tableError) {
      console.log('✅ Table "api_keys" exists and is accessible\n');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the check
checkApiKeys();