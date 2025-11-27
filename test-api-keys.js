// const fetch = require('node-fetch');

// Admin credentials
const ADMIN_EMAIL = 'elimizroch@gmail.com';
const ADMIN_PASSWORD = 'ScamDunk2025!Admin';
const BASE_URL = 'https://scam-dunk-production.vercel.app';

async function loginAsAdmin() {
  console.log('Logging in as admin...');
  const response = await fetch(`${BASE_URL}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('✓ Login successful');
    return data.token;
  } else {
    throw new Error('Login failed: ' + JSON.stringify(data));
  }
}

async function checkDebugInfo(token) {
  console.log('\nChecking debug info...');
  const response = await fetch(`${BASE_URL}/api/admin/debug-keys`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  console.log('Debug Info:', JSON.stringify(data, null, 2));
  return data;
}

async function checkCurrentKeys(token) {
  console.log('\nChecking current API keys...');
  const response = await fetch(`${BASE_URL}/api/admin/api-keys`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  if (data.success) {
    let configuredCount = 0;
    data.apiKeys.forEach(category => {
      category.keys.forEach(key => {
        if (key.isConfigured) {
          configuredCount++;
          console.log(`✓ ${key.name}: Configured (${key.currentValue?.value || 'unknown'})`);
        }
      });
    });
    console.log(`\nTotal configured keys: ${configuredCount}`);
  }
  return data;
}

async function checkRestoreEndpoint(token) {
  console.log('\nChecking restore endpoint...');
  const response = await fetch(`${BASE_URL}/api/admin/restore-keys`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'check' })
  });
  
  const data = await response.json();
  console.log('Current keys in database:', data.currentKeys?.length || 0);
  if (data.currentKeys && data.currentKeys.length > 0) {
    data.currentKeys.forEach(key => {
      console.log(`  - ${key.key_name}: ${key.is_active ? 'Active' : 'Inactive'} (Created: ${key.created_at})`);
    });
  }
  return data;
}

async function main() {
  try {
    const token = await loginAsAdmin();
    
    const debugInfo = await checkDebugInfo(token);
    const currentKeys = await checkCurrentKeys(token);
    const restoreInfo = await checkRestoreEndpoint(token);
    
    console.log('\n=== SUMMARY ===');
    console.log('Database connected:', debugInfo.database?.connected || false);
    console.log('Keys in database:', debugInfo.database?.totalKeys || 0);
    console.log('Environment vars:', debugInfo.env);
    
    if (debugInfo.database?.error) {
      console.error('Database error:', debugInfo.database.error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();