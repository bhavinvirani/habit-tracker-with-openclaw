import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Grid3X3,
  BarChart3,
  TrendingUp,
  Target,
  Loader2,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  startOfYear,
  eachMonthOfInterval,
  getDay,
} from 'date-fns';
import { analyticsApi } from '../services/habits';
import clsx from 'clsx';
import { ViewToggle, type ViewOption } from '../components/ui';

type ViewMode = 'calendar' | 'heatmap' | 'stats';

// View mode options
const VIEW_MODE_OPTIONS: ViewOption<ViewMode>[] = [
  { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
  { id: 'heatmap', icon: Grid3X3, label: 'Heatmap' },
  { id: 'stats', icon: BarChart3, label: 'Stats' },
];

interface CalendarDay {
  date: string;
  completed: number;
  total: number;
  percentage: number;
  habits: Array<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    completed: boolean;
    value: number | null;
  }>;
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  // Fetch calendar data (day-by-day with habits)
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn: () => analyticsApi.getCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1),
  });

  // Fetch heatmap data for the year view
  const { data: heatmapData, isLoading: loadingHeatmap } = useQuery({
    queryKey: ['heatmap', currentDate.getFullYear()],
    queryFn: () => analyticsApi.getHeatmap(currentDate.getFullYear()),
    enabled: viewMode === 'heatmap',
  });

  // Fetch weekly data for stats view
  const { data: weeklyData } = useQuery({
    queryKey: ['weekly'],
    queryFn: () => analyticsApi.getWeekly(),
    enabled: viewMode === 'stats',
  });

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">
        {viewMode === 'heatmap' ? currentDate.getFullYear() : format(currentDate, 'MMMM yyyy')}
      </h2>
      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            setCurrentDate(
              viewMode === 'heatmap'
                ? new Date(currentDate.getFullYear() - 1, 0, 1)
                : subMonths(currentDate, 1)
            )
          }
          className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-dark-300 hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-3 py-1.5 text-sm text-primary-400 hover:bg-primary-600/20 rounded-lg transition-colors"
        >
          Today
        </button>
        <button
          onClick={() =>
            setCurrentDate(
              viewMode === 'heatmap'
                ? new Date(currentDate.getFullYear() + 1, 0, 1)
                : addMonths(currentDate, 1)
            )
          }
          className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-dark-300 hover:text-white"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderViewToggle = () => (
    <ViewToggle value={viewMode} onChange={setViewMode} options={VIEW_MODE_OPTIONS} />
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center py-2 text-sm font-medium text-dark-400">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    // Create a map of date -> day data
    const dayDataMap = new Map<string, CalendarDay>();
    if (calendarData?.days) {
      calendarData.days.forEach((d: CalendarDay) => {
        dayDataMap.set(d.date, d);
      });
    }

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dateKey = format(currentDay, 'yyyy-MM-dd');
        const dayData = dayDataMap.get(dateKey);
        const percentage = dayData?.percentage || 0;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);

        const getBgColor = () => {
          if (!isCurrentMonth) return 'bg-transparent';
          if (!dayData || dayData.total === 0) return 'bg-dark-800';
          if (percentage === 0) return 'bg-dark-800';
          if (percentage < 25) return 'bg-primary-600/10';
          if (percentage < 50) return 'bg-primary-600/25';
          if (percentage < 75) return 'bg-primary-600/40';
          if (percentage < 100) return 'bg-primary-600/60';
          return 'bg-accent-green/50';
        };

        days.push(
          <div
            key={dateKey}
            onClick={() => isCurrentMonth && setSelectedDate(currentDay)}
            className={clsx(
              'aspect-square p-1 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center relative',
              getBgColor(),
              isCurrentMonth
                ? 'hover:ring-2 hover:ring-primary-500/50'
                : 'opacity-30 cursor-default',
              isSelected && 'ring-2 ring-primary-500',
              isTodayDate && !isSelected && 'ring-2 ring-accent-yellow'
            )}
          >
            <span
              className={clsx(
                'text-sm font-medium',
                isCurrentMonth ? 'text-white' : 'text-dark-600',
                isTodayDate && 'text-accent-yellow'
              )}
            >
              {format(currentDay, 'd')}
            </span>
            {isCurrentMonth && dayData && dayData.total > 0 && (
              <span className="text-xs text-dark-400 mt-0.5">
                {dayData.completed}/{dayData.total}
              </span>
            )}
            {isCurrentMonth && percentage === 100 && dayData && dayData.total > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-green rounded-full flex items-center justify-center">
                <CheckCircle2 size={8} className="text-white" />
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={format(day, 'yyyy-MM-dd')} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="space-y-1">{rows}</div>;
  };

  const renderHeatmap = () => {
    if (loadingHeatmap) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      );
    }

    const months = eachMonthOfInterval({
      start: startOfYear(currentDate),
      end: new Date(currentDate.getFullYear(), 11, 31),
    });

    const heatmapMap = new Map<string, { count: number; level: number }>();
    if (heatmapData?.heatmap) {
      heatmapData.heatmap.forEach((d) => {
        heatmapMap.set(d.date, { count: d.count, level: d.level });
      });
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-2">
          {months.map((month) => (
            <div key={format(month, 'MMM')} className="text-center">
              <p className="text-xs text-dark-400 mb-2">{format(month, 'MMM')}</p>
              <div className="space-y-0.5">
                {Array.from({ length: 31 }, (_, i) => {
                  const day = new Date(month.getFullYear(), month.getMonth(), i + 1);
                  if (day.getMonth() !== month.getMonth()) return null;
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const data = heatmapMap.get(dateKey);
                  const level = data?.level || 0;

                  return (
                    <div
                      key={i}
                      className={clsx(
                        'w-full h-2 rounded-sm',
                        level === 0 && 'bg-dark-800',
                        level === 1 && 'bg-primary-600/20',
                        level === 2 && 'bg-primary-600/40',
                        level === 3 && 'bg-primary-600/60',
                        level === 4 && 'bg-accent-green/60'
                      )}
                      title={`${dateKey}: ${data?.count || 0} completions`}
                    />
                  );
                }).filter(Boolean)}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-dark-700">
          <span className="text-xs text-dark-400">Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={clsx(
                  'w-4 h-4 rounded',
                  level === 0 && 'bg-dark-800',
                  level === 1 && 'bg-primary-600/20',
                  level === 2 && 'bg-primary-600/40',
                  level === 3 && 'bg-primary-600/60',
                  level === 4 && 'bg-accent-green/60'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-dark-400">More</span>
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const dayOfWeekStats = [
      { day: 'Sun', percentage: 0, count: 0 },
      { day: 'Mon', percentage: 0, count: 0 },
      { day: 'Tue', percentage: 0, count: 0 },
      { day: 'Wed', percentage: 0, count: 0 },
      { day: 'Thu', percentage: 0, count: 0 },
      { day: 'Fri', percentage: 0, count: 0 },
      { day: 'Sat', percentage: 0, count: 0 },
    ];

    // Calculate stats from calendar data
    if (calendarData?.days) {
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      const dayTotals = [0, 0, 0, 0, 0, 0, 0];

      calendarData.days.forEach((d: CalendarDay) => {
        const dayOfWeek = getDay(new Date(d.date));
        dayTotals[dayOfWeek] += d.total;
        dayCounts[dayOfWeek] += d.completed;
      });

      dayOfWeekStats.forEach((stat, i) => {
        stat.count = dayCounts[i];
        stat.percentage = dayTotals[i] > 0 ? Math.round((dayCounts[i] / dayTotals[i]) * 100) : 0;
      });
    }

    const bestDay = [...dayOfWeekStats].sort((a, b) => b.percentage - a.percentage)[0];
    const worstDay = [...dayOfWeekStats].sort((a, b) => a.percentage - b.percentage)[0];

    return (
      <div className="space-y-6">
        {/* Day of Week Performance */}
        <div>
          <h3 className="text-sm font-medium text-dark-400 mb-4">Completion by Day of Week</h3>
          <div className="grid grid-cols-7 gap-2">
            {dayOfWeekStats.map((stat) => (
              <div key={stat.day} className="text-center">
                <div
                  className="h-24 rounded-lg flex items-end justify-center p-2 mb-2"
                  style={{
                    background: `linear-gradient(to top, ${
                      stat.percentage >= 70
                        ? 'rgb(16 185 129 / 0.4)'
                        : stat.percentage >= 40
                          ? 'rgb(42 163 255 / 0.3)'
                          : 'rgb(71 85 105 / 0.3)'
                    } ${stat.percentage}%, transparent ${stat.percentage}%)`,
                  }}
                >
                  <span className="text-lg font-bold text-white">{stat.percentage}%</span>
                </div>
                <p className="text-xs text-dark-400">{stat.day}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-accent-green/10 border border-accent-green/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-accent-green" />
              <span className="text-sm font-medium text-accent-green">Best Day</span>
            </div>
            <p className="text-2xl font-bold text-white">{bestDay.day}</p>
            <p className="text-xs text-dark-400">{bestDay.percentage}% completion</p>
          </div>

          <div className="p-4 rounded-lg bg-accent-orange/10 border border-accent-orange/20">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-accent-orange" />
              <span className="text-sm font-medium text-accent-orange">Needs Focus</span>
            </div>
            <p className="text-2xl font-bold text-white">{worstDay.day}</p>
            <p className="text-xs text-dark-400">{worstDay.percentage}% completion</p>
          </div>
        </div>

        {/* Weekly Summary from API */}
        {weeklyData?.summary && (
          <div className="p-4 rounded-lg bg-dark-800">
            <h3 className="text-sm font-medium text-dark-400 mb-3">This Week</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{weeklyData.summary.completed}</p>
                <p className="text-xs text-dark-400">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-400">{weeklyData.summary.rate}%</p>
                <p className="text-xs text-dark-400">Success Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-green">{weeklyData.summary.total}</p>
                <p className="text-xs text-dark-400">Total Expected</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Get selected day details
  const selectedDayData =
    selectedDate && calendarData?.days
      ? calendarData.days.find((d: CalendarDay) => d.date === format(selectedDate, 'yyyy-MM-dd'))
      : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendar</h1>
          <p className="text-dark-400 mt-1">Track your habit completion over time</p>
        </div>
        {renderViewToggle()}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main View */}
        <div className="lg:col-span-2 card">
          {renderHeader()}

          {viewMode === 'calendar' && (
            <>
              {renderDays()}
              {renderCells()}

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-dark-700">
                <span className="text-xs text-dark-400">Less</span>
                <div className="flex gap-1">
                  {[
                    { level: 0, bg: 'bg-dark-700' },
                    { level: 25, bg: 'bg-primary-600/25' },
                    { level: 50, bg: 'bg-primary-600/40' },
                    { level: 75, bg: 'bg-primary-600/60' },
                    { level: 100, bg: 'bg-accent-green/50' },
                  ].map(({ level, bg }) => (
                    <div key={level} className={clsx('w-4 h-4 rounded', bg)} title={`${level}%`} />
                  ))}
                </div>
                <span className="text-xs text-dark-400">More</span>
              </div>
            </>
          )}

          {viewMode === 'heatmap' && renderHeatmap()}
          {viewMode === 'stats' && renderStats()}
        </div>

        {/* Selected Day Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a day'}
          </h3>

          {selectedDayData ? (
            <div className="space-y-4">
              {/* Completion percentage */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-dark-800">
                <span className="text-dark-300">Completion</span>
                <span
                  className={clsx(
                    'text-2xl font-bold',
                    selectedDayData.percentage === 100
                      ? 'text-accent-green'
                      : selectedDayData.percentage >= 50
                        ? 'text-primary-400'
                        : 'text-accent-orange'
                  )}
                >
                  {selectedDayData.percentage}%
                </span>
              </div>

              <div className="text-sm text-dark-400">
                {selectedDayData.completed} of {selectedDayData.total} habits completed
              </div>

              {/* Habit list */}
              {selectedDayData.habits && selectedDayData.habits.length > 0 && (
                <div className="space-y-2">
                  {selectedDayData.habits.map(
                    (habit: {
                      id: string;
                      name: string;
                      color: string;
                      icon: string | null;
                      completed: boolean;
                      value: number | null;
                    }) => (
                      <div
                        key={habit.id}
                        className={clsx(
                          'flex items-center gap-3 p-3 rounded-lg transition-colors',
                          habit.completed ? 'bg-accent-green/10' : 'bg-dark-800'
                        )}
                      >
                        {habit.completed ? (
                          <CheckCircle2 size={18} className="text-accent-green flex-shrink-0" />
                        ) : (
                          <Circle size={18} className="text-dark-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {habit.icon && <span>{habit.icon}</span>}
                            <span
                              className={clsx(
                                'text-sm truncate',
                                habit.completed ? 'text-white' : 'text-dark-400'
                              )}
                            >
                              {habit.name}
                            </span>
                          </div>
                          {habit.value !== null && (
                            <p className="text-xs text-dark-500">Value: {habit.value}</p>
                          )}
                        </div>
                        <div
                          className="w-2 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: habit.color }}
                        />
                      </div>
                    )
                  )}
                </div>
              )}

              {selectedDayData.total === 0 && (
                <p className="text-dark-500 text-sm">No habits scheduled for this day</p>
              )}
            </div>
          ) : selectedDate ? (
            <div className="text-center py-8 text-dark-500">
              <p>No data for this date</p>
            </div>
          ) : (
            <div className="text-center py-8 text-dark-500">
              <p>Click on a date to see details</p>
            </div>
          )}

          {/* Month Summary */}
          {calendarData?.summary && (
            <div className="mt-6 pt-4 border-t border-dark-700">
              <h4 className="text-sm font-medium text-dark-400 mb-3">Monthly Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-dark-800 text-center">
                  <p className="text-xl font-bold text-white">{calendarData.summary.percentage}%</p>
                  <p className="text-xs text-dark-400">Completion Rate</p>
                </div>
                <div className="p-3 rounded-lg bg-dark-800 text-center">
                  <p className="text-xl font-bold text-accent-green">
                    {calendarData.summary.totalCompleted}
                  </p>
                  <p className="text-xs text-dark-400">Total Completed</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
