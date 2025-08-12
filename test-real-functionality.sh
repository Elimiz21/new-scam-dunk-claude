#!/bin/bash

echo "=== Testing Real End-to-End Functionality ==="
echo

# Test 1: User Registration with Database Persistence
echo "1. Testing User Registration with Database Persistence:"
USER_ID=$(curl -s -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e_test@example.com","password":"Test123","firstName":"E2E","lastName":"Test"}' \
  | grep -o '"id":[0-9]*' | cut -d: -f2)
echo "   Created user with ID: $USER_ID"

# Check if user exists in database
docker exec scamdunk-postgres psql -U scamdunk -d scamdunk -c "SELECT email FROM users WHERE email='e2e_test@example.com';" | grep e2e_test && echo "   ✅ User persisted in database" || echo "   ❌ User NOT in database"
echo

# Test 2: Login with the created user
echo "2. Testing Login:"
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e_test@example.com","password":"Test123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "   Token received: ${TOKEN:0:50}..."
echo

# Test 3: Create a scan that calls AI service
echo "3. Testing Scan Creation with AI Analysis:"
SCAN_RESPONSE=$(curl -s -X POST http://localhost:4000/scans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"text","content":"Send me $5000 urgently for amazing investment opportunity"}')
echo "   Scan response: $SCAN_RESPONSE"
echo

# Test 4: Direct AI service call
echo "4. Testing Direct AI Service Call:"
AI_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/scan/quick-scan \
  -H "Content-Type: application/json" \
  -d '{"content":"This is definitely a scam message"}')
echo "   AI Response: $AI_RESPONSE"
echo

# Test 5: Blockchain verification
echo "5. Testing Blockchain Token Verification:"
BLOCKCHAIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/v1/verify/token \
  -H "Content-Type: application/json" \
  -d '{"address":"0x1234567890123456789012345678901234567890","network":"ethereum"}')
echo "   Blockchain Response: $BLOCKCHAIN_RESPONSE"
echo

# Test 6: WebSocket connection
echo "6. Testing WebSocket Connection:"
node /tmp/test_websocket.js 2>&1 | head -3
echo

# Test 7: Frontend availability
echo "7. Testing Frontend Service:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$HTTP_STATUS" = "200" ]; then
  echo "   ✅ Frontend responding (HTTP $HTTP_STATUS)"
else
  echo "   ⚠️ Frontend error (HTTP $HTTP_STATUS)"
fi
echo

# Test 8: Inter-service communication
echo "8. Testing Inter-Service Communication (API → AI):"
docker exec scamdunk-api wget -qO- --post-data='{"content":"Test inter-service"}' \
  --header='Content-Type: application/json' \
  http://scamdunk-ai:8001/api/v1/scan/quick-scan | head -100
echo

echo "=== End-to-End Test Complete ==="