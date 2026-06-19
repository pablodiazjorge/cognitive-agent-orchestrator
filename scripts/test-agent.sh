#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

echo "=== Cognitive Agent Orchestrator — quick curl tests ==="
echo "Backend URL: $BASE_URL"
echo ""

HEALTH=$(curl -s "$BASE_URL/api/health" || echo '{"status":"DOWN"}')
echo "Health check: $HEALTH"
PROVIDER=$(echo "$HEALTH" | grep -o '"provider":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
echo "Active provider: $PROVIDER"
echo ""

function run_test() {
  local prompt="$1"
  echo "--------------------------------------------------"
  echo "Prompt: $prompt"

  local session_response
  session_response=$(curl -s -X POST "$BASE_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"$prompt\"}")

  local session_id
  session_id=$(echo "$session_response" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

  if [ -z "$session_id" ]; then
    echo "Failed to create session. Response: $session_response"
    return
  fi

  echo "Session ID: $session_id"
  echo "SSE stream:"
  curl -N -H "Accept: text/event-stream" "$BASE_URL/api/chat/$session_id/stream"
  echo ""
}

run_test "Calculate 15 * 7 + 3"
run_test "What's the weather in Tokyo?"
run_test "Search for information about transformers in NLP"

echo ""
echo "=== Tests complete ==="
