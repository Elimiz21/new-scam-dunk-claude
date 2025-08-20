-- Create API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,
  key_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Admin Logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  email VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_name ON api_keys(key_name);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_timestamp ON admin_logs(timestamp);

-- Create or update scans table if it doesn't exist
CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  scan_type VARCHAR(50),
  risk_score INTEGER,
  risk_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create or update users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tables for scan results if they don't exist
CREATE TABLE IF NOT EXISTS contact_verifications (
  id SERIAL PRIMARY KEY,
  scan_id VARCHAR(255),
  contact_type VARCHAR(50),
  contact_value VARCHAR(255),
  is_scammer BOOLEAN,
  risk_score INTEGER,
  risk_level VARCHAR(20),
  confidence INTEGER,
  verification_sources TEXT[],
  flags TEXT[],
  recommendations TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_analyses (
  id SERIAL PRIMARY KEY,
  scan_id VARCHAR(255),
  manipulation_detected BOOLEAN,
  risk_score INTEGER,
  confidence INTEGER,
  patterns JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trading_analyses (
  id SERIAL PRIMARY KEY,
  scan_id VARCHAR(255),
  symbol VARCHAR(50),
  manipulation_type VARCHAR(100),
  risk_score INTEGER,
  indicators JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veracity_checks (
  id SERIAL PRIMARY KEY,
  scan_id VARCHAR(255),
  entity_type VARCHAR(50),
  entity_name VARCHAR(255),
  is_legitimate BOOLEAN,
  risk_score INTEGER,
  verification_sources TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);