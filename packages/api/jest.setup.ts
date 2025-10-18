process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-test-token';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  'unit-test-secret-key-that-should-be-replaced-in-production';
process.env.PORT = process.env.PORT || '0';
