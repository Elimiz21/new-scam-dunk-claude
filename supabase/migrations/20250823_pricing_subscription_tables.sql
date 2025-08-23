-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  billing_period VARCHAR(20), -- 'monthly', 'one_time', 'free'
  features JSONB NOT NULL,
  max_users INTEGER DEFAULT 1,
  max_scans_per_month INTEGER, -- NULL for unlimited
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert the new pricing plans
INSERT INTO subscription_plans (name, display_name, price, billing_period, features, max_users, max_scans_per_month, sort_order) VALUES
('free_trial', 'Free Trial', 0.00, 'free', 
 '{"scans": 1, "features": ["All 4 detection tests", "Full AI analysis", "Detailed report", "No credit card required"]}', 
 1, 1, 1),
('pay_per_scan', 'Pay Per Scan', 4.99, 'one_time', 
 '{"features": ["Single comprehensive scan", "All 4 detection tests", "Advanced AI detection", "Downloadable report", "Email results", "30-day result storage"]}', 
 1, 1, 2),
('personal', 'Personal', 9.99, 'monthly', 
 '{"features": ["Unlimited scans", "All 4 detection tests", "Real-time monitoring", "Priority support", "Scan history", "Mobile app access", "Email & SMS alerts"]}', 
 1, NULL, 3),
('family', 'Family', 19.99, 'monthly', 
 '{"features": ["Everything in Personal", "Up to 3 users", "Family dashboard", "Elder-specific features", "Activity monitoring", "Emergency alerts", "Phone support", "Parental controls"]}', 
 3, NULL, 4),
('teams', 'Teams', 49.99, 'monthly', 
 '{"features": ["Unlimited users & scans", "Team management dashboard", "API access & integrations", "Compliance reporting", "Dedicated account manager", "Priority support", "Custom training"]}', 
 NULL, NULL, 5),
('enterprise', 'Enterprise', 0.00, 'custom', 
 '{"features": ["Custom AI model training", "On-premise deployment option", "SLA & 24/7 support", "SOC 2 compliance", "White-label options", "Custom integrations"]}', 
 NULL, NULL, 6);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  plan_id INTEGER REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL, -- 'active', 'cancelled', 'expired', 'trial'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_active_subscription UNIQUE (user_id, status)
);

-- Create user scan usage table to track free trials and pay-per-scan
CREATE TABLE IF NOT EXISTS user_scan_usage (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  scan_type VARCHAR(50) NOT NULL, -- 'free_trial', 'pay_per_scan', 'subscription'
  scan_id VARCHAR(255),
  used_at TIMESTAMP DEFAULT NOW(),
  payment_id VARCHAR(255), -- For pay-per-scan transactions
  amount_paid DECIMAL(10, 2),
  CONSTRAINT unique_free_trial UNIQUE (user_id, scan_type) -- Ensures only one free trial per user
);

-- Create payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  subscription_id INTEGER REFERENCES user_subscriptions(id),
  transaction_type VARCHAR(50) NOT NULL, -- 'subscription', 'one_time', 'refund'
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create team members table for family and teams plans
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES user_subscriptions(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member'
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT unique_team_member UNIQUE (subscription_id, email)
);

-- Add subscription fields to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id INTEGER REFERENCES user_subscriptions(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_trial_used BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_scans_performed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free';

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_scan_usage_user_id ON user_scan_usage(user_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_team_members_subscription_id ON team_members(subscription_id);

-- Create a function to check if user has available scans
CREATE OR REPLACE FUNCTION check_user_scan_eligibility(p_user_id VARCHAR)
RETURNS TABLE (
  can_scan BOOLEAN,
  scan_type VARCHAR,
  reason TEXT
) AS $$
BEGIN
  -- Check if user has active subscription
  IF EXISTS (
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = p_user_id 
    AND status = 'active' 
    AND (current_period_end IS NULL OR current_period_end > NOW())
  ) THEN
    RETURN QUERY SELECT true::BOOLEAN, 'subscription'::VARCHAR, 'Active subscription'::TEXT;
    RETURN;
  END IF;
  
  -- Check if user has used free trial
  IF NOT EXISTS (
    SELECT 1 FROM user_scan_usage 
    WHERE user_id = p_user_id 
    AND scan_type = 'free_trial'
  ) THEN
    RETURN QUERY SELECT true::BOOLEAN, 'free_trial'::VARCHAR, 'Free trial available'::TEXT;
    RETURN;
  END IF;
  
  -- User needs to pay per scan
  RETURN QUERY SELECT false::BOOLEAN, 'pay_per_scan'::VARCHAR, 'Payment required'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();