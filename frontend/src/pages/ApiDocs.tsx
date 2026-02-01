import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Key,
  Zap,
  BookOpen,
  BarChart3,
  Target,
  Calendar,
  User,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  requestBody?: string;
  responseExample: string;
  queryParams?: { name: string; type: string; description: string }[];
}

interface Section {
  title: string;
  icon: React.ElementType;
  description: string;
  endpoints: Endpoint[];
}

const API_SECTIONS: Section[] = [
  {
    title: 'Authentication',
    icon: Key,
    description: 'User authentication and session management',
    endpoints: [
      {
        method: 'POST',
        path: '/auth/register',
        description: 'Create a new user account',
        auth: false,
        requestBody: `{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}`,
        responseExample: `{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" },
    "token": "jwt-token"
  }
}`,
      },
      {
        method: 'POST',
        path: '/auth/login',
        description: 'Login and get JWT token',
        auth: false,
        requestBody: `{
  "email": "user@example.com",
  "password": "password123"
}`,
        responseExample: `{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" },
    "token": "jwt-token"
  }
}`,
      },
      {
        method: 'POST',
        path: '/auth/refresh',
        description: 'Refresh access token using cookie',
        auth: false,
        responseExample: `{
  "success": true,
  "data": { "token": "new-jwt-token" }
}`,
      },
      {
        method: 'GET',
        path: '/auth/me',
        description: 'Get current authenticated user',
        auth: true,
        responseExample: `{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe", "timezone": "America/New_York" }
  }
}`,
      },
    ],
  },
  {
    title: 'Habits',
    icon: Target,
    description: 'Manage habits and configurations',
    endpoints: [
      {
        method: 'GET',
        path: '/habits',
        description: 'Get all habits for the user',
        auth: true,
        queryParams: [
          { name: 'isActive', type: 'boolean', description: 'Filter by active status' },
          { name: 'category', type: 'string', description: 'Filter by category' },
          { name: 'frequency', type: 'string', description: 'DAILY or WEEKLY' },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "habits": [
      {
        "id": "uuid",
        "name": "Morning Exercise",
        "frequency": "DAILY",
        "habitType": "BOOLEAN",
        "currentStreak": 5,
        "color": "#10B981"
      }
    ]
  }
}`,
      },
      {
        method: 'POST',
        path: '/habits',
        description: 'Create a new habit',
        auth: true,
        requestBody: `{
  "name": "Morning Exercise",
  "description": "30 min workout",
  "category": "Health",
  "frequency": "DAILY",
  "habitType": "BOOLEAN",
  "color": "#10B981",
  "icon": "🏃"
}`,
        responseExample: `{
  "success": true,
  "data": { "habit": { "id": "uuid", "name": "Morning Exercise", "..." } }
}`,
      },
      {
        method: 'PATCH',
        path: '/habits/:id',
        description: 'Update a habit',
        auth: true,
        requestBody: `{ "name": "Updated Name", "color": "#3B82F6" }`,
        responseExample: `{
  "success": true,
  "data": { "habit": { "...": "updated habit" } }
}`,
      },
      {
        method: 'DELETE',
        path: '/habits/:id',
        description: 'Delete a habit',
        auth: true,
        responseExample: `{ "success": true, "message": "Habit deleted" }`,
      },
    ],
  },
  {
    title: 'Tracking',
    icon: Calendar,
    description: 'Log habit completions and track progress',
    endpoints: [
      {
        method: 'GET',
        path: '/tracking/today',
        description: "Get today's habits with completion status",
        auth: true,
        responseExample: `{
  "success": true,
  "data": {
    "date": "2026-02-01",
    "habits": [
      {
        "id": "uuid",
        "name": "Exercise",
        "isCompleted": true,
        "currentStreak": 7
      }
    ],
    "summary": { "total": 5, "completed": 3, "remaining": 2 }
  }
}`,
      },
      {
        method: 'POST',
        path: '/tracking/check-in',
        description: 'Mark a habit as complete',
        auth: true,
        requestBody: `{
  "habitId": "uuid",
  "completed": true,
  "value": null,
  "date": "2026-02-01"
}`,
        responseExample: `{
  "success": true,
  "data": {
    "log": { "id": "log-uuid", "completed": true },
    "streak": { "current": 8, "longest": 15 }
  }
}`,
      },
      {
        method: 'DELETE',
        path: '/tracking/check-in',
        description: 'Undo a habit completion',
        auth: true,
        requestBody: `{ "habitId": "uuid", "date": "2026-02-01" }`,
        responseExample: `{ "success": true, "message": "Check-in removed" }`,
      },
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    description: 'Insights, stats, and performance data',
    endpoints: [
      {
        method: 'GET',
        path: '/analytics/overview',
        description: 'Get dashboard overview stats',
        auth: true,
        responseExample: `{
  "success": true,
  "data": {
    "totalHabits": 5,
    "completedToday": 3,
    "currentBestStreak": 12,
    "monthlyCompletionRate": 85.5
  }
}`,
      },
      {
        method: 'GET',
        path: '/analytics/productivity',
        description: 'Get productivity score with breakdown',
        auth: true,
        responseExample: `{
  "success": true,
  "data": {
    "score": 78,
    "grade": "B",
    "trend": "improving",
    "breakdown": { "consistency": 32, "streaks": 24, "completion": 22 }
  }
}`,
      },
      {
        method: 'GET',
        path: '/analytics/predictions',
        description: 'Get streak predictions and risk assessment',
        auth: true,
        responseExample: `{
  "success": true,
  "data": {
    "predictions": [
      {
        "habitName": "Exercise",
        "currentStreak": 25,
        "nextMilestone": 30,
        "riskLevel": "low"
      }
    ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/analytics/correlations',
        description: 'Find habits completed together',
        auth: true,
        responseExample: `{
  "success": true,
  "data": {
    "correlations": [
      {
        "habit1": { "name": "Exercise" },
        "habit2": { "name": "Healthy Breakfast" },
        "correlation": 0.82,
        "interpretation": "Strong positive - often completed together"
      }
    ]
  }
}`,
      },
    ],
  },
  {
    title: 'Books',
    icon: BookOpen,
    description: 'Reading tracker and book management',
    endpoints: [
      {
        method: 'GET',
        path: '/books',
        description: 'Get all books',
        auth: true,
        queryParams: [
          {
            name: 'status',
            type: 'string',
            description: 'WANT_TO_READ, READING, FINISHED, ABANDONED',
          },
        ],
        responseExample: `{
  "success": true,
  "data": {
    "books": [
      { "id": "uuid", "title": "Atomic Habits", "author": "James Clear", "status": "READING", "progress": 45 }
    ]
  }
}`,
      },
      {
        method: 'GET',
        path: '/books/current',
        description: 'Get currently reading book (dashboard widget)',
        auth: true,
        responseExample: `{
  "success": true,
  "data": {
    "book": {
      "id": "uuid",
      "title": "Atomic Habits",
      "currentPage": 150,
      "totalPages": 320,
      "progress": 47,
      "pagesReadThisWeek": 45,
      "estimatedDaysToFinish": 12
    }
  }
}`,
      },
      {
        method: 'PUT',
        path: '/books/:id/progress',
        description: 'Update reading progress',
        auth: true,
        requestBody: `{ "currentPage": 175 }`,
        responseExample: `{ "success": true, "data": { "book": { "currentPage": 175, "progress": 55 } } }`,
      },
    ],
  },
  {
    title: 'Challenges',
    icon: Trophy,
    description: 'Create and track habit challenges',
    endpoints: [
      {
        method: 'GET',
        path: '/challenges',
        description: 'Get all challenges',
        auth: true,
        responseExample: `{
  "success": true,
  "data": {
    "challenges": [
      {
        "id": "uuid",
        "name": "30-Day Fitness",
        "status": "ACTIVE",
        "progress": { "daysCompleted": 15, "daysTotal": 30 }
      }
    ]
  }
}`,
      },
      {
        method: 'POST',
        path: '/challenges',
        description: 'Create a new challenge',
        auth: true,
        requestBody: `{
  "name": "30-Day Fitness",
  "habitIds": ["habit-uuid-1", "habit-uuid-2"],
  "duration": 30,
  "startDate": "2026-02-01"
}`,
        responseExample: `{ "success": true, "data": { "challenge": { "id": "uuid", "..." } } }`,
      },
    ],
  },
  {
    title: 'User',
    icon: User,
    description: 'Profile and settings management',
    endpoints: [
      {
        method: 'GET',
        path: '/user/profile',
        description: 'Get user profile',
        auth: true,
        responseExample: `{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John", "email": "john@example.com", "timezone": "America/New_York" }
  }
}`,
      },
      {
        method: 'PUT',
        path: '/user/profile',
        description: 'Update user profile',
        auth: true,
        requestBody: `{ "name": "John Updated", "timezone": "Europe/London" }`,
        responseExample: `{ "success": true, "data": { "user": { "...": "updated" } } }`,
      },
      {
        method: 'GET',
        path: '/user/export',
        description: 'Export all user data (GDPR)',
        auth: true,
        responseExample: `{
  "success": true,
  "data": {
    "user": { "..." },
    "habits": [ "..." ],
    "habitLogs": [ "..." ],
    "books": [ "..." ],
    "exportedAt": "2026-02-01T12:00:00Z"
  }
}`,
      },
    ],
  },
];

const MethodBadge: React.FC<{ method: Endpoint['method'] }> = ({ method }) => {
  const colors = {
    GET: 'bg-accent-green/20 text-accent-green',
    POST: 'bg-accent-blue/20 text-accent-blue',
    PUT: 'bg-accent-yellow/20 text-accent-yellow',
    PATCH: 'bg-accent-orange/20 text-accent-orange',
    DELETE: 'bg-accent-red/20 text-accent-red',
  };

  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-mono font-semibold', colors[method])}>
      {method}
    </span>
  );
};

const EndpointCard: React.FC<{ endpoint: Endpoint; baseUrl: string }> = ({ endpoint, baseUrl }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const curlCommand = `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"${
    endpoint.requestBody
      ? ` \\
  -d '${endpoint.requestBody.replace(/\n/g, '').replace(/\s+/g, ' ')}'`
      : ''
  }`;

  return (
    <div className="border border-dark-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-dark-800/50 transition-colors"
      >
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono text-white flex-1 text-left">{endpoint.path}</code>
        {endpoint.auth && (
          <span className="text-xs text-dark-500 flex items-center gap-1">
            <Key size={12} />
            Auth
          </span>
        )}
        {expanded ? (
          <ChevronDown size={18} className="text-dark-400" />
        ) : (
          <ChevronRight size={18} className="text-dark-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          <p className="text-sm text-dark-400">{endpoint.description}</p>

          {endpoint.queryParams && (
            <div>
              <h4 className="text-xs font-medium text-dark-400 uppercase mb-2">Query Parameters</h4>
              <div className="space-y-1">
                {endpoint.queryParams.map((param) => (
                  <div key={param.name} className="flex gap-2 text-sm">
                    <code className="text-primary-400">{param.name}</code>
                    <span className="text-dark-500">({param.type})</span>
                    <span className="text-dark-400">- {param.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.requestBody && (
            <div>
              <h4 className="text-xs font-medium text-dark-400 uppercase mb-2">Request Body</h4>
              <pre className="p-3 rounded-lg bg-dark-900 border border-dark-700 overflow-x-auto">
                <code className="text-xs text-dark-300">{endpoint.requestBody}</code>
              </pre>
            </div>
          )}

          <div>
            <h4 className="text-xs font-medium text-dark-400 uppercase mb-2">Response</h4>
            <pre className="p-3 rounded-lg bg-dark-900 border border-dark-700 overflow-x-auto">
              <code className="text-xs text-dark-300">{endpoint.responseExample}</code>
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-dark-400 uppercase">cURL Example</h4>
              <button
                onClick={() => handleCopy(curlCommand)}
                className={clsx(
                  'p-1.5 rounded-lg transition-colors',
                  copied
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-dark-800 text-dark-400 hover:text-white'
                )}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-dark-900 border border-dark-700 overflow-x-auto">
              <code className="text-xs text-dark-300">{curlCommand}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

const ApiDocs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('Authentication');
  const baseUrl = `${window.location.origin}/api`;

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Header */}
      <div className="bg-dark-900 border-b border-dark-700">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Code size={24} className="text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">API Documentation</h1>
              <p className="text-dark-400">Habit Tracker REST API Reference</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800">
              <span className="text-xs text-dark-400">Base URL:</span>
              <code className="text-sm text-primary-400 font-mono">{baseUrl}</code>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800">
              <Key size={14} className="text-dark-400" />
              <span className="text-xs text-dark-400">Auth:</span>
              <code className="text-sm text-white font-mono">Bearer token</code>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-8 space-y-2">
              <h3 className="text-xs font-medium text-dark-400 uppercase px-3 mb-3">Endpoints</h3>
              {API_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.title}
                    onClick={() => setActiveSection(section.title)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      activeSection === section.title
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-dark-400 hover:text-white hover:bg-dark-800'
                    )}
                  >
                    <Icon size={16} />
                    {section.title}
                    <span className="ml-auto text-xs text-dark-500">
                      {section.endpoints.length}
                    </span>
                  </button>
                );
              })}

              <div className="pt-6 mt-6 border-t border-dark-700">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-white transition-colors"
                >
                  <ExternalLink size={14} />
                  Full Documentation
                </a>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {API_SECTIONS.filter((s) => s.title === activeSection).map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                      <Icon size={20} className="text-primary-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{section.title}</h2>
                      <p className="text-sm text-dark-400">{section.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {section.endpoints.map((endpoint) => (
                      <EndpointCard
                        key={`${endpoint.method}-${endpoint.path}`}
                        endpoint={endpoint}
                        baseUrl={baseUrl}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Quick Start Guide */}
            <div className="mt-12 p-6 rounded-2xl bg-dark-900 border border-dark-700">
              <div className="flex items-center gap-3 mb-4">
                <Zap size={20} className="text-accent-yellow" />
                <h3 className="text-lg font-semibold">Quick Start for AI Integration</h3>
              </div>

              <div className="space-y-4 text-sm text-dark-300">
                <p>
                  <strong className="text-white">1. Authenticate:</strong> POST to{' '}
                  <code className="text-primary-400">/auth/login</code> with email/password to get a
                  JWT token.
                </p>
                <p>
                  <strong className="text-white">2. Include token:</strong> Add{' '}
                  <code className="text-primary-400">Authorization: Bearer YOUR_TOKEN</code> to all
                  requests.
                </p>
                <p>
                  <strong className="text-white">3. Common flows:</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    Get today's habits:{' '}
                    <code className="text-primary-400">GET /tracking/today</code>
                  </li>
                  <li>
                    Mark complete: <code className="text-primary-400">POST /tracking/check-in</code>
                  </li>
                  <li>
                    Get insights:{' '}
                    <code className="text-primary-400">GET /analytics/productivity</code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
