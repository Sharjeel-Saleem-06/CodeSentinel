#!/bin/bash

# Master script to set up GitHub Secrets
# This script will try multiple methods to set your secrets automatically

set -e

echo "🔐 GitHub Secrets Setup - Master Script"
echo "========================================"
echo ""

REPO="Sharjeel-Saleem-06/CodeSentinel"
ENV_FILE="codescan-pro/.env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found!"
    exit 1
fi

# Method 1: Try GitHub CLI (if authenticated)
if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
        echo "✅ GitHub CLI is authenticated"
        echo "🚀 Using GitHub CLI to set secrets..."
        echo ""
        
        # Set all VITE_* secrets
        grep -E "^VITE_" "$ENV_FILE" | while IFS='=' read -r key value; do
            value=$(echo "$value" | sed "s/^['\"]//;s/['\"]$//" | xargs)
            if [ ! -z "$value" ]; then
                echo -n "   Setting $key... "
                if echo -n "$value" | gh secret set "$key" --repo "$REPO" 2>/dev/null; then
                    echo "✅"
                else
                    echo "❌"
                fi
            fi
        done
        
        echo ""
        echo "🎉 Secrets set successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Set NETLIFY_AUTH_TOKEN: gh secret set NETLIFY_AUTH_TOKEN --repo $REPO"
        echo "   2. Set NETLIFY_SITE_ID: gh secret set NETLIFY_SITE_ID --repo $REPO"
        echo ""
        echo "   Or get them from:"
        echo "   - NETLIFY_AUTH_TOKEN: https://app.netlify.com/user/applications"
        echo "   - NETLIFY_SITE_ID: Netlify Dashboard → Site settings → General"
        exit 0
    else
        echo "⚠️  GitHub CLI not authenticated"
        echo ""
        echo "Would you like to authenticate now? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo ""
            echo "🔑 Opening browser for authentication..."
            gh auth login --web
            echo ""
            echo "✅ Authenticated! Re-running script..."
            exec "$0"
        fi
    fi
fi

# Method 2: Try with GITHUB_TOKEN environment variable
if [ ! -z "$GITHUB_TOKEN" ]; then
    echo "✅ Found GITHUB_TOKEN environment variable"
    echo "🚀 Using GitHub API to set secrets..."
    echo ""
    echo "⚠️  This method requires PyNaCl for encryption"
    echo "   Installing dependencies..."
    
    if ! python3 -c "import nacl" 2>/dev/null; then
        pip3 install pynacl
    fi
    
    ./.github/set-secrets-with-token.sh
    exit 0
fi

# If we get here, provide instructions
echo "❌ No authentication method found"
echo ""
echo "Please choose one of these options:"
echo ""
echo "Option 1: Authenticate GitHub CLI (Recommended)"
echo "   gh auth login"
echo "   Then run this script again"
echo ""
echo "Option 2: Use GitHub Token"
echo "   GITHUB_TOKEN=your_token ./setup-github-secrets.sh"
echo ""
echo "Option 3: Manual setup"
echo "   Go to: https://github.com/$REPO/settings/secrets/actions"
echo "   Add secrets manually from your $ENV_FILE file"
echo ""
echo "For detailed instructions, see: .github/README.md"
