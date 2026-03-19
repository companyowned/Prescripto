# Prescripto Deployment Summary

## What's Been Set Up

I've created a complete deployment configuration for your Prescripto application to deploy:
- **Backend**: FastAPI on Vercel (serverless)
- **Frontend**: Android APK built with Expo

---

## Files Created

### Backend Configuration
- **[backend/vercel.json](backend/vercel.json)** - Vercel serverless configuration
- **[backend/.env.example](backend/.env.example)** - Environment variables template

### Mobile App Configuration  
- **[mobile/.env.production](mobile/.env.production)** - Production API URL for mobile app
- **[mobile/eas.json](mobile/eas.json)** - EAS build configuration

### Deployment Scripts
- **[quick-deploy.sh](quick-deploy.sh)** - Quick start deployment script (recommended)
- **[deploy.sh](deploy.sh)** - Full-featured deployment script with menu

### Documentation
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete backend & mobile deployment guide
- **[ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md)** - Detailed Android APK building guide

---

## Quick Start

### Option A: Automated (Recommended)

```bash
# Run the quick deployment script
./quick-deploy.sh
```

This will:
1. Install required CLI tools
2. Deploy backend to Vercel
3. Configure mobile app with backend URL
4. Build Android APK

### Option B: Step by Step

#### 1. Deploy Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Deploy to Vercel
vercel --prod

# Configure environment variables during deployment:
# - DATABASE_URL (PostgreSQL connection)
# - JWT_SECRET_KEY (secure random key)
# - AZURE_VISION_ENDPOINT & KEY
# - OPENAI_API_KEY
# - Other API keys
```

#### 2. Get Backend URL

After deployment, you'll have: `https://your-project.vercel.app/api/v1`

#### 3. Build Android APK

```bash
cd mobile

# Update .env.production with your backend URL
echo "EXPO_PUBLIC_API_URL=https://your-project.vercel.app/api/v1" > .env.production

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --type apk
```

---

## Key Configuration Points

### Backend (Vercel)

**Environment Variables Needed:**
```
DATABASE_URL=postgresql+asyncpg://user:pass@host/db?ssl=require
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# OCR & AI
AZURE_VISION_ENDPOINT=https://...
AZURE_VISION_KEY=...
OPENAI_API_KEY=sk-...

# Optional: Workflow & Storage
N8N_WEBHOOK_URL=...
N8N_AUTH_KEY=...
S3_BUCKET_NAME=...
```

**CORS Update:** After deploying, update `app/core/config.py` with your Vercel URL:
```python
allow_origins=[
    "https://your-project.vercel.app",
    "https://yourmobiledomain.com",  # Your APK domain
]
```

### Mobile App (Android APK)

**What's Pre-configured:**
- ✅ EAS build setup (eas.json)
- ✅ Android permissions (camera)
- ✅ App configuration (app.json)
- ✅ API client ready (src/services/apiClient.ts)
- ✅ Environment variable support (.env.production)

**What You Need to Do:**
1. Replace `your-project.vercel.app` in `.env.production`
2. Ensure Expo account
3. Run: `eas build --platform android --type apk`

---

## Deployment Checklist

### Backend (Vercel)
- [ ] Copy environment variables from .env.example
- [ ] Set DATABASE_URL to your PostgreSQL
- [ ] Generate strong JWT_SECRET_KEY
- [ ] Set AZURE_VISION_ENDPOINT & KEY
- [ ] Set OPENAI_API_KEY (if needed)
- [ ] Run: `cd backend && vercel --prod`
- [ ] Test: `curl https://your-project.vercel.app/health`
- [ ] Update CORS origins in app/core/config.py
- [ ] Redeploy if CORS updated

### Mobile (Android APK)
- [ ] Update .env.production with backend URL
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Build APK: `eas build --platform android --type apk`
- [ ] Download APK from Expo dashboard
- [ ] Test on Android device
- [ ] Install: `adb install prescripto.apk` (or download directly)

---

## Testing Deployment

### Test Backend API
```bash
# Health check
curl https://your-project.vercel.app/health

# API docs
https://your-project.vercel.app/docs
```

### Test Mobile App
1. Install APK on Android device
2. Go to Settings/About to verify backend URL
3. Test login functionality
4. Try uploading/scanning a prescription
5. Check API responses

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `502 Bad Gateway` on Vercel | Check DATABASE_URL, restart database connection pool |
| APK build fails in EAS | Check Node.js version (18+), review build logs |
| `CORS error` in mobile app | Update allow_origins in app/core/config.py, redeploy |
| `API not found` on mobile | Verify EXPO_PUBLIC_API_URL in .env.production |
| Camera permission denied | Grant permission in Android app settings |

---

## Next Steps

1. **Start deployment:** `./quick-deploy.sh`
2. **Monitor builds:**
   - Vercel: https://vercel.com/dashboard
   - Expo: https://expo.dev/builds
3. **Test thoroughly:**
   - API endpoints
   - Mobile app functionality
   - Camera & file uploads
4. **Publish:**
   - Push to Google Play Store (optional)
   - Share APK with users (internal distribution)

---

## Support Files

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - In-depth deployment instructions
- **[ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md)** - Android-specific build details
- **[deploy.sh](deploy.sh)** - Full deployment menu script
- **[quick-deploy.sh](quick-deploy.sh)** - Automated quick start

---

## Architecture Overview

```
┌──────────────────────────────────────────┐
│          Prescripto Architecture         │
├──────────────────────────────────────────┤
│                                          │
│  ┌─────────────────────────────────┐    │
│  │   Android Mobile App (APK)      │    │
│  │  - Built with Expo/React Native │    │
│  │  - API Client with auth token   │    │
│  └────────────┬────────────────────┘    │
│               │                         │
│               │ HTTPS                   │
│               │                         │
│  ┌────────────▼────────────────────┐    │
│  │  Vercel (Backend API)           │    │
│  │  - FastAPI running serverless   │    │
│  │  - Auto-scales with demand      │    │
│  │  - Cold start ~10-15 seconds    │    │
│  └────────────┬────────────────────┘    │
│               │                         │
│               │                         │
│  ┌────────────▼────────────────────┐    │
│  │  PostgreSQL Database (Neon)     │    │
│  │  - Serverless, auto-scaling     │    │
│  │  - Connection pooling           │    │
│  └─────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

---

**Ready to deploy? Run:** `./quick-deploy.sh`
