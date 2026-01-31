#!/bin/bash

# Auto-set GitHub Secrets from .env file
# Uses GitHub CLI (gh) for authentication and secret management

set -e

REPO="Sharjeel-Saleem-06/CodeSentinel"
ENV_FILE="codescan-pro/.env"

echo "🔐 GitHub Secrets Auto-Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found!"
    exit 1
fi

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not installed!"
    echo "   Install it: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔑 Authenticating with GitHub..."
    echo "   Please follow the browser prompt to authenticate"
    gh auth login --web
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Read and set secrets from .env
echo "📖 Reading $ENV_FILE..."
echo "🔑 Setting GitHub Secrets..."
echo ""

# Set VITE_* secrets
grep -E "^VITE_" "$ENV_FILE" | while IFS='=' read -r key value; do
    # Remove quotes if present
    value=$(echo "$value" | sed "s/^['\"]//;s/['\"]$//")
    
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
echo "📋 Netlify Secrets (set these manually if needed):"
echo "   NETLIFY_AUTH_TOKEN - Get from: https://app.netlify.com/user/applications"
echo "   NETLIFY_SITE_ID - Get from: Netlify Dashboard → Site settings"
echo ""
echo "   To set manually:"
echo "   gh secret set NETLIFY_AUTH_TOKEN --repo $REPO"
echo "   gh secret set NETLIFY_SITE_ID --repo $REPO"
echo ""

echo "🎉 Done! Secrets have been set."
echo "   Check them at: https://github.com/$REPO/settings/secrets/actions"
