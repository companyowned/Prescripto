# Prescripto Chatbot With LlamaIndex

## Summary

This implementation adds an authenticated medical assistant chatbot to Prescripto. The assistant answers general medical education questions and questions about the user's saved prescription records, extracted medications, diagnoses, follow-up requests, medication reminders, and upcoming dose events.

The chatbot is intentionally built as a separate layer on top of Prescripto's existing prescription extraction system. It does not replace OCR, prescription parsing, or classification. Those remain handled by the existing document processing workflow. LlamaIndex is used for the conversational medical assistant layer.

## What Was Built

### Backend

New files:

- `backend/app/schemas/chat.py`
- `backend/app/controllers/chat_controller.py`
- `backend/app/views/chat.py`
- `backend/app/utils/llamaindex_chat.py`

Updated files:

- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/requirements.txt`

The backend now exposes:

```http
POST /api/v1/chat
```

The endpoint is protected by the same JWT authentication used by the rest of the app. When answering record-specific questions, the assistant only sees records owned by the authenticated user. By default, the mobile app asks the backend to include all family profiles owned by that user.

### Mobile App

New files:

- `mobile/src/features/chat/types.ts`
- `mobile/src/features/chat/api.ts`
- `mobile/src/features/chat/hooks.ts`
- `mobile/src/app/(app)/chat.tsx`

Updated files:

- `mobile/src/app/(app)/home.tsx`
- `mobile/src/app/(app)/settings.tsx`

The app now includes a Medical Assistant screen reachable from Home and Settings.

## How It Works

### 1. The User Sends a Chat Message

The mobile screen sends this payload:

```json
{
  "message": "What medicines am I taking today?",
  "profile_id": "active-profile-id",
  "include_family_profiles": true,
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous answer" }
  ],
  "max_records": 20
}
```

### 2. FastAPI Authenticates the Request

`backend/app/views/chat.py` uses:

```python
current_user: User = Depends(get_current_user)
```

This keeps the chatbot inside the existing access-control model. The user cannot ask the chatbot about another user's prescriptions.

### 3. The Chat Controller Builds Private Context

`ChatController` gathers context from:

- Saved prescriptions
- Family profile names
- Doctors and facilities
- Diagnosis text
- Medication rows
- Follow-up requests parsed from `raw_output_json`
- Medication reminders
- Upcoming dose events in the next 24 hours

The result is converted into plain text context plus structured source metadata.

### 4. LlamaIndex Answers From Records Or General Medical Guidance

When these are available:

- `llama-index-core`
- `llama-index-llms-google-genai`
- `GOOGLE_API_KEY`

the backend uses LlamaIndex to create a temporary per-request `SummaryIndex` from the authenticated user's current records when records are available. For general medical education questions, the Gemini prompt allows broad, safe educational guidance even when no saved records exist.

The LlamaIndex path lives in:

```text
backend/app/utils/llamaindex_chat.py
```

It uses:

```python
Document
SummaryIndex
GoogleGenAI
```

The model is configurable with:

```env
GOOGLE_API_KEY=...
CHAT_LLM_MODEL=gemini-2.5-flash
CHAT_TEMPERATURE=0.2
```

### 5. Local Fallback Keeps The Feature Working

If LlamaIndex packages are not installed, or `GOOGLE_API_KEY` is not set, the endpoint still works using a deterministic fallback.

The fallback can:

- Summarize saved records
- Answer common general medical-routing questions, such as what type of doctor usually evaluates fever
- List medications
- Show reminder and upcoming dose context
- Respond safely when the user asks to change treatment
- Tell the user when no saved records exist

Responses include a `mode` field:

```json
{
  "mode": "llamaindex"
}
```

or:

```json
{
  "mode": "fallback"
}
```

The mobile screen displays this so development behavior is visible.

## Why LlamaIndex Was Used

LlamaIndex is a good fit for this part of Prescripto because the chatbot is a retrieval and context-grounding problem.

Prescripto already has structured private data:

- Prescription history
- Medication rows
- Doctor and facility data
- Reminder schedules
- Upcoming dose events

For record-specific questions, the assistant should answer from the user's own records. For general medical education questions, the assistant may use Gemini's medical knowledge with strict guardrails. LlamaIndex gives the backend a clean way to combine both paths behind one chat interface.

This is the correct boundary:

```text
OCR / extraction / classification
        stays in existing workflow

Chat over saved prescription data and general medical education
        uses LlamaIndex
```

That keeps the high-risk extraction pipeline stable while adding a useful assistant layer.

## Why LlamaIndex Was Not Used For OCR

LlamaIndex is not the best tool for reading handwritten prescriptions directly. OCR and extraction should remain separate because they need:

- Image preprocessing
- OCR-specific services
- Structured validation
- Confidence scoring
- Retry and fallback behavior
- Database normalization

The chatbot should consume the normalized results after the prescription has already been processed.

## Safety Rules

The assistant is scoped to medical-record explanation and general medical education.

It must not:

- Diagnose conditions
- Prescribe medication
- Recommend changing dosage
- Tell users to stop medication
- Replace a clinician or pharmacist

It may:

- Explain saved prescription records
- Suggest the usual type of doctor for a symptom, such as primary care for fever
- Explain common red flags that should prompt urgent care
- Provide general educational information with uncertainty

The backend includes urgent-safety detection for terms such as chest pain, overdose, severe allergic reaction, and breathing problems. In those cases, it returns an emergency-care message instead of trying to answer normally.

Every response includes this disclaimer:

```text
Prescripto can explain saved prescription records and provide general medical education, but it is not a doctor and cannot diagnose, prescribe, or change treatment. For urgent symptoms or suspected overdose, contact local emergency services immediately.
```

## API Reference

### Request

```http
POST /api/v1/chat
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "message": "Summarize my latest prescription",
  "profile_id": "optional-profile-id",
  "include_family_profiles": true,
  "history": [],
  "max_records": 20
}
```

### Response

```json
{
  "message": "Your saved prescription includes...",
  "mode": "llamaindex",
  "sources": [
    {
      "type": "prescription",
      "title": "Prescription from 2026-05-02 12:30",
      "reference_id": "prescription-id",
      "metadata": {
        "document_id": "document-id",
        "confidence_score": 0.91
      }
    }
  ],
  "safety_disclaimer": "Prescripto can explain saved prescription records..."
}
```

## Installation

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

The LlamaIndex dependencies added are:

```text
llama-index-core>=0.12.0
llama-index-llms-google-genai>=0.3.0
```

Set environment variables:

```env
GOOGLE_API_KEY=your_key_here
CHAT_LLM_MODEL=gemini-2.5-flash
CHAT_TEMPERATURE=0.2
```

If `GOOGLE_API_KEY` is missing, the endpoint still runs in fallback mode.

## Running Locally

Backend:

```bash
cd backend
uvicorn app.main:app --reload
```

Mobile:

```bash
cd mobile
npm start
```

If the mobile app should call a local backend, set:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Use your machine LAN IP instead of `localhost` when testing on a physical phone.

## Example Questions

Good questions:

- "Summarize my latest prescription."
- "What medicines are saved in my records?"
- "What medicines are saved for my family profiles?"
- "Show prescriptions for each family member."
- "What reminders do I have today?"
- "Which doctor prescribed this?"
- "Do I have any lab follow-up requests?"
- "What diagnosis is saved for my last prescription?"
- "What kind of doctor should I see for fever?"
- "Which specialist usually treats a skin rash?"
- "When is a headache urgent?"

Questions the assistant will refuse or caution:

- "Should I stop this medicine?"
- "Can I double my dose?"
- "What should I take instead?"
- "I overdosed, what now?"

## Implementation Notes

The current implementation creates a per-request LlamaIndex from the user's latest records. This is simple, privacy-conscious, and appropriate for the current data size.

If the app grows to thousands of documents per user, the next step should be a persistent vector index keyed by:

- `user_id`
- `profile_id`
- `prescription_id`
- `document_id`

At that point, embeddings and incremental indexing would become useful. For now, per-request context avoids index synchronization bugs and keeps the chatbot grounded in the latest database state.

## Files Changed

Backend:

```text
backend/app/schemas/chat.py
backend/app/controllers/chat_controller.py
backend/app/views/chat.py
backend/app/utils/llamaindex_chat.py
backend/app/main.py
backend/app/core/config.py
backend/requirements.txt
```

Mobile:

```text
mobile/src/features/chat/types.ts
mobile/src/features/chat/api.ts
mobile/src/features/chat/hooks.ts
mobile/src/app/(app)/chat.tsx
mobile/src/app/(app)/home.tsx
mobile/src/app/(app)/settings.tsx
```
