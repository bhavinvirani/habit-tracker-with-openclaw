import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, Circle } from 'lucide-react';
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
} from 'date-fns';
import { analyticsApi } from '../services/habits';
import clsx from 'clsx';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch monthly data
  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ['monthly', currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn: () => analyticsApi.getMonthly(currentDate.getFullYear(), currentDate.getMonth() + 1),
  });

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">{format(currentDate, 'MMMM yyyy')}</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
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
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-dark-300 hover:text-white"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
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
    const dayDataMap = new Map<string, any>();
    if (monthlyData?.days) {
      monthlyData.days.forEach((d: any) => {
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

        // Calculate background intensity based on completion
        const getBgColor = () => {
          if (!isCurrentMonth) return 'bg-transparent';
          if (percentage === 0) return 'bg-dark-800';
          if (percentage < 25) return 'bg-primary-600/10';
          if (percentage < 50) return 'bg-primary-600/25';
          if (percentage < 75) return 'bg-primary-600/40';
          if (percentage < 100) return 'bg-primary-600/60';
          return 'bg-primary-600/80';
        };

        days.push(
          <div
            key={dateKey}
            onClick={() => isCurrentMonth && setSelectedDate(currentDay)}
            className={clsx(
              'aspect-square p-1 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center',
              getBgColor(),
              isCurrentMonth ? 'hover:ring-2 hover:ring-primary-500/50' : 'opacity-30',
              isSelected && 'ring-2 ring-primary-500',
              isTodayDate && 'ring-2 ring-accent-yellow'
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
            {isCurrentMonth && dayData?.total > 0 && (
              <span className="text-xs text-dark-400 mt-0.5">
                {dayData.completed}/{dayData.total}
              </span>
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

  // Get selected day details
  const selectedDayData = selectedDate
    ? monthlyData?.days?.find((d: any) => d.date === format(selectedDate, 'yyyy-MM-dd'))
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
      <div>
        <h1 className="text-3xl font-bold text-white">Calendar</h1>
        <p className="text-dark-400 mt-1">Track your habit completion over time</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          {renderHeader()}
          {renderDays()}
          {renderCells()}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-dark-700">
            <span className="text-xs text-dark-400">Less</span>
            <div className="flex gap-1">
              {[0, 25, 50, 75, 100].map((level) => (
                <div
                  key={level}
                  className={clsx(
                    'w-4 h-4 rounded',
                    level === 0 && 'bg-dark-700',
                    level === 25 && 'bg-primary-600/25',
                    level === 50 && 'bg-primary-600/40',
                    level === 75 && 'bg-primary-600/60',
                    level === 100 && 'bg-primary-600/80'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-dark-400">More</span>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a day'}
          </h3>

          {selectedDayData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-dark-800">
                <span className="text-dark-300">Completion</span>
                <span className="text-2xl font-bold text-primary-400">
                  {selectedDayData.percentage}%
                </span>
              </div>

              <div className="text-sm text-dark-400">
                {selectedDayData.completed} of {selectedDayData.total} habits completed
              </div>

              {selectedDayData.habits?.length > 0 && (
                <div className="space-y-2">
                  {selectedDayData.habits.map((habit: any) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-dark-800"
                    >
                      {habit.completed ? (
                        <CheckCircle2 size={18} className="text-accent-green" />
                      ) : (
                        <Circle size={18} className="text-dark-500" />
                      )}
                      <span
                        className={clsx(
                          'text-sm',
                          habit.completed ? 'text-dark-200' : 'text-dark-400'
                        )}
                      >
                        {habit.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-500">
              <p>Click on a date to see details</p>
            </div>
          )}

          {/* Month Summary */}
          {monthlyData?.summary && (
            <div className="mt-6 pt-4 border-t border-dark-700">
              <h4 className="text-sm font-medium text-dark-400 mb-3">Monthly Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-dark-800 text-center">
                  <p className="text-xl font-bold text-white">{monthlyData.summary.percentage}%</p>
                  <p className="text-xs text-dark-400">Completion Rate</p>
                </div>
                <div className="p-3 rounded-lg bg-dark-800 text-center">
                  <p className="text-xl font-bold text-accent-green">
                    {monthlyData.summary.totalCompleted}
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
