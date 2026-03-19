# Prescripto Deployment Guide

## Backend Deployment on Vercel

### Prerequisites
- Vercel account and CLI installed
- Python 3.11+
- PostgreSQL database (Neon, Vercel Postgres, or AWS RDS)
- Environment variables configured

### Step 1: Prepare Backend for Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Update CORS in config.py:**
   After deploying to Vercel, add your deployed URL to allowed origins in `app/core/config.py`:
   ```python
   allow_origins=[
       "your-domain.vercel.app",
       "https://yourmobiledomain.com",
       # ... other origins
   ]
   ```

3. **Ensure all required environment variables are set** (see .env.example)

### Step 2: Deploy Backend to Vercel

```bash
cd backend
vercel --prod
```

During deployment, configure these environment variables in Vercel:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Secure random key
- `AZURE_VISION_ENDPOINT` - Azure Vision API endpoint
- `AZURE_VISION_KEY` - Azure Vision API key
- `OPENAI_API_KEY` - OpenAI API key (if using)
- `N8N_WEBHOOK_URL` - n8n workflow webhook
- `N8N_AUTH_KEY` - n8n authentication key

### Important Notes for Vercel Deployment:
- **Cold starts**: First request may take longer (10-15 seconds)
- **Temporary storage**: Use S3 or similar for file uploads (not local `/tmp`)
- **Background jobs**: Celery/Redis may not work on serverless; consider using async tasks
- **Database**: Ensure database is accessible from Vercel infrastructure
- **Max file size**: Default 50MB, configured in vercel.json

### Your Backend URL:
After deployment, your API will be at:
```
https://your-project.vercel.app/api/v1
```

---

## Mobile App Deployment (Android APK)

### Prerequisites
- Node.js & npm installed
- Expo account (free)
- Java JDK 11+ installed
- Android SDK (via Android Studio or Android Command-line Tools)

### Option 1: Using Expo Application Services (EAS) - Recommended

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Update API endpoint in mobile app:**
   Create/update `.env.production` in `mobile/` directory:
   ```
   EXPO_PUBLIC_API_URL=https://your-project.vercel.app/api/v1
   ```

4. **Build Android APK:**
   ```bash
   cd mobile
   eas build --platform android --type apk
   ```

5. **Download APK:**
   - Monitor build progress in Expo dashboard
   - Download when complete

### Option 2: Local Android Build

1. **Setup Android SDK:**
   ```bash
   # Ensure ANDROID_HOME is set
   export ANDROID_HOME=$HOME/Library/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   ```

2. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

3. **Build APK locally:**
   ```bash
   # Install EAS CLI
   npm install -g eas-cli
   
   # Build for internal distribution
   eas build --platform android --local
   ```

4. **For signed production APK:**
   ```bash
   # Generate keystore (one-time)
   keytool -genkey -v -keystore prescripto-release.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias prescripto-alias
   
   # Build signed APK
   eas build --platform android --type app-signed
   ```

### Option 3: Manual Build with Android Studio

1. **Generate Expo bundle:**
   ```bash
   cd mobile
   expo prebuild --clean
   ```

2. **Open in Android Studio:**
   ```bash
   open -a "Android Studio" android/
   ```

3. **Build APK:**
   - Build > Generate Signed Bundle/APK
   - Follow the wizard

---

## Configuration Checklist

- [ ] Backend DATABASE_URL configured in Vercel environment
- [ ] JWT_SECRET_KEY set to secure random value
- [ ] API keys (Azure, OpenAI, etc.) configured
- [ ] CORS origins updated for production domains
- [ ] Mobile app .env.production with correct API_URL
- [ ] Android signing key created (if building locally)
- [ ] Vercel deployment tested (/docs endpoint accessible)
- [ ] Mobile app API client points to deployed backend

---

## Testing Deployment

### Test Backend:
```bash
curl https://your-project.vercel.app/health
```

### Test Mobile App:
1. Install APK on Android device
2. Verify API connectivity in app settings
3. Test login, document scan, prescription analysis

---

## Troubleshooting

### Backend Issues:
- **502 Bad Gateway**: Check database connection, ensure DATABASE_URL is correct
- **Cold start timeout**: Optimize imports, consider connection pooling
- **CORS errors**: Update allow_origins in Vercel environment and config.py

### Mobile Issues:
- **API connection failed**: Verify EXPO_PUBLIC_API_URL, check CORS headers
- **Build fails**: Clear npm cache `npm cache clean --force`
- **APK won't install**: Ensure signing key matches app identifier

---

## Next Steps

1. Deploy backend to Vercel
2. Build Android APK using EAS
3. Install APK on Android device
4. Test end-to-end workflow
5. Monitor logs in Vercel & Expo dashboards
