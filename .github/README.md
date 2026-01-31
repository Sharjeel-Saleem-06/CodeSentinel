# GitHub Secrets Setup

This folder contains scripts to automatically set GitHub Secrets from your `.env` file.

## 🚀 Quick Setup (Easiest Method)

### Option 1: Using GitHub CLI (Recommended)

1. **Authenticate GitHub CLI** (one-time setup):
   ```bash
   gh auth login
   ```
   Follow the browser prompt to authenticate.

2. **Run the auto-setup script**:
   ```bash
   cd /Users/muhammadsharjeel/Documents/AI_Code_Checker
   ./.github/auto-set-secrets.sh
   ```

That's it! All secrets from your `codescan-pro/.env` file will be set automatically.

### Option 2: Using GitHub Personal Access Token

1. **Get a token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select `repo` scope
   - Copy the token

2. **Run the script**:
   ```bash
   cd /Users/muhammadsharjeel/Documents/AI_Code_Checker
   GITHUB_TOKEN=your_token_here ./.github/set-secrets-with-token.sh
   ```

### Option 3: Manual Setup via GitHub Website

1. Go to: https://github.com/Sharjeel-Saleem-06/CodeSentinel/settings/secrets/actions
2. Click "New repository secret" for each variable
3. Copy values from your `codescan-pro/.env` file

## 📋 Required Secrets

### API Keys (from `.env`):
- `VITE_GROQ_API_KEY` through `VITE_GROQ_API_KEY_10`
- `VITE_GEMINI_API_KEY`
- `VITE_HUGGINGFACE_API_KEY`
- `VITE_TOGETHER_API_KEY` (optional)

### Netlify Configuration:
- `NETLIFY_AUTH_TOKEN` - Get from: https://app.netlify.com/user/applications
- `NETLIFY_SITE_ID` - Get from: Netlify Dashboard → Site settings → General → Site details

## 🔍 Verify Secrets

After setting secrets, verify them at:
https://github.com/Sharjeel-Saleem-06/CodeSentinel/settings/secrets/actions

## 🎯 What Happens Next?

Once secrets are set:
1. Push any code change to `main` branch
2. GitHub Actions will automatically:
   - Build your project with the secrets
   - Deploy to Netlify
3. Your site will be live at: https://codesentinelai.netlify.app

## 📝 Scripts Available

- `auto-set-secrets.sh` - Uses GitHub CLI (easiest)
- `set-secrets-with-token.sh` - Uses GitHub API with token
- `set-secrets.py` - Python script with encryption
- `set-secrets.js` - Node.js script
- `setup-secrets.sh` - Helper to show what needs to be set
