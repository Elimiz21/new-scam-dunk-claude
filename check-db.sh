#!/bin/bash

# Supabase credentials
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://gcrkijxkecsfafjbojey.supabase.co}"
SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not exported. Run 'export NEXT_PUBLIC_SUPABASE_ANON_KEY=...' before using this script."
  exit 1
fi

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
