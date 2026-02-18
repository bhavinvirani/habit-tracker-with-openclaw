import api from './api';
import { AdminUser, ApplicationStats, AuditEntry } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const adminApi = {
  getStats: async (): Promise<ApplicationStats> => {
    const response = await api.get<ApiResponse<{ stats: ApplicationStats }>>('/admin/stats');
    return response.data.data.stats;
  },

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ users: AdminUser[]; total: number; totalPages: number }> => {
    const response = await api.get<ApiResponse<AdminUser[]>>('/admin/users', { params });
    return {
      users: response.data.data,
      total: response.data.meta?.pagination?.total ?? 0,
      totalPages: response.data.meta?.pagination?.totalPages ?? 1,
    };
  },

  updateUserRole: async (
    userId: string,
    isAdmin: boolean
  ): Promise<{ id: string; name: string; email: string; isAdmin: boolean }> => {
    const response = await api.patch<
      ApiResponse<{ user: { id: string; name: string; email: string; isAdmin: boolean } }>
    >(`/admin/users/${userId}/role`, { isAdmin });
    return response.data.data.user;
  },

  getAuditLog: async (params?: {
    flagKey?: string;
    page?: number;
    limit?: number;
  }): Promise<{ entries: AuditEntry[]; total: number; totalPages: number }> => {
    const response = await api.get<ApiResponse<AuditEntry[]>>('/admin/features/audit', { params });
    return {
      entries: response.data.data,
      total: response.data.meta?.pagination?.total ?? 0,
      totalPages: response.data.meta?.pagination?.totalPages ?? 1,
    };
  },
};
