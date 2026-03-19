# 🚀 Prescripto Deployment Guide

Deploy your Prescripto backend to Vercel and build Android APK - Complete setup included!

## 📋 Quick Links

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT_SUMMARY.md](#-quick-start) | Start here - overview & quick start |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Full backend & mobile deployment guide |
| [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md) | Detailed Android APK building instructions |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Complete verification checklist |

## 🎯 What's Included

### ✅ Pre-configured Files

#### Backend (Vercel)
- **[backend/vercel.json](backend/vercel.json)** - Serverless config for Vercel
- **[backend/.env.example](backend/.env.example)** - Environment variables template

#### Mobile (Expo)
- **[mobile/.env.production](mobile/.env.production)** - Production API configuration
- **[mobile/eas.json](mobile/eas.json)** - Expo build configuration

### 📝 Documentation
- **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)** - Overview & quick reference
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Step-by-step instructions
- **[ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md)** - Android-specific details
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment checks

### 🔧 Helper Scripts
- **[quick-deploy.sh](quick-deploy.sh)** - Automated quick start (recommended)
- **[deploy.sh](deploy.sh)** - Full featured deployment menu
- **[setup-env.sh](setup-env.sh)** - Interactive environment setup

---

## 🚀 Quick Start (5 minutes)

### 1️⃣ Install Prerequisites
```bash
# Install Vercel CLI
npm install -g vercel

# Install EAS CLI
npm install -g eas-cli
```

### 2️⃣ Set Up Environment Variables
```bash
# Interactive setup helper
./setup-env.sh
```

This will guide you through:
- Database configuration (Neon, AWS RDS, etc.)
- API keys (Azure Vision, OpenAI)
- Storage setup (local or S3)
- n8n workflow integration

### 3️⃣ Deploy Backend
```bash
cd backend
vercel --prod
```

During deployment:
- Configure environment variables in Vercel dashboard
- Get your deployment URL (e.g., `https://prescripto-api.vercel.app`)

### 4️⃣ Update Mobile App
```bash
# Update with your backend URL
echo "EXPO_PUBLIC_API_URL=https://your-project.vercel.app/api/v1" > mobile/.env.production
```

### 5️⃣ Build Android APK
```bash
cd mobile
eas login
eas build --platform android --type apk
```

**Done!** Download your APK from https://expo.dev/builds

---

## 📖 Full Documentation

### For Backend Deployment
👉 See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for:
- Prerequisites checklist
- Detailed Vercel setup
- Environment variable configuration
- Database connection setup
- Testing & verification

### For Android APK Building
👉 See [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md) for:
- Cloud build (EAS) - recommended
- Local build setup
- Signing & release configuration
- Installation on devices
- Troubleshooting

### Pre & Post Deployment
👉 See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for:
- Complete verification checklist
- Environment variable setup
- Security configuration
- Performance monitoring
- Rollback procedures

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│     Android APK (Expo/React Native)     │
│  • Built with latest Expo SDK           │
│  • Camera integration for scanning      │
│  • JWT token-based authentication       │
└────────────┬────────────────────────────┘
             │ HTTPS REST API
             │
┌────────────▼────────────────────────────┐
│   Vercel Backend (FastAPI Serverless)   │
│  • Auto-scaling with demand             │
│  • Cold start ~10-15 seconds            │
│  • Built-in CI/CD                       │
│  • Global edge network                  │
└────────────┬────────────────────────────┘
             │ Database Driver
             │
┌────────────▼────────────────────────────┐
│    PostgreSQL Database (Neon)           │
│  • Serverless, auto-scaling             │
│  • Connection pooling                   │
│  • Automatic backups                    │
└─────────────────────────────────────────┘
```

---

## 🔐 Security

### ✅ Best Practices Implemented

- **JWT Authentication** - Secure token-based auth
- **CORS Configuration** - Restrict to your domains
- **Environment Variables** - Secrets never in code
- **SSL/TLS** - All connections encrypted
- **Database Pooling** - Secure connection management
- **File Validation** - Type & size checks

### 🔒 Before Deployment

- [ ] Generate strong JWT secret (32+ characters)
- [ ] Use database with SSL enabled
- [ ] Rotate API keys regularly
- [ ] Keep secrets in environment variables only
- [ ] Review CORS origins for your domains

---

## ⚙️ Configuration

### Backend Environment Variables

```bash
# Essential
DATABASE_URL=postgresql+asyncpg://...
JWT_SECRET_KEY=your-secure-key

# OCR (Azure Vision)
AZURE_VISION_ENDPOINT=https://...
AZURE_VISION_KEY=...

# AI Analysis (OpenAI)
OPENAI_API_KEY=sk-...

# File Storage (optional)
S3_BUCKET_NAME=your-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Mobile App Configuration

```bash
# Update .env.production with your API
EXPO_PUBLIC_API_URL=https://your-project.vercel.app/api/v1
```

---

## 📊 Monitoring

### Vercel Dashboard
- Function execution times
- Error logs and debugging
- Deployment history
- Environment variable management

### Expo Dashboard
- APK build status
- App crash reports
- User analytics
- Device information

### Database
- Connection pool status
- Query performance
- Slow query logs
- Backup status

---

## 🐛 Troubleshooting

### Backend Won't Deploy
```bash
# Check logs
vercel logs

# Test locally first
cd backend
uvicorn app.main:app --reload
```

### Mobile App Can't Connect to API
```bash
# Verify backend URL
cat mobile/.env.production

# Test connectivity
adb shell curl https://your-project.vercel.app/health

# Check CORS settings
# Backend: app/core/config.py
```

### APK Build Fails
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install

# Check Node.js version (need 18+)
node --version
```

---

## 📚 Development Guides

### Running Backend Locally
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Running Mobile Locally
```bash
cd mobile
npm install
npm start
# Scan QR code with Expo Go app
```

---

## 🎯 Next Steps

1. **Setup Environment**
   ```bash
   ./setup-env.sh
   ```

2. **Deploy Backend**
   ```bash
   cd backend && vercel --prod
   ```

3. **Update Mobile**
   ```bash
   echo "EXPO_PUBLIC_API_URL=your-url" > mobile/.env.production
   ```

4. **Build APK**
   ```bash
   cd mobile && eas build --platform android --type apk
   ```

5. **Test End-to-End**
   - Install APK on device
   - Test login & scanning
   - Verify API responses

---

## 📞 Support

### Common Issues
- **API connection errors** → Check CORS in app/core/config.py
- **Cold start timeout** → Vercel normal, API will respond
- **APK installation fails** → Ensure Android API 24+
- **Build fails** → Run `npm cache clean --force`

### Resources
- [Vercel Docs](https://vercel.com/docs)
- [Expo Docs](https://docs.expo.dev)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

---

## 📋 Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Backend | ⏳ Not deployed | TBD |
| Mobile APK | ⏳ Not built | TBD |
| Database | ✅ Configured | Neon |

---

**Ready to deploy?**
```bash
./quick-deploy.sh
```

Or follow the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

---

*Last updated: March 19, 2026*
*Prescripto v1.0.0*
