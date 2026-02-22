import React from 'react';
import clsx from 'clsx';

interface SparklineProps {
  /** Array of completion values (true/false for each day) */
  data: boolean[];
  /** Color for completed bars */
  color: string;
  /** Height of the sparkline */
  height?: number;
  /** Show day labels on hover */
  showTooltips?: boolean;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, height = 16, showTooltips = true }) => {
  const totalDays = data.length;

  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((completed, i) => {
        const daysAgo = totalDays - 1 - i;
        const tooltipText = showTooltips
          ? `${daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}: ${completed ? 'Done' : 'Missed'}`
          : undefined;

        return (
          <div
            key={i}
            className={clsx('w-1.5 rounded-full transition-all', completed ? '' : 'opacity-30')}
            style={{
              height: completed ? height : height * 0.375,
              backgroundColor: completed ? color : '#4b5563',
            }}
            title={tooltipText}
          />
        );
      })}
    </div>
  );
};

export default Sparkline;
