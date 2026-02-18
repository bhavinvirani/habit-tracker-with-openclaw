# AI Weekly Insights Engine — Design Document

**Date:** 2026-02-18
**Status:** Approved

---

## 1. Overview

A Claude-powered weekly insights system that analyzes each user's habit data and generates personalized reports. Reports are generated on-demand by an admin (dev-triggered via admin dashboard) and displayed to users on the Dashboard and Analytics pages.

The entire AI feature is gated behind a scalable feature flag system that also supports future feature toggles.

---

## 2. Feature Flag System

### 2.1 Data Model

```prisma
model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique   // "ai_insights", "challenges", "book_tracking"
  name        String              // "AI Weekly Insights"
  description String?             // "Claude-powered weekly habit analysis"
  category    String   @default("general") // "ai", "experimental", "core"
  enabled     Boolean  @default(false)
  metadata    Json?               // Extra config per flag
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 2.2 Backend — FeatureFlagService

- Loads all flags into in-memory `Map` on startup for fast lookups
- Refreshes cache when admin toggles a flag
- Helpers:
  - `isEnabled(key)` — returns boolean for service-layer checks
  - `requireFeature(key)` — Express middleware, returns 403 if disabled
- Self-registering: each feature calls `featureFlagService.register()` on startup. If flag already exists, registration is a no-op (preserves admin toggle state). New flags appear in admin UI automatically on deploy.

### 2.3 API Endpoints

| Method  | Path                          | Auth          | Purpose                                       |
| ------- | ----------------------------- | ------------- | --------------------------------------------- |
| `GET`   | `/api/v1/admin/features`      | Admin         | List all flags with full details              |
| `PATCH` | `/api/v1/admin/features/:key` | Admin         | Toggle flag or update metadata                |
| `GET`   | `/api/v1/features`            | Authenticated | Returns enabled flag keys only (for frontend) |

### 2.4 Frontend — FeatureGate Pattern

- `FeatureFlagProvider` context loads enabled flag keys on auth (single API call)
- `<FeatureGate flag="ai_insights">` component for conditional rendering
- `useFeatureFlags()` hook with `isEnabled(key)` for logic checks

### 2.5 Admin UI — Feature Flags Page (`/admin/features`)

- Grouped by category (collapsible sections)
- Each flag: toggle switch (optimistic update), name, description, category badge, last updated
- Search bar for filtering
- Toast notifications on toggle success/failure

---

## 3. AI Weekly Insights

### 3.1 Insight Types

1. **Pattern Detection** — Hidden correlations and triggers ("You skip Exercise 80% of the time when you also skip Meditation")
2. **Risk Warnings** — Proactive streak-risk alerts ("Reading streak at day 16 — you historically break around day 18-20")
3. **Optimization Tips** — Actionable schedule/behavior advice ("Your Water Intake completion jumps to 95% on days you complete Morning Walk first")
4. **Progress Narratives** — Big-picture storytelling ("Best 2-week consistency since October. 3 habits improved by 20%+")

### 3.2 Data Model

```prisma
model WeeklyReport {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  patterns      Json     // Array of { insight: string, habits: string[], confidence: string }
  risks         Json     // Array of { habit: string, message: string, severity: "low"|"medium"|"high" }
  optimizations Json     // Array of { suggestion: string, habits: string[], impact: string }
  narrative     String   // Free-form progress summary paragraph
  periodStart   DateTime // Start of analysis window
  periodEnd     DateTime // End of analysis window
  generatedAt   DateTime @default(now())

  @@unique([userId])     // Only latest report per user (upsert)
  @@index([userId])
}
```

### 3.3 Generation Flow

```
Admin clicks "Generate Reports" on admin dashboard
  ↓
Backend checks: aiInsightsEnabled flag + ANTHROPIC_API_KEY present
  ↓
Iterates over all active users
  ↓
For each user, collects (last 30 days):
  - HabitLog data (completions, values, notes)
  - Current & longest streaks per habit
  - Habit correlations
  - Day-of-week performance breakdown
  - Week-over-week comparison
  - Productivity score & trend
  ↓
Assembles into structured JSON context
  ↓
Sends to Claude API (claude-sonnet-4-5-20250929, temp 0.3, ~1500 max tokens)
  System prompt: "You are a habit behavior analyst. Analyze this data
  and produce exactly 4 JSON sections: patterns, risks, optimizations,
  narrative. Be specific, reference actual habit names and numbers."
  ↓
Parses structured response
  ↓
Upserts into WeeklyReport table (one per user)
```

### 3.4 API Endpoints

| Method | Path                             | Auth          | Purpose                          |
| ------ | -------------------------------- | ------------- | -------------------------------- |
| `POST` | `/api/v1/admin/generate-reports` | Admin         | Trigger batch report generation  |
| `GET`  | `/api/v1/reports/latest`         | Authenticated | Get current user's latest report |

### 3.5 Claude API Integration

- **Provider:** Anthropic (Claude)
- **Model:** claude-sonnet-4-5-20250929
- **Temperature:** 0.3
- **Max tokens:** ~1500
- **API key:** Environment variable only (`ANTHROPIC_API_KEY`)
- **Service:** `services/ai.ts` — Claude API client, prompt builder, response parser
- **Orchestrator:** `services/reportGenerator.ts` — data collection + AI call per user

### 3.6 API Key Security

- `ANTHROPIC_API_KEY` stored as environment variable only
- Added to `backend/.env.example` as placeholder
- `.env` already in `.gitignore`
- Read via `process.env.ANTHROPIC_API_KEY`
- Startup validation: if AI flag enabled but key missing → log warning, auto-disable
- Key never touches: database, frontend bundle, API responses, log files
- Production: set in Render dashboard environment variables
- All Claude API calls happen server-side only

---

## 4. User Model Changes

Add `isAdmin` boolean to `User` model:

```prisma
model User {
  // ... existing fields
  isAdmin  Boolean @default(false)
  reports  WeeklyReport[]
}
```

Admin status set manually in DB. Admin middleware checks `req.userId` → user.isAdmin.

---

## 5. Frontend — Display

### 5.1 Dashboard — Weekly Insights Card

- Positioned after daily progress section
- Sparkle/brain icon, "AI Insights" header, "Updated X days ago" timestamp
- 2-3 highlight lines from the report (1 top pattern, 1 risk if any, 1 optimization)
- Colored icons per type: blue (patterns), amber (risks), green (optimizations)
- "View full report →" link to Analytics page
- Empty state if no report: "No insights generated yet"
- Entire card wrapped in `<FeatureGate flag="ai_insights">`

### 5.2 Analytics — Full Report Section

- New section at top of Analytics page
- Four collapsible cards:
  - **Patterns Found** (blue accent) — insight text + habit name badges
  - **Risk Alerts** (amber/red accent) — severity badge + habit name
  - **Optimization Tips** (green accent) — impact level + habit badges
  - **Weekly Summary** (purple accent) — narrative paragraph
- Header: "Week of [date range]" with generation timestamp
- Skeleton loading state while fetching
- Wrapped in `<FeatureGate flag="ai_insights">`

### 5.3 Admin Page

- Route: `/admin` (redirect non-admins)
- **Feature Flags section:** toggles grouped by category
- **AI Insights section** (visible when flag enabled):
  - "Generate Weekly Reports" button
  - Last generated timestamp
  - Users processed count
  - Spinner + "Generating..." state during batch run
  - Success/error toast on completion

---

## 6. Summary of New Files

### Backend

- `prisma/schema.prisma` — Add FeatureFlag, WeeklyReport models, isAdmin on User
- `services/featureFlag.ts` — FeatureFlagService (cache, register, isEnabled)
- `middleware/featureGate.ts` — requireFeature middleware
- `middleware/adminAuth.ts` — Admin-only middleware
- `services/ai.ts` — Claude API client
- `services/reportGenerator.ts` — Report generation orchestrator
- `controllers/adminController.ts` — Admin endpoints
- `controllers/reportController.ts` — User report endpoint
- `routes/admin.ts` — Admin routes
- `routes/reports.ts` — Report routes
- `validators/admin.ts` — Admin endpoint validation

### Frontend

- `contexts/FeatureFlagContext.tsx` — Provider + hook + FeatureGate component
- `services/features.ts` — Feature flag API calls
- `services/reports.ts` — Report API calls
- `pages/Admin.tsx` — Admin dashboard page
- `components/dashboard/WeeklyInsightsCard.tsx` — Dashboard summary card
- `components/analytics/AIInsightsSection.tsx` — Full report on Analytics
- `components/admin/FeatureFlagsManager.tsx` — Feature flags admin UI
- `components/admin/ReportGenerator.tsx` — Report generation admin UI
