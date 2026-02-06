import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  /** Render as a circle */
  circle?: boolean;
  /** Width (CSS value) */
  width?: string | number;
  /** Height (CSS value) */
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, circle, width, height }) => (
  <div
    className={clsx('animate-pulse bg-dark-700/50 rounded', circle && 'rounded-full', className)}
    style={{ width, height }}
  />
);

/** Skeleton shaped like a stat card */
export const StatCardSkeleton: React.FC = () => (
  <div className="card p-4">
    <div className="flex items-center gap-3">
      <Skeleton circle className="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>
    </div>
  </div>
);

/** Skeleton for a single habit row */
export const HabitRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-dark-800 border border-dark-700">
    <Skeleton circle className="w-12 h-12" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-40 rounded-md" />
      <Skeleton className="h-3 w-24 rounded-md" />
    </div>
    <div className="hidden sm:flex items-center gap-6">
      <Skeleton className="h-8 w-12 rounded-md" />
      <Skeleton className="h-8 w-12 rounded-md" />
      <Skeleton className="h-8 w-12 rounded-md" />
    </div>
  </div>
);

/** Skeleton for a chart area */
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-40' }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-5 w-36 rounded-md" />
      <Skeleton className="h-5 w-20 rounded-md" />
    </div>
    <div className={clsx(height, 'flex items-end gap-2 px-4')}>
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-md" height={`${30 + Math.random() * 60}%`} />
      ))}
    </div>
  </div>
);

/** Skeleton for a book card */
export const BookCardSkeleton: React.FC = () => (
  <div className="card p-4 space-y-3">
    <div className="flex gap-3">
      <Skeleton className="w-16 h-24 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
        <Skeleton className="h-2 w-full rounded-full mt-3" />
      </div>
    </div>
  </div>
);

/** Skeleton for a challenge card */
export const ChallengeCardSkeleton: React.FC = () => (
  <div className="card p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-40 rounded-md" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="h-3 w-full rounded-md" />
    <div className="flex items-center gap-4 mt-2">
      <Skeleton circle className="w-16 h-16" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-3 w-32 rounded-md" />
      </div>
    </div>
  </div>
);

/** Full-page skeleton for Dashboard */
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-4 w-56 rounded-md" />
      </div>
      <Skeleton className="h-10 w-28 rounded-lg" />
    </div>

    {/* Progress + Stats */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card flex flex-col items-center justify-center py-8">
        <Skeleton circle className="w-40 h-40" />
        <Skeleton className="h-4 w-32 rounded-md mt-4" />
        <Skeleton className="h-3 w-24 rounded-md mt-2" />
      </div>
      <div className="card p-4 space-y-4">
        <Skeleton className="h-3 w-24 rounded-md" />
        <div className="grid grid-cols-3 gap-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    </div>

    {/* Heatmap */}
    <div className="card">
      <Skeleton className="h-5 w-32 rounded-md mb-4" />
      <div className="flex gap-1.5">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex-1 space-y-1">
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="aspect-square w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>

    {/* Habits list */}
    <div className="card space-y-3">
      <Skeleton className="h-5 w-28 rounded-md" />
      <HabitRowSkeleton />
      <HabitRowSkeleton />
      <HabitRowSkeleton />
    </div>
  </div>
);

/** Full-page skeleton for Habits */
export const HabitsSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading habits">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>
      <Skeleton className="h-10 w-28 rounded-lg" />
    </div>

    {/* Quick Stats */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>

    {/* Filters */}
    <div className="card">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 flex-1 min-w-[200px] rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
    </div>

    {/* Habit list */}
    <div className="space-y-3">
      <HabitRowSkeleton />
      <HabitRowSkeleton />
      <HabitRowSkeleton />
      <HabitRowSkeleton />
      <HabitRowSkeleton />
    </div>
  </div>
);

/** Full-page skeleton for Analytics */
export const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading analytics">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-32 rounded-md" />
      <Skeleton className="h-4 w-52 rounded-md" />
    </div>

    {/* Productivity Score + Comparison */}
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 card p-6">
        <div className="flex items-center gap-6">
          <Skeleton circle className="w-32 h-32 shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </div>
      <div className="lg:col-span-2">
        <Skeleton className="h-full min-h-[120px] w-full rounded-xl" />
      </div>
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>

    {/* Heatmap */}
    <div className="card">
      <Skeleton className="h-5 w-36 rounded-md mb-4" />
      <Skeleton className="h-24 w-full rounded-md" />
    </div>

    {/* Trend chart */}
    <ChartSkeleton />

    {/* Weekly + Day-of-Week */}
    <div className="grid lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    {/* Categories + Habit Performance */}
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card">
        <Skeleton className="h-5 w-28 rounded-md mb-4" />
        <div className="flex items-center gap-6">
          <Skeleton circle className="w-32 h-32" />
          <div className="flex-1 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton circle className="w-3 h-3" />
                <Skeleton className="h-3 flex-1 rounded-md" />
                <Skeleton className="h-3 w-10 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <ChartSkeleton />
    </div>

    {/* Correlations */}
    <div className="card space-y-3">
      <Skeleton className="h-5 w-40 rounded-md" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-800">
          <Skeleton className="h-3 flex-1 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-3 flex-1 rounded-md" />
        </div>
      ))}
    </div>

    {/* Streak leaders + Predictions */}
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card space-y-2">
        <Skeleton className="h-5 w-32 rounded-md mb-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-dark-800">
            <Skeleton circle className="w-6 h-6" />
            <Skeleton className="h-3 flex-1 rounded-md" />
            <Skeleton className="h-4 w-10 rounded-md" />
          </div>
        ))}
      </div>
      <div className="card space-y-3">
        <Skeleton className="h-5 w-40 rounded-md" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg bg-dark-800 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>

    {/* Insights */}
    <div className="card space-y-3">
      <Skeleton className="h-5 w-24 rounded-md" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-16 rounded-lg" />
    </div>
  </div>
);

/** Full-page skeleton for Books */
export const BooksSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading books">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-4 w-44 rounded-md" />
      </div>
      <Skeleton className="h-10 w-28 rounded-lg" />
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>

    {/* Filters */}
    <div className="card">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 flex-1 min-w-[200px] rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
    </div>

    {/* Book grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <BookCardSkeleton />
      <BookCardSkeleton />
      <BookCardSkeleton />
      <BookCardSkeleton />
      <BookCardSkeleton />
      <BookCardSkeleton />
    </div>
  </div>
);

/** Full-page skeleton for Challenges */
export const ChallengesSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading challenges">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>

    {/* Challenge cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ChallengeCardSkeleton />
      <ChallengeCardSkeleton />
      <ChallengeCardSkeleton />
      <ChallengeCardSkeleton />
    </div>
  </div>
);

export default Skeleton;
