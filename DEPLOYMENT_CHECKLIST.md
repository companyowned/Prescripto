# Deployment Checklist

## Pre-Deployment Setup

### Prerequisites
- [ ] Vercel account created (vercel.com)
- [ ] Expo account created (expo.dev)
- [ ] PostgreSQL database ready (Neon, AWS RDS, or similar)
- [ ] CLI tools installed:
  - [ ] Vercel CLI: `npm install -g vercel`
  - [ ] EAS CLI: `npm install -g eas-cli`

### API Keys & Credentials Gathered
- [ ] Database URL (PostgreSQL connection string with SSL)
- [ ] JWT Secret Key (generate random: `openssl rand -hex 32`)
- [ ] Azure Vision API credentials (endpoint & key)
- [ ] OpenAI API key (if using AI features)
- [ ] n8n webhook URL & auth key (if using workflows)
- [ ] AWS S3 credentials (if using S3 for uploads)

---

## Backend Deployment (Vercel)

### Step 1: Prepare Backend
- [ ] Review [backend/vercel.json](../../backend/vercel.json)
- [ ] Review [backend/.env.example](../../backend/.env.example)
- [ ] Ensure `requirements.txt` is up to date
- [ ] Test locally: `uvicorn app.main:app --reload`

### Step 2: Configure Vercel
- [ ] Login to Vercel: `vercel login`
- [ ] Navigate to backend: `cd backend`
- [ ] Initialize Vercel project: `vercel`

### Step 3: Set Environment Variables
In Vercel dashboard, set:
- [ ] `DATABASE_URL` = Your PostgreSQL connection string
- [ ] `JWT_SECRET_KEY` = Secure random key
- [ ] `JWT_ALGORITHM` = "HS256"
- [ ] `AZURE_VISION_ENDPOINT` = Your endpoint
- [ ] `AZURE_VISION_KEY` = Your key
- [ ] `OPENAI_API_KEY` = Your key (if needed)
- [ ] `N8N_WEBHOOK_URL` = Your webhook (if needed)
- [ ] `CELERY_BROKER_URL` = Redis URL (if needed)
- [ ] `DEBUG` = "false"

### Step 4: Deploy
- [ ] Run: `vercel --prod`
- [ ] Wait for deployment to complete
- [ ] Get Vercel URL (e.g., `https://prescripto-api.vercel.app`)

### Step 5: Test Backend
- [ ] Access `/docs`: `https://your-project.vercel.app/docs`
- [ ] Check health endpoint: `https://your-project.vercel.app/health`
- [ ] Test API endpoints in Swagger UI

### Step 6: Update CORS
- [ ] Copy your Vercel URL
- [ ] Edit `backend/app/core/config.py`
- [ ] Add Vercel URL to `allow_origins`
- [ ] Redeploy: `vercel --prod`

---

## Mobile App Deployment (Android APK)

### Step 1: Prepare Mobile App
- [ ] Update `mobile/.env.production`:
  ```
  EXPO_PUBLIC_API_URL=https://your-vercel-project.vercel.app/api/v1
  ```
- [ ] Review [mobile/eas.json](../../mobile/eas.json)
- [ ] Verify [mobile/app.json](../../mobile/app.json) config
- [ ] Test on local device: `npm start`

### Step 2: Configure Expo
- [ ] Login to Expo: `eas login`
- [ ] Verify Expo account credentials
- [ ] Accept any terms if prompted

### Step 3: Build APK (Choose One)

#### Option A: Cloud Build (Recommended)
- [ ] Run: `cd mobile && eas build --platform android --type apk`
- [ ] Monitor at: https://expo.dev/builds
- [ ] Download APK when complete

#### Option B: Local Build
- [ ] Set `ANDROID_HOME`: `export ANDROID_HOME=$HOME/Library/Android/Sdk`
- [ ] Install dependencies: `npm install`
- [ ] Run: `eas build --platform android --local`
- [ ] Find APK: `android/app/build/outputs/apk/`

### Step 4: Install on Device
- [ ] Download APK file
- [ ] Transfer to Android device (USB or email)
- [ ] Tap APK to install
- [ ] Grant permissions when prompted

---

## Post-Deployment Testing

### Backend API Testing
```bash
# Health check
curl https://your-project.vercel.app/health

# Check API documentation
open https://your-project.vercel.app/docs

# Test auth endpoint (example)
curl -X POST https://your-project.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Mobile App Testing
- [ ] Launch app on Android device
- [ ] Verify app starts without errors
- [ ] Check Settings/Debug to verify API URL
- [ ] Test login with credentials
- [ ] Test document upload
- [ ] Test prescription scanning
- [ ] Monitor logs: `adb logcat | grep Prescripto`

### Integration Testing
- [ ] Login from mobile app
- [ ] Upload prescription document
- [ ] Verify backend receives file
- [ ] Verify OCR processing starts
- [ ] Check prescription analysis results
- [ ] Verify results sync to mobile app

---

## Performance Monitoring

### Vercel Dashboard
- [ ] Monitor deployment logs
- [ ] Check function execution times
- [ ] Review error logs
- [ ] Monitor database connections

### Expo Dashboard
- [ ] Check build logs
- [ ] Review app crashes/errors
- [ ] Monitor app analytics

### Database
- [ ] Check connection pool status
- [ ] Monitor query performance
- [ ] Review slow queries

---

## Security Checklist

- [ ] JWT_SECRET_KEY is strong (32+ characters)
- [ ] Database URL uses SSL connection
- [ ] CORS origins restricted to your domains
- [ ] No secrets committed to version control
- [ ] Environment variables in Vercel, not in code
- [ ] HTTPS enforced for all API calls
- [ ] API authentication required for all endpoints
- [ ] File uploads validated (type, size)
- [ ] Database credentials not exposed
- [ ] Third-party API keys rotated regularly

---

## Troubleshooting

### Backend Issues

**502 Bad Gateway**
- [ ] Check database connection
- [ ] Verify DATABASE_URL is correct
- [ ] Check Vercel function logs
- [ ] Ensure database is accessible

**CORS Error**
- [ ] Add mobile domain to allow_origins
- [ ] Redeploy backend
- [ ] Clear mobile app cache

**Slow Startup (Cold Start)**
- [ ] Optimize imports (move heavy imports to functions)
- [ ] Consider keeping warm with periodic requests
- [ ] Use connection pooling for database

### Mobile App Issues

**API Connection Failed**
- [ ] Verify EXPO_PUBLIC_API_URL in .env.production
- [ ] Check backend is running
- [ ] Test connectivity: `adb shell curl https://your-project.vercel.app/health`

**Build Failed**
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Delete node_modules: `rm -rf node_modules`
- [ ] Reinstall: `npm install`
- [ ] Check Node.js version (18+)

**APK Installation Failed**
- [ ] Check Android version (API 24+)
- [ ] Ensure package signature matches
- [ ] Try: `adb uninstall com.prescripto.app` then reinstall

---

## Rollback Plan

### If Backend Deployment Fails
1. [ ] Check error logs in Vercel dashboard
2. [ ] Rollback to previous version in Vercel
3. [ ] Fix issue locally
4. [ ] Redeploy: `vercel --prod`

### If Mobile App Crashes
1. [ ] Check logs: `adb logcat`
2. [ ] Verify API is responding
3. [ ] Clear app data: `adb shell pm clear com.prescripto.app`
4. [ ] Reinstall APK
5. [ ] Build new APK if needed: `eas build --platform android --type apk`

---

## Post-Deployment Tasks

### Week 1
- [ ] Monitor error logs daily
- [ ] Gather user feedback
- [ ] Check API performance metrics
- [ ] Optimize slow endpoints if needed

### Month 1
- [ ] Review security logs
- [ ] Update API keys/credentials
- [ ] Plan feature improvements
- [ ] Collect performance data

### Ongoing
- [ ] Keep dependencies updated
- [ ] Monitor database performance
- [ ] Rotate API keys quarterly
- [ ] Review and update CORS origins
- [ ] Monitor cloud costs (Vercel, database, storage)

---

**Status:**
- [ ] All items completed
- [ ] Ready for production
- [ ] Users notified
- [ ] Support documentation shared

**Deployment Date:** _______________
**Deployed By:** _______________
**Notes:** _______________________________________________
