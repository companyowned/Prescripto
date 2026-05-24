# Prescripto — Feature Updates & Changelog

> Branch: `MallakEdits` · Last updated: 2026-05-24

---

## Phase 1 — Bug Fixes & Core Polish

### UI / Visual Fixes
- **FloatingMedicalBackground** — Rewrote component cleanly; removed stale `shimmer` reference that caused a crash on load.
- **Button component** — Standardised variants (`primary`, `outline`, `ghost`) with consistent sizing tokens.
- **GlassBackground** — Replaced plain colour fill with a glassmorphism-style layered background using `glass.jpg` asset.
- **Theme colours** (`colors.ts`) — Added `glass.*` token group (`background`, `border`, `borderHighlight`, `inputBg`), `confidence.*` (high/medium/low), `dark.*`, `textSecondary`, `textMuted`, `error`, `white`.

### Navigation & Layout
- **App layout** (`_layout.tsx`) — Added `GestureHandlerRootView` wrapper required by `react-native-gesture-handler` v2; wired `signOut` into auth context.
- **Onboarding screen** (`(onboarding)/index.tsx`) — New first-run experience with animated slides and glassmorphism cards; "Get Started" / "Skip" both navigate to the login page.

### Reminders / Medications
- **ReminderCard** — Fixed info button overlapping the delete button; raised card to full opacity (`#FFFFFF` + `zIndex: 1, elevation: 2`).
- **ReminderCard (web)** — Added visible Edit / Pause / Delete action buttons for web (swipe gestures unavailable in browser).

### Internationalisation
- **LanguageContext** (`language-context.tsx`) — New context providing `t(key)`, `isRTL`, and `toggleLanguage`; full Arabic translation for all keys.
- **ThemeContext** (`theme-context.tsx`) — New context providing `colors` token object that switches between light and dark palettes; `darkMode` toggle in settings.
- Wired `t()` into: Home screen quick-action labels, greeting, stat cards; Reminders screen all strings; Settings screen all labels; MockBottomTabs tab labels.

### Profile
- **Profile picture upload** — Used `expo-image-picker` to let users pick a photo; URI persisted with `AsyncStorage`; camera-icon edit badge; "Tap to change photo" hint.

### Settings
- All labels localised via `t()`.
- Dark mode toggle functional via `ThemeContext`.
- Language toggle (English ↔ Arabic) triggers full RTL layout via `isRTL ? 'rtl' : 'ltr'` direction prop.

---

## Phase 2 — Feature Additions

### 1 · Records Page — Month Filter
**File:** `mobile/src/app/(app)/history.tsx`

- Added a horizontal scrollable month-chip row above the records list.
- Chips are dynamically extracted from the available record dates.
- "All Months" chip resets the filter.
- `filterByMonth()` utility filters the record list to the chosen month.
- When a month is selected but has no records, shows a contextual "No records this month — Clear Filter" empty state instead of the generic empty state.
- Improved `recordTitle` logic: diagnosis text → "Prescription — Dr. X" → "Lab Results — Facility" → generic fallback (correct priority order).

### 2 · Prescription ↔ Lab / Radiology Linking

**Backend — `backend/app/repos/document_repo.py`**
- Added `get_children_by_parent_id(db, parent_document_id, user_id)` — queries documents by `parent_document_id` foreign key.

**Backend — `backend/app/views/documents.py`**
- Added `GET /api/v1/documents?parent_document_id=<uuid>` endpoint that returns linked child documents.

**Frontend — `mobile/src/features/prescriptions/api.ts`**
- Added `getLinkedDocuments(parentDocumentId)` API call.
- Added `LinkedDocument` interface (`id`, `purpose`, `original_filename`, `status`, `created_at`, `file_url`, `parent_document_id`).

**Frontend — `mobile/src/features/prescriptions/hooks.ts`**
- Added `useLinkedDocuments(parentDocumentId)` TanStack Query hook.

**Frontend — `mobile/src/app/(app)/result.tsx` — Care Journey Timeline**
- Replaced the plain linked-documents list with a visual **Care Journey** timeline:
  - Prescription node (blue) at the top with its date.
  - Vertical connecting bars between nodes.
  - Each linked lab / radiology result is a tappable card with colour-coded badge (green = Lab, purple = Scan), date, and filename.
  - Gradient wash per card matching the document type colour.
  - "Add Lab / Radiology Result" button at the bottom for quick upload.

### 3 · Enhanced Navigation Speed (staleTime)
**Files:** `hooks.ts` files for prescriptions and reminders

Added `staleTime: 5 * 60 * 1000` (5 minutes) to all key TanStack Query hooks so cached data is shown instantly on re-navigation instead of triggering a fresh network fetch every time:
- `usePrescriptionHistory`
- `usePrescription`
- `useLinkedDocuments`
- `useMedicationInsights`
- `useMedicationTrends`
- `useRiskFlags`
- `useMedicationReminders` (2-minute stale time)

Page entrance animations reduced from 380–400 ms → 180 ms.

### 4 · Reminders — Time-of-Day Grouping & Card Redesign
**Files:** `reminders.tsx`, `ReminderCard.tsx`

**Grouping**
- Reminders are grouped into: **Morning** (5 AM–12 PM), **Afternoon** (12–5 PM), **Evening** (5–9 PM), **Night** (9 PM–5 AM), **As Needed** (interval / no fixed times).
- Each group header is now a full-width card with:
  - Coloured background + LinearGradient wash.
  - Large emoji (24 px) + group name in bold uppercase.
  - Time range subtitle (e.g., "5 AM – 12 PM").
  - Pill badge showing "N meds" count.

**ReminderCard improvements**
- Dosage and form shown as coloured chips (not plain text).
- `instructions` field displayed as a subtitle line — tells the patient what the medication is *for*.
- Web-only Edit / Pause / Delete action row retained.

### 5 · Insights Screen Enhancements
**File:** `mobile/src/app/(app)/insights.tsx`

- Added **motivational banner** below the adherence ring that adapts message and colour to the score:
  - ≥ 90 % → "Outstanding! You're crushing your goals." (green 🏆)
  - ≥ 75 % → "Great job! Stay consistent." (green 🌟)
  - ≥ 50 % → "Good effort — a little more consistency helps." (amber 💪)
  - < 50 % → "Let's get back on track. Every dose counts." (red 💊)
- Wired `useLanguage()` for RTL layout support.
- `staleTime` added to all three insight queries.

### 6 · Profile Picture Upload
**File:** `mobile/src/app/(app)/profile.tsx`

- `expo-image-picker` integration with camera-roll permission request.
- Selected avatar URI persisted via `AsyncStorage` (key: `user_avatar_uri`).
- Profile avatar shows the picked image; falls back to initials monogram.
- Edit badge changed to camera icon; "Tap to change photo" hint text added.

### 7 · Recent Scans — Correct Labelling
**File:** `mobile/src/components/home/RecentScansList.tsx`

Fixed wrong priority order that was showing doctor/institute name as the scan title.

New `getScanTitle()` priority:
1. `diagnosis_text` (if not null / "null" / empty)
2. Purpose-specific fallback:
   - Prescription → `"N Medications Prescribed"` or `"Prescription — Dr. X"`
   - Lab result → `"Lab Results — Facility"` or `"Lab Test Results"`
   - Radiology → `"Radiology — Facility"` or `"Radiology Report"`
3. Generic: `"Medical Prescription"`

Each scan card redesigned:
- Left-side colour accent bar (blue = Rx, green = Lab, purple = Scan).
- Coloured icon circle with purpose-appropriate icon.
- Type badge (`Rx` / `Lab` / `Scan`) in accent colour.
- Confidence score shown in green / amber / red.
- Subtitle shows doctor name (Rx) or facility (Lab/Radiology) + date.

### 8 · Family Profile Switching
**File:** `mobile/src/features/prescriptions/hooks.ts`

- Changed `usePrescriptionHistory` from `enabled: !!profileId` to `enabled: true` so data always loads regardless of whether a profile is explicitly selected.
- History and home screen scans now update correctly when switching between family profiles.

---

## New Files Added

| File | Purpose |
|------|---------|
| `mobile/src/app/(onboarding)/index.tsx` | First-run onboarding screen with animated slides |
| `mobile/src/contexts/language-context.tsx` | Arabic / English i18n context + RTL support |
| `mobile/src/contexts/theme-context.tsx` | Light / dark theme context |
| `mobile/src/components/ui/MedicationInfoModal.tsx` | Bottom-sheet modal showing full medication details |
| `mobile/src/components/ui/PharmacyModal.tsx` | Nearest pharmacy finder modal |
| `mobile/src/components/ui/PillBadge.tsx` | Reusable coloured pill/badge chip component |
| `mobile/src/components/ui/SkeletonLoader.tsx` | Animated skeleton loading cards |
| `mobile/assets/glass.jpg` | Glassmorphism background image asset |

---

## Dependencies Added

| Package | Version | Reason |
|---------|---------|--------|
| `expo-image-picker` | ~17.0 | Profile photo upload |
| `@react-native-async-storage/async-storage` | — | Avatar URI persistence |
| `expo-blur` | — | Glassmorphism BlurView |
| `expo-linear-gradient` | — | Gradient overlays |
| `expo-haptics` | — | Touch feedback |
| `expo-print` + `expo-sharing` | — | PDF adherence report export |

---

## API Endpoints Added / Changed

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/documents?parent_document_id=<uuid>` | Returns documents linked to a parent prescription document |

---

## Known Issues / Remaining Work

- Prescription / scan OCR parsing accuracy depends on image quality; complex handwritten prescriptions may still parse incompletely.
- `expo-location` removed from web bundle to avoid `createPermissionHook` crash — nearest pharmacy uses browser `navigator.geolocation` on web instead.
- Push notifications not yet implemented (reminder alerts are display-only in the app).
