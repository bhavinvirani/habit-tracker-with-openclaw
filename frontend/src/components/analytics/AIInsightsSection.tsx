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
import { format } from 'date-fns';
import clsx from 'clsx';
import { reportsApi } from '../../services/reports';
import { ChartSkeleton } from '../ui/Skeleton';
import type { WeeklyReport, PatternInsight, RiskInsight, OptimizationInsight } from '../../types';

// ── Severity color mapping ──────────────────────────────────────────

const SEVERITY_COLORS: Record<
  'low' | 'medium' | 'high',
  { bg: string; text: string; border: string }
> = {
  low: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20',
  },
  medium: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  high: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
};

// ── Section keys ────────────────────────────────────────────────────

type SectionKey = 'patterns' | 'risks' | 'optimizations' | 'summary';

interface ExpandedSections {
  patterns: boolean;
  risks: boolean;
  optimizations: boolean;
  summary: boolean;
}

// ── Collapsible section wrapper ─────────────────────────────────────

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  accentColor,
  isExpanded,
  onToggle,
  count,
  children,
}) => (
  <div className="rounded-xl bg-dark-800/50 border border-dark-700/50 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', accentColor)}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="text-xs text-dark-400 bg-dark-700 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 text-dark-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-dark-400" />
      )}
    </button>
    {isExpanded && <div className="px-4 pb-4">{children}</div>}
  </div>
);

// ── Habit badge ─────────────────────────────────────────────────────

const HabitBadge: React.FC<{ name: string }> = ({ name }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-dark-700 text-dark-200 border border-dark-600">
    {name}
  </span>
);

// ── Main component ──────────────────────────────────────────────────

const AIInsightsSection: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    patterns: true,
    risks: true,
    optimizations: true,
    summary: true,
  });

  const { data: report, isLoading } = useQuery<WeeklyReport | null>({
    queryKey: ['weekly-report'],
    queryFn: reportsApi.getLatest,
    staleTime: 10 * 60 * 1000,
  });

  const toggleSection = (key: SectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return <ChartSkeleton height="h-64" />;
  }

  if (!report) {
    return null;
  }

  const periodStart = format(new Date(report.periodStart), 'MMM d');
  const periodEnd = format(new Date(report.periodEnd), 'MMM d, yyyy');

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400/20 to-accent-purple/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Weekly Insights</h2>
            <p className="text-xs text-dark-400">
              Week of {periodStart} - {periodEnd}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Patterns Found */}
      <CollapsibleSection
        title="Patterns Found"
        icon={<TrendingUp className="w-4 h-4 text-primary-400" />}
        accentColor="bg-primary-400/10"
        isExpanded={expandedSections.patterns}
        onToggle={() => toggleSection('patterns')}
        count={report.patterns.length}
      >
        {report.patterns.length > 0 ? (
          <div className="space-y-3">
            {report.patterns.map((pattern: PatternInsight, index: number) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-dark-800 border border-dark-700/50 space-y-2"
              >
                <p className="text-sm text-dark-200 leading-relaxed">{pattern.insight}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {pattern.habits.map((habit) => (
                      <HabitBadge key={habit} name={habit} />
                    ))}
                  </div>
                  <span className="text-xs text-dark-500 whitespace-nowrap">
                    {pattern.confidence} confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-400 text-center py-2">No patterns detected yet.</p>
        )}
      </CollapsibleSection>

      {/* 2. Risk Alerts */}
      <CollapsibleSection
        title="Risk Alerts"
        icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        accentColor="bg-amber-400/10"
        isExpanded={expandedSections.risks}
        onToggle={() => toggleSection('risks')}
        count={report.risks.length}
      >
        {report.risks.length > 0 ? (
          <div className="space-y-3">
            {report.risks.map((risk: RiskInsight, index: number) => {
              const colors = SEVERITY_COLORS[risk.severity];
              return (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-dark-800 border border-dark-700/50 flex items-start gap-3"
                >
                  <span
                    className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0',
                      colors.bg,
                      colors.text,
                      colors.border
                    )}
                  >
                    {risk.severity}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{risk.habit}</p>
                    <p className="text-xs text-dark-300 mt-0.5 leading-relaxed">{risk.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-dark-400 text-center py-2">No risk alerts this week.</p>
        )}
      </CollapsibleSection>

      {/* 3. Optimization Tips */}
      <CollapsibleSection
        title="Optimization Tips"
        icon={<TrendingUp className="w-4 h-4 text-green-400" />}
        accentColor="bg-green-400/10"
        isExpanded={expandedSections.optimizations}
        onToggle={() => toggleSection('optimizations')}
        count={report.optimizations.length}
      >
        {report.optimizations.length > 0 ? (
          <div className="space-y-3">
            {report.optimizations.map((opt: OptimizationInsight, index: number) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-dark-800 border border-dark-700/50 space-y-2"
              >
                <p className="text-sm text-dark-200 leading-relaxed">{opt.suggestion}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {opt.habits.map((habit) => (
                      <HabitBadge key={habit} name={habit} />
                    ))}
                  </div>
                  <span className="text-xs text-dark-500 whitespace-nowrap">
                    {opt.impact} impact
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-400 text-center py-2">No optimization tips this week.</p>
        )}
      </CollapsibleSection>

      {/* 4. Weekly Summary */}
      <CollapsibleSection
        title="Weekly Summary"
        icon={<BookOpen className="w-4 h-4 text-purple-400" />}
        accentColor="bg-purple-400/10"
        isExpanded={expandedSections.summary}
        onToggle={() => toggleSection('summary')}
      >
        {report.narrative ? (
          <p className="text-sm text-dark-200 leading-relaxed">{report.narrative}</p>
        ) : (
          <p className="text-sm text-dark-400 text-center py-2">No summary available.</p>
        )}
      </CollapsibleSection>
    </div>
  );
};

export default AIInsightsSection;
