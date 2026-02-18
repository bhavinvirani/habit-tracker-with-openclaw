import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { adminApi } from '../../services/admin';
import { AuditEntry, AuditAction } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const actionBadgeVariant: Record<AuditAction, 'primary' | 'success' | 'warning' | 'danger'> = {
  CREATED: 'primary',
  TOGGLED: 'success',
  UPDATED: 'warning',
  DELETED: 'danger',
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface AuditLogPanelProps {
  flagKey?: string;
  limit?: number;
  showLoadMore?: boolean;
}

const AuditLogPanel: React.FC<AuditLogPanelProps> = ({
  flagKey,
  limit = 10,
  showLoadMore = true,
}) => {
  const [page, setPage] = useState(1);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', { flagKey, page, limit }],
    queryFn: () => adminApi.getAuditLog({ flagKey, page, limit }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-dark-400" />
      </div>
    );
  }

  const entries = data?.entries ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-dark-400">No audit entries found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry: AuditEntry) => (
        <div key={entry.id} className="p-3 rounded-lg bg-dark-800/50 border border-dark-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant={actionBadgeVariant[entry.action]} size="sm">
                {entry.action}
              </Badge>
              <code className="text-xs text-dark-300 truncate">{entry.flagKey}</code>
              <span className="text-xs text-dark-500">by {entry.user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-500 whitespace-nowrap">
                {formatTimeAgo(entry.createdAt)}
              </span>
              <button
                onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                className="text-dark-500 hover:text-dark-300 transition-colors"
              >
                {expandedEntry === entry.id ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            </div>
          </div>
          {expandedEntry === entry.id && (
            <pre className="mt-2 p-2 rounded bg-dark-900 text-xs text-dark-300 overflow-x-auto">
              {JSON.stringify(entry.changes, null, 2)}
            </pre>
          )}
        </div>
      ))}
      {showLoadMore && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-dark-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuditLogPanel;
