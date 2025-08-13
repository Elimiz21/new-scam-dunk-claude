#!/bin/bash

# Production Database Setup Script
# This script sets up the production database with proper security and optimizations

set -e

echo "🚀 Setting up production database for Scam Dunk..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "❌ .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Check required variables
if [ -z "$DATABASE_URL" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ Required database environment variables are not set!"
    exit 1
fi

echo "📦 Installing dependencies..."
cd packages/api
npm ci --production

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding production database with initial data..."
npx prisma db seed

echo "🔍 Verifying database connection..."
npx prisma db execute --sql "SELECT version();"

echo "🔐 Setting up database security..."
cat << EOF > /tmp/security.sql
-- Revoke unnecessary privileges
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Create read-only user for analytics
CREATE USER scamdunk_readonly WITH PASSWORD '${READONLY_PASSWORD:-DefaultReadOnly123}';
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO scamdunk_readonly;
GRANT USAGE ON SCHEMA public TO scamdunk_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO scamdunk_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO scamdunk_readonly;

-- Set up connection limits
ALTER DATABASE ${POSTGRES_DB} CONNECTION LIMIT 100;

-- Enable row level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create backup user
CREATE USER scamdunk_backup WITH PASSWORD '${BACKUP_PASSWORD:-DefaultBackup123}';
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO scamdunk_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO scamdunk_backup;
EOF

echo "📊 Optimizing database performance..."
cat << EOF > /tmp/optimize.sql
-- Update statistics
ANALYZE;

-- Configure autovacuum
ALTER TABLE scans SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE alerts SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE chat_messages SET (autovacuum_vacuum_scale_factor = 0.05);

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_user_created ON scans(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_user_status ON alerts(user_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_scan ON chat_messages(scan_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_results_scan ON verification_results(scan_id);

-- Create composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_type_status_created ON scans(scan_type, status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_severity_created ON alerts(severity, created_at DESC);
EOF

# Execute SQL scripts
if command -v psql &> /dev/null; then
    psql $DATABASE_URL < /tmp/security.sql
    psql $DATABASE_URL < /tmp/optimize.sql
else
    echo "⚠️  psql not found. Please run the SQL scripts manually."
    echo "Security script saved to: /tmp/security.sql"
    echo "Optimization script saved to: /tmp/optimize.sql"
fi

echo "🔄 Setting up database backups..."
mkdir -p backups

cat << 'EOF' > backups/backup.sh
#!/bin/bash
# Daily backup script
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/scamdunk_$TIMESTAMP.sql.gz"

pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "scamdunk_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x backups/backup.sh

echo "📅 Setting up backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * /app/backups/backup.sh") | crontab -

echo "✅ Production database setup complete!"
echo ""
echo "Next steps:"
echo "1. Review the database security settings"
echo "2. Update passwords for readonly and backup users"
echo "3. Configure automated backup storage (S3/GCS)"
echo "4. Set up monitoring and alerting"
echo "5. Test database failover procedures"