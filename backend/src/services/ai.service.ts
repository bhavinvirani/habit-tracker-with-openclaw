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

export interface HabitDataContext {
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

/**
 * Generate insights using local analysis of user's habit data.
 * Falls back from Claude API if unavailable or if credits are insufficient.
 */
export async function generateInsights(data: HabitDataContext): Promise<AIInsightsResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Try Claude API first
  if (apiKey) {
    try {
      return await generateInsightsFromAPI(data, apiKey);
    } catch (error) {
      logger.warn('Claude API call failed, falling back to local analysis', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Fallback: generate insights from the data locally
  return generateLocalInsights(data);
}

async function generateInsightsFromAPI(
  data: HabitDataContext,
  apiKey: string
): Promise<AIInsightsResult> {
  const client = new Anthropic({ apiKey });

  const userMessage = `Here is the user's habit data for the past 30 days:\n\n${JSON.stringify(data, null, 2)}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block: { type: string }) => block.type === 'text') as
    | { type: 'text'; text: string }
    | undefined;
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude API');
  }

  let jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonText) as AIInsightsResult;

  if (!parsed.patterns || !parsed.risks || !parsed.optimizations || !parsed.narrative) {
    throw new Error('Invalid AI response structure');
  }

  logger.info('AI insights generated via Claude API', {
    patterns: parsed.patterns.length,
    risks: parsed.risks.length,
    optimizations: parsed.optimizations.length,
  });

  return parsed;
}

function generateLocalInsights(data: HabitDataContext): AIInsightsResult {
  const patterns: PatternInsight[] = [];
  const risks: RiskInsight[] = [];
  const optimizations: OptimizationInsight[] = [];

  // Sort habits by completion rate
  const sorted = [...data.habits].sort((a, b) => b.completionRate - a.completionRate);
  const topHabits = sorted.filter((h) => h.completionRate >= 70);
  const struggling = sorted.filter((h) => h.completionRate < 40 && h.completionRate > 0);

  // Pattern: best performing habits
  if (topHabits.length >= 2) {
    patterns.push({
      insight: `${topHabits[0].name} and ${topHabits[1].name} are your most consistent habits at ${topHabits[0].completionRate}% and ${topHabits[1].completionRate}% completion respectively.`,
      habits: topHabits.slice(0, 2).map((h) => h.name),
      confidence: 'high',
    });
  } else if (topHabits.length === 1) {
    patterns.push({
      insight: `${topHabits[0].name} is your star habit with ${topHabits[0].completionRate}% completion rate and a ${topHabits[0].currentStreak}-day streak.`,
      habits: [topHabits[0].name],
      confidence: 'high',
    });
  }

  // Pattern: streak leaders
  const streakLeader = sorted.reduce(
    (best, h) => (h.currentStreak > best.currentStreak ? h : best),
    sorted[0]
  );
  if (streakLeader && streakLeader.currentStreak >= 3) {
    patterns.push({
      insight: `${streakLeader.name} leads with a ${streakLeader.currentStreak}-day streak (longest ever: ${streakLeader.longestStreak} days).`,
      habits: [streakLeader.name],
      confidence: 'high',
    });
  }

  // Pattern: day-of-week performance
  if (data.dayOfWeekPerformance.length > 0) {
    const bestDay = data.dayOfWeekPerformance.reduce((best, d) =>
      d.completionRate > best.completionRate ? d : best
    );
    const worstDay = data.dayOfWeekPerformance.reduce((worst, d) =>
      d.completionRate < worst.completionRate ? d : worst
    );
    if (bestDay.completionRate - worstDay.completionRate > 10) {
      patterns.push({
        insight: `You perform best on ${bestDay.day}s (${bestDay.completionRate.toFixed(0)}%) and struggle most on ${worstDay.day}s (${worstDay.completionRate.toFixed(0)}%).`,
        habits: [],
        confidence: 'medium',
      });
    }
  }

  // Correlations
  if (data.correlations.length > 0) {
    const strongest = data.correlations[0];
    patterns.push({
      insight: `${strongest.habit1} and ${strongest.habit2} show a ${strongest.interpretation} (correlation: ${strongest.coefficient.toFixed(2)}).`,
      habits: [strongest.habit1, strongest.habit2],
      confidence: 'medium',
    });
  }

  // Risks: declining habits
  for (const habit of struggling.slice(0, 2)) {
    risks.push({
      habit: habit.name,
      message: `${habit.name} is at ${habit.completionRate}% completion — ${habit.currentStreak === 0 ? 'the streak has broken' : `only a ${habit.currentStreak}-day streak remains`}. Consider simplifying this habit to rebuild momentum.`,
      severity: habit.completionRate < 20 ? 'high' : 'medium',
    });
  }

  // Risk: week-over-week decline
  if (data.weekOverWeek.change < -10) {
    risks.push({
      habit: 'Overall',
      message: `Your completion rate dropped ${Math.abs(data.weekOverWeek.change).toFixed(0)}% this week (${data.weekOverWeek.thisWeekRate.toFixed(0)}% vs ${data.weekOverWeek.lastWeekRate.toFixed(0)}% last week).`,
      severity: data.weekOverWeek.change < -20 ? 'high' : 'medium',
    });
  }

  // Optimizations
  if (struggling.length > 0 && topHabits.length > 0) {
    optimizations.push({
      suggestion: `Try stacking ${struggling[0].name} right after ${topHabits[0].name} — pairing a struggling habit with a strong one builds automatic triggers.`,
      habits: [struggling[0].name, topHabits[0].name],
      impact: 'high',
    });
  }

  if (data.dayOfWeekPerformance.length > 0) {
    const worstDay = data.dayOfWeekPerformance.reduce((w, d) =>
      d.completionRate < w.completionRate ? d : w
    );
    if (worstDay.completionRate < 50) {
      optimizations.push({
        suggestion: `${worstDay.day}s are your weakest day at ${worstDay.completionRate.toFixed(0)}%. Set a specific reminder or reduce your habit load on ${worstDay.day}s.`,
        habits: [],
        impact: 'medium',
      });
    }
  }

  const longestStreakHabit = sorted.reduce(
    (best, h) => (h.longestStreak > best.longestStreak ? h : best),
    sorted[0]
  );
  if (
    longestStreakHabit &&
    longestStreakHabit.currentStreak < longestStreakHabit.longestStreak * 0.5
  ) {
    optimizations.push({
      suggestion: `${longestStreakHabit.name} once had a ${longestStreakHabit.longestStreak}-day streak but is now at ${longestStreakHabit.currentStreak}. Revisit what worked during your best run.`,
      habits: [longestStreakHabit.name],
      impact: 'medium',
    });
  }

  // Narrative
  const avgRate =
    data.habits.length > 0
      ? data.habits.reduce((sum, h) => sum + h.completionRate, 0) / data.habits.length
      : 0;
  const trendWord =
    data.weekOverWeek.change > 5
      ? 'improving'
      : data.weekOverWeek.change < -5
        ? 'dipping'
        : 'holding steady';

  const narrative =
    topHabits.length > 0
      ? `You're tracking ${data.habits.length} habits with an average ${avgRate.toFixed(0)}% completion rate — ${trendWord} compared to last week. ${topHabits[0].name} continues to be your anchor habit${struggling.length > 0 ? `, while ${struggling[0].name} could use some attention` : ''}. Keep building on what's working!`
      : `You're tracking ${data.habits.length} habits with an average ${avgRate.toFixed(0)}% completion rate. Focus on building consistency with one or two key habits before expanding further.`;

  logger.info('AI insights generated via local analysis', {
    patterns: patterns.length,
    risks: risks.length,
    optimizations: optimizations.length,
  });

  return { patterns, risks, optimizations, narrative };
}

export function isAIConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
