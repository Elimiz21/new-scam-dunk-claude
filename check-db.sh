#!/bin/bash

# Supabase credentials
SUPABASE_URL="https://gcrkijxkecsfafjbojey.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpanhrZWNzZmFmamJvamV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNzcxMzYsImV4cCI6MjA1MjY1MzEzNn0.l7E7uAv1lguno9vDMjNGJ0GVkonCSpyi1dM-hc5SH5s"

echo "🔍 Checking Supabase database for API keys..."
echo ""

# Query the api_keys table
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/api_keys?select=*" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo "✅ Query complete"