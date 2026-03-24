#!/bin/bash
# OpenRouter Chat - Emergency Claude Alternative
# Usage: ./openrouter-chat.sh "Your message here"

API_KEY="sk-freee6849684e46a0339d226f6fe5b11fe1e41e9006891d60193"
ENDPOINT="https://play.knplabai.com/ai/v1/chat/completions"
MODEL="${MODEL:-gpt-4o-mini}"

if [ -z "$1" ]; then
    echo "Usage: $0 \"Your message\""
    echo "Example: $0 \"Hello, how are you?\""
    exit 1
fi

MESSAGE="$1"

curl -s "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"$MESSAGE\"}
    ]
  }" | jq -r '.choices[0].message.content' 2>/dev/null || echo "Error: Failed to parse response"
