# 🩺 Prescripto

Prescripto is a full-stack, AI-powered medical application designed to digitize handwritten medical prescriptions. By leveraging a mobile app natively integrated with a Python backend and an n8n (Gemini-powered) AI pipeline, Prescripto can read a doctor's handwriting directly from a photo and extract the doctor's name, facility, diagnosis, and a structured list of medications.

---

## 🏗 Architecture Overview

The system is separated into three primary components:

1. **Mobile App (Frontend)**: Built with **React Native / Expo** (Expo Router). Provides a clean user interface for authentication, viewing history, and uploading prescription photos. 
2. **Backend API**: Built with **Python / FastAPI**. Manages user authentication (JWT), secure document storage, SQL databases (SQLAlchemy), and orchestrates the AI workflow calls.
3. **AI Pipeline**: Built with **n8n**. A webhook-triggered workflow that sends the raw image data directly to **Google Gemini 1.5 Flash** (a multimodal vision AI) for flawless handwritten text extraction and structural JSON formatting.

---

## ✨ Features

- **Secure Authentication**: JWT-based login and registration system.
- **Image Scanning & Uploads**: React Native mobile app seamlessly sends `multipart/form-data` image uploads to the server.
- **Intelligent AI Extraction**: Uses Gemini Vision to bypass traditional unreliable OCR, allowing it to decipher messy doctor handwriting and correctly map data into a rigorous JSON structure.
- **Robust Parsing Engine**: The backend has a recursive JSON parser that ensures AI data is reliably caught and formatted, even if the LLM wraps it in markdown blocks or nests the data unexpectedly.
- **Universal Local Fallback**: If the n8n pipeline is offline, the backend gracefully falls back to mock data so the mobile demo works seamlessly without crashing.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+) & **npm** (for the Expo app)
- **Python** (v3.10+) (for the FastAPI backend)
- **n8n Account / Instance** (for the AI extraction pipeline)

### 1. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a digital environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up Environment Variables:
   Open `backend/.env` and configure your keys. 
   ```env
   N8N_WEBHOOK_URL=https://your-n8n-domain.com/webhook/prescription-analysis
   JWT_SECRET_KEY=your_super_secret_key
   ```
5. Start the server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### 2. Mobile Setup (React Native / Expo)

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Environment Variables:
   Open `mobile/.env` and point the API to your local machine's IP address where the backend is running.
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:8000/api/v1
   ```
4. Start the native Expo development server:
   ```bash
   npx expo start
   ```
5. Scan the QR code with the **Expo Go** app on your physical iOS/Android device to run the app!

---

## 🤖 n8n AI Pipeline Configuration

To process real prescriptions instead of mock data, you need to set up the n8n pipeline:

1. **Webhook Node**: 
   - HTTP Method: `POST`
   - Respond: `Using 'Respond to Webhook' Node`
2. **Google Gemini Node**: 
   - Resource: `Image`, Operation: `Analyze Image`, Model: `gemini-1.5-flash`
   - Input Type: `Binary File(s)`, Input Field Name: `data`
   - *Prompt*: Instruct the AI to act as a pharmacist reading handwritten prescriptions and output a strict JSON list of medications and diagnoses. (No markdown).
3. **Code Node (Clean JSON Output)**:
   - Mode: `Run Once for All Items`
   - Grab Gemini's nested response, strip markdown ````json` ticks, and parse the data exactly into: `return { json: JSON.parse(rawText) }`
4. **Respond to Webhook Node**:
   - Respond With: `JSON`
   - Hook this to the end of your workflow so n8n sends the extracted data directly back to the Prescripto Backend!

---

## 🛠 Tech Stack

- **Frontend**: React Native, Expo SDK 54, React Router, Axios
- **Backend**: FastAPI, Python 3, SQLAlchemy, aiosqlite, Pydantic, httpx, bcrypt
- **AI / Pipeline**: n8n, Google Gemini 1.5 Flash Vision API
- **Database**: SQLite (Development) -> easily swap to PostgreSQL (Production)
