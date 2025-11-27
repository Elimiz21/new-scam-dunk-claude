#!/bin/bash

# Comprehensive Live Site E2E Test Suite
# Targets the production URL: https://scam-dunk-production.vercel.app

echo "🚀 Starting Full End-to-End Live Test Suite on Production..."
echo "============================================================"

BASE_URL="https://scam-dunk-production.vercel.app"

# Function to check a URL and optional content
check_url() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $name ($url)... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" == "$expected_status" ]; then
        echo "✅ OK ($status)"
        return 0
    else
        echo "❌ FAILED (Got $status, expected $expected_status)"
        return 1
    fi
}

# 1. Public Pages
echo ""
echo "--- Public Pages ---"
check_url "Homepage" "$BASE_URL/"
check_url "Login Page" "$BASE_URL/login"
check_url "Register Page" "$BASE_URL/register"
check_url "Pricing Page" "$BASE_URL/pricing"
check_url "Health Endpoint" "$BASE_URL/api/health" 200

# 2. API Route Checks (Unauthenticated)
echo ""
echo "--- API Routes (Auth Checks) ---"
# These should return 401 Unauthorized if they exist and are protected, or 404 if missing
check_url "Contact Verification (Auth Check)" "$BASE_URL/api/contact-verification" 405 # Method Not Allowed (GET on POST)
# To properly check existence, we'll send a POST without token and expect 401
echo -n "Testing Contact Verification Auth Protection... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/contact-verification")
if [ "$status" == "401" ]; then echo "✅ OK (401 Protected)"; else echo "❌ FAILED (Got $status)"; fi

echo -n "Testing Chat Analysis Auth Protection... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/chat-analysis")
if [ "$status" == "401" ]; then echo "✅ OK (401 Protected)"; else echo "❌ FAILED (Got $status)"; fi

echo -n "Testing Trading Analysis Auth Protection... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/trading-analysis")
if [ "$status" == "401" ]; then echo "✅ OK (401 Protected)"; else echo "❌ FAILED (Got $status)"; fi

echo -n "Testing Veracity Auth Protection... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/veracity-checking")
if [ "$status" == "401" ]; then echo "✅ OK (401 Protected)"; else echo "❌ FAILED (Got $status)"; fi


# 3. Interactive Browser Simulation (Simulated via CLI where possible)
# Since we can't easily run a full browser session in bash, we'll use the browser tool for the main flow
# but we can check if critical assets are loading.

echo ""
echo "--- Asset Checks ---"
# Check if a key JS file loads (from previous output)
check_url "Main JS Chunk" "$BASE_URL/_next/static/chunks/main-app-7981b39fbb7ce9d8.js" 200

echo ""
echo "============================================================"
echo "Basic Connectivity Suite Complete."
echo "Please run the Interactive Browser Test for functional verification."

