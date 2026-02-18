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
