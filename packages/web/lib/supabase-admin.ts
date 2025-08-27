import { createClient } from '@supabase/supabase-js';

// Hardcoded fallback configuration
const FALLBACK_SUPABASE_URL = 'https://gcrkijhkecsfafjbojey.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpamhrZWNzZmFmamJvamV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzOTE5MTUsImV4cCI6MjA0ODk2NzkxNX0.VsHcZtqR01JVsYMKZ5dvn2yB2zxUJFCvPqQQ7i5FQPA';

export function getSupabaseClient() {
  // Try environment variables first
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    FALLBACK_SUPABASE_ANON_KEY;
  
  // Fix common configuration mistakes
  // If the URL is a PostgreSQL connection string, extract the project ID and convert to REST API URL
  if (supabaseUrl && supabaseUrl.startsWith('postgresql://')) {
    console.warn('Detected PostgreSQL URL instead of Supabase REST API URL, attempting to fix...');
    // Extract project ID from the PostgreSQL URL
    const match = supabaseUrl.match(/db\.([a-z0-9]+)\.supabase\.co/);
    if (match && match[1]) {
      supabaseUrl = `https://${match[1]}.supabase.co`;
      console.log('Fixed Supabase URL:', supabaseUrl);
    } else {
      // Fallback to hardcoded URL if we can't parse it
      console.warn('Could not parse PostgreSQL URL, using fallback');
      supabaseUrl = FALLBACK_SUPABASE_URL;
    }
  }
  
  // Clean the key - remove any whitespace or newlines
  if (supabaseKey) {
    supabaseKey = supabaseKey.replace(/[\s\n\r]+/g, '').trim();
  }
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing even with fallbacks');
    return null;
  }
  
  try {
    const client = createClient(supabaseUrl, supabaseKey);
    
    // Test the connection
    client.from('api_keys').select('count').limit(1).then(({ error }) => {
      if (error) {
        console.warn('Supabase connection test failed:', error.message);
      } else {
        console.log('Supabase connection successful');
      }
    });
    
    return client;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}