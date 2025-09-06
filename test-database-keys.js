#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as the app
const SUPABASE_URL = 'https://gcrkijhkecsfafjbojey.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpamhrZWNzZmFmamJvamV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzM5MTkxNSwiZXhwIjoyMDQ4OTY3OTE1fQ.7iQ4mPdAiCDO0SJX4hO-1G_xwi_Ge_xGqC1DJzDcPzc';

async function testDatabaseKeys() {
  console.log('=== Testing Database API Key Storage ===\n');
  
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log('✓ Connected to Supabase\n');
    
    // 1. Check if api_keys table exists
    console.log('1. Checking api_keys table...');
    const { data: tables, error: tablesError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      if (tablesError.code === '42P01') {
        console.log('❌ Table "api_keys" does not exist!');
        console.log('\nCreating table...');
        
        // Create the table
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS api_keys (
              id SERIAL PRIMARY KEY,
              key_name VARCHAR(100) UNIQUE NOT NULL,
              key_value TEXT NOT NULL,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
          `
        });
        
        if (createError) {
          console.log('❌ Failed to create table:', createError.message);
          console.log('\nPlease create the table manually in Supabase dashboard with this SQL:');
          console.log(`
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,
  key_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`);
        } else {
          console.log('✓ Table created successfully');
        }
      } else {
        console.log('❌ Error checking table:', tablesError.message);
      }
    } else {
      console.log('✓ Table "api_keys" exists\n');
      
      // 2. List all API keys in the database
      console.log('2. Fetching all API keys from database...');
      const { data: keys, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (keysError) {
        console.log('❌ Error fetching keys:', keysError.message);
      } else if (keys && keys.length > 0) {
        console.log(`✓ Found ${keys.length} API keys in database:\n`);
        
        keys.forEach(key => {
          const maskedValue = key.key_value ? 
            '••••••' + key.key_value.slice(-6) : '(empty)';
          console.log(`  - ${key.key_name}: ${maskedValue}`);
          console.log(`    Status: ${key.is_active ? 'Active' : 'Inactive'}`);
          console.log(`    Created: ${new Date(key.created_at).toLocaleString()}`);
          console.log(`    Updated: ${new Date(key.updated_at).toLocaleString()}\n`);
        });
      } else {
        console.log('⚠️  No API keys found in database');
        console.log('   Keys entered in the admin panel may not have been saved properly.\n');
      }
      
      // 3. Test saving a new key
      console.log('3. Testing save functionality...');
      const testKeyName = 'TEST_KEY_' + Date.now();
      const testKeyValue = 'test-value-12345';
      
      const { error: saveError } = await supabase
        .from('api_keys')
        .upsert([{
          key_name: testKeyName,
          key_value: testKeyValue,
          is_active: true,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'key_name'
        });
      
      if (saveError) {
        console.log('❌ Test save failed:', saveError.message);
      } else {
        console.log('✓ Test key saved successfully');
        
        // Clean up test key
        await supabase
          .from('api_keys')
          .delete()
          .eq('key_name', testKeyName);
        console.log('✓ Test key cleaned up\n');
      }
      
      // 4. Check for important production keys
      console.log('4. Checking for critical production keys...');
      const criticalKeys = [
        'OPENAI_API_KEY',
        'COINMARKETCAP_API_KEY',
        'ALPHA_VANTAGE_API_KEY',
        'ETHERSCAN_API_KEY'
      ];
      
      for (const keyName of criticalKeys) {
        const { data: key } = await supabase
          .from('api_keys')
          .select('key_name, is_active')
          .eq('key_name', keyName)
          .single();
        
        if (key && key.is_active) {
          console.log(`  ✓ ${keyName}: Configured and active`);
        } else if (key && !key.is_active) {
          console.log(`  ⚠️  ${keyName}: Configured but inactive`);
        } else {
          console.log(`  ❌ ${keyName}: Not configured`);
        }
      }
    }
    
    console.log('\n=== Test Complete ===');
    console.log('\nSummary:');
    console.log('- If you see API keys listed above, they ARE saved in the database');
    console.log('- If no keys are shown, the keys may only be in memory/session storage');
    console.log('- Re-enter keys in the admin panel at: https://scam-dunk-production.vercel.app/admin');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDatabaseKeys().catch(console.error);