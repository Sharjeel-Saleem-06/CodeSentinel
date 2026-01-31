# GitHub Actions Deployment Setup

This project uses GitHub Actions to automatically build and deploy to Netlify when you push to the `main` branch.

## 🔐 Setting Up GitHub Secrets

You need to add the following secrets to your GitHub repository:

### Steps:
1. Go to your repository: `https://github.com/Sharjeel-Saleem-06/CodeSentinel`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each variable below

### Required Secrets:

#### Netlify Configuration:
- `NETLIFY_AUTH_TOKEN` - Get from: https://app.netlify.com/user/applications → Personal access tokens → New access token
- `NETLIFY_SITE_ID` - Get from: Netlify Dashboard → Site settings → General → Site details → Site ID

#### Groq API Keys (Primary):
Get your Groq API keys from: https://console.groq.com/keys
- `VITE_GROQ_API_KEY` - Your primary Groq API key
- `VITE_GROQ_API_KEY_1` through `VITE_GROQ_API_KEY_10` - Additional keys for load balancing (optional but recommended)

**Note:** Copy the actual keys from your local `.env` file or Netlify dashboard.

#### Fallback AI Providers:
- `VITE_GEMINI_API_KEY` - Get from: https://makersuite.google.com/app/apikey
- `VITE_HUGGINGFACE_API_KEY` - Get from: https://huggingface.co/settings/tokens
- `VITE_TOGETHER_API_KEY` - Get from: https://api.together.xyz/settings/api-keys (optional)

**Quick Setup:** Copy all API keys from your local `codescan-pro/.env` file to GitHub Secrets.

## 🚀 How It Works

1. **On Push to Main**: GitHub Actions automatically:
   - Checks out your code
   - Installs dependencies
   - Builds the project with environment variables from GitHub Secrets
   - Deploys to Netlify

2. **Manual Trigger**: You can also manually trigger the workflow:
   - Go to **Actions** tab → **Build and Deploy to Netlify** → **Run workflow**

## 📝 Notes

- Secrets are encrypted and never exposed in logs
- The build happens in GitHub Actions, so your local machine doesn't need Netlify CLI
- Environment variables are injected during build time
- The built files are deployed directly to Netlify

## 🔍 Troubleshooting

- **Build fails**: Check GitHub Actions logs in the **Actions** tab
- **Deployment fails**: Verify `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` are correct
- **API keys not working**: Ensure all secrets are set correctly (check for typos)
