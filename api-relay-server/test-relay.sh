#!/bin/bash

echo "=========================================="
echo "     API Relay Server Test Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_KEY="lc_dev_team1_cursor_x8k9j2h4"
BASE_URL="http://localhost:4000"

echo "1. Testing Health Endpoint..."
echo "------------------------------"
curl -s $BASE_URL/health | jq '.'
echo ""

echo "2. Testing Models Endpoint..."
echo "------------------------------"
curl -s $BASE_URL/v1/models \
  -H "Authorization: Bearer $API_KEY" | jq '.data[0:2]'
echo ""

echo "3. Testing Chat Completion (Non-streaming)..."
echo "----------------------------------------------"
curl -s $BASE_URL/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello in 5 words or less"}
    ],
    "temperature": 0.7,
    "stream": false
  }' | jq '.'
echo ""

echo "4. Testing Chat Completion (Streaming)..."
echo "------------------------------------------"
echo "Sending streaming request..."
curl -N $BASE_URL/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Count from 1 to 5 slowly"}
    ],
    "temperature": 0.7,
    "stream": true
  }' 2>/dev/null | head -20
echo ""
echo "... (stream truncated for display)"
echo ""

echo "5. Testing Invalid API Key..."
echo "------------------------------"
curl -s $BASE_URL/v1/models \
  -H "Authorization: Bearer invalid_key_12345" | jq '.'
echo ""

echo "6. Testing Usage Endpoint..."
echo "-----------------------------"
curl -s $BASE_URL/v1/usage \
  -H "Authorization: Bearer $API_KEY" | jq '.'
echo ""

echo "=========================================="
echo "           Test Complete!"
echo "=========================================="
echo ""
echo "Next Steps for Cursor Integration:"
echo "1. Start the relay server: npm run dev"
echo "2. Open Cursor IDE"
echo "3. Go to Settings (Cmd+,)"
echo "4. Search for 'OpenAI'"
echo "5. Set Base URL to: $BASE_URL/v1"
echo "6. Set API Key to: $API_KEY"
echo "7. Test with Cursor's chat or autocomplete"
echo ""