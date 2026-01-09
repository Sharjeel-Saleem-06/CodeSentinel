# 🚀 Netlify Deployment Guide for CodeSentinel

## ⚠️ Important: Repository Structure

This project has `package.json` inside the `codescan-pro` subdirectory, NOT at the repo root.

The `netlify.toml` at the **repo root** is configured with `base = "codescan-pro"` to handle this automatically.

---

## Quick Deployment Steps

### Option 1: Git Integration (Recommended) ✅

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to Netlify"
   git push origin main
   ```

2. **Connect on Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - **Netlify will automatically detect the `netlify.toml` at repo root**
   - Just click "Deploy site"!

   The `netlify.toml` already configures:
   - ✅ Base directory: `codescan-pro`
   - ✅ Build command: `npm ci && npm run build`
   - ✅ Publish directory: `dist`
   - ✅ Node version: 18

3. **Add Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add the required variables (see below)
   - Trigger a redeploy

---

### Option 2: Drag & Drop (Manual)

1. **Build the project locally:**
   ```bash
   cd codescan-pro
   npm install
   npm run build
   ```

2. **Go to Netlify:**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Login or create an account

3. **Deploy:**
   - Drag and drop the `dist` folder to Netlify's deploy zone
   - Your site will be live in seconds!

---

### Option 3: Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Build and Deploy:**
   ```bash
   cd codescan-pro
   npm run build
   netlify deploy --prod --dir=dist
   ```

---

## 📁 Project Structure

```
AI_Code_Checker/           (Repository Root)
├── netlify.toml           ← Main config (base = "codescan-pro")
├── codescan-pro/          ← Project directory
│   ├── package.json
│   ├── netlify.toml       ← Backup config (for direct folder deploy)
│   ├── public/
│   │   ├── _redirects     (Auto-copied to dist/)
│   │   └── _headers       (Auto-copied to dist/)
│   ├── netlify/
│   │   └── DEPLOYMENT.md  (This guide)
│   └── dist/              (Build output)
└── ...
```

---

## ⚙️ Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GROQ_API_KEYS` | Groq API keys (comma-separated) | ✅ Yes |

### Setting Environment Variables

1. Go to your site on Netlify
2. Navigate to **Site Settings** → **Environment Variables**
3. Add each variable with its value
4. Trigger a new deploy (Deploys → Trigger deploy)

---

## 🔧 Build Settings (Auto-configured)

The `netlify.toml` at repo root automatically sets:

| Setting | Value |
|---------|-------|
| Base directory | `codescan-pro` |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` (relative to base) |
| Node version | `18` |

**You don't need to configure these manually!**

---

## 🌐 Custom Domain

1. Go to **Domain Settings**
2. Click **Add custom domain**
3. Enter your domain (e.g., `codesentinel.com`)
4. Configure DNS:
   - Add CNAME record pointing to your Netlify URL
   - Or use Netlify DNS

---

## 🔒 SSL/HTTPS

Netlify provides free SSL certificates automatically:

1. Go to **Domain Settings** → **HTTPS**
2. Click **Verify DNS configuration**
3. SSL certificate will be provisioned automatically

---

## 📊 Build Logs

If deployment fails, check build logs:

1. Go to **Deploys** tab
2. Click on the failed deploy
3. Review the build log for errors

### Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check Node version (should be 18+) |
| 404 on routes | Ensure `_redirects` file is in `dist` |
| Missing env vars | Add them in Netlify dashboard |
| API not working | Check CORS settings |

---

## 🎉 Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] AI features work (Groq API)
- [ ] All routes accessible
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)

---

## 📞 Support

If you encounter issues:

1. Check [Netlify Docs](https://docs.netlify.com)
2. Review build logs
3. Open an issue on GitHub

---

**Happy Deploying! 🚀**

