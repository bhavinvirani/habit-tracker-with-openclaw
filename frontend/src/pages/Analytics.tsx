import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  TrendingUp,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Link2,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from 'recharts';
import { format, subWeeks, addWeeks, getDay, startOfYear, eachDayOfInterval } from 'date-fns';
import { analyticsApi } from '../services/habits';
import clsx from 'clsx';
import { WeeklyDay, StreakInfo, ChartTooltipProps } from '../types';
import {
  PageHeader,
  AnalyticsSkeleton,
  CircularProgress,
  TrendIndicator,
  Badge,
} from '../components/ui';
import { ChartSkeleton } from '../components/ui/Skeleton';

// ── Heatmap helpers ───────────────────────────────────────────────

const HEATMAP_COLORS: Record<number, string> = {
  0: '#1e293b',
  1: '#1e3a5f',
  2: '#1a5fb4',
  3: '#2a8ff7',
  4: '#52c2ff',
};

interface HeatmapCell {
  date: string;
  count: number;
  level: number;
  empty?: boolean;
}

function buildHeatmapGrid(
  data: Array<{ date: string; count: number; total: number; level: number }> | undefined,
  year: number
): HeatmapCell[][] {
  if (!data || data.length === 0) return [];

  const lookup = new Map(data.map((d) => [d.date, d]));
  const jan1 = startOfYear(new Date(year, 0, 1));
  const dec31 = new Date(year, 11, 31);
  const today = new Date();
  const endDate = dec31 > today ? today : dec31;
  const allDays = eachDayOfInterval({ start: jan1, end: endDate });

  // Pad start so the first column aligns (week starts on Sunday)
  const startDow = getDay(jan1); // 0=Sun
  const padded: HeatmapCell[] = Array.from({ length: startDow }, () => ({
    date: '',
    count: 0,
    level: 0,
    empty: true,
  }));

  for (const day of allDays) {
    const key = format(day, 'yyyy-MM-dd');
    const entry = lookup.get(key);
    padded.push({ date: key, count: entry?.count ?? 0, level: entry?.level ?? 0 });
  }

  // Group into columns of 7 (weeks)
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

// ── Grade color mapping ───────────────────────────────────────────

const GRADE_COLORS: Record<string, [string, string]> = {
  A: ['#10b981', '#34d399'],
  B: ['#2aa3ff', '#52c2ff'],
  C: ['#f59e0b', '#fbbf24'],
  D: ['#f97316', '#fb923c'],
  F: ['#ef4444', '#f87171'],
};

// ── Component ─────────────────────────────────────────────────────

const Analytics: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const weekDate =
    weekOffset === 0
      ? undefined
      : format(
          weekOffset > 0
            ? addWeeks(new Date(), weekOffset)
            : subWeeks(new Date(), Math.abs(weekOffset)),
          'yyyy-MM-dd'
        );

  // ── Existing queries ──────────────────────────────────────────
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['overview'],
    queryFn: analyticsApi.getOverview,
  });

  const { data: weekly, isLoading: loadingWeekly } = useQuery({
    queryKey: ['weekly', weekDate],
    queryFn: () => analyticsApi.getWeekly(weekDate ? { startDate: weekDate } : undefined),
  });

  const { data: streaks, isLoading: loadingStreaks } = useQuery({
    queryKey: ['streaks'],
    queryFn: analyticsApi.getStreaks,
  });

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: analyticsApi.getInsights,
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: analyticsApi.getCategoryBreakdown,
  });

  const { data: comparison, isLoading: loadingComparison } = useQuery({
    queryKey: ['comparison'],
    queryFn: analyticsApi.getWeekComparison,
  });

  const { data: trend, isLoading: loadingTrend } = useQuery({
    queryKey: ['trend'],
    queryFn: analyticsApi.getMonthlyTrend,
  });

  // ── New queries (longer staleTime — data changes slowly) ─────
  const HEAVY_STALE = 10 * 60 * 1000; // 10 minutes

  const { data: productivity, isLoading: loadingProductivity } = useQuery({
    queryKey: ['analytics', 'productivity'],
    queryFn: analyticsApi.getProductivityScore,
    staleTime: HEAVY_STALE,
  });

  const { data: performance, isLoading: loadingPerformance } = useQuery({
    queryKey: ['analytics', 'performance'],
    queryFn: analyticsApi.getBestPerforming,
    staleTime: HEAVY_STALE,
  });

  const { data: correlations, isLoading: loadingCorrelations } = useQuery({
    queryKey: ['analytics', 'correlations'],
    queryFn: analyticsApi.getCorrelations,
    staleTime: HEAVY_STALE,
  });

  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ['analytics', 'predictions'],
    queryFn: analyticsApi.getPredictions,
    staleTime: HEAVY_STALE,
  });

  const { data: heatmap, isLoading: loadingHeatmap } = useQuery({
    queryKey: ['analytics', 'heatmap', heatmapYear],
    queryFn: () => analyticsApi.getHeatmap(heatmapYear),
    staleTime: HEAVY_STALE,
  });

  // ── Full-page skeleton only when nothing has loaded yet ───────
  const allLoading =
    loadingOverview &&
    loadingWeekly &&
    loadingStreaks &&
    loadingInsights &&
    loadingCategories &&
    loadingComparison &&
    loadingTrend &&
    loadingProductivity &&
    loadingPerformance &&
    loadingCorrelations &&
    loadingPredictions &&
    loadingHeatmap;

  if (allLoading) {
    return <AnalyticsSkeleton />;
  }

  // ── Prepare chart data ────────────────────────────────────────
  const weeklyChartData =
    weekly?.days?.map((day: WeeklyDay) => ({
      name: format(new Date(day.date), 'EEE'),
      completed: day.completed,
      total: day.total,
      percentage: day.percentage,
    })) || [];

  const categoryChartData =
    categories?.categories?.map((cat) => ({
      name: cat.name,
      value: cat.completionRate,
      color: cat.color,
      habitCount: cat.habitCount,
    })) || [];

  const trendChartData =
    trend?.days?.map((day) => ({
      date: format(new Date(day.date), 'MMM d'),
      rate: day.rate,
      completed: day.completed,
    })) || [];

  // ── Tooltips ──────────────────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-primary-400 text-sm">
            {payload[0].value} of {payload[0].payload.total} completed
          </p>
          <p className="text-dark-400 text-xs">{payload[0].payload.percentage}% success rate</p>
        </div>
      );
    }
    return null;
  };

  const TrendTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-primary-400 text-sm">{payload[0].value}% completion</p>
        </div>
      );
    }
    return null;
  };

  const DayOfWeekTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-primary-400 text-sm">{payload[0].value}% completion rate</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Track your progress and insights" />

      {/* ── 1. Productivity Score + Week Comparison ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Productivity Score */}
        <div className="lg:col-span-3">
          {loadingProductivity ? (
            <ChartSkeleton />
          ) : productivity ? (
            <ProductivityScoreCard productivity={productivity} />
          ) : null}
        </div>

        {/* Week Comparison */}
        <div className="lg:col-span-2">
          {loadingComparison ? (
            <div className="card h-full flex flex-col justify-center p-4 min-h-[120px]">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-dark-700/50 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-dark-700/50 rounded-md animate-pulse" />
                  <div className="h-3 w-24 bg-dark-700/50 rounded-md animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-20 bg-dark-700/50 rounded-md animate-pulse" />
            </div>
          ) : comparison ? (
            <div
              className={clsx(
                'p-4 rounded-xl border flex flex-col justify-center h-full',
                comparison.trend === 'up'
                  ? 'bg-accent-green/10 border-accent-green/20'
                  : comparison.trend === 'down'
                    ? 'bg-accent-red/10 border-accent-red/20'
                    : 'bg-dark-800 border-dark-700'
              )}
            >
              <div className="flex items-center gap-4">
                {comparison.trend === 'up' ? (
                  <div className="w-10 h-10 rounded-full bg-accent-green/20 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-5 h-5 text-accent-green" />
                  </div>
                ) : comparison.trend === 'down' ? (
                  <div className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center shrink-0">
                    <ArrowDownRight className="w-5 h-5 text-accent-red" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center shrink-0">
                    <Minus className="w-5 h-5 text-dark-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm">
                    {comparison.trend === 'up'
                      ? "You're doing better this week!"
                      : comparison.trend === 'down'
                        ? 'Room for improvement'
                        : 'Staying consistent!'}
                  </p>
                  <p className="text-xs text-dark-400">
                    {comparison.thisWeek.rate}% this week vs {comparison.lastWeek.rate}% last
                  </p>
                </div>
              </div>
              <div
                className={clsx(
                  'text-3xl font-bold mt-3',
                  comparison.trend === 'up'
                    ? 'text-accent-green'
                    : comparison.trend === 'down'
                      ? 'text-accent-red'
                      : 'text-dark-400'
                )}
              >
                {comparison.change > 0 ? '+' : ''}
                {comparison.change}%
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── 2. Overview Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Current Streak</span>
            <Flame className="w-5 h-5 text-accent-orange" />
          </div>
          <p className="stat-value text-accent-orange">{overview?.currentBestStreak || 0}</p>
          <p className="text-sm text-dark-500">days in a row</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Best Streak</span>
            <TrendingUp className="w-5 h-5 text-accent-green" />
          </div>
          <p className="stat-value text-accent-green">{overview?.longestEverStreak || 0}</p>
          <p className="text-sm text-dark-500">personal record</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Avg Completion</span>
            <Target className="w-5 h-5 text-primary-400" />
          </div>
          <p className="stat-value text-primary-400">{overview?.monthlyCompletionRate || 0}%</p>
          <p className="text-sm text-dark-500">last 30 days</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Active Habits</span>
            <Calendar className="w-5 h-5 text-accent-purple" />
          </div>
          <p className="stat-value text-accent-purple">{overview?.activeHabits || 0}</p>
          <p className="text-sm text-dark-500">being tracked</p>
        </div>
      </div>

      {/* ── 3. Activity Heatmap ── */}
      {loadingHeatmap ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="animate-pulse bg-dark-700/50 h-5 w-36 rounded-md" />
          </div>
          <div className="animate-pulse bg-dark-700/50 h-24 w-full rounded-md" />
        </div>
      ) : (
        <ActivityHeatmap data={heatmap?.heatmap} year={heatmapYear} onYearChange={setHeatmapYear} />
      )}

      {/* ── 4. 30-Day Trend ── */}
      {loadingTrend ? (
        <ChartSkeleton />
      ) : (
        trend &&
        trendChartData.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">30-Day Trend</h2>
                <p className="text-sm text-dark-400">Daily completion rate over the past month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-400">{trend.averageRate}%</p>
                <p className="text-xs text-dark-500">average</p>
              </div>
            </div>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2aa3ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2aa3ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={6}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#2aa3ff"
                    strokeWidth={2}
                    fill="url(#trendGradient)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      )}

      {/* ── 5. Weekly Progress + Day-of-Week Performance ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Weekly Progress</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors text-dark-300 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-dark-400 min-w-[100px] text-center">
                {weekly?.days && weekly.days.length > 0
                  ? `${format(new Date(weekly.days[0].date), 'MMM d')} - ${format(new Date(weekly.days[weekly.days.length - 1].date), 'MMM d')}`
                  : 'This Week'}
              </span>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                disabled={weekOffset >= 0}
                className={clsx(
                  'p-1.5 rounded-lg transition-colors',
                  weekOffset >= 0
                    ? 'text-dark-600 cursor-not-allowed'
                    : 'hover:bg-dark-700 text-dark-300 hover:text-white'
                )}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="h-48 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed" radius={[4, 4, 0, 0]} animationDuration={800}>
                  {weeklyChartData.map((entry: { percentage: number }, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.percentage >= 80
                          ? '#10b981'
                          : entry.percentage >= 50
                            ? '#2aa3ff'
                            : '#64748b'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {weekly?.summary && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-dark-700">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{weekly.summary.completed}</p>
                <p className="text-xs text-dark-400">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary-400">{weekly.summary.rate}%</p>
                <p className="text-xs text-dark-400">Success</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-dark-300">{weekly.summary.total}</p>
                <p className="text-xs text-dark-400">Expected</p>
              </div>
            </div>
          )}
        </div>

        {/* Day-of-Week Performance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Day-of-Week Performance</h2>
          {loadingPerformance ? (
            <div className="h-48 sm:h-52 flex items-center justify-center">
              <div className="animate-pulse text-dark-500 text-sm">Loading...</div>
            </div>
          ) : performance?.byDayOfWeek ? (
            <>
              <div className="h-48 sm:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performance.byDayOfWeek}>
                    <XAxis
                      dataKey="day"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(day: string) => day.slice(0, 3)}
                    />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} hide />
                    <Tooltip content={<DayOfWeekTooltip />} />
                    <Bar dataKey="completionRate" radius={[4, 4, 0, 0]} animationDuration={800}>
                      {performance.byDayOfWeek.map((entry, index) => (
                        <Cell
                          key={`dow-${index}`}
                          fill={
                            entry.completionRate >= 80
                              ? '#10b981'
                              : entry.completionRate >= 50
                                ? '#2aa3ff'
                                : '#64748b'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-dark-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-green/20 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-4 h-4 text-accent-green" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {performance.bestDayOfWeek.day}
                    </p>
                    <p className="text-xs text-dark-400">
                      {performance.bestDayOfWeek.completionRate}% avg
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-red/20 flex items-center justify-center shrink-0">
                    <ArrowDownRight className="w-4 h-4 text-accent-red" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {performance.worstDayOfWeek.day}
                    </p>
                    <p className="text-xs text-dark-400">
                      {performance.worstDayOfWeek.completionRate}% avg
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-dark-400 text-center py-8">Not enough data yet</p>
          )}
        </div>
      </div>

      {/* ── 6. Category Breakdown + Habit Performance ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">By Category</h2>
          {categoryChartData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
                {categoryChartData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm text-dark-300 flex-1 truncate">{cat.name}</span>
                    <span className="text-sm font-medium text-white">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-dark-400 text-center py-8">No category data yet</p>
          )}
        </div>

        {/* Habit Performance */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Habit Performance (30 days)</h2>
          </div>
          {categories?.habitRates && categories.habitRates.length > 0 ? (
            <div className="space-y-3">
              {categories.habitRates.slice(0, 8).map((habit) => (
                <div key={habit.id} className="flex items-center gap-3">
                  <span className="text-lg">{habit.icon || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white truncate">{habit.name}</span>
                      <span className="text-sm font-medium text-dark-300">
                        {habit.completionRate}%
                      </span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${habit.completionRate}%`,
                          backgroundColor:
                            habit.completionRate >= 80
                              ? '#10b981'
                              : habit.completionRate >= 50
                                ? '#2aa3ff'
                                : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                  {habit.currentStreak > 0 && (
                    <div className="flex items-center gap-1 text-accent-orange text-xs">
                      <Flame size={12} />
                      <span>{habit.currentStreak}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-400 text-center py-8">No habit data yet</p>
          )}
        </div>
      </div>

      {/* ── 7. Habit Correlations ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-5 h-5 text-accent-purple" />
          <h2 className="text-lg font-semibold text-white">Habit Correlations</h2>
        </div>
        <p className="text-sm text-dark-400 mb-4">
          Habits that tend to be completed together (last 30 days)
        </p>
        {loadingCorrelations ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-dark-800"
              >
                <div className="h-3 flex-1 bg-dark-700/50 rounded-md" />
                <div className="h-4 w-16 bg-dark-700/50 rounded-md" />
                <div className="h-3 flex-1 bg-dark-700/50 rounded-md" />
              </div>
            ))}
          </div>
        ) : correlations && correlations.length > 0 ? (
          <div className="space-y-3">
            {correlations.slice(0, 6).map((corr, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-dark-800">
                <span className="text-sm text-white font-medium truncate flex-1 text-right min-w-0">
                  {corr.habit1.name}
                </span>
                <div className="flex flex-col items-center min-w-[80px] shrink-0">
                  <div className="flex items-center gap-1">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${Math.abs(corr.correlation) * 40}px`,
                        backgroundColor: corr.correlation > 0 ? '#10b981' : '#ef4444',
                      }}
                    />
                    <span
                      className={clsx(
                        'text-xs font-bold',
                        corr.correlation > 0 ? 'text-accent-green' : 'text-accent-red'
                      )}
                    >
                      {corr.correlation > 0 ? '+' : ''}
                      {corr.correlation.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] text-dark-500 mt-0.5 text-center leading-tight">
                    {corr.interpretation}
                  </span>
                </div>
                <span className="text-sm text-white font-medium truncate flex-1 min-w-0">
                  {corr.habit2.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dark-400 text-center py-8">Track more habits to see correlations!</p>
        )}
      </div>

      {/* ── 8. Streak Leaders + Streak Predictions ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Streaks */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Streak Leaders</h2>
          {streaks?.streaks && streaks.streaks.length > 0 ? (
            <div className="space-y-2">
              {streaks.streaks.slice(0, 5).map((habit: StreakInfo, index: number) => (
                <div
                  key={habit.habitId}
                  className="flex items-center gap-3 p-2 rounded-lg bg-dark-800"
                >
                  <span
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0
                        ? 'bg-accent-yellow/20 text-accent-yellow'
                        : index === 1
                          ? 'bg-dark-500/20 text-dark-300'
                          : index === 2
                            ? 'bg-accent-orange/20 text-accent-orange'
                            : 'bg-dark-700 text-dark-400'
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{habit.habitName}</p>
                    <p className="text-xs text-dark-400">Best: {habit.longestStreak}d</p>
                  </div>
                  <div className="flex items-center gap-1 text-accent-orange">
                    <Flame size={14} />
                    <span className="font-bold text-sm">{habit.currentStreak}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-400 text-center py-8">No streak data yet</p>
          )}
        </div>

        {/* Streak Predictions */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-accent-yellow" />
            <h2 className="text-lg font-semibold text-white">Milestone Predictions</h2>
          </div>
          {loadingPredictions ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse p-3 rounded-lg bg-dark-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-28 bg-dark-700/50 rounded-md" />
                    <div className="h-5 w-16 bg-dark-700/50 rounded-full" />
                  </div>
                  <div className="h-1.5 w-full bg-dark-700/50 rounded-full" />
                </div>
              ))}
            </div>
          ) : predictions && predictions.length > 0 ? (
            <div className="space-y-3">
              {predictions.slice(0, 5).map((pred) => (
                <div key={pred.habitId} className="p-3 rounded-lg bg-dark-800">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-white truncate min-w-0 flex-1">
                      {pred.habitName}
                    </span>
                    <Badge
                      variant={
                        pred.riskLevel === 'low'
                          ? 'success'
                          : pred.riskLevel === 'medium'
                            ? 'warning'
                            : 'danger'
                      }
                      size="sm"
                    >
                      {pred.riskLevel} risk
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-dark-400 flex items-center gap-1">
                          <Flame size={10} className="text-accent-orange" />
                          {pred.currentStreak}d streak
                        </span>
                        <span className="text-dark-400">Goal: {pred.nextMilestone}d</span>
                      </div>
                      <div className="h-1.5 bg-dark-700 rounded-full">
                        <div
                          className="h-full rounded-full bg-accent-orange transition-all"
                          style={{
                            width: `${Math.min(100, (pred.currentStreak / pred.nextMilestone) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right min-w-[50px]">
                      <p className="text-lg font-bold text-white">
                        {pred.predictedDaysToMilestone}
                      </p>
                      <p className="text-[10px] text-dark-500">days left</p>
                    </div>
                  </div>
                  {pred.riskReason && (
                    <p className="text-xs text-dark-500 mt-1.5 flex items-center gap-1">
                      <AlertTriangle size={10} className="text-accent-yellow shrink-0" />
                      {pred.riskReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-400 text-center py-8">
              Start building streaks to see predictions!
            </p>
          )}
        </div>
      </div>

      {/* ── 9. Insights ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-accent-yellow" />
          <h2 className="text-lg font-semibold text-white">Insights</h2>
        </div>

        {(insights?.bestDay || insights?.topHabit) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {insights?.bestDay && (
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent-green/20 to-accent-green/5 border border-accent-green/20">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm">🎯</span>
                  <span className="text-xs text-accent-green font-medium">Best Day</span>
                </div>
                <p className="text-lg font-bold text-white">{insights.bestDay.day}</p>
                <p className="text-xs text-dark-400">{insights.bestDay.percentage}%</p>
              </div>
            )}
            {insights?.topHabit && (
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent-orange/20 to-accent-orange/5 border border-accent-orange/20">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs text-accent-orange font-medium">Top Streak</span>
                </div>
                <p className="text-lg font-bold text-white">{insights.topHabit.streak}d</p>
                <p className="text-xs text-dark-400 truncate">{insights.topHabit.name}</p>
              </div>
            )}
          </div>
        )}

        {insights?.suggestions && insights.suggestions?.length > 0 ? (
          <div className="space-y-2">
            {insights.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
              <div
                key={index}
                className="p-2 rounded-lg bg-dark-800/50 border border-dark-700/50 flex items-start gap-2"
              >
                <span className="text-primary-400 text-sm">💡</span>
                <p className="text-xs text-dark-300 leading-relaxed">{suggestion}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-dark-400 text-xs">Keep tracking to get insights!</p>
          </div>
        )}

        {insights?.needsAttention && insights.needsAttention.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dark-700">
            <p className="text-xs text-dark-500 uppercase tracking-wide font-medium mb-2">
              Needs Attention
            </p>
            <div className="space-y-1">
              {insights.needsAttention
                .slice(0, 2)
                .map((item: { name: string; missedDays: number }, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-1.5 rounded bg-accent-red/10 border border-accent-red/20"
                  >
                    <span className="text-xs text-dark-300 truncate">{item.name}</span>
                    <span className="text-xs text-accent-red">{item.missedDays}d</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Extracted sub-components ──────────────────────────────────────

interface ProductivityScoreCardProps {
  productivity: {
    score: number;
    grade: string;
    trend: 'improving' | 'stable' | 'declining';
    breakdown: { consistency: number; streaks: number; completion: number };
  };
}

const ProductivityScoreCard: React.FC<ProductivityScoreCardProps> = ({ productivity }) => {
  const gradeColors = GRADE_COLORS[productivity.grade] || GRADE_COLORS.C;
  const trendMap: Record<string, 'up' | 'down' | 'neutral'> = {
    improving: 'up',
    declining: 'down',
    stable: 'neutral',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-6">
        <CircularProgress
          percent={productivity.score}
          size={120}
          strokeWidth={8}
          gradientId="productivityGradient"
          gradientColors={gradeColors}
          showText={false}
        >
          <span className="text-3xl font-bold text-white">{productivity.score}</span>
          <span className="text-sm font-bold" style={{ color: gradeColors[0] }}>
            {productivity.grade}
          </span>
        </CircularProgress>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Productivity Score</h2>
            <TrendIndicator trend={trendMap[productivity.trend]} asBadge size="sm" />
          </div>
          <BreakdownBar
            label="Consistency"
            value={productivity.breakdown.consistency}
            max={40}
            color="#2aa3ff"
          />
          <BreakdownBar
            label="Streaks"
            value={productivity.breakdown.streaks}
            max={30}
            color="#f97316"
          />
          <BreakdownBar
            label="Completion"
            value={productivity.breakdown.completion}
            max={30}
            color="#10b981"
          />
        </div>
      </div>
    </div>
  );
};

const BreakdownBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
}> = ({ label, value, max, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-dark-400">{label}</span>
      <span className="text-white font-medium">
        {value}/{max}
      </span>
    </div>
    <div className="h-1.5 bg-dark-700 rounded-full">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

interface ActivityHeatmapProps {
  data: Array<{ date: string; count: number; total: number; level: number }> | undefined;
  year: number;
  onYearChange: (year: number) => void;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data, year, onYearChange }) => {
  const currentYear = new Date().getFullYear();
  const weeks = useMemo(() => buildHeatmapGrid(data, year), [data, year]);
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Activity</h2>
          <p className="text-sm text-dark-400">{year} overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onYearChange(year - 1)}
            className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors text-dark-300 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-white font-medium min-w-[40px] text-center">{year}</span>
          <button
            onClick={() => onYearChange(year + 1)}
            disabled={year >= currentYear}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              year >= currentYear
                ? 'text-dark-600 cursor-not-allowed'
                : 'hover:bg-dark-700 text-dark-300 hover:text-white'
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {weeks.length > 0 ? (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-[3px] min-w-fit">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="w-6 h-3.5 sm:h-4 text-[9px] text-dark-500 leading-3 text-right"
                >
                  {label}
                </div>
              ))}
            </div>
            {/* Weeks grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, di) => (
                  <div
                    key={`${wi}-${di}`}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all"
                    style={{
                      backgroundColor: cell.empty ? 'transparent' : HEATMAP_COLORS[cell.level],
                    }}
                    title={cell.empty ? '' : `${cell.date}: ${cell.count} completed`}
                  />
                ))}
                {/* Pad incomplete last week */}
                {week.length < 7 &&
                  Array.from({ length: 7 - week.length }).map((_, pi) => (
                    <div key={`pad-${pi}`} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-dark-400 text-center py-8">No activity data for {year}</p>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-dark-500">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm"
            style={{ backgroundColor: HEATMAP_COLORS[level] }}
          />
        ))}
        <span className="text-xs text-dark-500">More</span>
      </div>
    </div>
  );
};

export default Analytics;
