/**
 * Standard API Response Interface
 * All API endpoints return this structure for consistency
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
    stack?: string; // Only in development
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: PaginationMeta;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
