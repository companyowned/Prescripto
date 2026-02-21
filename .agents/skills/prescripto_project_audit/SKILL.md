---
name: prescripto-project-audit
description: Comprehensive skill audit and project reference for the Prescripto medical prescription scanning and analysis application (Expo React Native + FastAPI + SkepticGen).
---

# Prescripto — Project Skill Audit

> **Version**: 1.0  
> **Last Updated**: 2026-02-21  
> **Status**: Greenfield — Initial Architecture & Specification

---

## 1. Project Overview

**Prescripto** is a mobile-first medical prescription scanning and analysis platform. Users photograph or upload prescriptions; the system extracts structured medical data via an AI-powered multi-agent pipeline (SkepticGen) and presents the results in a clean, editable UI.

### Core Value Proposition

| Capability | Description |
|---|---|
| **Scan & Upload** | Camera capture or PDF/image import from device |
| **AI Extraction** | OCR → NLP → Classification via SkepticGen multi-agent workflow |
| **Structured Output** | Doctor, facility, diagnosis, medications with confidence scores |
| **User Review** | Inline editing of extracted fields before final save |
| **History** | Full list of past analyzed prescriptions |

---

## 2. Technology Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | Expo + React Native + TypeScript |
| Navigation | React Navigation |
| Data Fetching | TanStack Query (polling + caching) |
| State Management | Zustand (lightweight global state) |
| Camera/Docs | Expo Camera + DocumentPicker |
| UI Library | React Native Paper / NativeWind (TailwindCSS RN) |

### Backend

| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy 2.0 + Alembic migrations |
| Database | PostgreSQL |
| Background Jobs | Celery + Redis (prod) / FastAPI BackgroundTasks (dev) |
| File Storage | S3-compatible (MinIO dev / AWS S3 prod) or local |
| Auth | JWT access tokens (+ optional refresh tokens) |
| Schemas | Pydantic v2 |

### AI / Workflow

| Layer | Technology |
|---|---|
| Orchestration | SkepticGen (skflow) |
| LLM | `gpt-4.1-mini` (configurable per agent node) |
| OCR | Azure AI Vision |
| NLP | Lettria NLP |
| Classification | Custom classification agent |

---

## 3. SkepticGen Workflow Audit

**Workflow ID**: `skflow_4ee35c96-99fa-4b4c-9ef8-6ab9fb7d9452`  
**Source File**: `medical_prescription_extraction_and_analysis_skflow-2.json`

### 3.1 Pipeline Architecture

```
┌─────────────┐     ┌──────────────────────┐     ┌───────────────────────────┐     ┌──────────────────────┐
│   Trigger    │────▶│  Prescription OCR    │────▶│  Medical Text Analysis   │────▶│  Classification      │
│  (text input)│     │  Agent               │     │  Agent                   │     │  Agent               │
└─────────────┘     └──────────────────────┘     └───────────────────────────┘     └──────────────────────┘
                          AgentHandoff                  AgentHandoff
```

### 3.2 Node Details

#### Node 1 — Trigger (`trigger-node-06713922`)

| Field | Value |
|---|---|
| **Type** | `triggerNode` |
| **Trigger Type** | `text` |
| **Input Type** | `text` |
| **Purpose** | Entry point; receives the prescription image/text input |

#### Node 2 — Prescription OCR Agent (`agent-node-761ad04e`)

| Field | Value |
|---|---|
| **Model** | `gpt-4.1-mini` |
| **Tool Agent** | No |
| **Handoff** | → Medical Text Analysis Agent |

**Responsibilities**:
1. Receive prescription image input
2. Invoke **Azure AI Vision OCR** to extract printed + handwritten text
3. Extract text segments with confidence scores
4. Flag low-confidence segments below threshold
5. Package as JSON: `{ text_segments[], confidence_scores[], low_confidence_flags[] }`
6. Handoff via `transfer_to_Medical_Text_Analysis_Agent()`

**Output Schema**:
```json
{
  "text_segments": ["string"],
  "confidence_scores": [0.0],
  "low_confidence_flags": [false]
}
```

> [!IMPORTANT]
> This agent relies on Azure AI Vision as an external tool. The backend integration stub must handle Azure API credentials, rate limits, and fallback behavior.

#### Node 3 — Medical Text Analysis Agent (`agent-node-fa9b9d8f`)

| Field | Value |
|---|---|
| **Model** | `gpt-4.1-mini` |
| **Tool Agent** | No |
| **Handoff** | → Classification Agent |

**Responsibilities**:
1. Receive OCR-extracted text + confidence data
2. Use **Lettria NLP** to detect medical entities: diagnosis, medications, dosage, frequency, duration, notes
3. Assess entity-level confidence
4. Flag uncertain / ambiguous segments (especially medications & dosages)
5. Generate alerts for unclear or potentially unsafe information
6. Output plain-text analysis summary (no JSON/code in final output)

> [!WARNING]
> The agent instructions specify **plain-text output only** (no JSON), but the handoff description mentions "structured JSON summary." This inconsistency should be resolved during implementation — recommend standardizing on structured JSON output for downstream parsing.

#### Node 4 — Classification Agent (`agent-node-26228fee`)

| Field | Value |
|---|---|
| **Model** | `gpt-4.1-mini` |
| **Tool Agent** | No |
| **Handoff** | Terminal node (no further handoff) |

**Responsibilities**:
1. Receive content from Medical Text Analysis Agent
2. Classify content into appropriate categories/labels
3. Assign confidence scores per classification
4. Handle edge cases: empty input, low confidence, malformed content
5. Output structured JSON ready for database persistence

**Output Schema**:
```json
{
  "categories": ["string"],
  "confidence_scores": { "category": 0.0 },
  "flags": {
    "empty_input": false,
    "low_confidence": false,
    "unexpected_content": false
  },
  "metadata": {}
}
```

> [!NOTE]
> The Classification Agent mentions "Firebase" in its instructions, but the project architecture uses PostgreSQL. The agent prompt should be updated to reference the correct database layer, or the term should be generalized to "database."

### 3.3 Edge Connections

| Source → Target | Type |
|---|---|
| Trigger → OCR Agent | `default` |
| OCR Agent → Analysis Agent | `AgentHandoff` |
| Analysis Agent → Classification Agent | `AgentHandoff` |

### 3.4 Workflow Risks & Recommendations

| # | Risk | Severity | Recommendation |
|---|---|---|---|
| 1 | Output format inconsistency (Analysis Agent: text vs JSON) | **High** | Standardize all agent outputs to JSON for reliable parsing |
| 2 | Firebase reference in Classification Agent | **Medium** | Update prompt to reference PostgreSQL / generic DB |
| 3 | No retry/fallback logic in workflow definition | **Medium** | Add retry logic in backend `workflow_controller` |
| 4 | Hardcoded model `gpt-4.1-mini` | **Low** | Make model configurable per-environment |
| 5 | No image pre-processing step defined | **Low** | Add image normalization (rotation, contrast) before OCR |

---

## 4. Data Flow

```
User (Mobile App)
  │
  ├── Camera Scan ──────┐
  ├── Upload PDF/Image ──┤
  │                      ▼
  │              POST /api/v1/documents
  │                      │
  │                      ▼
  │              Save file (S3/local)
  │              Create Document + Job records
  │                      │
  │                      ▼
  │              Background Worker (Celery/BackgroundTasks)
  │                      │
  │              ┌───────┴───────┐
  │              │  SkepticGen   │
  │              │  Pipeline     │
  │              │               │
  │              │  1. OCR       │
  │              │  2. NLP       │
  │              │  3. Classify  │
  │              └───────┬───────┘
  │                      │
  │                      ▼
  │              Parse output → structured schema
  │              Store: Prescription, Doctor, Facility,
  │                     Diagnosis, Medication[]
  │                      │
  │                      ▼
  │              Job status → done
  │
  ├── Poll GET /api/v1/jobs/{job_id}
  │              │
  │              ▼
  ├── GET /api/v1/prescriptions/{document_id}
  │              │
  │              ▼
  └── Display → Edit → PATCH → Confirm Save
```

---

## 5. Backend Architecture

### 5.1 Folder Structure

```
backend/
  app/
    main.py                          # FastAPI app factory
    core/
      config.py                      # Settings (env-based)
      security.py                    # JWT, password hashing
      logging.py                     # Structured logging
      exceptions.py                  # Custom exception hierarchy
    db/
      session.py                     # DB session factory
      base.py                       # Declarative base
      migrations/                    # Alembic
    models/                          # SQLAlchemy ORM models
      user.py
      document.py
      job.py
      prescription.py
      doctor.py
      facility.py
      diagnosis.py
      medication.py
    schemas/                         # Pydantic request/response
      user.py
      document.py
      job.py
      prescription.py
    repos/                           # Data access layer
      user_repo.py
      document_repo.py
      prescription_repo.py
    controllers/                     # Business logic / service layer
      document_controller.py
      workflow_controller.py
      prescription_controller.py
    views/                           # FastAPI routers (API endpoints)
      health.py
      auth.py
      documents.py
      prescriptions.py
    workers/                         # Background processing
      celery_app.py
      tasks.py
    utils/                           # Shared utilities
      file_storage.py
      pdf_tools.py
      ocr.py
      skepticgen_client.py
      parsing.py
    tests/
```

### 5.2 Layer Responsibilities

| Layer | Role | Example |
|---|---|---|
| **Models** | SQLAlchemy table definitions | `models/prescription.py` |
| **Schemas** | Pydantic validation (req/res) | `schemas/prescription.py` |
| **Repos** | DB queries & data access | `repos/prescription_repo.py` |
| **Controllers** | Business logic orchestration | `controllers/workflow_controller.py` |
| **Views** | HTTP routing & serialization | `views/prescriptions.py` |
| **Workers** | Async background jobs | `workers/tasks.py` |

### 5.3 Database Entities

```
┌──────────┐    ┌──────────┐    ┌──────────────┐
│   User   │───▶│ Document │───▶│     Job      │
└──────────┘    └────┬─────┘    └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Prescription │
              ├──────────────┤
              │ doctor_id ──────▶ Doctor
              │ facility_id ────▶ Facility
              │ diagnosis_text │
              │ raw_output_json│
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Medication[] │
              └──────────────┘
```

| Entity | Key Fields |
|---|---|
| **User** | `id`, `email`, `hashed_password`, `created_at` |
| **Document** | `id`, `user_id`, `file_url`, `file_type` (pdf/image), `status` (uploaded/processing/done/failed), `created_at` |
| **Job** | `id`, `document_id`, `workflow_id`, `status`, `progress`, `error_message`, `started_at`, `finished_at` |
| **Prescription** | `id`, `document_id`, `doctor_id`, `facility_id`, `diagnosis_text`, `raw_output_json`, `created_at` |
| **Doctor** | `id`, `name`, `license_no` (optional) |
| **Facility** | `id`, `name`, `address` (optional) |
| **Medication** | `id`, `prescription_id`, `name`, `dose`, `frequency`, `duration`, `notes` |

### 5.4 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/auth/register` | User registration |
| `POST` | `/api/v1/auth/login` | JWT login |
| `POST` | `/api/v1/documents` | Upload document (multipart) → returns `document_id`, `job_id` |
| `GET` | `/api/v1/documents/{id}` | Document metadata |
| `GET` | `/api/v1/jobs/{job_id}` | Job status / progress |
| `GET` | `/api/v1/prescriptions` | Prescription history list |
| `GET` | `/api/v1/prescriptions/{document_id}` | Analysis result |
| `PATCH` | `/api/v1/prescriptions/{id}` | User corrections |

### 5.5 Normalized Output Schema

All SkepticGen outputs must be normalized to:

```json
{
  "doctor": { "name": "string" },
  "facility": { "name": "string" },
  "diagnosis": "string | null",
  "medications": [
    {
      "name": "string",
      "dose": "string | null",
      "frequency": "string | null",
      "duration": "string | null"
    }
  ],
  "confidence": { "overall": 0.0 }
}
```

---

## 6. Frontend Architecture

### 6.1 Folder Structure

```
mobile/
  src/
    app/
      navigation/                    # Stack/tab navigators
      screens/
        HomeScreen.tsx
        ScanScreen.tsx
        UploadScreen.tsx
        ProcessingScreen.tsx
        ResultScreen.tsx
        HistoryScreen.tsx
    components/
      ui/                            # Reusable primitives
        Button.tsx
        Card.tsx
        Input.tsx
        Loader.tsx
        EmptyState.tsx
      prescription/                  # Domain-specific
        MedicationList.tsx
        MedicationItem.tsx
        PrescriptionHeader.tsx
        DiagnosisCard.tsx
        DoctorFacilityCard.tsx
    features/
      documents/
        api.ts / hooks.ts / types.ts
      prescriptions/
        api.ts / hooks.ts / types.ts
    services/
      apiClient.ts                   # Axios/fetch wrapper
      auth.ts                        # Token management
    theme/
      colors.ts / spacing.ts / typography.ts
    utils/
      validators.ts / file.ts
```

### 6.2 Screen Flow

```
Home ──┬──▶ Scan (Camera) ──┐
       │                     ├──▶ Processing (poll job) ──▶ Result ──▶ Save/Edit
       └──▶ Upload (Picker) ─┘
                                                            │
       History ◀────────────────────────────────────────────┘
```

### 6.3 Component Rules

- **`components/ui/*`** — Generic, reusable primitives (no domain logic)
- **`components/prescription/*`** — Domain components (prescription-specific)
- **Screens** compose components; no duplicated UI logic in screens
- **`features/*/hooks.ts`** — TanStack Query hooks for data fetching/mutation
- **`services/apiClient.ts`** — Single HTTP client with auth interceptors

---

## 7. UI/UX Requirements

| Requirement | Detail |
|---|---|
| **Layout** | Minimalist with clear visual hierarchy |
| **Flow** | Step-based: Upload/Scan → Processing → Results → Save/Edit |
| **Cards** | Use cards for doctor, hospital, diagnosis, medications |
| **Inline Edit** | Pencil icon for field-level editing |
| **Error States** | "Scan unclear, try again", "Diagnosis not found" |
| **Accessibility** | Readable fonts, high contrast, large tap targets |
| **Animations** | Smooth transitions between steps, loading spinners |

---

## 8. Security & Compliance

| Area | Implementation |
|---|---|
| **Transport** | HTTPS in production |
| **Auth** | JWT access tokens, optional refresh tokens |
| **File Storage** | Signed URLs for S3; no direct public access |
| **Logging** | Never log raw medical document content |
| **Access Control** | Users can only access their own prescriptions |
| **Input Validation** | Pydantic schemas on all endpoints |
| **Rate Limiting** | Recommended for upload endpoints |

---

## 9. Environment & Configuration

### Required Environment Variables (Backend)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/prescripto

# Auth
JWT_SECRET_KEY=<random-secret>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Storage
STORAGE_BACKEND=local  # or "s3"
S3_BUCKET_NAME=prescripto-uploads
S3_ENDPOINT_URL=http://localhost:9000  # MinIO
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# SkepticGen / AI
SKEPTICGEN_API_URL=https://api.skepticgen.com
SKEPTICGEN_API_KEY=
OPENAI_API_KEY=
AZURE_VISION_ENDPOINT=
AZURE_VISION_KEY=

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

---

## 10. Deliverables Checklist

- [ ] Expo RN app (TypeScript) with reusable components + modern theme
- [ ] FastAPI backend with clean layered architecture (models → schemas → repos → controllers → views)
- [ ] Database migrations (Alembic) + seeded workflow config
- [ ] Document processing pipeline + SkepticGen integration stub/client
- [ ] End-to-end flow: upload → process → results → save → history
- [ ] Auth system (register/login/JWT)
- [ ] Error handling + validation layer
- [ ] Unit tests for critical paths

---

## 11. Implementation Notes

### SkepticGen Client Stub

The `utils/skepticgen_client.py` should:

1. Accept document content (image bytes or extracted text)
2. Call the SkepticGen API with **workflow ID** `skflow_4ee35c96-99fa-4b4c-9ef8-6ab9fb7d9452`
3. Handle async execution (the workflow may take 10–60 seconds)
4. Parse the final Classification Agent output into the normalized schema
5. Return structured `PrescriptionResult` Pydantic model

### Workflow Config in DB

Store workflow definitions so they can be updated without code deploys:

```python
class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(UUID, primary_key=True)
    name = Column(String, nullable=False)
    version = Column(Integer, default=1)
    config_json = Column(JSON, nullable=False)      # Full skflow JSON
    prompt_template = Column(Text, nullable=True)
    output_schema = Column(JSON, nullable=True)      # Expected JSON shape
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
```

### Image Pre-Processing Recommendations

Before sending to OCR:
- Auto-rotate using EXIF data
- Increase contrast for handwritten text
- Resize to optimal resolution for Azure Vision API
- Convert PDF pages to individual images (one per page)
