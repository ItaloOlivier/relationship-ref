# Deployment Guide - Next.js Web Viewer

## Deploy to Vercel (Recommended)

### Prerequisites
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`

### Deployment Steps

1. **Navigate to the web app directory:**
   ```bash
   cd apps/web
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

   Follow the prompts:
   - **Set up and deploy?** Y
   - **Which scope?** Select your account/team
   - **Link to existing project?** N (first time) or Y (subsequent deploys)
   - **What's your project's name?** relationship-referee-web (or your choice)
   - **In which directory is your code located?** ./ (current directory)
   - **Want to modify settings?** N (use defaults)

4. **The CLI will output a deployment URL** (e.g., `https://relationship-referee-web-abc123.vercel.app`)

### Environment Variables

Vercel automatically uses `.env.production` for production builds, which is already configured with:
```
NEXT_PUBLIC_API_URL=https://relationship-ref-production.up.railway.app
```

If you need to override this:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_API_URL` = `https://relationship-ref-production.up.railway.app`

### Production Deployment

For production (custom domain):
```bash
vercel --prod
```

### Continuous Deployment

Once linked to Vercel:
- **Push to main** → Automatically deploys to production
- **Push to other branches** → Creates preview deployments

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `share.relationshipreferee.com`)
3. Follow DNS configuration instructions

## Deploy to Railway (Alternative)

### Steps

1. Go to Railway Dashboard
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `relationship-ref-1` repository
4. **Root Directory:** `apps/web`
5. **Build Command:** `npm run build`
6. **Start Command:** `npm start`
7. **Add Environment Variable:**
   - `NEXT_PUBLIC_API_URL` = `https://relationship-ref-production.up.railway.app`
   - `PORT` = `3001`

### Generate Domain
Railway will auto-generate a domain like: `relationship-referee-web.up.railway.app`

## Testing the Deployment

After deployment, test the share links:

1. **Create a share link** (from Flutter app or via API):
   ```bash
   curl -X POST https://relationship-ref-production.up.railway.app/sessions/share \
     -H "Authorization: Bearer YOUR_JWT" \
     -H "Content-Type: application/json" \
     -d '{"sessionId": "SESSION_ID", "expiresInDays": 7}'
   ```

2. **Access the web viewer:**
   ```
   https://YOUR_VERCEL_URL/share/report/SHARE_TOKEN
   ```

## Monitoring

- **Vercel Analytics:** Automatically enabled in dashboard
- **Logs:** `vercel logs YOUR_PROJECT_NAME`
- **Build Logs:** Available in Vercel Dashboard → Deployments

## Rollback

To rollback to a previous deployment:
```bash
vercel rollback
```

Or via Vercel Dashboard → Deployments → Select deployment → Promote to Production
