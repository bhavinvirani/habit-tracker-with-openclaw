import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
}

export default function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-slate-100">Something went wrong</h2>
        <p className="mb-6 text-sm text-slate-400">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500"
          >
            Reload Page
          </button>
          {resetError && (
            <button
              onClick={resetError}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              Try Again
            </button>
          )}
          <a
            href="/"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
