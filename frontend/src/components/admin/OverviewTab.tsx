import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Target, Activity, TrendingUp, Loader2 } from 'lucide-react';
import { adminApi } from '../../services/admin';
import { AdminUser } from '../../types';
import { StatCard, Card } from '../ui';
import AuditLogPanel from './AuditLogPanel';

const OverviewTab: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }],
    queryFn: () => adminApi.getUsers({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-dark-800/50 border border-dark-700 animate-pulse"
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} value={stats.totalUsers} label="Total Users" color="green" />
          <StatCard icon={Target} value={stats.totalHabits} label="Total Habits" color="blue" />
          <StatCard
            icon={Activity}
            value={stats.activeUsersLast7Days}
            label="Active (7d)"
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            value={stats.avgCompletionRate}
            suffix="%"
            label="Avg Completion"
            color="purple"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Activity */}
        <Card
          padding="lg"
          header={<h3 className="text-sm font-medium text-white">Recent Activity</h3>}
        >
          <AuditLogPanel limit={5} showLoadMore={false} />
        </Card>

        {/* New Users */}
        <Card padding="lg" header={<h3 className="text-sm font-medium text-white">New Users</h3>}>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-dark-400" />
            </div>
          ) : usersData?.users.length === 0 ? (
            <p className="text-sm text-dark-400 text-center py-6">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {usersData?.users.map((user: AdminUser) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-dark-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary-400">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-dark-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-dark-500 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
