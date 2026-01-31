#!/bin/bash

# GitHub Secrets Setup Helper Script
# This script helps you copy API keys from .env to GitHub Secrets

echo "🔐 GitHub Secrets Setup Helper"
echo "================================"
echo ""
echo "This script will help you set up GitHub Secrets for automated deployment."
echo ""
echo "📋 Steps:"
echo "1. Go to: https://github.com/Sharjeel-Saleem-06/CodeSentinel/settings/secrets/actions"
echo "2. Click 'New repository secret' for each variable below"
echo "3. Copy the values from your codescan-pro/.env file"
echo ""
echo "🔑 Required Secrets:"
echo ""

# Check if .env exists
if [ -f "codescan-pro/.env" ]; then
    echo "✅ Found codescan-pro/.env file"
    echo ""
    echo "📝 Secrets to add (copy from your .env file):"
    echo ""
    
    # Extract and display keys
    grep -E "^VITE_" codescan-pro/.env | while IFS='=' read -r key value; do
        if [ ! -z "$value" ]; then
            echo "Secret Name: $key"
            echo "Secret Value: $value"
            echo "---"
        fi
    done
    
    echo ""
    echo "🌐 Netlify Secrets (get from Netlify dashboard):"
    echo "Secret Name: NETLIFY_AUTH_TOKEN"
    echo "Get from: https://app.netlify.com/user/applications"
    echo ""
    echo "Secret Name: NETLIFY_SITE_ID"
    echo "Get from: Netlify Dashboard → Site settings → General → Site details"
    echo ""
else
    echo "❌ codescan-pro/.env file not found"
    echo "Please create it first by copying codescan-pro/.env.example"
fi

echo ""
echo "💡 Tip: You can also use GitHub CLI (gh) to set secrets:"
echo "   gh secret set VITE_GROQ_API_KEY --body \"your_key_here\""
echo ""
