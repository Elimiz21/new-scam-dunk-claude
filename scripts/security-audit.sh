#!/bin/bash

# Security Audit Script for Scam Dunk
# Performs comprehensive security checks before production deployment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Results tracking
ISSUES_FOUND=0
WARNINGS=0

echo -e "${BLUE}🔒 Starting Security Audit for Scam Dunk${NC}"
echo "========================================="

# Function to report issues
report_issue() {
    echo -e "${RED}❌ ISSUE: $1${NC}"
    ((ISSUES_FOUND++))
}

report_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
}

report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 1. Check for exposed secrets in code
echo -e "\n${BLUE}1. Checking for exposed secrets...${NC}"

# Check for common secret patterns
if grep -r "sk_live\|pk_live\|api_key\|secret_key\|password\|token" \
    --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
    --exclude-dir=node_modules --exclude-dir=.git \
    packages/ 2>/dev/null | grep -v "process.env" | grep -v "interface\|type\|const.*:\|let.*:\|var.*:" > /dev/null; then
    report_issue "Potential secrets found in source code"
    echo "Run: grep -r 'sk_live\|api_key' --include='*.js' --include='*.ts' packages/"
else
    report_success "No exposed secrets found in source code"
fi

# Check .env files aren't committed
if [ -f ".env" ] || [ -f ".env.production" ]; then
    if git ls-files --error-unmatch .env 2>/dev/null || git ls-files --error-unmatch .env.production 2>/dev/null; then
        report_issue ".env files are tracked in git!"
    else
        report_success ".env files are not tracked in git"
    fi
fi

# 2. Dependency vulnerabilities
echo -e "\n${BLUE}2. Checking npm dependencies...${NC}"

# Run npm audit
AUDIT_RESULT=$(npm audit --production 2>&1 || true)
if echo "$AUDIT_RESULT" | grep -q "found 0 vulnerabilities"; then
    report_success "No npm vulnerabilities found"
else
    CRITICAL=$(echo "$AUDIT_RESULT" | grep -oP '\d+(?= critical)' || echo "0")
    HIGH=$(echo "$AUDIT_RESULT" | grep -oP '\d+(?= high)' || echo "0")
    
    if [ "$CRITICAL" -gt 0 ]; then
        report_issue "Found $CRITICAL critical npm vulnerabilities"
    fi
    if [ "$HIGH" -gt 0 ]; then
        report_warning "Found $HIGH high npm vulnerabilities"
    fi
fi

# 3. Check file permissions
echo -e "\n${BLUE}3. Checking file permissions...${NC}"

# Check for world-writable files
WORLD_WRITABLE=$(find . -type f -perm -002 -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | wc -l)
if [ "$WORLD_WRITABLE" -gt 0 ]; then
    report_warning "Found $WORLD_WRITABLE world-writable files"
else
    report_success "No world-writable files found"
fi

# 4. Security headers check
echo -e "\n${BLUE}4. Checking security headers configuration...${NC}"

# Check Next.js config for security headers
if grep -q "Strict-Transport-Security\|X-Frame-Options\|X-Content-Type-Options" packages/web/next.config.js; then
    report_success "Security headers configured in Next.js"
else
    report_issue "Security headers not properly configured"
fi

# Check API security middleware
if [ -f "packages/api/src/middleware/security.middleware.ts" ]; then
    report_success "API security middleware found"
else
    report_warning "API security middleware not found"
fi

# 5. Authentication & Authorization
echo -e "\n${BLUE}5. Checking authentication configuration...${NC}"

# Check for JWT secret configuration
if grep -q "JWT_SECRET\|NEXTAUTH_SECRET" .env.production.example; then
    report_success "JWT/Auth secrets configured"
else
    report_issue "Authentication secrets not configured"
fi

# 6. Database security
echo -e "\n${BLUE}6. Checking database security...${NC}"

# Check for SQL injection prevention
if grep -r "SELECT.*FROM.*WHERE.*\${" --include="*.ts" --include="*.js" packages/api 2>/dev/null; then
    report_warning "Potential SQL injection vulnerabilities found"
else
    report_success "No obvious SQL injection patterns found"
fi

# Check Prisma usage (parameterized queries)
if [ -f "packages/api/prisma/schema.prisma" ]; then
    report_success "Using Prisma ORM (parameterized queries)"
fi

# 7. Input validation
echo -e "\n${BLUE}7. Checking input validation...${NC}"

# Check for validation libraries
if grep -q "joi\|yup\|zod\|express-validator" packages/api/package.json; then
    report_success "Input validation library found"
else
    report_warning "No input validation library detected"
fi

# 8. Rate limiting
echo -e "\n${BLUE}8. Checking rate limiting...${NC}"

if grep -q "express-rate-limit\|rate-limit" packages/api/package.json; then
    report_success "Rate limiting configured"
else
    report_issue "Rate limiting not configured"
fi

# 9. CORS configuration
echo -e "\n${BLUE}9. Checking CORS configuration...${NC}"

if grep -q "cors" packages/api/package.json; then
    if grep -q "origin.*function\|origin.*array" packages/api/src/middleware/security.middleware.ts 2>/dev/null; then
        report_success "CORS properly configured with origin validation"
    else
        report_warning "CORS configured but origin validation unclear"
    fi
else
    report_issue "CORS not configured"
fi

# 10. SSL/TLS configuration
echo -e "\n${BLUE}10. Checking SSL/TLS configuration...${NC}"

if [ -f "nginx/sites-enabled/scamdunk.conf" ]; then
    if grep -q "ssl_protocols.*TLSv1.2.*TLSv1.3" nginx/sites-enabled/scamdunk.conf; then
        report_success "Modern TLS protocols configured"
    else
        report_warning "TLS configuration needs review"
    fi
else
    report_warning "Nginx SSL configuration not found"
fi

# 11. Content Security Policy
echo -e "\n${BLUE}11. Checking Content Security Policy...${NC}"

if grep -q "Content-Security-Policy" packages/web/next.config.js; then
    report_success "CSP headers configured"
else
    report_warning "Content Security Policy not configured"
fi

# 12. API Key Security
echo -e "\n${BLUE}12. Checking API key security...${NC}"

# Check if API keys are hashed
if grep -q "createHash\|bcrypt\|argon2" packages/api/src/middleware/security.middleware.ts 2>/dev/null; then
    report_success "API keys are hashed before comparison"
else
    report_warning "API key hashing not detected"
fi

# 13. Logging and Monitoring
echo -e "\n${BLUE}13. Checking logging configuration...${NC}"

if [ -f "packages/api/src/utils/monitoring.ts" ]; then
    report_success "Monitoring and logging configured"
    
    # Check for sensitive data filtering
    if grep -q "beforeSend.*delete.*authorization\|delete.*cookie" packages/api/src/utils/monitoring.ts; then
        report_success "Sensitive data filtered from logs"
    else
        report_warning "Ensure sensitive data is filtered from logs"
    fi
else
    report_issue "Monitoring not configured"
fi

# 14. Docker Security
echo -e "\n${BLUE}14. Checking Docker security...${NC}"

if [ -f "packages/web/Dockerfile.production" ]; then
    # Check for non-root user
    if grep -q "USER.*nextjs\|USER.*node" packages/web/Dockerfile.production; then
        report_success "Docker containers run as non-root user"
    else
        report_issue "Docker containers may be running as root"
    fi
    
    # Check for latest base images
    if grep -q "node:.*alpine" packages/web/Dockerfile.production; then
        report_success "Using Alpine Linux for smaller attack surface"
    else
        report_warning "Consider using Alpine Linux for containers"
    fi
fi

# 15. Environment Variables
echo -e "\n${BLUE}15. Checking environment variables...${NC}"

if [ -f ".env.production.example" ]; then
    # Check for default values
    if grep -q "CHANGE_THIS\|YOUR_.*_HERE\|example\.com" .env.production.example; then
        report_warning "Default/example values found in .env.production.example"
        echo "    Ensure all values are changed in production!"
    else
        report_success "No obvious default values in environment config"
    fi
fi

# Summary
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}Security Audit Summary${NC}"
echo -e "${BLUE}=========================================${NC}"

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 No security issues found!${NC}"
    echo "The application appears to be ready for production deployment."
elif [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${YELLOW}Found $WARNINGS warnings that should be reviewed.${NC}"
    echo "The application can be deployed but review the warnings."
else
    echo -e "${RED}Found $ISSUES_FOUND critical issues and $WARNINGS warnings!${NC}"
    echo "Please fix all critical issues before deploying to production."
fi

echo -e "\n${BLUE}Recommendations:${NC}"
echo "1. Run 'npm audit fix' to fix npm vulnerabilities"
echo "2. Enable Web Application Firewall (WAF) in production"
echo "3. Implement security monitoring and alerting"
echo "4. Perform regular security audits"
echo "5. Consider penetration testing before launch"
echo "6. Set up dependency scanning in CI/CD"
echo "7. Enable GitHub security alerts"
echo "8. Configure SIEM for log analysis"

# Exit with error if critical issues found
if [ $ISSUES_FOUND -gt 0 ]; then
    exit 1
fi

exit 0