// ============ IN-MEMORY REQUEST METRICS ============

let totalRequests = 0;
let totalResponseTime = 0;
let activeRequests = 0;
const byMethod: Record<string, number> = {};
const byStatusGroup: Record<string, number> = {};
const startedAt = new Date().toISOString();

/**
 * Record a completed request.
 */
export function recordRequest(method: string, statusCode: number, durationMs: number): void {
  totalRequests++;
  totalResponseTime += durationMs;

  byMethod[method] = (byMethod[method] || 0) + 1;

  const group = `${Math.floor(statusCode / 100)}xx`;
  byStatusGroup[group] = (byStatusGroup[group] || 0) + 1;
}

/**
 * Increment active (in-flight) request count.
 */
export function incrementActive(): void {
  activeRequests++;
}

/**
 * Decrement active (in-flight) request count.
 */
export function decrementActive(): void {
  activeRequests--;
}

/**
 * Return a snapshot of all request metrics.
 */
export function getRequestMetrics() {
  return {
    totalRequests,
    byMethod: { ...byMethod },
    byStatusGroup: { ...byStatusGroup },
    averageResponseTime:
      totalRequests > 0 ? Math.round((totalResponseTime / totalRequests) * 100) / 100 : 0,
    activeRequests,
    startedAt,
  };
}

/**
 * Reset all metrics (for testing).
 */
export function resetMetrics(): void {
  totalRequests = 0;
  totalResponseTime = 0;
  activeRequests = 0;
  for (const key of Object.keys(byMethod)) delete byMethod[key];
  for (const key of Object.keys(byStatusGroup)) delete byStatusGroup[key];
}
