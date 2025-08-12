-- Database initialization script for Scam Dunk AI Service
-- This script creates the necessary tables for storing analysis results,
-- user feedback, model performance metrics, and other persistent data.

-- Create database if it doesn't exist (uncomment if needed)
-- CREATE DATABASE scamdunk_ai;

-- Use the database
\c scamdunk_ai;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS ai_service;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set default schema
SET search_path TO ai_service, public;

-- Table for storing analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_hash VARCHAR(32) NOT NULL,
    original_text TEXT,
    final_score FLOAT NOT NULL CHECK (final_score >= 0 AND final_score <= 1),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('critical', 'high', 'medium', 'low', 'minimal', 'error')),
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    model_predictions JSONB,
    explanation JSONB,
    processing_time FLOAT,
    user_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analysis_results
CREATE INDEX IF NOT EXISTS idx_analysis_results_text_hash ON analysis_results(text_hash);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_results_risk_level ON analysis_results(risk_level);
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_score ON analysis_results(final_score);

-- Table for user feedback
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES analysis_results(id) ON DELETE SET NULL,
    text_hash VARCHAR(32),
    original_text TEXT,
    predicted_score FLOAT NOT NULL CHECK (predicted_score >= 0 AND predicted_score <= 1),
    actual_label INTEGER NOT NULL CHECK (actual_label IN (0, 1)),
    user_confidence INTEGER CHECK (user_confidence >= 1 AND user_confidence <= 5),
    feedback_text TEXT,
    user_id VARCHAR(255),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_feedback
CREATE INDEX IF NOT EXISTS idx_user_feedback_analysis_id ON user_feedback(analysis_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_text_hash ON user_feedback(text_hash);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);

-- Table for batch processing jobs
CREATE TABLE IF NOT EXISTS batch_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_items INTEGER NOT NULL,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    results JSONB,
    error_message TEXT,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    callback_url TEXT,
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_time FLOAT
);

-- Create indexes for batch_jobs
CREATE INDEX IF NOT EXISTS idx_batch_jobs_batch_id ON batch_jobs(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_priority ON batch_jobs(priority);

-- Table for model performance metrics
CREATE TABLE IF NOT EXISTS model_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(50) NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for model_metrics
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_name ON model_metrics(model_name);
CREATE INDEX IF NOT EXISTS idx_model_metrics_timestamp ON model_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_model_metrics_metric_name ON model_metrics(metric_name);

-- Table for system performance tracking
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL,
    metrics JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for system_metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);

-- Table for API usage statistics
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time FLOAT NOT NULL,
    request_size INTEGER,
    response_size INTEGER,
    user_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for api_usage
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON api_usage(status_code);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);

-- Analytics schema tables
SET search_path TO analytics, public;

-- Daily aggregated statistics
CREATE TABLE IF NOT EXISTS daily_stats (
    date DATE PRIMARY KEY,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time FLOAT,
    total_scam_detected INTEGER DEFAULT 0,
    total_legitimate INTEGER DEFAULT 0,
    high_risk_count INTEGER DEFAULT 0,
    medium_risk_count INTEGER DEFAULT 0,
    low_risk_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    cache_hit_rate FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hourly aggregated statistics
CREATE TABLE IF NOT EXISTS hourly_stats (
    hour TIMESTAMP WITH TIME ZONE PRIMARY KEY,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time FLOAT,
    scam_detection_rate FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics tables
CREATE INDEX IF NOT EXISTS idx_hourly_stats_hour ON hourly_stats(hour);

-- Views for common queries
SET search_path TO ai_service, public;

-- View for recent analysis results
CREATE OR REPLACE VIEW recent_analyses AS
SELECT 
    id,
    text_hash,
    final_score,
    risk_level,
    confidence,
    processing_time,
    user_id,
    created_at
FROM analysis_results
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- View for model accuracy based on feedback
CREATE OR REPLACE VIEW model_accuracy AS
SELECT 
    DATE_TRUNC('day', uf.created_at) as date,
    COUNT(*) as total_feedback,
    AVG(
        CASE 
            WHEN (uf.predicted_score >= 0.5 AND uf.actual_label = 1) OR 
                 (uf.predicted_score < 0.5 AND uf.actual_label = 0) 
            THEN 1.0 
            ELSE 0.0 
        END
    ) as accuracy,
    AVG(uf.user_confidence) as avg_user_confidence
FROM user_feedback uf
GROUP BY DATE_TRUNC('day', uf.created_at)
ORDER BY date DESC;

-- View for risk level distribution
CREATE OR REPLACE VIEW risk_distribution AS
SELECT 
    risk_level,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    AVG(confidence) as avg_confidence
FROM analysis_results
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY risk_level
ORDER BY count DESC;

-- Functions for data maintenance

-- Function to clean old analysis results
CREATE OR REPLACE FUNCTION cleanup_old_analyses(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analysis_results 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily statistics
CREATE OR REPLACE FUNCTION update_daily_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO analytics.daily_stats (
        date,
        total_requests,
        successful_requests,
        failed_requests,
        avg_response_time,
        total_scam_detected,
        total_legitimate,
        high_risk_count,
        medium_risk_count,
        low_risk_count,
        unique_users
    )
    SELECT 
        target_date,
        COUNT(*),
        COUNT(*) FILTER (WHERE final_score >= 0),
        COUNT(*) FILTER (WHERE final_score < 0),
        AVG(processing_time),
        COUNT(*) FILTER (WHERE final_score >= 0.5),
        COUNT(*) FILTER (WHERE final_score < 0.5),
        COUNT(*) FILTER (WHERE risk_level = 'high'),
        COUNT(*) FILTER (WHERE risk_level = 'medium'),
        COUNT(*) FILTER (WHERE risk_level = 'low'),
        COUNT(DISTINCT user_id)
    FROM analysis_results
    WHERE DATE(created_at) = target_date
    ON CONFLICT (date) DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        successful_requests = EXCLUDED.successful_requests,
        failed_requests = EXCLUDED.failed_requests,
        avg_response_time = EXCLUDED.avg_response_time,
        total_scam_detected = EXCLUDED.total_scam_detected,
        total_legitimate = EXCLUDED.total_legitimate,
        high_risk_count = EXCLUDED.high_risk_count,
        medium_risk_count = EXCLUDED.medium_risk_count,
        low_risk_count = EXCLUDED.low_risk_count,
        unique_users = EXCLUDED.unique_users,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analysis_results_updated_at 
    BEFORE UPDATE ON analysis_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a user for the application (adjust credentials as needed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'scamdunk_app') THEN
        CREATE ROLE scamdunk_app WITH LOGIN PASSWORD 'app_password_123';
    END IF;
END
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA ai_service TO scamdunk_app;
GRANT USAGE ON SCHEMA analytics TO scamdunk_app;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ai_service TO scamdunk_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA analytics TO scamdunk_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ai_service TO scamdunk_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA analytics TO scamdunk_app;

-- Allow the app user to execute functions
GRANT EXECUTE ON FUNCTION cleanup_old_analyses(INTEGER) TO scamdunk_app;
GRANT EXECUTE ON FUNCTION update_daily_stats(DATE) TO scamdunk_app;

-- Insert some sample data for testing (optional)
INSERT INTO analysis_results (
    text_hash,
    original_text,
    final_score,
    risk_level,
    confidence,
    processing_time,
    model_predictions,
    explanation
) VALUES 
(
    md5('Test scam message'),
    'Guaranteed 500% returns! Act now!',
    0.92,
    'high',
    0.87,
    0.156,
    '{"bert": {"score": 0.89, "confidence": 0.82}, "pattern": {"score": 0.95, "confidence": 0.91}}',
    '{"key_factors": [{"factor": "investment_scam", "importance": 0.95}], "recommendations": ["Do not respond", "Report to authorities"]}'
),
(
    md5('Normal message'),
    'Hello, how are you today?',
    0.15,
    'low',
    0.92,
    0.098,
    '{"bert": {"score": 0.12, "confidence": 0.95}, "pattern": {"score": 0.18, "confidence": 0.89}}',
    '{"key_factors": [], "recommendations": ["Message appears legitimate"]}'
);

-- Create schedule for maintenance (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-analyses', '0 2 * * *', 'SELECT cleanup_old_analyses(30);');
-- SELECT cron.schedule('update-daily-stats', '0 1 * * *', 'SELECT update_daily_stats(CURRENT_DATE - INTERVAL ''1 day'');');

COMMIT;