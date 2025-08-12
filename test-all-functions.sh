#!/bin/bash

# Scam Dunk Comprehensive Function Testing Script
# This script tests all endpoints and logs results

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URLs
API_URL="http://localhost:4000"
WEB_URL="http://localhost:3000"
AI_URL="http://localhost:8001"
BLOCKCHAIN_URL="http://localhost:3002"

# Results file
RESULTS_FILE="functiontests.md"
LOG_FILE="test-logs.txt"

# Initialize results file
echo "# Function Test Results - $(date)" > $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "## Test Execution Summary" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "Started at: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Initialize log file
echo "Test Logs - $(date)" > $LOG_FILE
echo "========================" >> $LOG_FILE

# Counter variables
TOTAL=0
PASSED=0
FAILED=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    TOTAL=$((TOTAL + 1))
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Testing: $description" >> $LOG_FILE
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" 2>&1)
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    elif [ "$method" == "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$url" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    echo "Response Code: $http_code" >> $LOG_FILE
    echo "Response Body: $body" >> $LOG_FILE
    echo "---" >> $LOG_FILE
    
    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        echo -e "${GREEN}✓ PASSED${NC} - HTTP $http_code"
        echo "- ✅ $description - HTTP $http_code" >> $RESULTS_FILE
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} - HTTP $http_code"
        echo "- ❌ $description - HTTP $http_code" >> $RESULTS_FILE
        echo "  Error: $body" >> $RESULTS_FILE
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test Docker containers health
echo "## 1. Container Health Checks" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "\n${YELLOW}=== Testing Container Health ===${NC}\n"

containers=("scamdunk-postgres" "scamdunk-redis" "scamdunk-api" "scamdunk-web" "scamdunk-ai" "scamdunk-blockchain")

for container in "${containers[@]}"; do
    status=$(docker inspect -f '{{.State.Status}}' $container 2>/dev/null)
    if [ "$status" == "running" ]; then
        echo -e "${GREEN}✓${NC} $container is running"
        echo "- ✅ $container: Running" >> $RESULTS_FILE
    else
        echo -e "${RED}✗${NC} $container is not running (Status: $status)"
        echo "- ❌ $container: Not running (Status: $status)" >> $RESULTS_FILE
    fi
done

echo "" >> $RESULTS_FILE

# Test Basic Health Endpoints
echo "## 2. Health Check Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "\n${YELLOW}=== Testing Health Endpoints ===${NC}\n"

test_endpoint "GET" "$API_URL/health" "" "API Health Check"
test_endpoint "GET" "$WEB_URL/health" "" "Web Health Check"
test_endpoint "GET" "$AI_URL/health" "" "AI Service Health Check"
test_endpoint "GET" "$BLOCKCHAIN_URL/health" "" "Blockchain Service Health Check"

echo "" >> $RESULTS_FILE

# Test API Endpoints
echo "## 3. API Service Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "\n${YELLOW}=== Testing API Endpoints ===${NC}\n"

# Auth endpoints
echo "### Authentication Endpoints" >> $RESULTS_FILE
test_endpoint "POST" "$API_URL/auth/register" '{"email":"test@example.com","password":"Test123!","name":"Test User"}' "Auth Register"
test_endpoint "POST" "$API_URL/auth/login" '{"email":"test@example.com","password":"Test123!"}' "Auth Login"
test_endpoint "POST" "$API_URL/auth/logout" '{}' "Auth Logout"
test_endpoint "POST" "$API_URL/auth/refresh" '{"refreshToken":"dummy-token"}' "Auth Refresh Token"
test_endpoint "POST" "$API_URL/auth/forgot-password" '{"email":"test@example.com"}' "Auth Forgot Password"
test_endpoint "POST" "$API_URL/auth/reset-password" '{"token":"dummy-token","password":"NewPass123!"}' "Auth Reset Password"
test_endpoint "POST" "$API_URL/auth/verify-email" '{"token":"dummy-token"}' "Auth Verify Email"
test_endpoint "POST" "$API_URL/auth/resend-verification" '{"email":"test@example.com"}' "Auth Resend Verification"

echo "" >> $RESULTS_FILE

# User endpoints
echo "### User Management Endpoints" >> $RESULTS_FILE
test_endpoint "GET" "$API_URL/users/me" "" "Get Current User"
test_endpoint "PUT" "$API_URL/users/me" '{"name":"Updated Name"}' "Update Current User"
test_endpoint "GET" "$API_URL/users/me/stats" "" "Get User Stats"
test_endpoint "DELETE" "$API_URL/users/me" "" "Delete Current User"

echo "" >> $RESULTS_FILE

# Scan endpoints
echo "### Scan Endpoints" >> $RESULTS_FILE
test_endpoint "POST" "$API_URL/scans" '{"type":"quick","content":"Test scan content"}' "Create New Scan"
test_endpoint "GET" "$API_URL/scans" "" "Get All Scans"
test_endpoint "GET" "$API_URL/scans/test-id" "" "Get Scan by ID"

echo "" >> $RESULTS_FILE

# Chat Import endpoints
echo "### Chat Import Endpoints" >> $RESULTS_FILE
test_endpoint "POST" "$API_URL/chat-import/initialize" '{"fileName":"test.txt","fileSize":1024,"platform":"whatsapp"}' "Initialize Chat Upload"
test_endpoint "GET" "$API_URL/chat-import/supported-formats" "" "Get Supported Formats"
test_endpoint "GET" "$API_URL/chat-import/list" "" "List Chat Imports"

echo "" >> $RESULTS_FILE

# Detection endpoints
echo "### Detection Endpoints" >> $RESULTS_FILE
test_endpoint "GET" "$API_URL/detections/scan/test-scan-id" "" "Get Detections for Scan"

echo "" >> $RESULTS_FILE

# Notification endpoints
echo "### Notification Endpoints" >> $RESULTS_FILE
test_endpoint "GET" "$API_URL/notifications" "" "Get Notifications"
test_endpoint "PUT" "$API_URL/notifications/test-id/read" "" "Mark Notification as Read"

echo "" >> $RESULTS_FILE

# Test AI Service Endpoints
echo "## 4. AI Service Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "\n${YELLOW}=== Testing AI Service Endpoints ===${NC}\n"

test_endpoint "POST" "$AI_URL/api/v1/scan/quick-scan" '{"text":"This is a test message for scam detection"}' "AI Quick Scan"
test_endpoint "POST" "$AI_URL/api/v1/detection/analyze" '{"messages":["Test message 1","Test message 2"]}' "AI Analyze Messages"
test_endpoint "POST" "$AI_URL/api/v1/detection/batch" '{"items":[{"id":"1","text":"Test"}]}' "AI Batch Detection"
test_endpoint "GET" "$AI_URL/api/v1/detection/patterns" "" "AI Get Detection Patterns"
test_endpoint "GET" "$AI_URL/api/status" "" "AI Service Status"
test_endpoint "GET" "$AI_URL/api/models" "" "AI Available Models"
test_endpoint "GET" "$AI_URL/api/version" "" "AI Service Version"

echo "" >> $RESULTS_FILE

# Test Blockchain Service Endpoints
echo "## 5. Blockchain Service Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "\n${YELLOW}=== Testing Blockchain Service Endpoints ===${NC}\n"

# Verification endpoints
echo "### Verification Endpoints" >> $RESULTS_FILE
test_endpoint "POST" "$BLOCKCHAIN_URL/api/v1/verify/token" '{"address":"0x0000000000000000000000000000000000000000","network":"ethereum"}' "Verify Token"
test_endpoint "POST" "$BLOCKCHAIN_URL/api/v1/verify/wallet" '{"address":"0x0000000000000000000000000000000000000000"}' "Verify Wallet"
test_endpoint "POST" "$BLOCKCHAIN_URL/api/v1/scan/transaction" '{"txHash":"0x0000","network":"ethereum"}' "Scan Transaction"
test_endpoint "GET" "$BLOCKCHAIN_URL/api/v1/verify/status/test-request-id" "" "Get Verification Status"

echo "" >> $RESULTS_FILE

# Analysis endpoints
echo "### Analysis Endpoints" >> $RESULTS_FILE
test_endpoint "POST" "$BLOCKCHAIN_URL/api/v1/analyze/contract" '{"address":"0x0000","network":"ethereum"}' "Analyze Contract"
test_endpoint "POST" "$BLOCKCHAIN_URL/api/v1/detect/honeypot" '{"address":"0x0000","network":"ethereum"}' "Detect Honeypot"
test_endpoint "POST" "$BLOCKCHAIN_URL/api/v1/detect/rugpull" '{"address":"0x0000","network":"ethereum"}' "Detect Rugpull"
test_endpoint "GET" "$BLOCKCHAIN_URL/api/v1/analyze/supported-networks" "" "Get Supported Networks"

echo "" >> $RESULTS_FILE

# Price endpoints
echo "### Price Endpoints" >> $RESULTS_FILE
test_endpoint "GET" "$BLOCKCHAIN_URL/api/v1/price/BTC" "" "Get Token Price"
test_endpoint "GET" "$BLOCKCHAIN_URL/api/v1/price/historical/BTC" "" "Get Historical Price"
test_endpoint "GET" "$BLOCKCHAIN_URL/api/v1/price/trending" "" "Get Trending Prices"

echo "" >> $RESULTS_FILE

# Test WebSocket Connections
echo "## 6. WebSocket Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "\n${YELLOW}=== Testing WebSocket Connections ===${NC}\n"

# Test WebSocket connection (basic check)
timeout 2 curl -s -N -H "Connection: Upgrade" -H "Upgrade: websocket" "$API_URL/socket.io/" &>/dev/null
if [ $? -eq 0 ] || [ $? -eq 124 ]; then
    echo -e "${GREEN}✓${NC} WebSocket endpoint is accessible"
    echo "- ✅ WebSocket endpoint accessible" >> $RESULTS_FILE
else
    echo -e "${RED}✗${NC} WebSocket endpoint not accessible"
    echo "- ❌ WebSocket endpoint not accessible" >> $RESULTS_FILE
fi

echo "" >> $RESULTS_FILE

# Check container logs for errors
echo "## 7. Container Error Analysis" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "\n${YELLOW}=== Checking Container Logs for Errors ===${NC}\n"

for container in "${containers[@]}"; do
    error_count=$(docker logs $container 2>&1 | grep -i "error" | wc -l)
    if [ $error_count -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $container: No errors in logs"
        echo "- ✅ $container: No errors detected" >> $RESULTS_FILE
    else
        echo -e "${YELLOW}⚠${NC} $container: $error_count error(s) in logs"
        echo "- ⚠️ $container: $error_count error(s) detected" >> $RESULTS_FILE
        # Get last 3 errors for the report
        docker logs $container 2>&1 | grep -i "error" | tail -3 | while read line; do
            echo "    - $line" >> $RESULTS_FILE
        done
    fi
done

echo "" >> $RESULTS_FILE

# Generate Summary
echo "## Test Summary" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "- **Total Tests**: $TOTAL" >> $RESULTS_FILE
echo "- **Passed**: $PASSED" >> $RESULTS_FILE
echo "- **Failed**: $FAILED" >> $RESULTS_FILE
echo "- **Success Rate**: $(( PASSED * 100 / TOTAL ))%" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "Completed at: $(date)" >> $RESULTS_FILE

# Print summary to console
echo ""
echo "======================================"
echo -e "${YELLOW}Test Summary:${NC}"
echo "======================================"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "Success Rate: $(( PASSED * 100 / TOTAL ))%"
echo "======================================"
echo ""
echo "Results saved to: $RESULTS_FILE"
echo "Logs saved to: $LOG_FILE"