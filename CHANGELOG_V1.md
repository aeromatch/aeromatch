# AeroMatch V1 - Changelog (Jan 2025)

## Summary
Complete rebuild and upgrade of AeroMatch web app to a coherent V1 for Jan 26 launch.

---

## PHASE 1: Entry Flow & UX Fixes ✅

### Files Changed:
- `src/app/page.tsx` - Server component for home page
- `src/components/home/HomePage.tsx` - Client component with i18n support
- `src/app/globals.css` - Complete design system overhaul

### Changes:
- Home page shows marketing section + clear CTAs
- Two buttons: "Sign in" and "Create account"
- If logged in: "Go to Dashboard" button
- Session logic corrected
- Gold border styles: 2px default, 4px for active/selected states
- Hover states, focus rings, proper spacing on all clickable elements

---

## PHASE 1.3: Internationalization (i18n) ✅

### Files Created:
- `src/lib/i18n/translations.ts` - EN/ES translations dictionary
- `src/lib/i18n/LanguageContext.tsx` - React context + LanguageSwitch component

### Files Modified:
- `src/app/layout.tsx` - Added LanguageProvider wrapper
- `src/components/ui/AppLayout.tsx` - Added LanguageSwitch to sidebar

### Features:
- EN default, ES optional
- Language preference persisted in localStorage
- Switch available in header and sidebar

---

## PHASE 2: Home Page Polish ✅

### Files Modified:
- `src/components/home/HomePage.tsx` - Premium hero section
- `src/app/globals.css` - New component styles

### Changes:
- Premium hero with availability-first messaging:
  - Headline: "Certified technical talent, available when you need it"
  - Clear value proposition
- 4 feature cards with icons (Availability First, Verified Docs, Anonymous Until Match, Fast Connection)
- Brand palette: deep navy/blue, warm gold accents, clean whites
- High contrast, readable text
- Demo mode link in header

---

## PHASE 3: Availability Calendar (Airbnb-like) ✅

### Files Created:
- `src/components/availability/AvailabilityCalendar.tsx` - Interactive calendar component

### Files Modified:
- `src/app/profile/availability/page.tsx` - Rebuilt with new calendar
- `src/app/search/page.tsx` - Uses same calendar for date selection

### Features:
- Airbnb-style range selection (click start, click end)
- Preview highlight between start/end dates
- "Confirm availability" button
- Multiple ranges support
- Quick presets: "Next 30 days", "Next 90 days"
- Visual freshness indicators

---

## PHASE 4: Availability Freshness ✅

### Files Modified:
- `src/app/api/search/technicians/route.ts` - Added freshness calculation
- `src/app/profile/availability/page.tsx` - Confirmation flow

### Migration Created:
- `supabase/migrations/001_add_confirmed_at.sql`

### Features:
- Technicians must confirm availability periodically (30-day default)
- Freshness states: Fresh (green), Warning (yellow), Stale (red)
- Companies see freshness indicator on search results
- Results sorted by freshness (fresh first)

---

## PHASE 5: Documents V2 ✅

### Files Modified:
- `src/app/profile/documents/page.tsx` - Complete rebuild

### Features:
- Structured categories with tabs:
  1. **Licenses**: EASA B1, EASA B2, UK CAA B1, UK CAA B2, FAA A&P
  2. **Type Ratings**: For each aircraft type - Theoretical + Practical slots
  3. **Certificates**: HF, EWIS, FTS, RVSM, ETOPS, Run-up, Tank Entry, Boroscope, NDT
- Missing document warnings
- "Verified" badge placeholder
- "Download AMX PDF" button (stubbed)
- Upload status indicators

---

## PHASE 6: Demo Mode & Feedback ✅

### Files Created:
- `src/app/demo/page.tsx` - Public demo page
- `src/components/feedback/FeedbackModal.tsx` - Exit-intent feedback

### Migration Created:
- `supabase/migrations/002_feedback_table.sql`

### Features:
- Demo mode accessible from home page (no login required)
- Three demo views: Home, Technician, Company
- Sample data for demonstration
- Exit-intent feedback modal (desktop only)
- Feedback stored in Supabase

---

## Design System Updates

### New CSS Classes:
```css
/* Buttons */
.btn-cta          /* Header CTA with gold border */
.btn-primary-lg   /* Large primary button */
.btn-primary-filled-lg
.btn-secondary-lg

/* Active States (4px border) */
.btn-active
.btn-selected
.card-action-active
.chip-selected

/* Calendar */
.calendar-day
.calendar-day-today
.calendar-day-selected
.calendar-day-in-range

/* Freshness Indicators */
.freshness-fresh
.freshness-warning
.freshness-stale

/* Feature Cards */
.feature-card
.feature-icon
.cta-card
```

---

## Database Migrations

Run these in Supabase SQL Editor:

### 1. Add confirmed_at to availability_slots
```sql
-- supabase/migrations/001_add_confirmed_at.sql
ALTER TABLE availability_slots ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ DEFAULT NOW();
UPDATE availability_slots SET confirmed_at = created_at WHERE confirmed_at IS NULL;
```

### 2. Create feedback table
```sql
-- supabase/migrations/002_feedback_table.sql
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT,
  page TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert feedback" ON feedback FOR INSERT WITH CHECK (true);
```

### 3. Add file_name to documents
```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name TEXT;
```

---

## How to Run Locally

```bash
cd aeroMatch-app
npm install
npm run dev
```

Then open: http://localhost:3000

---

## Core Flows Verified

1. ✅ **Technician register** → complete profile → set availability → upload docs
2. ✅ **Company register** → search by dates/types → view results with freshness labels
3. ✅ **Demo mode** → explore without signup
4. ✅ **Language switch** → EN/ES toggle persistent

---

## Quality Bar Met

- ✅ Premium, readable, high contrast
- ✅ Buttons look clickable (gold borders, hover states)
- ✅ Gold accents used intentionally
- ✅ Clear hierarchy and spacing
- ✅ Anonymity logic preserved

