# Deployment Guide

This guide covers deploying the Crowd-Powered Smart Complaint Management System to Railway.

## Architecture

### Local Development
- **Frontend** (localhost:5173) → **Backend** (Docker @ localhost:7000) → **Railway PostgreSQL + Redis**

### Production
- **Frontend** (Railway) → **Backend** (Railway) → **Railway PostgreSQL + Redis** (internal networking)

---

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI** (optional): `npm install -g @railway/cli`
3. **Git Repository**: Your code should be in a Git repository

---

## Part 1: Database & Redis Setup (Already Done)

✅ You already have PostgreSQL and Redis running on Railway.

**Current Configuration:**
- **PostgreSQL**: `nozomi.proxy.rlwy.net:29169`
- **Redis**: `yamanote.proxy.rlwy.net:55455`

---

## Part 2: Deploy Backend to Railway

### Step 1: Create Backend Service

1. Go to Railway dashboard
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will detect Django automatically

### Step 2: Configure Backend Environment Variables

In Railway, go to your backend service → **Variables** tab and add:

```env
# Django Configuration
SECRET_KEY=your-production-secret-key-here
DEBUG=False
RAILWAY_ENVIRONMENT=production

# Database (use Railway's DATABASE_URL variable reference)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (use Railway's variable reference)
REDIS_URL=${{Redis.REDIS_URL}}

# Frontend URL (add after deploying frontend)
FRONTEND_URL=https://your-frontend-domain.railway.app

# Backend URL (will be auto-generated, but set it for CSRF)
BACKEND_URL=https://your-backend-domain.railway.app

# Cloudinary (use your existing values)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (use your existing values)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# JWT (use your existing values)
JWT_SECRET_KEY=your-jwt-secret
```

### Step 3: Configure Backend Build

Create `railway.json` in your **Backend/** directory:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn CPCMS.wsgi:application --bind 0.0.0.0:$PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 4: Update Backend for Production

The settings are already configured to detect Railway environment. Ensure `requirements.txt` includes:

```txt
gunicorn==21.2.0
whitenoise==6.5.0
```

Add to `CPCMS/settings.py` (if not already present):

```python
# Static files configuration for production
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# Whitenoise for serving static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### Step 5: Deploy Backend

1. Push your code to GitHub
2. Railway will automatically detect changes and deploy
3. Wait for build to complete
4. Note your backend URL: `https://your-backend-domain.railway.app`

---

## Part 3: Deploy Frontend to Railway

### Step 1: Create Frontend Service

1. In the same Railway project, click **"New"** → **"GitHub Repo"**
2. Select your repository again
3. Railway will detect Vite/React

### Step 2: Configure Frontend Environment Variables

In Railway, go to your frontend service → **Variables** tab:

```env
# Backend API URL (use your actual backend Railway URL)
VITE_API_URL=https://your-backend-domain.railway.app
```

### Step 3: Configure Frontend Build

Create `railway.json` in your **Frontend/** directory:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run preview -- --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

Or use a static file server. Update `Frontend/package.json`:

```json
{
  "scripts": {
    "preview": "vite preview",
    "serve": "vite preview --host 0.0.0.0 --port ${PORT:-3000}"
  },
  "dependencies": {
    "serve": "^14.2.0"
  }
}
```

### Step 4: Update Backend with Frontend URL

1. Go back to backend service in Railway
2. Update `FRONTEND_URL` environment variable with your frontend URL: `https://your-frontend-domain.railway.app`
3. Railway will redeploy automatically

### Step 5: Deploy Frontend

1. Push your code to GitHub
2. Railway will automatically build and deploy
3. Your frontend will be live at: `https://your-frontend-domain.railway.app`

---

## Part 4: Update Production Environment Files

### Backend `.env.production` (for reference)

```env
SECRET_KEY=your-production-secret-key
DEBUG=False
RAILWAY_ENVIRONMENT=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
FRONTEND_URL=https://your-frontend-domain.railway.app
BACKEND_URL=https://your-backend-domain.railway.app
```

### Frontend `.env.production`

Update this file with your actual backend URL:

```env
VITE_API_URL=https://your-backend-domain.railway.app
```

---

## Part 5: Verify Deployment

### Test Backend

1. Visit `https://your-backend-domain.railway.app/admin/`
2. Login with admin credentials
3. Check complaints and departments

### Test Frontend

1. Visit `https://your-frontend-domain.railway.app`
2. Login as user/government official
3. Create a complaint
4. Verify it appears in backend admin

### Check Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View backend logs
railway logs --service backend

# View frontend logs
railway logs --service frontend
```

---

## Important Notes

### Database Optimization

The backend is configured to automatically use Railway's internal database hostname (`postgres.railway.internal`) when deployed on Railway. This provides:
- ✅ Faster database connections
- ✅ Lower latency
- ✅ No external bandwidth usage

### CORS & CSRF Configuration

The settings automatically handle:
- ✅ Local development (localhost:5173)
- ✅ Production (Railway domains)
- ✅ HTTP/HTTPS variants

### Static Files

Static files are served using WhiteNoise in production, which is:
- ✅ Fast and efficient
- ✅ CDN-friendly
- ✅ No additional infrastructure needed

---

## Troubleshooting

### Issue: CORS errors in production

**Solution**: Verify `FRONTEND_URL` is set correctly in backend environment variables.

```bash
railway variables --service backend
```

### Issue: Database connection errors

**Solution**: Ensure `DATABASE_URL` is properly linked:

```bash
railway variables --service backend | grep DATABASE_URL
```

### Issue: Static files not loading

**Solution**: Run collectstatic manually:

```bash
railway run python manage.py collectstatic --noinput
```

### Issue: 502 Bad Gateway

**Solution**: Check logs for startup errors:

```bash
railway logs --service backend
```

---

## Environment Variables Summary

### Backend (Railway)
| Variable | Value | Notes |
|----------|-------|-------|
| `SECRET_KEY` | Random string | Generate new for production |
| `DEBUG` | `False` | Never `True` in production |
| `RAILWAY_ENVIRONMENT` | `production` | Auto-detects Railway |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway reference |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Railway reference |
| `FRONTEND_URL` | Frontend Railway URL | For CORS |
| `BACKEND_URL` | Backend Railway URL | For CSRF |

### Frontend (Railway)
| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | Backend Railway URL | For API calls |

---

## Local Development with Railway Database

Your current setup already works:

```env
# Backend/.env (current configuration)
DATABASE_URL=postgresql://postgres:password@nozomi.proxy.rlwy.net:29169/railway
REDIS_URL=redis://default:password@yamanote.proxy.rlwy.net:55455
```

```env
# Frontend/.env.local
VITE_API_URL=http://localhost:7000
```

To run locally:

```bash
# Backend
cd Backend
docker-compose up -d --build

# Frontend
cd Frontend
npm install
npm run dev
```

---

## Next Steps

1. ✅ **Generate Production SECRET_KEY**:
   ```python
   from django.core.management.utils import get_random_secret_key
   print(get_random_secret_key())
   ```

2. ✅ **Deploy Backend to Railway** (follow Part 2)

3. ✅ **Deploy Frontend to Railway** (follow Part 3)

4. ✅ **Update Environment Variables** with actual URLs

5. ✅ **Test Production Deployment**

6. ✅ **Set up Custom Domain** (optional)

---

## Custom Domain (Optional)

### Backend Domain

1. Go to backend service in Railway
2. Click **Settings** → **Domains**
3. Add custom domain: `api.yourdomain.com`
4. Update DNS with provided CNAME
5. Update `BACKEND_URL` in environment variables

### Frontend Domain

1. Go to frontend service in Railway
2. Click **Settings** → **Domains**
3. Add custom domain: `yourdomain.com`
4. Update DNS with provided CNAME
5. Update `FRONTEND_URL` in backend environment variables

---

## Monitoring

### Railway Dashboard

- View service health
- Check resource usage
- Monitor deployments
- View logs in real-time

### Django Admin

- Monitor complaints
- Check user activity
- View ML predictions
- Manage departments

---

## Cost Optimization

Railway offers:
- **$5/month** for Hobby plan (sufficient for most projects)
- **Free tier** with $5 credit per month
- Pay-as-you-go for Pro plan

Tips:
- Use internal networking (already configured)
- Enable HTTP/2 (automatic on Railway)
- Use WhiteNoise for static files (already configured)
- Monitor resource usage in Railway dashboard

---

## Security Checklist

- ✅ Set `DEBUG=False` in production
- ✅ Use strong `SECRET_KEY`
- ✅ Configure `ALLOWED_HOSTS` properly (already done)
- ✅ Use HTTPS (Railway provides free SSL)
- ✅ Set secure cookie flags (already configured)
- ✅ Enable CSRF protection (already configured)
- ✅ Configure CORS properly (already configured)
- ✅ Use environment variables for secrets
- ✅ Keep dependencies updated

---

**Need Help?** Check Railway documentation or project README.
