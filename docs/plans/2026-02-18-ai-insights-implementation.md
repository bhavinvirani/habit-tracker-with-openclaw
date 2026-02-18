# AI Weekly Insights Engine — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a feature flag system + Claude-powered weekly insights engine with admin controls, dashboard summary card, and full analytics report view.

**Architecture:** Backend adds FeatureFlag and WeeklyReport Prisma models, a FeatureFlagService with in-memory cache, a Claude AI service, and admin-protected endpoints. Frontend adds a FeatureFlag context with `<FeatureGate>` component, an Admin page, a Dashboard insights card, and an Analytics insights section.

**Tech Stack:** Anthropic SDK (Claude Sonnet), Prisma, Express, React, React Query, Zustand, Tailwind CSS, Zod

**Design Doc:** `docs/plans/2026-02-18-ai-insights-design.md`

---

## Task 1: Prisma Schema — Add FeatureFlag, WeeklyReport, isAdmin

**Files:**

- Modify: `backend/prisma/schema.prisma`

**Step 1: Add models to Prisma schema**

Add `isAdmin` field to the `User` model (after the `apiKeyScopes` field):

```prisma
  isAdmin  Boolean @default(false)
```

Add `reports WeeklyReport[]` to User's relation list (after `notificationSettings`):

```prisma
  reports              WeeklyReport[]
```

Add at the bottom of the schema (before enums):

```prisma
// ============ FEATURE FLAGS ============

model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique
  name        String
  description String?
  category    String   @default("general")
  enabled     Boolean  @default(false)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@map("feature_flags")
}

// ============ AI WEEKLY REPORTS ============

model WeeklyReport {
  id            String   @id @default(cuid())
  userId        String
  patterns      Json
  risks         Json
  optimizations Json
  narrative     String
  periodStart   DateTime
  periodEnd     DateTime
  generatedAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId])
  @@index([userId])
  @@map("weekly_reports")
}
```

**Step 2: Generate and apply migration**

Run:

```bash
cd /Users/bhavinvirani/Desktop/Code/personal/habit-tracker && npx prisma migrate dev --name add-feature-flags-and-weekly-reports
```

Expected: Migration created and applied. Prisma client regenerated.

**Step 3: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat: add FeatureFlag, WeeklyReport models and isAdmin to User"
```

---

## Task 2: Backend — FeatureFlagService

**Files:**

- Create: `backend/src/services/featureFlag.service.ts`

**Step 1: Create the service**

```typescript
import prisma from '../config/database';
import logger from '../utils/logger';

interface FeatureFlagRegistration {
  key: string;
  name: string;
  description?: string;
  category?: string;
  defaultEnabled?: boolean;
  metadata?: Record<string, unknown>;
}

interface FeatureFlag {
  key: string;
  name: string;
  description: string | null;
  category: string;
  enabled: boolean;
  metadata: unknown;
  updatedAt: Date;
}

class FeatureFlagService {
  private cache = new Map<string, FeatureFlag>();
  private loaded = false;

  async loadAll(): Promise<void> {
    const flags = await prisma.featureFlag.findMany();
    this.cache.clear();
    for (const flag of flags) {
      this.cache.set(flag.key, flag);
    }
    this.loaded = true;
    logger.info(`Loaded ${flags.length} feature flags`);
  }

  async register(reg: FeatureFlagRegistration): Promise<void> {
    const existing = await prisma.featureFlag.findUnique({ where: { key: reg.key } });
    if (existing) return; // No-op if already exists — preserves admin toggle state

    await prisma.featureFlag.create({
      data: {
        key: reg.key,
        name: reg.name,
        description: reg.description ?? null,
        category: reg.category ?? 'general',
        enabled: reg.defaultEnabled ?? false,
        metadata: reg.metadata ?? undefined,
      },
    });
    // Reload cache after registration
    await this.loadAll();
    logger.info(`Registered feature flag: ${reg.key}`);
  }

  async isEnabled(key: string): Promise<boolean> {
    if (!this.loaded) await this.loadAll();
    return this.cache.get(key)?.enabled ?? false;
  }

  async getAll(): Promise<FeatureFlag[]> {
    if (!this.loaded) await this.loadAll();
    return Array.from(this.cache.values());
  }

  async getEnabledKeys(): Promise<string[]> {
    if (!this.loaded) await this.loadAll();
    return Array.from(this.cache.values())
      .filter((f) => f.enabled)
      .map((f) => f.key);
  }

  async toggle(key: string, enabled: boolean): Promise<FeatureFlag> {
    const flag = await prisma.featureFlag.update({
      where: { key },
      data: { enabled },
    });
    await this.loadAll(); // Refresh cache
    return flag;
  }

  async updateFlag(
    key: string,
    data: { enabled?: boolean; metadata?: Record<string, unknown> }
  ): Promise<FeatureFlag> {
    const flag = await prisma.featureFlag.update({
      where: { key },
      data,
    });
    await this.loadAll();
    return flag;
  }
}

export const featureFlagService = new FeatureFlagService();
```

**Step 2: Commit**

```bash
git add backend/src/services/featureFlag.service.ts
git commit -m "feat: add FeatureFlagService with in-memory cache"
```

---

## Task 3: Backend — Feature Flag & Admin Middleware

**Files:**

- Create: `backend/src/middleware/featureGate.ts`
- Create: `backend/src/middleware/adminAuth.ts`

**Step 1: Create featureGate middleware**

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { featureFlagService } from '../services/featureFlag.service';
import { AuthorizationError } from '../utils/AppError';

export const requireFeature = (featureKey: string) => {
  return async (_req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const enabled = await featureFlagService.isEnabled(featureKey);
      if (!enabled) {
        throw new AuthorizationError(`Feature '${featureKey}' is not enabled`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

**Step 2: Create adminAuth middleware**

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AuthorizationError } from '../utils/AppError';
import prisma from '../config/database';

export const requireAdmin = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      throw new AuthorizationError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
```

**Step 3: Commit**

```bash
git add backend/src/middleware/featureGate.ts backend/src/middleware/adminAuth.ts
git commit -m "feat: add requireFeature and requireAdmin middleware"
```

---

## Task 4: Backend — Admin Feature Flag Endpoints

**Files:**

- Create: `backend/src/validators/admin.validator.ts`
- Create: `backend/src/controllers/admin.controller.ts`
- Create: `backend/src/routes/admin.routes.ts`
- Modify: `backend/src/server.ts`

**Step 1: Create validators**

```typescript
import { z } from 'zod';

export const featureFlagKeyParamSchema = z.object({
  key: z.string().min(1, 'Feature flag key is required'),
});

export const updateFeatureFlagSchema = z.object({
  enabled: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
```

**Step 2: Create controller**

```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { featureFlagService } from '../services/featureFlag.service';
import { UpdateFeatureFlagInput } from '../validators/admin.validator';

export const getAllFeatureFlags = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const flags = await featureFlagService.getAll();
  sendSuccess(res, { flags }, 'Feature flags retrieved successfully');
});

export const updateFeatureFlag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const data = req.body as UpdateFeatureFlagInput;
  const flag = await featureFlagService.updateFlag(key, data);
  sendSuccess(res, { flag }, `Feature flag '${key}' updated successfully`);
});

export const getEnabledFeatures = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const keys = await featureFlagService.getEnabledKeys();
  sendSuccess(res, { features: keys }, 'Enabled features retrieved successfully');
});
```

**Step 3: Create routes**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { validateBody, validateParams } from '../middleware/validate';
import { featureFlagKeyParamSchema, updateFeatureFlagSchema } from '../validators/admin.validator';
import {
  getAllFeatureFlags,
  updateFeatureFlag,
  getEnabledFeatures,
} from '../controllers/admin.controller';

const router = Router();

// Public (authenticated) — get enabled feature keys for frontend
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/features', authenticate, readLimiter as any, getEnabledFeatures);

// Admin-only — manage feature flags
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/admin/features', authenticate, requireAdmin, readLimiter as any, getAllFeatureFlags);
router.patch(
  '/admin/features/:key',
  authenticate,
  requireAdmin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  validateParams(featureFlagKeyParamSchema),
  validateBody(updateFeatureFlagSchema),
  updateFeatureFlag
);

export default router;
```

**Step 4: Mount routes in server.ts**

In `backend/src/server.ts`, add the import (after the last route import):

```typescript
import featureRoutes from './routes/admin.routes';
```

And mount it on v1Router (after the reminders line):

```typescript
v1Router.use('/', featureRoutes);
```

**Step 5: Commit**

```bash
git add backend/src/validators/admin.validator.ts backend/src/controllers/admin.controller.ts backend/src/routes/admin.routes.ts backend/src/server.ts
git commit -m "feat: add admin feature flag API endpoints"
```

---

## Task 5: Backend — Register AI Insights Feature Flag on Startup

**Files:**

- Modify: `backend/src/server.ts`

**Step 1: Import and register on startup**

In `server.ts`, add the import:

```typescript
import { featureFlagService } from './services/featureFlag.service';
```

Inside the `app.listen` callback (after `logger.info('Server started successfully', ...)`), add:

```typescript
// Load feature flags and register defaults
featureFlagService.loadAll().then(async () => {
  await featureFlagService.register({
    key: 'ai_insights',
    name: 'AI Weekly Insights',
    description: 'Claude-powered weekly habit analysis reports',
    category: 'ai',
    defaultEnabled: false,
  });
});
```

**Step 2: Commit**

```bash
git add backend/src/server.ts
git commit -m "feat: register ai_insights feature flag on startup"
```

---

## Task 6: Backend — AI Service (Claude Client)

**Files:**

- Create: `backend/src/services/ai.service.ts`

**Step 1: Install Anthropic SDK**

```bash
cd /Users/bhavinvirani/Desktop/Code/personal/habit-tracker && npm install @anthropic-ai/sdk --workspace=backend
```

**Step 2: Add ANTHROPIC_API_KEY to .env.example**

Append to `backend/.env.example`:

```
# --------------------------------------------
# AI / Anthropic (Optional)
# --------------------------------------------
# Required for AI Weekly Insights feature.
# Get your API key at https://console.anthropic.com
# If not set, the AI insights feature will be auto-disabled.
ANTHROPIC_API_KEY=
```

**Step 3: Create the AI service**

````typescript
import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger';

interface PatternInsight {
  insight: string;
  habits: string[];
  confidence: string;
}

interface RiskInsight {
  habit: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

interface OptimizationInsight {
  suggestion: string;
  habits: string[];
  impact: string;
}

export interface AIInsightsResult {
  patterns: PatternInsight[];
  risks: RiskInsight[];
  optimizations: OptimizationInsight[];
  narrative: string;
}

interface HabitDataContext {
  habits: Array<{
    name: string;
    category: string | null;
    frequency: string;
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    completionRate: number;
    recentCompletions: Array<{ date: string; completed: boolean; value: number | null }>;
  }>;
  correlations: Array<{
    habit1: string;
    habit2: string;
    coefficient: number;
    interpretation: string;
  }>;
  dayOfWeekPerformance: Array<{
    day: string;
    completionRate: number;
  }>;
  weekOverWeek: {
    thisWeekRate: number;
    lastWeekRate: number;
    change: number;
  };
  productivityScore: {
    score: number;
    grade: string;
    trend: string;
  };
}

const SYSTEM_PROMPT = `You are a habit behavior analyst. You receive structured data about a user's habit tracking over the past 30 days. Analyze the data and produce insights in exactly 4 categories.

Return ONLY valid JSON with this exact structure:
{
  "patterns": [
    { "insight": "specific observation referencing habit names and numbers", "habits": ["Habit Name 1", "Habit Name 2"], "confidence": "high|medium|low" }
  ],
  "risks": [
    { "habit": "Habit Name", "message": "specific risk warning with numbers", "severity": "low|medium|high" }
  ],
  "optimizations": [
    { "suggestion": "specific actionable advice referencing data", "habits": ["Habit Name"], "impact": "high|medium|low" }
  ],
  "narrative": "A 2-3 sentence progress summary highlighting the most important trends this week."
}

Rules:
- Reference actual habit names and real numbers from the data
- Keep each insight to 1-2 sentences, be specific not generic
- Patterns: find correlations, triggers, and hidden connections (2-4 items)
- Risks: warn about streaks likely to break or declining habits (1-3 items)
- Optimizations: suggest timing, ordering, or stacking changes (1-3 items)
- Narrative: be encouraging but honest, highlight both wins and areas to improve
- If data is limited, produce fewer insights rather than making up generic advice`;

export async function generateInsights(data: HabitDataContext): Promise<AIInsightsResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey });

  const userMessage = `Here is the user's habit data for the past 30 days:\n\n${JSON.stringify(data, null, 2)}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude API');
  }

  // Extract JSON from the response (handle potential markdown wrapping)
  let jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonText) as AIInsightsResult;

  // Validate structure
  if (!parsed.patterns || !parsed.risks || !parsed.optimizations || !parsed.narrative) {
    throw new Error('Invalid AI response structure');
  }

  logger.info('AI insights generated successfully', {
    patterns: parsed.patterns.length,
    risks: parsed.risks.length,
    optimizations: parsed.optimizations.length,
  });

  return parsed;
}

export function isAIConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
````

**Step 4: Commit**

```bash
git add backend/src/services/ai.service.ts backend/.env.example backend/package.json backend/package-lock.json
git commit -m "feat: add AI service with Claude API integration"
```

---

## Task 7: Backend — Report Generator Service

**Files:**

- Create: `backend/src/services/reportGenerator.service.ts`

**Step 1: Create the report generator**

This service orchestrates data collection from existing analytics functions and feeds them to the AI service.

```typescript
import prisma from '../config/database';
import { generateInsights, isAIConfigured, AIInsightsResult } from './ai.service';
import { featureFlagService } from './featureFlag.service';
import * as analyticsService from './analytics.service';
import logger from '../utils/logger';
import { BadRequestError } from '../utils/AppError';
import { subDays } from 'date-fns';

interface GenerationResult {
  usersProcessed: number;
  usersSkipped: number;
  errors: string[];
}

async function collectUserData(userId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30);

  // Fetch user's active habits
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true, isArchived: false },
    select: {
      id: true,
      name: true,
      category: true,
      frequency: true,
      currentStreak: true,
      longestStreak: true,
      totalCompletions: true,
    },
  });

  if (habits.length === 0) return null;

  // Fetch recent habit logs
  const logs = await prisma.habitLog.findMany({
    where: { userId, date: { gte: thirtyDaysAgo } },
    select: { habitId: true, date: true, completed: true, value: true },
    orderBy: { date: 'desc' },
  });

  // Build per-habit completion data
  const habitData = habits.map((habit) => {
    const habitLogs = logs.filter((l) => l.habitId === habit.id);
    const completedCount = habitLogs.filter((l) => l.completed).length;
    const completionRate = habitLogs.length > 0 ? (completedCount / 30) * 100 : 0;

    return {
      name: habit.name,
      category: habit.category,
      frequency: habit.frequency,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      totalCompletions: habit.totalCompletions,
      completionRate: Math.round(completionRate * 10) / 10,
      recentCompletions: habitLogs.slice(0, 14).map((l) => ({
        date: l.date.toISOString().split('T')[0],
        completed: l.completed,
        value: l.value,
      })),
    };
  });

  // Fetch existing analytics data (reuse your analytics service)
  let correlations: Array<{
    habit1: string;
    habit2: string;
    coefficient: number;
    interpretation: string;
  }> = [];
  try {
    const corrData = await analyticsService.getHabitCorrelations(userId);
    correlations = corrData.correlations.map((c) => ({
      habit1: c.habit1Name,
      habit2: c.habit2Name,
      coefficient: c.correlation,
      interpretation: c.interpretation,
    }));
  } catch {
    // Correlations may not be available for new users
  }

  let dayOfWeekPerformance: Array<{ day: string; completionRate: number }> = [];
  try {
    const perfData = await analyticsService.getBestPerformingAnalysis(userId);
    dayOfWeekPerformance = perfData.byDayOfWeek.map((d) => ({
      day: d.day,
      completionRate: d.completionRate,
    }));
  } catch {
    // May not be available
  }

  let weekOverWeek = { thisWeekRate: 0, lastWeekRate: 0, change: 0 };
  try {
    const compData = await analyticsService.getWeekComparison(userId);
    weekOverWeek = {
      thisWeekRate: compData.thisWeek.rate,
      lastWeekRate: compData.lastWeek.rate,
      change: compData.change,
    };
  } catch {
    // May not be available
  }

  let productivityScore = { score: 0, grade: 'N/A', trend: 'stable' };
  try {
    const prodData = await analyticsService.getProductivityScore(userId);
    productivityScore = {
      score: prodData.score,
      grade: prodData.grade,
      trend: prodData.trend,
    };
  } catch {
    // May not be available
  }

  return {
    habits: habitData,
    correlations,
    dayOfWeekPerformance,
    weekOverWeek,
    productivityScore,
  };
}

export async function generateReportsForAllUsers(): Promise<GenerationResult> {
  const aiEnabled = await featureFlagService.isEnabled('ai_insights');
  if (!aiEnabled) {
    throw new BadRequestError('AI Insights feature is disabled');
  }

  if (!isAIConfigured()) {
    throw new BadRequestError('ANTHROPIC_API_KEY is not configured');
  }

  const users = await prisma.user.findMany({
    where: { isAdmin: false },
    select: { id: true, name: true },
  });

  // Include admin users too — generate for everyone
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true },
  });

  const result: GenerationResult = {
    usersProcessed: 0,
    usersSkipped: 0,
    errors: [],
  };

  const periodEnd = new Date();
  const periodStart = subDays(periodEnd, 7);

  for (const user of allUsers) {
    try {
      const data = await collectUserData(user.id);
      if (!data) {
        result.usersSkipped++;
        continue;
      }

      const insights: AIInsightsResult = await generateInsights(data);

      await prisma.weeklyReport.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          patterns: insights.patterns as unknown as Record<string, unknown>[],
          risks: insights.risks as unknown as Record<string, unknown>[],
          optimizations: insights.optimizations as unknown as Record<string, unknown>[],
          narrative: insights.narrative,
          periodStart,
          periodEnd,
        },
        update: {
          patterns: insights.patterns as unknown as Record<string, unknown>[],
          risks: insights.risks as unknown as Record<string, unknown>[],
          optimizations: insights.optimizations as unknown as Record<string, unknown>[],
          narrative: insights.narrative,
          periodStart,
          periodEnd,
          generatedAt: new Date(),
        },
      });

      result.usersProcessed++;
      logger.info(`Generated report for user: ${user.name} (${user.id})`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`User ${user.id}: ${errMsg}`);
      logger.error(`Failed to generate report for user ${user.id}`, { error: errMsg });
    }
  }

  logger.info('Report generation complete', result);
  return result;
}

export async function getLatestReport(userId: string) {
  return prisma.weeklyReport.findUnique({
    where: { userId },
  });
}
```

**Step 2: Commit**

```bash
git add backend/src/services/reportGenerator.service.ts
git commit -m "feat: add report generator service with data collection and AI orchestration"
```

---

## Task 8: Backend — Report & Admin Report Endpoints

**Files:**

- Create: `backend/src/controllers/report.controller.ts`
- Modify: `backend/src/routes/admin.routes.ts`

**Step 1: Create report controller**

```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { generateReportsForAllUsers, getLatestReport } from '../services/reportGenerator.service';

export const generateReports = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const result = await generateReportsForAllUsers();
  sendSuccess(res, result, 'Reports generated successfully');
});

export const getMyLatestReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const report = await getLatestReport(req.userId!);
  sendSuccess(res, { report }, 'Latest report retrieved successfully');
});
```

**Step 2: Add routes to admin.routes.ts**

Add imports at the top of `backend/src/routes/admin.routes.ts`:

```typescript
import { requireFeature } from '../middleware/featureGate';
import { generateReports, getMyLatestReport } from '../controllers/report.controller';
```

Add routes at the bottom (before `export default router`):

```typescript
// Report generation (admin only, requires ai_insights feature)
router.post(
  '/admin/generate-reports',
  authenticate,
  requireAdmin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  requireFeature('ai_insights'),
  generateReports
);

// User's latest report (authenticated, requires ai_insights feature)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get(
  '/reports/latest',
  authenticate,
  readLimiter as any,
  requireFeature('ai_insights'),
  getMyLatestReport
);
```

**Step 3: Commit**

```bash
git add backend/src/controllers/report.controller.ts backend/src/routes/admin.routes.ts
git commit -m "feat: add report generation and retrieval endpoints"
```

---

## Task 9: Backend — Test Helpers Update & Feature Flag Tests

**Files:**

- Modify: `backend/src/__tests__/helpers.ts`
- Create: `backend/src/__tests__/api/admin.test.ts`

**Step 1: Add admin routes to test app**

In `backend/src/__tests__/helpers.ts`, add the import:

```typescript
import featureRoutes from '../routes/admin.routes';
```

And mount it in `createTestApp()` (after the last `app.use` route line):

```typescript
app.use('/api/', featureRoutes);
```

**Step 2: Create admin tests**

```typescript
import request from 'supertest';
import { createTestApp, uniqueEmail } from '../helpers';
import prisma from '../../config/database';

const app = createTestApp();

describe('Admin API', () => {
  let adminToken: string;
  let adminUserId: string;
  let userToken: string;

  beforeAll(async () => {
    // Create admin user
    const adminEmail = uniqueEmail();
    const res = await request(app).post('/api/auth/register').send({
      email: adminEmail,
      password: 'TestPass123!',
      name: 'Admin User',
    });
    if (res.status === 500) return;
    adminToken = res.body.data?.token;
    adminUserId = res.body.data?.user?.id;

    if (adminUserId) {
      await prisma.user.update({
        where: { id: adminUserId },
        data: { isAdmin: true },
      });
    }

    // Create regular user
    const userRes = await request(app).post('/api/auth/register').send({
      email: uniqueEmail(),
      password: 'TestPass123!',
      name: 'Regular User',
    });
    userToken = userRes.body.data?.token;
  });

  afterAll(async () => {
    await prisma.featureFlag.deleteMany({}).catch(() => {});
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-' } } }).catch(() => {});
  });

  describe('GET /api/admin/features', () => {
    it('should return feature flags for admin', async () => {
      if (!adminToken) return;
      const res = await request(app)
        .get('/api/admin/features')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('flags');
      expect(Array.isArray(res.body.data.flags)).toBe(true);
    });

    it('should reject non-admin user', async () => {
      if (!userToken) return;
      const res = await request(app)
        .get('/api/admin/features')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/admin/features');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/admin/features/:key', () => {
    beforeAll(async () => {
      // Ensure a flag exists
      await prisma.featureFlag.upsert({
        where: { key: 'test_flag' },
        create: { key: 'test_flag', name: 'Test Flag', enabled: false },
        update: {},
      });
    });

    it('should toggle a feature flag', async () => {
      if (!adminToken) return;
      const res = await request(app)
        .patch('/api/admin/features/test_flag')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ enabled: true });

      expect(res.status).toBe(200);
      expect(res.body.data.flag.enabled).toBe(true);
    });

    it('should reject non-admin', async () => {
      if (!userToken) return;
      const res = await request(app)
        .patch('/api/admin/features/test_flag')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ enabled: false });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/features', () => {
    it('should return enabled feature keys for authenticated user', async () => {
      if (!userToken) return;
      const res = await request(app)
        .get('/api/features')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('features');
      expect(Array.isArray(res.body.data.features)).toBe(true);
    });
  });
});
```

**Step 3: Run tests**

```bash
cd /Users/bhavinvirani/Desktop/Code/personal/habit-tracker && npm run test --workspace=backend -- --testPathPattern=admin
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add backend/src/__tests__/helpers.ts backend/src/__tests__/api/admin.test.ts
git commit -m "test: add admin feature flag API tests"
```

---

## Task 10: Frontend — Feature Flag Types & API Service

**Files:**

- Modify: `frontend/src/types/index.ts` (or create types)
- Create: `frontend/src/services/features.ts`
- Create: `frontend/src/services/reports.ts`

**Step 1: Add types**

Check `frontend/src/types/index.ts` for the existing types pattern, then add:

```typescript
// Feature Flags
export interface FeatureFlag {
  key: string;
  name: string;
  description: string | null;
  category: string;
  enabled: boolean;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
}

// Weekly Report
export interface PatternInsight {
  insight: string;
  habits: string[];
  confidence: string;
}

export interface RiskInsight {
  habit: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface OptimizationInsight {
  suggestion: string;
  habits: string[];
  impact: string;
}

export interface WeeklyReport {
  id: string;
  userId: string;
  patterns: PatternInsight[];
  risks: RiskInsight[];
  optimizations: OptimizationInsight[];
  narrative: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
}
```

**Step 2: Create features API service**

`frontend/src/services/features.ts`:

```typescript
import api from './api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const featuresApi = {
  getEnabledFeatures: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<{ features: string[] }>>('/features');
    return response.data.data.features;
  },

  // Admin endpoints
  getAllFlags: async () => {
    const response =
      await api.get<ApiResponse<{ flags: import('../types').FeatureFlag[] }>>('/admin/features');
    return response.data.data.flags;
  },

  updateFlag: async (
    key: string,
    data: { enabled?: boolean; metadata?: Record<string, unknown> }
  ) => {
    const response = await api.patch<ApiResponse<{ flag: import('../types').FeatureFlag }>>(
      `/admin/features/${key}`,
      data
    );
    return response.data.data.flag;
  },
};
```

**Step 3: Create reports API service**

`frontend/src/services/reports.ts`:

```typescript
import api from './api';
import { WeeklyReport } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const reportsApi = {
  getLatest: async (): Promise<WeeklyReport | null> => {
    const response = await api.get<ApiResponse<{ report: WeeklyReport | null }>>('/reports/latest');
    return response.data.data.report;
  },

  // Admin
  generateReports: async () => {
    const response =
      await api.post<
        ApiResponse<{ usersProcessed: number; usersSkipped: number; errors: string[] }>
      >('/admin/generate-reports');
    return response.data.data;
  },
};
```

**Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/services/features.ts frontend/src/services/reports.ts
git commit -m "feat: add frontend feature flag and report API services"
```

---

## Task 11: Frontend — FeatureFlagProvider & FeatureGate Component

**Files:**

- Create: `frontend/src/contexts/FeatureFlagContext.tsx`

**Step 1: Create the context**

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { featuresApi } from '../services/features';

interface FeatureFlagContextValue {
  enabledFeatures: string[];
  isEnabled: (key: string) => boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  enabledFeatures: [],
  isEnabled: () => false,
  isLoading: true,
  refetch: async () => {},
});

export const useFeatureFlags = () => useContext(FeatureFlagContext);

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeatures = async () => {
    try {
      const features = await featuresApi.getEnabledFeatures();
      setEnabledFeatures(features);
    } catch {
      setEnabledFeatures([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeatures();
    } else {
      setEnabledFeatures([]);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const isEnabled = (key: string) => enabledFeatures.includes(key);

  return (
    <FeatureFlagContext.Provider
      value={{ enabledFeatures, isEnabled, isLoading, refetch: fetchFeatures }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const FeatureGate: React.FC<{ flag: string; children: React.ReactNode }> = ({
  flag,
  children,
}) => {
  const { isEnabled, isLoading } = useFeatureFlags();

  if (isLoading) return null;
  if (!isEnabled(flag)) return null;

  return <>{children}</>;
};
```

**Step 2: Wrap App with FeatureFlagProvider**

In `frontend/src/App.tsx`, import and wrap:

```typescript
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
```

Wrap the `<ErrorBoundary>` contents inside the `return` with `<FeatureFlagProvider>`:

```tsx
return (
  <ErrorBoundary>
    <FeatureFlagProvider>
      <Routes>{/* ... existing routes ... */}</Routes>
      {/* ... existing Toaster, VercelAnalytics, etc. ... */}
    </FeatureFlagProvider>
  </ErrorBoundary>
);
```

**Step 3: Commit**

```bash
git add frontend/src/contexts/FeatureFlagContext.tsx frontend/src/App.tsx
git commit -m "feat: add FeatureFlagProvider and FeatureGate component"
```

---

## Task 12: Frontend — Admin Page with Feature Flags Manager

**Files:**

- Create: `frontend/src/pages/Admin.tsx`
- Modify: `frontend/src/App.tsx` (add route)
- Modify: `frontend/src/components/layout/Sidebar.tsx` (add nav item)

**Step 1: Create Admin page**

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { Settings, ToggleLeft, ToggleRight, Sparkles, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { featuresApi } from '@/services/features';
import { reportsApi } from '@/services/reports';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { PageHeader } from '@/components/ui';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { FeatureFlag } from '@/types';

export default function Admin() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { refetch: refetchFeatureFlags } = useFeatureFlags();
  const [search, setSearch] = useState('');

  // Redirect non-admin users
  // Note: isAdmin comes from the user object stored in auth store
  // You may need to add isAdmin to your User type and auth response
  if (!(user as { isAdmin?: boolean })?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const { data: flags, isLoading } = useQuery({
    queryKey: ['admin-features'],
    queryFn: featuresApi.getAllFlags,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      featuresApi.updateFlag(key, { enabled }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-features'] });
      refetchFeatureFlags(); // Update the global feature flag context
      toast.success(`${variables.key} ${variables.enabled ? 'enabled' : 'disabled'}`);
    },
    onError: () => {
      toast.error('Failed to update feature flag');
    },
  });

  const generateMutation = useMutation({
    mutationFn: reportsApi.generateReports,
    onSuccess: (data) => {
      toast.success(
        `Reports generated: ${data.usersProcessed} users processed, ${data.usersSkipped} skipped`
      );
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message || 'Failed to generate reports');
    },
  });

  if (isLoading) return <DashboardSkeleton />;

  const allFlags = flags || [];
  const filtered = search
    ? allFlags.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.key.toLowerCase().includes(search.toLowerCase())
      )
    : allFlags;

  // Group by category
  const grouped = filtered.reduce(
    (acc, flag) => {
      const cat = flag.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(flag);
      return acc;
    },
    {} as Record<string, FeatureFlag[]>
  );

  const aiInsightsEnabled = allFlags.find((f) => f.key === 'ai_insights')?.enabled ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title="Admin" subtitle="Manage feature flags and system settings" />

      {/* Feature Flags Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings size={20} className="text-primary-400" />
            Feature Flags
          </h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search flags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {Object.entries(grouped).map(([category, categoryFlags]) => (
          <div key={category} className="mb-4">
            <h3 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2">
              {category} ({categoryFlags.length})
            </h3>
            <div className="space-y-2">
              {categoryFlags.map((flag) => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-700/50 hover:border-dark-600 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{flag.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
                        {flag.key}
                      </span>
                    </div>
                    {flag.description && (
                      <p className="text-xs text-dark-400 mt-0.5">{flag.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ key: flag.key, enabled: !flag.enabled })}
                    disabled={toggleMutation.isPending}
                    className="ml-4 flex-shrink-0"
                  >
                    {flag.enabled ? (
                      <ToggleRight size={28} className="text-accent-green" />
                    ) : (
                      <ToggleLeft size={28} className="text-dark-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {allFlags.length === 0 && (
          <p className="text-sm text-dark-400 text-center py-8">No feature flags registered yet.</p>
        )}
      </div>

      {/* AI Report Generation Section */}
      {aiInsightsEnabled && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-accent-purple" />
            AI Weekly Reports
          </h2>
          <p className="text-sm text-dark-300 mb-4">
            Generate AI-powered weekly insight reports for all users. This calls the Claude API for
            each user with active habits.
          </p>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-accent-purple/20 text-accent-purple border border-accent-purple/30 rounded-lg hover:bg-accent-purple/30 transition-all disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Weekly Reports
              </>
            )}
          </button>
          {generateMutation.data && (
            <div className="mt-3 p-3 rounded-lg bg-dark-800/50 border border-dark-700/50">
              <p className="text-sm text-accent-green">
                {generateMutation.data.usersProcessed} users processed,{' '}
                {generateMutation.data.usersSkipped} skipped
              </p>
              {generateMutation.data.errors.length > 0 && (
                <p className="text-sm text-accent-red mt-1">
                  {generateMutation.data.errors.length} errors
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Add route in App.tsx**

Add lazy import at top:

```typescript
const Admin = React.lazy(() => import('./pages/Admin'));
```

Add route inside the authenticated `<Route element={isAuthenticated ? <Layout /> : ...}>` block (after the help route, before the catch-all):

```tsx
<Route
  path="admin"
  element={
    <SuspensePage>
      <Admin />
    </SuspensePage>
  }
/>
```

**Step 3: Add nav item in Sidebar.tsx**

Import `Shield` icon and add admin nav item (conditionally shown for admins). Add to the imports:

```typescript
import { Shield } from 'lucide-react';
```

Add to the navItems array (at the end, before the closing `]`):

```typescript
    {
      to: '/admin',
      icon: Shield,
      label: 'Admin',
      badge: null,
      adminOnly: true,
    },
```

Note: You'll need to update the navItems type to include `adminOnly?: boolean` and filter items based on `user.isAdmin` when rendering. Add this filtering in the render:

```tsx
const { user } = useAuthStore();
// ... in the map:
{navItems
  .filter((item) => !item.adminOnly || (user as { isAdmin?: boolean })?.isAdmin)
  .map((item) => (
    // ... existing NavLink code
  ))}
```

**Step 4: Add isAdmin to User type and auth response**

Check `frontend/src/types/index.ts` for the `User` interface and add `isAdmin: boolean`. Also check the backend auth controller (`/me` endpoint and login/register responses) to ensure `isAdmin` is included in the user object returned.

If `isAdmin` is not returned from the backend, update `backend/src/controllers/auth.controller.ts` — in the user select/response to include `isAdmin`.

**Step 5: Commit**

```bash
git add frontend/src/pages/Admin.tsx frontend/src/App.tsx frontend/src/components/layout/Sidebar.tsx frontend/src/types/index.ts
git commit -m "feat: add Admin page with feature flags manager and report generation"
```

---

## Task 13: Frontend — Dashboard Weekly Insights Card

**Files:**

- Create: `frontend/src/components/dashboard/WeeklyInsightsCard.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`

**Step 1: Create the insights card**

```tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { reportsApi } from '@/services/reports';
import { formatDistanceToNow } from 'date-fns';

export default function WeeklyInsightsCard() {
  const { data: report, isLoading } = useQuery({
    queryKey: ['weekly-report'],
    queryFn: reportsApi.getLatest,
    staleTime: 10 * 60 * 1000, // 10 min
  });

  if (isLoading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 bg-dark-700/50 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-dark-700/50 rounded w-full" />
          <div className="h-3 bg-dark-700/50 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-accent-purple" />
          <h3 className="text-sm font-medium text-white">AI Insights</h3>
        </div>
        <p className="text-xs text-dark-400">No insights generated yet.</p>
      </div>
    );
  }

  const highlights: Array<{
    icon: React.ElementType;
    text: string;
    color: string;
  }> = [];

  // Add top pattern
  if (report.patterns.length > 0) {
    highlights.push({
      icon: Sparkles,
      text: report.patterns[0].insight,
      color: 'text-primary-400',
    });
  }

  // Add top risk
  if (report.risks.length > 0) {
    highlights.push({
      icon: AlertTriangle,
      text: `${report.risks[0].habit}: ${report.risks[0].message}`,
      color: 'text-amber-400',
    });
  }

  // Add top optimization
  if (report.optimizations.length > 0) {
    highlights.push({
      icon: TrendingUp,
      text: report.optimizations[0].suggestion,
      color: 'text-accent-green',
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent-purple" />
          <h3 className="text-sm font-medium text-white">AI Insights</h3>
        </div>
        <span className="text-xs text-dark-400">
          {formatDistanceToNow(new Date(report.generatedAt), { addSuffix: true })}
        </span>
      </div>

      <div className="space-y-2">
        {highlights.map((h, i) => (
          <div key={i} className="flex items-start gap-2">
            <h.icon size={14} className={`${h.color} mt-0.5 flex-shrink-0`} />
            <p className="text-xs text-dark-300 leading-relaxed">{h.text}</p>
          </div>
        ))}
      </div>

      <Link
        to="/analytics"
        className="flex items-center gap-1 mt-3 text-xs text-primary-400 hover:text-primary-300 transition-colors"
      >
        View full report
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}
```

**Step 2: Add to Dashboard**

In `frontend/src/pages/Dashboard.tsx`, import and add the card:

```typescript
import { FeatureGate } from '@/contexts/FeatureFlagContext';
import WeeklyInsightsCard from '@/components/dashboard/WeeklyInsightsCard';
```

Add after the daily progress section (find the appropriate spot in the JSX — after the stats grid or heatmap section):

```tsx
<FeatureGate flag="ai_insights">
  <WeeklyInsightsCard />
</FeatureGate>
```

**Step 3: Commit**

```bash
git add frontend/src/components/dashboard/WeeklyInsightsCard.tsx frontend/src/pages/Dashboard.tsx
git commit -m "feat: add Weekly Insights card to Dashboard"
```

---

## Task 14: Frontend — Analytics AI Insights Section

**Files:**

- Create: `frontend/src/components/analytics/AIInsightsSection.tsx`
- Modify: `frontend/src/pages/Analytics.tsx`

**Step 1: Create the full insights section**

```tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { reportsApi } from '@/services/reports';
import { format } from 'date-fns';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import clsx from 'clsx';

const severityColors = {
  low: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high: 'bg-accent-red/10 text-accent-red border-accent-red/20',
};

const impactColors = {
  high: 'text-accent-green',
  medium: 'text-primary-400',
  low: 'text-dark-300',
};

export default function AIInsightsSection() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    patterns: true,
    risks: true,
    optimizations: true,
    narrative: true,
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['weekly-report'],
    queryFn: reportsApi.getLatest,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <ChartSkeleton height="h-64" />;
  if (!report) return null;

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const periodLabel = `${format(new Date(report.periodStart), 'MMM d')} – ${format(new Date(report.periodEnd), 'MMM d, yyyy')}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-accent-purple" />
          <h2 className="text-lg font-semibold text-white">AI Weekly Insights</h2>
        </div>
        <span className="text-xs text-dark-400">Week of {periodLabel}</span>
      </div>

      {/* Patterns */}
      {report.patterns.length > 0 && (
        <div className="card overflow-hidden">
          <button
            onClick={() => toggleSection('patterns')}
            className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary-400" />
              <span className="text-sm font-medium text-white">
                Patterns Found ({report.patterns.length})
              </span>
            </div>
            {expandedSections.patterns ? (
              <ChevronUp size={16} className="text-dark-400" />
            ) : (
              <ChevronDown size={16} className="text-dark-400" />
            )}
          </button>
          {expandedSections.patterns && (
            <div className="px-4 pb-4 space-y-2">
              {report.patterns.map((pattern, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-primary-500/5 border border-primary-500/10"
                >
                  <p className="text-sm text-dark-200">{pattern.insight}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {pattern.habits.map((h) => (
                      <span
                        key={h}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400"
                      >
                        {h}
                      </span>
                    ))}
                    <span className="text-xs text-dark-500 ml-auto">{pattern.confidence}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Risks */}
      {report.risks.length > 0 && (
        <div className="card overflow-hidden">
          <button
            onClick={() => toggleSection('risks')}
            className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-white">
                Risk Alerts ({report.risks.length})
              </span>
            </div>
            {expandedSections.risks ? (
              <ChevronUp size={16} className="text-dark-400" />
            ) : (
              <ChevronDown size={16} className="text-dark-400" />
            )}
          </button>
          {expandedSections.risks && (
            <div className="px-4 pb-4 space-y-2">
              {report.risks.map((risk, i) => (
                <div
                  key={i}
                  className={clsx('p-3 rounded-lg border', severityColors[risk.severity])}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{risk.habit}</span>
                    <span
                      className={clsx(
                        'text-xs px-2 py-0.5 rounded-full',
                        severityColors[risk.severity]
                      )}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">{risk.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Optimizations */}
      {report.optimizations.length > 0 && (
        <div className="card overflow-hidden">
          <button
            onClick={() => toggleSection('optimizations')}
            className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-accent-green" />
              <span className="text-sm font-medium text-white">
                Optimization Tips ({report.optimizations.length})
              </span>
            </div>
            {expandedSections.optimizations ? (
              <ChevronUp size={16} className="text-dark-400" />
            ) : (
              <ChevronDown size={16} className="text-dark-400" />
            )}
          </button>
          {expandedSections.optimizations && (
            <div className="px-4 pb-4 space-y-2">
              {report.optimizations.map((opt, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-accent-green/5 border border-accent-green/10"
                >
                  <p className="text-sm text-dark-200">{opt.suggestion}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {opt.habits.map((h) => (
                      <span
                        key={h}
                        className="text-xs px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green"
                      >
                        {h}
                      </span>
                    ))}
                    <span
                      className={clsx(
                        'text-xs ml-auto',
                        impactColors[opt.impact as keyof typeof impactColors] || 'text-dark-400'
                      )}
                    >
                      {opt.impact} impact
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Narrative */}
      <div className="card overflow-hidden">
        <button
          onClick={() => toggleSection('narrative')}
          className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-accent-purple" />
            <span className="text-sm font-medium text-white">Weekly Summary</span>
          </div>
          {expandedSections.narrative ? (
            <ChevronUp size={16} className="text-dark-400" />
          ) : (
            <ChevronDown size={16} className="text-dark-400" />
          )}
        </button>
        {expandedSections.narrative && (
          <div className="px-4 pb-4">
            <p className="text-sm text-dark-200 leading-relaxed">{report.narrative}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Add to Analytics page**

In `frontend/src/pages/Analytics.tsx`, import and add:

```typescript
import { FeatureGate } from '@/contexts/FeatureFlagContext';
import AIInsightsSection from '@/components/analytics/AIInsightsSection';
```

Add at the top of the page content (after the header, before existing sections):

```tsx
<FeatureGate flag="ai_insights">
  <AIInsightsSection />
</FeatureGate>
```

**Step 3: Commit**

```bash
git add frontend/src/components/analytics/AIInsightsSection.tsx frontend/src/pages/Analytics.tsx
git commit -m "feat: add AI Insights section to Analytics page"
```

---

## Task 15: Backend — Ensure isAdmin in Auth Responses

**Files:**

- Modify: `backend/src/controllers/auth.controller.ts` (or wherever login/register/me responses are built)

**Step 1: Check and update auth responses**

Find where user data is returned in the auth controller (login, register, /me endpoints). Ensure `isAdmin` is included in the user object. Look for `select` or response building patterns and add `isAdmin: true` to the select clause, or ensure it's not excluded if the whole user object is returned.

For example, if there's a select like:

```typescript
select: { id: true, email: true, name: true, timezone: true, createdAt: true }
```

Add `isAdmin: true` to it.

**Step 2: Commit**

```bash
git add backend/src/controllers/auth.controller.ts
git commit -m "feat: include isAdmin in auth response user object"
```

---

## Task 16: Integration — Wire Everything & Manual Test

**Step 1: Set yourself as admin in the database**

```bash
cd /Users/bhavinvirani/Desktop/Code/personal/habit-tracker && npx prisma studio --schema=backend/prisma/schema.prisma
```

In Prisma Studio, find your user and set `isAdmin: true`.

**Step 2: Start dev server and test the flow**

```bash
make up
```

Test checklist:

1. Login → verify sidebar shows "Admin" link (only if isAdmin)
2. Navigate to `/admin` → see feature flags list with `ai_insights` flag
3. Toggle `ai_insights` on → verify toast shows success
4. Navigate to Dashboard → verify "AI Insights" card appears (empty state: "No insights generated yet")
5. Navigate to Analytics → verify no AI section (since no report generated)
6. Go back to Admin → click "Generate Weekly Reports"
7. After generation → Dashboard shows insights card with highlights
8. Analytics → full AI insights section with collapsible cards

**Step 3: Final commit with any fixes**

```bash
git add -A
git commit -m "feat: complete AI Weekly Insights Engine integration"
```

---

## Summary of All Files

### New Backend Files

| File                                              | Purpose                                   |
| ------------------------------------------------- | ----------------------------------------- |
| `backend/src/services/featureFlag.service.ts`     | Feature flag service with in-memory cache |
| `backend/src/services/ai.service.ts`              | Claude API client and prompt              |
| `backend/src/services/reportGenerator.service.ts` | Report generation orchestrator            |
| `backend/src/middleware/featureGate.ts`           | requireFeature middleware                 |
| `backend/src/middleware/adminAuth.ts`             | requireAdmin middleware                   |
| `backend/src/validators/admin.validator.ts`       | Zod schemas for admin endpoints           |
| `backend/src/controllers/admin.controller.ts`     | Feature flag CRUD controller              |
| `backend/src/controllers/report.controller.ts`    | Report generation + retrieval             |
| `backend/src/routes/admin.routes.ts`              | All admin + feature + report routes       |
| `backend/src/__tests__/api/admin.test.ts`         | Admin API tests                           |

### New Frontend Files

| File                                                       | Purpose                       |
| ---------------------------------------------------------- | ----------------------------- |
| `frontend/src/services/features.ts`                        | Feature flag API calls        |
| `frontend/src/services/reports.ts`                         | Report API calls              |
| `frontend/src/contexts/FeatureFlagContext.tsx`             | Provider + hook + FeatureGate |
| `frontend/src/pages/Admin.tsx`                             | Admin dashboard page          |
| `frontend/src/components/dashboard/WeeklyInsightsCard.tsx` | Dashboard summary card        |
| `frontend/src/components/analytics/AIInsightsSection.tsx`  | Full report on Analytics      |

### Modified Files

| File                                         | Change                                 |
| -------------------------------------------- | -------------------------------------- |
| `backend/prisma/schema.prisma`               | Add FeatureFlag, WeeklyReport, isAdmin |
| `backend/src/server.ts`                      | Mount routes, register feature flags   |
| `backend/src/__tests__/helpers.ts`           | Add admin routes to test app           |
| `backend/.env.example`                       | Add ANTHROPIC_API_KEY                  |
| `frontend/src/App.tsx`                       | Add FeatureFlagProvider, Admin route   |
| `frontend/src/components/layout/Sidebar.tsx` | Add Admin nav item                     |
| `frontend/src/pages/Dashboard.tsx`           | Add WeeklyInsightsCard                 |
| `frontend/src/pages/Analytics.tsx`           | Add AIInsightsSection                  |
| `frontend/src/types/index.ts`                | Add FeatureFlag, WeeklyReport types    |
| `backend/src/controllers/auth.controller.ts` | Include isAdmin in responses           |
