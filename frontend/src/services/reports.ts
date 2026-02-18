import api from './api';
import { WeeklyReport } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const reportsApi = {
  getLatest: async (): Promise<WeeklyReport | null> => {
    const response = await api.get<ApiResponse<{ report: WeeklyReport | null }>>('/reports/latest');
    return response.data.data.report;
  },

  // Admin
  generateReports: async (): Promise<{
    usersProcessed: number;
    usersSkipped: number;
    errors: string[];
  }> => {
    const response =
      await api.post<
        ApiResponse<{ usersProcessed: number; usersSkipped: number; errors: string[] }>
      >('/admin/generate-reports');
    return response.data.data;
  },
};
