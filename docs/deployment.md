# Railway Deployment Guide

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- Railway CLI installed: `brew install railway`
- GitHub repository with the code

## Initial Setup

### 1. Create Railway Project

```bash
# Login to Railway
railway login

# Create new project
railway init
```

### 2. Add Services

In the Railway dashboard, add the following services:

1. **PostgreSQL** - Database
2. **Redis** - Queue and caching
3. **API** - NestJS backend (from GitHub)

### 3. Configure PostgreSQL

Railway will automatically provision PostgreSQL and provide `DATABASE_URL`.

### 4. Configure Redis

Railway will automatically provision Redis and provide `REDIS_URL`.

### 5. Configure API Service

Link to your GitHub repository and set the following:

**Root Directory**: `apps/api`

**Build Command**:
```bash
npm ci && npx prisma generate && npm run build
```

**Start Command**:
```bash
npx prisma migrate deploy && npm run start:prod
```

### 6. Environment Variables

Set these in Railway dashboard for the API service:

```env
# Database (auto-set by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-set by Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT
JWT_SECRET=<generate-a-strong-secret-key>
JWT_EXPIRATION=7d

# Magic Link
MAGIC_LINK_SECRET=<generate-another-secret-key>

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
SMTP_FROM=noreply@yourapp.com

# OpenAI
OPENAI_API_KEY=sk-<your-openai-key>

# App
APP_URL=https://your-api.railway.app
MOBILE_DEEP_LINK=relationshipreferee://
NODE_ENV=production
PORT=3000

# Sentry (optional)
SENTRY_DSN=<your-sentry-dsn>

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### 7. Deploy

Railway will automatically deploy when you push to the main branch.

Manual deploy:
```bash
cd apps/api
railway up
```

## Database Migrations

Migrations run automatically on deploy via the start command. To run manually:

```bash
railway run npx prisma migrate deploy
```

To create a new migration:
```bash
# Local development
cd apps/api
npx prisma migrate dev --name <migration_name>
```

## Seed Data

To seed the database:
```bash
railway run npm run db:seed
```

## Monitoring

### Logs
```bash
railway logs
```

### Database Access
```bash
railway connect postgres
```

### Redis Access
```bash
railway connect redis
```

## Custom Domain

1. Go to Settings > Networking in Railway
2. Add your custom domain
3. Configure DNS records as instructed

## Scaling

Railway auto-scales based on traffic. To configure:

1. Go to Settings > Deploy
2. Set instance count and memory limits

## Costs

Railway pricing is usage-based:
- PostgreSQL: ~$5-20/month
- Redis: ~$5-10/month
- API: ~$5-20/month
- Total MVP: ~$15-50/month

## Troubleshooting

### Build Failures

Check that:
- `apps/api/package.json` has all dependencies
- Prisma schema is valid
- TypeScript compiles without errors

### Runtime Errors

```bash
railway logs --tail 100
```

### Database Connection Issues

Verify `DATABASE_URL` is correctly set and PostgreSQL service is running.

### Redis Connection Issues

Verify `REDIS_URL` is correctly set and Redis service is running.

## CI/CD Integration

Railway integrates with GitHub Actions. Deployments trigger on push to `main`.

For manual control, use GitHub Actions workflow in `.github/workflows/ci.yml`.

## Rollback

To rollback to a previous deployment:

1. Go to Deployments in Railway dashboard
2. Find the deployment to restore
3. Click "Redeploy"

## Environment Promotion

For staging/production environments:

1. Create separate Railway projects
2. Use environment variables for configuration
3. Deploy from different branches (e.g., `develop` → staging, `main` → production)
