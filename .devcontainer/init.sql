-- Initialize Scam Dunk Database
-- This script sets up the initial database schema and extensions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS scam_detection;
CREATE SCHEMA IF NOT EXISTS blockchain;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set search path
SET search_path TO public, auth, scam_detection, blockchain, analytics;

-- Grant permissions (development environment - permissive)
GRANT ALL PRIVILEGES ON DATABASE scamdunk TO scamdunk;
GRANT ALL PRIVILEGES ON ALL SCHEMAS IN DATABASE scamdunk TO scamdunk;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scamdunk;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scamdunk;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO scamdunk;

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator', 'analyst');
CREATE TYPE scan_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE risk_level AS ENUM ('safe', 'low', 'medium', 'high', 'critical');
CREATE TYPE platform_type AS ENUM ('whatsapp', 'telegram', 'discord', 'instagram', 'email', 'sms');
CREATE TYPE scam_type AS ENUM ('pig_butchering', 'pump_dump', 'fake_trading', 'romance', 'phishing', 'rug_pull', 'unknown');

-- Notify development environment is ready
DO $$
BEGIN
  RAISE NOTICE 'Scam Dunk database initialized successfully!';
END $$;