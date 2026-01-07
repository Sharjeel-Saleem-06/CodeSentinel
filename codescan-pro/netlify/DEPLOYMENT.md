# 🚀 Netlify Manual Deployment Guide

## Quick Deployment Steps

### Option 1: Drag & Drop (Easiest)

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

### Option 2: Netlify CLI

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

### Option 3: Git Integration

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to Netlify"
   git push origin main
   ```

2. **Connect on Netlify:**
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Select your repository
   - Configure build settings:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
     - **Base directory:** `codescan-pro` (if in subdirectory)

---

## 📁 Project Structure for Deployment

We have configured the project for automatic file handling:

```
/
├── netlify.toml         (Moved to root for Netlify Bot)
├── public/
│   ├── _redirects       (Moved here to be auto-copied to dist/)
│   └── _headers         (Moved here to be auto-copied to dist/)
└── netlify/
    └── DEPLOYMENT.md    (This guide)
```

**You do NOT need to manually copy files anymore.**
Just run `npm run build` and the `dist` folder will automatically contain `_redirects` and `_headers`.

---

## ⚙️ Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key | ✅ Yes |
| `VITE_GROQ_API_KEY` | Groq API key for AI | ✅ Yes |

### Setting Environment Variables

1. Go to your site on Netlify
2. Navigate to **Site Settings** → **Environment Variables**
3. Add each variable with its value
4. Trigger a new deploy

---

## 🔧 Build Settings

If using Git integration, configure these settings:

| Setting | Value |
|---------|-------|
| Base directory | `codescan-pro` |
| Build command | `npm run build` |
| Publish directory | `codescan-pro/dist` |
| Node version | `18` |

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
- [ ] Authentication works (Clerk)
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

