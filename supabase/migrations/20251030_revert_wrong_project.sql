-- Roll back unintended Supabase migrations pushed from another project

-- Drop triggers created by the pricing/subscription migration
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;

-- Drop helper functions introduced by the migrations
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_user_scan_eligibility(VARCHAR);

-- Revert column additions on existing tables
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS subscription_id;
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS free_trial_used;
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS total_scans_performed;
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS subscription_status;

-- Drop tables introduced by the migrations (ordered to satisfy foreign keys)
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS user_scan_usage CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

DROP TABLE IF EXISTS veracity_checks CASCADE;
DROP TABLE IF EXISTS trading_analyses CASCADE;
DROP TABLE IF EXISTS chat_analyses CASCADE;
DROP TABLE IF EXISTS contact_verifications CASCADE;
DROP TABLE IF EXISTS scans CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
