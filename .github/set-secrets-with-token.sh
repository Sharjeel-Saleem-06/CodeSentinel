#!/bin/bash

# Set GitHub Secrets using GitHub Personal Access Token
# Usage: GITHUB_TOKEN=your_token ./set-secrets-with-token.sh

set -e

REPO_OWNER="Sharjeel-Saleem-06"
REPO_NAME="CodeSentinel"
ENV_FILE="codescan-pro/.env"

echo "🔐 GitHub Secrets Setup (Using Token)"
echo "======================================"
echo ""

# Check for token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN environment variable not set!"
    echo ""
    echo "To get a token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token"
    echo ""
    echo "Then run:"
    echo "   GITHUB_TOKEN=your_token_here ./set-secrets-with-token.sh"
    exit 1
fi

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found!"
    exit 1
fi

# Check if jq is installed (needed for JSON parsing)
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found. Installing via brew..."
    brew install jq
fi

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ curl not found!"
    exit 1
fi

echo "✅ Token found"
echo "✅ Reading $ENV_FILE..."
echo ""

# Get repository public key
echo "🔑 Getting repository public key..."
PUBLIC_KEY_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/public-key")

PUBLIC_KEY=$(echo "$PUBLIC_KEY_RESPONSE" | jq -r '.key')
KEY_ID=$(echo "$PUBLIC_KEY_RESPONSE" | jq -r '.key_id')

if [ "$PUBLIC_KEY" == "null" ] || [ -z "$PUBLIC_KEY" ]; then
    echo "❌ Failed to get public key. Check your token permissions."
    exit 1
fi

echo "✅ Got public key"
echo ""

# Function to encrypt secret (requires Python with PyNaCl)
encrypt_secret() {
    local public_key="$1"
    local secret_value="$2"
    
    python3 -c "
from nacl import encoding, public
import base64
import sys

public_key_bytes = base64.b64decode('$public_key')
public_key_obj = public.PublicKey(public_key_bytes)
sealed_box = public.SealedBox(public_key_obj)
encrypted = sealed_box.encrypt('$secret_value'.encode('utf-8'))
print(base64.b64encode(encrypted).decode('utf-8'))
"
}

# Check if PyNaCl is available
if ! python3 -c "import nacl" 2>/dev/null; then
    echo "⚠️  PyNaCl not found. Installing..."
    pip3 install pynacl
fi

# Set secrets from .env
echo "🔐 Setting secrets..."
SUCCESS=0
FAILED=0

grep -E "^VITE_" "$ENV_FILE" | while IFS='=' read -r key value; do
    # Remove quotes and whitespace
    value=$(echo "$value" | sed "s/^['\"]//;s/['\"]$//" | xargs)
    
    if [ ! -z "$value" ]; then
        echo -n "   Setting $key... "
        
        # Encrypt the secret
        ENCRYPTED_VALUE=$(encrypt_secret "$PUBLIC_KEY" "$value")
        
        # Set the secret via API
        RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            -H "Content-Type: application/json" \
            -d "{\"encrypted_value\":\"$ENCRYPTED_VALUE\",\"key_id\":\"$KEY_ID\"}" \
            "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/$key")
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        
        if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "204" ]; then
            echo "✅"
            SUCCESS=$((SUCCESS + 1))
        else
            echo "❌ (HTTP $HTTP_CODE)"
            FAILED=$((FAILED + 1))
        fi
    fi
done

echo ""
echo "======================================"
echo "✅ Successfully set: $SUCCESS secrets"
if [ $FAILED -gt 0 ]; then
    echo "❌ Failed: $FAILED secrets"
fi
echo ""
echo "📋 Don't forget to set Netlify secrets manually:"
echo "   NETLIFY_AUTH_TOKEN"
echo "   NETLIFY_SITE_ID"
echo ""
echo "🎉 Done!"
