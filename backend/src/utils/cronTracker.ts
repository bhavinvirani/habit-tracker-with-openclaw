interface CronJobEntry {
  schedule: string;
  lastRun: string | null;
  lastStatus: 'success' | 'failure' | null;
  lastDurationMs: number | null;
  lastError: string | null;
  runCount: number;
  failCount: number;
}

const jobs = new Map<string, CronJobEntry>();

export function registerCronJob(name: string, schedule: string): void {
  if (!jobs.has(name)) {
    jobs.set(name, {
      schedule,
      lastRun: null,
      lastStatus: null,
      lastDurationMs: null,
      lastError: null,
      runCount: 0,
      failCount: 0,
    });
  }
}

export function reportCronRun(
  name: string,
  status: 'success' | 'failure',
  durationMs: number,
  error?: string
): void {
  const job = jobs.get(name);
  if (!job) return;

  job.lastRun = new Date().toISOString();
  job.lastStatus = status;
  job.lastDurationMs = durationMs;
  job.runCount++;

  if (status === 'failure') {
    job.failCount++;
    job.lastError = error || null;
  } else {
    job.lastError = null;
  }
}

export function getCronJobStats(): Record<string, CronJobEntry> {
  const result: Record<string, CronJobEntry> = {};
  for (const [name, entry] of jobs) {
    result[name] = { ...entry };
  }
  return result;
}

export function resetCronStats(): void {
  jobs.clear();
}
