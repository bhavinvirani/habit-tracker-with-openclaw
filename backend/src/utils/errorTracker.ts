const MAX_RECENT_ERRORS = 50;
const MAX_ERROR_CODES = 200;

interface ErrorCodeEntry {
  count: number;
  lastOccurrence: string;
  lastMessage: string;
  statusCode: number;
  lastUrl: string;
  lastMethod: string;
}

interface RecentError {
  code: string;
  message: string;
  url: string;
  method: string;
  timestamp: string;
}

// Aggregated by error code
const errorsByCode = new Map<string, ErrorCodeEntry>();

// Circular buffer of recent errors
const recentErrors: RecentError[] = [];
let recentIndex = 0;
let totalErrors = 0;

export function recordError(
  code: string,
  message: string,
  statusCode: number,
  url: string,
  method: string
): void {
  totalErrors++;

  // Update by-code aggregation (bounded)
  const existing = errorsByCode.get(code);
  if (existing) {
    existing.count++;
    existing.lastOccurrence = new Date().toISOString();
    existing.lastMessage = message;
    existing.statusCode = statusCode;
    existing.lastUrl = url;
    existing.lastMethod = method;
  } else if (errorsByCode.size < MAX_ERROR_CODES) {
    errorsByCode.set(code, {
      count: 1,
      lastOccurrence: new Date().toISOString(),
      lastMessage: message,
      statusCode,
      lastUrl: url,
      lastMethod: method,
    });
  }

  // Circular buffer for recent errors
  const entry: RecentError = {
    code,
    message,
    url,
    method,
    timestamp: new Date().toISOString(),
  };

  if (recentErrors.length < MAX_RECENT_ERRORS) {
    recentErrors.push(entry);
  } else {
    recentErrors[recentIndex % MAX_RECENT_ERRORS] = entry;
  }
  recentIndex++;
}

export function getErrorStats(): {
  totalErrors: number;
  byCode: Record<string, ErrorCodeEntry>;
  recent: RecentError[];
} {
  const byCode: Record<string, ErrorCodeEntry> = {};
  for (const [code, entry] of errorsByCode) {
    byCode[code] = { ...entry };
  }

  // Return recent errors in chronological order
  const ordered: RecentError[] = [];
  const len = recentErrors.length;
  if (len < MAX_RECENT_ERRORS) {
    ordered.push(...recentErrors);
  } else {
    // Read from oldest to newest in circular buffer
    for (let i = 0; i < MAX_RECENT_ERRORS; i++) {
      ordered.push(recentErrors[(recentIndex + i) % MAX_RECENT_ERRORS]);
    }
  }

  return { totalErrors, byCode, recent: ordered };
}

export function resetErrorStats(): void {
  errorsByCode.clear();
  recentErrors.length = 0;
  recentIndex = 0;
  totalErrors = 0;
}
