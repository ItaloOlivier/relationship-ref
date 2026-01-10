# Deployment Status

## ✅ Production Services

### Backend API (Railway)
- **URL**: https://relationship-ref-production.up.railway.app
- **Status**: ✅ Active and Healthy
- **API Documentation**: https://relationship-ref-production.up.railway.app/api/docs
- **Health Check**: https://relationship-ref-production.up.railway.app/health

**Test Commands:**
```bash
# Health check
curl https://relationship-ref-production.up.railway.app/health

# API info
curl https://relationship-ref-production.up.railway.app

# View Swagger docs
open https://relationship-ref-production.up.railway.app/api/docs
```

### Web Viewer (Vercel)
- **Primary URL**: https://relationship-ref-vercel.app
- **Status**: ✅ Deployed Successfully
- **Framework**: Next.js 15.5.9
- **Build**: Successful (4s)

**Domains:**
- Production: `https://relationship-ref-vercel.app`
- Git Branch: `https://relationship-ref-git-main-italo-oliviers-projects.vercel.app`
- Deployment: `https://relationship-kp8ly46gw-italo-oliviers-projects.vercel.app`

---

## 🔧 Configuration Required

### Vercel Environment Variable

The web viewer needs to know the backend API URL. Configure it in Vercel:

1. Go to: https://vercel.com/italo-oliviers-projects/relationship-ref/settings/environment-variables
2. Click **"Add New"**
3. Enter:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://relationship-ref-production.up.railway.app`
   - **Environments**: ✅ Production ✅ Preview ✅ Development
4. Click **"Save"**
5. **Redeploy**: Go to Deployments → Click latest → "Redeploy"

**Why this is needed:**
The environment variable tells the Next.js app where to fetch shared reports from. Without it, API calls will fail.

---

## 📝 Testing the Full Flow

### 1. Create a Test Share Link (via API)

```bash
# First, register a user
curl -X POST https://relationship-ref-production.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User"
  }'

# Login to get JWT token
TOKEN=$(curl -X POST https://relationship-ref-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }' | jq -r '.access_token')

# Create a test session (you'll need to import WhatsApp chat or record audio)
# For testing, you can use the API docs at /api/docs to create a session

# Generate share link
curl -X POST https://relationship-ref-production.up.railway.app/sessions/{SESSION_ID}/share \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expiresInDays": 7,
    "anonymizeNames": false
  }'
```

### 2. Access Shared Report

Once you have a share token, access it at:
```
https://relationship-ref-vercel.app/share/report/{TOKEN}
```

---

## 🚀 Deployment Pipeline

### Backend (Railway)
- **Trigger**: Automatic on push to `main` branch
- **Build**: `npm install && npm run build`
  - Prisma generate
  - TypeScript compilation (tsc)
  - Path alias transformation (tsc-alias)
- **Deploy**: `npm run start:prod`
  - Database migrations
  - Start NestJS server

**Key Files:**
- `apps/api/nixpacks.toml` - Build configuration
- `apps/api/tsconfig.build.json` - TypeScript config
- `apps/api/railway.json` - Deployment settings

### Frontend (Vercel)
- **Trigger**: Automatic on push to `main` branch
- **Build**: Next.js production build
- **Deploy**: Serverless functions + static assets

**Key Files:**
- `apps/web/vercel.json` - Deployment configuration
- `apps/web/.env.production` - Production env vars (gitignored)

---

## 📊 Monitoring

### Railway
- View logs: https://railway.app/project/{project-id}/service/{service-id}
- Metrics: CPU, Memory, Network usage
- Restart policy: ON_FAILURE (max 10 retries)

### Vercel
- Analytics: https://vercel.com/italo-oliviers-projects/relationship-ref/analytics
- Speed Insights: Performance metrics
- Build logs: Available for each deployment

---

## 🔒 Security Checklist

- [x] Environment variables secured (not in git)
- [x] Database migrations run automatically
- [x] HTTPS enabled on all endpoints
- [x] JWT authentication required for protected routes
- [x] Share tokens have expiration dates
- [x] CORS configured properly
- [ ] Rate limiting enabled (TODO: verify in production)
- [ ] Security headers configured (TODO: add helmet.js)

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: "Cannot find module" errors
- **Fix**: Check `tsc-alias` ran successfully in build logs
- **Verify**: `ls -la dist/` should show compiled JS files

**Problem**: Database connection errors
- **Fix**: Check `DATABASE_URL` in Railway environment variables
- **Verify**: Migrations ran successfully in deploy logs

**Problem**: bcrypt errors
- **Fix**: Ensure `npm ci` (not `npm ci --ignore-scripts`) in nixpacks.toml
- **Verify**: Native bindings compiled for x86_64-linux

### Frontend Issues

**Problem**: API calls return CORS errors
- **Fix**: Add frontend domain to backend CORS whitelist
- **Check**: `apps/api/src/bootstrap.ts` CORS configuration

**Problem**: "Failed to fetch" on share pages
- **Fix**: Ensure `NEXT_PUBLIC_API_URL` environment variable is set
- **Verify**: Redeploy after adding env var

**Problem**: 404 on share links
- **Fix**: Check share token is valid and not expired
- **Verify**: Call `GET /sessions/share/report/{token}` directly

---

## 📈 Next Steps

1. **Configure Environment Variable** (critical)
   - Add `NEXT_PUBLIC_API_URL` in Vercel
   - Redeploy web viewer

2. **Test End-to-End Flow**
   - Create session via mobile app
   - Generate share link
   - Open in web viewer
   - Verify report displays correctly

3. **Optional Enhancements**
   - Add custom domain (e.g., `share.relationshipreferee.app`)
   - Enable Vercel Analytics
   - Set up error monitoring (Sentry)
   - Configure CDN caching

4. **Mobile App Configuration**
   - Update API base URL in Flutter app to production
   - Test share functionality from mobile app
   - Submit app to TestFlight/Play Store

---

## 📞 Support

**Railway Support**: https://railway.app/help  
**Vercel Support**: https://vercel.com/support  
**API Documentation**: https://relationship-ref-production.up.railway.app/api/docs

