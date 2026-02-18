import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/admin';
import { AdminUser } from '../../types';
import { SearchInput, Badge, Button, ConfirmDialog } from '../ui';

interface UsersTabProps {
  currentUserId: string;
}

const UsersTab: React.FC<UsersTabProps> = ({ currentUserId }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleChangeTarget, setRoleChangeTarget] = useState<AdminUser | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, limit: 20, search: debouncedSearch }],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search: debouncedSearch || undefined }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      adminApi.updateUserRole(userId, isAdmin),
    onSuccess: (_data, { isAdmin }) => {
      toast.success(
        isAdmin
          ? `${roleChangeTarget?.name} is now an admin`
          : `${roleChangeTarget?.name} is no longer an admin`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setRoleChangeTarget(null);
    },
    onError: (error: { response?: { data?: { error?: { message: string } } } }) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update user role');
      setRoleChangeTarget(null);
    },
  });

  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={handleSearchChange}
        placeholder="Search users by name or email..."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-dark-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-dark-400">
            {debouncedSearch ? 'No users match your search.' : 'No users found.'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_80px_80px_100px_100px] gap-4 px-4 py-3 border-b border-dark-700 bg-dark-800/50 text-xs font-medium text-dark-400 uppercase tracking-wider">
            <span>Name</span>
            <span>Email</span>
            <span className="text-center">Role</span>
            <span className="text-center">Habits</span>
            <span>Joined</span>
            <span className="text-center">Action</span>
          </div>

          {/* Table rows */}
          {users.map((user: AdminUser) => {
            const isSelf = user.id === currentUserId;
            return (
              <div
                key={user.id}
                className="grid grid-cols-[1fr_1fr_80px_80px_100px_100px] gap-4 px-4 py-3 border-b border-dark-700/50 last:border-b-0 items-center hover:bg-dark-700/20 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-primary-400">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-white truncate">{user.name}</span>
                </div>
                <span className="text-sm text-dark-300 truncate">{user.email}</span>
                <div className="text-center">
                  <Badge variant={user.isAdmin ? 'success' : 'default'} size="sm">
                    {user.isAdmin ? 'Admin' : 'User'}
                  </Badge>
                </div>
                <span className="text-sm text-dark-300 text-center">{user._count.habits}</span>
                <span className="text-xs text-dark-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
                <div className="text-center">
                  {isSelf ? (
                    <span className="text-xs text-dark-500">You</span>
                  ) : (
                    <Button
                      variant={user.isAdmin ? 'danger' : 'success'}
                      size="sm"
                      icon={user.isAdmin ? ShieldOff : Shield}
                      iconOnly
                      onClick={() => setRoleChangeTarget(user)}
                      title={user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-dark-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        onConfirm={() =>
          roleChangeTarget &&
          roleMutation.mutate({
            userId: roleChangeTarget.id,
            isAdmin: !roleChangeTarget.isAdmin,
          })
        }
        title={roleChangeTarget?.isAdmin ? 'Remove Admin Privileges' : 'Grant Admin Privileges'}
        message={
          roleChangeTarget?.isAdmin
            ? `Are you sure you want to remove admin privileges from ${roleChangeTarget.name}?`
            : `Are you sure you want to grant admin privileges to ${roleChangeTarget?.name}?`
        }
        confirmText={roleChangeTarget?.isAdmin ? 'Remove Admin' : 'Make Admin'}
        danger={roleChangeTarget?.isAdmin}
        loading={roleMutation.isPending}
      />
    </div>
  );
};

export default UsersTab;
