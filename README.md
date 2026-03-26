# 🩺 Prescripto

Prescripto is a full-stack medical app that digitizes handwritten prescriptions using a React Native mobile app, a FastAPI backend, and an optional n8n AI workflow.

---

## ✅ Latest Project Status

- **Backend** is deployed on Vercel (serverless)
- **Android APK** is built via EAS (Expo)
- **GitHub Actions** workflows are configured for automatic backend deploy + APK build
- Auth/register/login flow is connected to production API

---

## 🏗 Architecture

1. **Mobile (Expo / React Native)**
   - Authentication
   - Scan/upload prescription documents
   - History and profile views

2. **Backend (FastAPI / SQLAlchemy)**
   - JWT authentication
   - Document and prescription APIs
   - DB access via async SQLAlchemy

3. **AI Workflow (n8n, optional)**
   - Webhook-based extraction/parsing pipeline
   - Can be enabled/disabled with env vars

---

## 📁 Project Structure

- `backend/` → FastAPI API
- `mobile/` → Expo React Native app
- `.github/workflows/` → CI/CD automation

---

## 🧪 Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Example local env (`backend/.env`):

```env
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>/<db>?ssl=require
JWT_SECRET_KEY=change-me-in-production
N8N_WEBHOOK_URL=
N8N_AUTH_KEY=
```

### Mobile

```bash
cd mobile
npm install
npm start
```

Mobile uses the fallback API URL from code by default.

---

## 🚀 Production Deployment

### Backend (Vercel)

Deploy command:

```bash
vercel --prod
```

Required Vercel environment variables:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `INIT_DB_ON_STARTUP=false`
- Optional: `N8N_WEBHOOK_URL`, `N8N_AUTH_KEY`, `OPENAI_API_KEY`, `AZURE_VISION_*`

### Mobile (Android APK with EAS)

Build APK:

```bash
cd mobile
eas build -p android --profile preview
```

---

## 🤖 CI/CD (Automatic Deploys)

Workflows:

- `.github/workflows/deploy-backend-vercel.yml`
- `.github/workflows/build-android-apk.yml`

Required GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `EXPO_TOKEN`

Behavior:

- Push changes in `backend/**` → backend auto-deploy workflow runs
- Push changes in `mobile/**` → APK build workflow runs

---

## 🛠 Tech Stack

- **Mobile**: React Native, Expo SDK 54, Expo Router, Axios, React Query
- **Backend**: FastAPI, SQLAlchemy async, Pydantic, JWT auth
- **Database**: PostgreSQL (Neon-compatible)
- **Automation**: GitHub Actions, Vercel, EAS Build

---

## 🔒 Security Notes

- Never commit `.env` or tokens
- Keep all secrets in Vercel / GitHub / Expo secret stores
- Revoke any token accidentally exposed in chat or commits
