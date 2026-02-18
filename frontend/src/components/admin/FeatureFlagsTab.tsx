import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ToggleLeft,
  ToggleRight,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { featuresApi } from '../../services/features';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import { FeatureFlag } from '../../types';
import { Button, ConfirmDialog } from '../ui';
import CreateFlagModal from './CreateFlagModal';
import EditFlagModal from './EditFlagModal';
import AuditLogPanel from './AuditLogPanel';

const FeatureFlagsTab: React.FC = () => {
  const { refetch: refetchFeatureFlags } = useFeatureFlags();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [deletingFlag, setDeletingFlag] = useState<FeatureFlag | null>(null);
  const [auditFlagKey, setAuditFlagKey] = useState<string | null>(null);

  const {
    data: flags,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-features'],
    queryFn: featuresApi.getAllFlags,
  });

  // Toggle flag mutation with optimistic UI
  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      featuresApi.updateFlag(key, { enabled }),
    onMutate: async ({ key, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-features'] });
      const previous = queryClient.getQueryData<FeatureFlag[]>(['admin-features']);
      if (previous) {
        queryClient.setQueryData<FeatureFlag[]>(
          ['admin-features'],
          previous.map((flag) => (flag.key === key ? { ...flag, enabled } : flag))
        );
      }
      return { previous };
    },
    onSuccess: (_data, { key, enabled }) => {
      toast.success(`Flag "${key}" ${enabled ? 'enabled' : 'disabled'}`);
      refetchFeatureFlags();
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin-features'], context.previous);
      }
      toast.error('Failed to update feature flag');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-features'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => featuresApi.deleteFlag(key),
    onSuccess: () => {
      toast.success(`Flag "${deletingFlag?.key}" deleted`);
      queryClient.invalidateQueries({ queryKey: ['admin-features'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit'] });
      refetchFeatureFlags();
      setDeletingFlag(null);
    },
    onError: () => {
      toast.error('Failed to delete feature flag');
    },
  });

  // Group flags by category
  const groupedFlags = useMemo(() => {
    if (!flags) return {};

    const filtered = flags.filter(
      (flag) =>
        flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (flag.description && flag.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return filtered.reduce<Record<string, FeatureFlag[]>>((acc, flag) => {
      const category = flag.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(flag);
      return acc;
    }, {});
  }, [flags, searchQuery]);

  const categoryNames = Object.keys(groupedFlags).sort();
  const allCategories = useMemo(
    () => [...new Set(flags?.map((f) => f.category).filter(Boolean) || [])],
    [flags]
  );

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-dark-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-400">{flags?.length || 0} flags total</span>
        <Button icon={Plus} size="sm" onClick={() => setShowCreateModal(true)}>
          Create Flag
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          type="text"
          placeholder="Search flags by name, key, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
        />
      </div>

      {isError && (
        <div className="card p-6 text-center">
          <p className="text-red-400">Failed to load feature flags. Please try again.</p>
        </div>
      )}

      {categoryNames.length === 0 && !isError && (
        <div className="card p-6 text-center">
          <p className="text-dark-400">
            {searchQuery ? 'No flags match your search.' : 'No feature flags found.'}
          </p>
        </div>
      )}

      {categoryNames.map((category) => {
        const categoryFlags = groupedFlags[category];
        const isCollapsed = collapsedCategories.has(category);
        const enabledCount = categoryFlags.filter((f) => f.enabled).length;

        return (
          <div key={category} className="card p-0 overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-dark-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-dark-400" />
                )}
                <h3 className="text-base font-semibold text-white capitalize">{category}</h3>
                <span className="text-xs text-dark-400">
                  {enabledCount}/{categoryFlags.length} enabled
                </span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="border-t border-dark-700">
                {categoryFlags.map((flag, idx) => (
                  <div
                    key={flag.key}
                    className={`flex items-center justify-between p-4 ${
                      idx < categoryFlags.length - 1 ? 'border-b border-dark-700/50' : ''
                    } hover:bg-dark-700/20 transition-colors`}
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white">{flag.name}</h4>
                        <code className="text-xs px-1.5 py-0.5 rounded bg-dark-700 text-dark-300">
                          {flag.key}
                        </code>
                      </div>
                      {flag.description && (
                        <p className="text-xs text-dark-400 mt-1 truncate">{flag.description}</p>
                      )}
                      <p className="text-xs text-dark-500 mt-1">
                        Updated {new Date(flag.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setEditingFlag(flag)}
                        className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setAuditFlagKey(auditFlagKey === flag.key ? null : flag.key)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          auditFlagKey === flag.key
                            ? 'text-primary-400 bg-primary-500/10'
                            : 'text-dark-400 hover:text-white hover:bg-dark-700'
                        }`}
                        title="History"
                      >
                        <Clock size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingFlag(flag)}
                        className="p-1.5 rounded-lg text-dark-400 hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() =>
                          toggleMutation.mutate({ key: flag.key, enabled: !flag.enabled })
                        }
                        disabled={toggleMutation.isPending}
                        className="flex-shrink-0 transition-colors disabled:opacity-50"
                        aria-label={`Toggle ${flag.name}`}
                      >
                        {flag.enabled ? (
                          <ToggleRight className="w-10 h-10 text-accent-green" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-dark-500 hover:text-dark-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Inline audit log for selected flag */}
                {categoryFlags.some((f) => f.key === auditFlagKey) && auditFlagKey && (
                  <div className="border-t border-dark-700 p-4 bg-dark-800/30">
                    <h4 className="text-sm font-medium text-dark-300 mb-3">
                      Audit History: <code className="text-primary-400">{auditFlagKey}</code>
                    </h4>
                    <AuditLogPanel flagKey={auditFlagKey} limit={5} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <CreateFlagModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        existingCategories={allCategories}
      />

      <EditFlagModal
        isOpen={!!editingFlag}
        onClose={() => setEditingFlag(null)}
        flag={editingFlag}
        existingCategories={allCategories}
      />

      <ConfirmDialog
        isOpen={!!deletingFlag}
        onClose={() => setDeletingFlag(null)}
        onConfirm={() => deletingFlag && deleteMutation.mutate(deletingFlag.key)}
        title="Delete Feature Flag"
        message={`Are you sure you want to delete the flag "${deletingFlag?.key}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default FeatureFlagsTab;
