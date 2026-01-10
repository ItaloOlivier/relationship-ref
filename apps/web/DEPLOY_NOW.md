# 🚀 Deploy Web Viewer to Vercel NOW

## Quick Deploy (5 minutes)

### Step 1: Login to Vercel
```bash
cd /Users/user/relationship-ref-1/apps/web
npx vercel login
```

This will:
1. Open your browser
2. Ask you to verify your email
3. Save authentication token

### Step 2: Deploy to Production
```bash
npx vercel --prod
```

Follow the interactive prompts:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select your account (usually your email/username)
- **Link to existing project?** → `N` (first time)
- **What's your project's name?** → `relationship-referee-web` (or press Enter for default)
- **In which directory is your code located?** → `./` (press Enter)
- **Want to override settings?** → `N` (press Enter)

### Step 3: Get Your URL

Vercel will output something like:
```
✅  Production: https://relationship-referee-web.vercel.app [1m 23s]
```

### Step 4: Test It

Create a test share link from your Flutter app or backend, then access:
```
https://relationship-referee-web.vercel.app/share/report/YOUR_TOKEN
```

---

## Alternative: Deploy via Vercel Dashboard (No CLI needed)

1. **Go to:** https://vercel.com/new
2. **Import Git Repository:**
   - Connect your GitHub account
   - Select `ItaloOlivier/relationship-ref-1`
3. **Configure Project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
4. **Environment Variables:**
   - Click "Add Environment Variable"
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://relationship-ref-production.up.railway.app`
5. **Deploy!**

---

## Current Status

- ✅ Next.js app built successfully (no errors)
- ✅ React 19 compatibility fixed
- ✅ Environment variables configured
- ✅ Vercel config file created
- ⏳ **READY TO DEPLOY** (just need authentication)

---

## What Happens After Deploy?

1. **Automatic deployments:** Every push to `main` branch will auto-deploy
2. **Preview deployments:** PRs get preview URLs
3. **Domain:** Vercel provides free `.vercel.app` domain
4. **SSL:** Automatic HTTPS certificate
5. **CDN:** Global edge network for fast loads

---

## Troubleshooting

### "Token is not valid"
Run: `npx vercel login` first

### "Build failed"
We already tested the build - it works! But if needed:
```bash
npm run build  # Should show no errors
```

### "API URL not working"
Check that Railway backend is deployed at:
https://relationship-ref-production.up.railway.app

---

## Next Steps After Deployment

1. **Update CLAUDE.md** with the Vercel URL
2. **Test share links** end-to-end
3. **Optional:** Add custom domain in Vercel dashboard
4. **Optional:** Enable Vercel Analytics

---

## Need Help?

Vercel Docs: https://vercel.com/docs
Vercel Support: https://vercel.com/support
