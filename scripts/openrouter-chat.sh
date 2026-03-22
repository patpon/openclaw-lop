#!/bin/bash
# OpenRouter Chat - Emergency Claude Alternative
# Usage: ./openrouter-chat.sh "Your message here"

OPENROUTER_API_KEY="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"
MODEL="${ANTHROPIC_MODEL:-anthropic/claude-3-haiku}"

if [ -z "$1" ]; then
    echo "Usage: $0 \"Your message\""
    echo "Example: $0 \"Hello, how are you?\""
    exit 1
fi

MESSAGE="$1"

curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"$MESSAGE\"}
    ]
  }" | jq -r '.choices[0].message.content' 2>/dev/null || echo "Error: Failed to parse response"
