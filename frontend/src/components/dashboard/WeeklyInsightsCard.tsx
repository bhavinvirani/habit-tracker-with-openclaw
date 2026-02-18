import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { reportsApi } from '../../services/reports';

const WeeklyInsightsCard: React.FC = () => {
  const {
    data: report,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['weekly-report'],
    queryFn: reportsApi.getLatest,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-dark-700 animate-pulse" />
          <div className="h-4 w-32 rounded bg-dark-700 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-dark-700 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-full rounded bg-dark-700 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-dark-700 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-medium text-white">AI Weekly Insights</h3>
        </div>
        <p className="text-sm text-dark-400">
          No insights available yet. Keep tracking your habits and check back after your first
          weekly report is generated.
        </p>
      </div>
    );
  }

  const topPattern = report.patterns[0] ?? null;
  const topRisk = report.risks[0] ?? null;
  const topOptimization = report.optimizations[0] ?? null;

  const hasHighlights = topPattern || topRisk || topOptimization;

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-medium text-white">AI Weekly Insights</h3>
        </div>
        <span className="text-xs text-dark-400">
          {formatDistanceToNow(new Date(report.generatedAt), { addSuffix: true })}
        </span>
      </div>

      {/* Highlights */}
      {hasHighlights ? (
        <div className="space-y-3">
          {topPattern && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-400/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-dark-300 uppercase tracking-wider mb-0.5">
                  Pattern
                </p>
                <p className="text-sm text-white leading-snug">{topPattern.insight}</p>
              </div>
            </div>
          )}

          {topRisk && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-dark-300 uppercase tracking-wider mb-0.5">
                  Risk
                </p>
                <p className="text-sm text-white leading-snug">{topRisk.message}</p>
              </div>
            </div>
          )}

          {topOptimization && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-accent-green" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-dark-300 uppercase tracking-wider mb-0.5">
                  Optimization
                </p>
                <p className="text-sm text-white leading-snug">{topOptimization.suggestion}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-dark-400">
          Your report has been generated but no specific highlights were found this week.
        </p>
      )}

      {/* Footer link */}
      <div className="mt-4 pt-3 border-t border-dark-700">
        <Link
          to="/analytics"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          View full report
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default WeeklyInsightsCard;
