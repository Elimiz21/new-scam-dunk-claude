-- Marketing Dashboard Database Setup
-- Run this in Supabase SQL Editor to enable full functionality
-- Project: https://supabase.com/dashboard/project/gcrkijxkecsfafjbojey

-- ================================================
-- Table 1: Agent Prompts Storage
-- ================================================
CREATE TABLE IF NOT EXISTS marketing_agent_prompts (
  agent_id text PRIMARY KEY,
  prompt text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Add Row-Level Security
ALTER TABLE marketing_agent_prompts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON marketing_agent_prompts
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated write" ON marketing_agent_prompts
  FOR ALL TO authenticated USING (true);

-- ================================================
-- Table 2: Integration Status Tracking
-- ================================================
CREATE TABLE IF NOT EXISTS marketing_integrations (
  provider text PRIMARY KEY,
  status text NOT NULL,
  description text,
  actions text[],
  url text,
  last_synced timestamptz
);

-- Add Row-Level Security
ALTER TABLE marketing_integrations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read integrations" ON marketing_integrations
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to manage integrations
CREATE POLICY "Allow authenticated write integrations" ON marketing_integrations
  FOR ALL TO authenticated USING (true);

-- Seed initial integration data
INSERT INTO marketing_integrations (provider, status, description, actions, url) VALUES
  ('github', 'pending', 'Connect GitHub to sync marketing documentation and trigger workflows', ARRAY['Connect Repository', 'Configure Webhooks'], 'https://github.com/Elimiz21/new-scam-dunk-claude'),
  ('supabase', 'connected', 'Database and authentication provider - currently connected', ARRAY['View Tables', 'Check Status'], 'https://supabase.com/dashboard/project/gcrkijxkecsfafjbojey'),
  ('vercel', 'pending', 'Deploy and hosting platform for continuous deployment', ARRAY['Connect Project', 'Configure Domains'], 'https://vercel.com')
ON CONFLICT (provider) DO NOTHING;

-- ================================================
-- Table 3: Integration Credentials (Encrypted)
-- ================================================
CREATE TABLE IF NOT EXISTS marketing_integration_credentials (
  provider text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Add Row-Level Security
ALTER TABLE marketing_integration_credentials ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access credentials
CREATE POLICY "Allow service role only" ON marketing_integration_credentials
  FOR ALL TO service_role USING (true);

-- ================================================
-- Verification
-- ================================================

-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'marketing_%'
ORDER BY table_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename LIKE 'marketing_%'
ORDER BY tablename, policyname;

-- ================================================
-- Success!
-- ================================================

-- You should see 3 tables:
-- 1. marketing_agent_prompts
-- 2. marketing_integrations
-- 3. marketing_integration_credentials

-- Now go test the marketing dashboard:
-- 1. Visit /marketing
-- 2. Try editing an agent prompt and clicking "Save"
-- 3. Check integrations tab for status
-- 4. Prompts should now persist across sessions!
