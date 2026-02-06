import React, { useState } from 'react';
import {
  MessageCircle,
  Smartphone,
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Zap,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  BookOpen,
  Settings,
  Bell,
  Code,
  Workflow,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
}

interface IntegrationType {
  id: string;
  title: string;
  description: string;
}

const INTEGRATION_TYPES: IntegrationType[] = [
  { id: 'telegram', title: 'Telegram Notifications', description: 'Simple one-way reminders' },
  { id: 'openclaw', title: 'OpenClaw Integration', description: 'Full conversational tracking' },
];

const SECTIONS: Section[] = [
  { id: 'overview', title: 'Overview', icon: BookOpen },
  { id: 'architecture', title: 'How It Works', icon: Workflow },
  { id: 'setup', title: 'Setup Guide', icon: Settings },
  { id: 'api', title: 'API Reference', icon: Code },
  { id: 'examples', title: 'Examples', icon: MessageCircle },
  { id: 'troubleshooting', title: 'Troubleshooting', icon: HelpCircle },
];

const IntegrationDocs: React.FC = () => {
  const [integrationType, setIntegrationType] = useState<'telegram' | 'openclaw'>('telegram');
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([1]);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleStep = (step: number) => {
    setExpandedSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    );
  };

  const CodeBlock: React.FC<{ code: string; language?: string; copyLabel?: string }> = ({
    code,
    language = 'bash',
    copyLabel = 'Code',
  }) => (
    <div className="relative group">
      <pre className="bg-dark-900 border border-dark-700 rounded-lg p-4 overflow-x-auto">
        <code className={`language-${language} text-sm text-dark-300`}>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, copyLabel)}
        className="absolute top-2 right-2 p-2 rounded-lg bg-dark-800 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copiedText === code ? (
          <Check size={14} className="text-accent-green" />
        ) : (
          <Copy size={14} className="text-dark-400" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Header */}
      <div className="bg-dark-900 border-b border-dark-700">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <MessageCircle size={24} className="text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Messaging Integration</h1>
              <p className="text-dark-400">
                Get reminders and track habits via Telegram and other messaging apps
              </p>
            </div>
          </div>

          {/* Integration Type Tabs */}
          <div className="flex gap-3 mt-6">
            {INTEGRATION_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setIntegrationType(type.id as 'telegram' | 'openclaw');
                  setActiveSection('overview');
                }}
                className={clsx(
                  'flex-1 p-4 rounded-xl border transition-all text-left',
                  integrationType === type.id
                    ? 'bg-primary-500/20 border-primary-500/50'
                    : 'bg-dark-800 border-dark-700 hover:border-dark-600'
                )}
              >
                <h3
                  className={clsx(
                    'font-medium mb-1',
                    integrationType === type.id ? 'text-primary-400' : 'text-white'
                  )}
                >
                  {type.title}
                </h3>
                <p className="text-sm text-dark-400">{type.description}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800">
              <span className="text-xs text-dark-400">Platform:</span>
              <span className="text-sm text-white font-mono">
                {integrationType === 'telegram' ? 'Telegram Bot' : 'OpenClaw'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800">
              <span className="text-xs text-dark-400">Auth:</span>
              <code className="text-sm text-primary-400 font-mono">
                {integrationType === 'telegram' ? 'TELEGRAM_BOT_TOKEN' : 'X-API-Key'}
              </code>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800">
              <span className="text-xs text-dark-400">Setup Time:</span>
              <span className="text-sm text-white">
                {integrationType === 'telegram' ? '10 min' : '30 min'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="lg:sticky lg:top-8 space-y-2">
              <h3 className="text-xs font-medium text-dark-400 uppercase px-3 mb-3">Sections</h3>
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                      activeSection === section.id
                        ? 'bg-primary-500/20 text-primary-400 font-medium'
                        : 'text-dark-400 hover:text-white hover:bg-dark-800'
                    )}
                  >
                    <Icon size={18} />
                    {section.title}
                  </button>
                );
              })}

              <div className="pt-6 mt-6 border-t border-dark-700">
                <a
                  href="https://openclaw.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-white transition-colors"
                >
                  <ExternalLink size={14} />
                  OpenClaw Docs
                </a>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* What is OpenClaw */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">What is OpenClaw?</h2>
                  <p className="text-dark-300 mb-6">
                    OpenClaw is an open-source AI assistant that runs on your computer. It connects
                    to messaging platforms (Telegram, WhatsApp, Discord) and can perform tasks using
                    "skills" - specialized instructions that teach it how to interact with APIs.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                        <Smartphone size={20} className="text-blue-400" />
                      </div>
                      <h3 className="font-medium text-white mb-1">Message from Anywhere</h3>
                      <p className="text-sm text-dark-400">
                        Track habits from Telegram, WhatsApp, or Discord
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center mb-3">
                        <Zap size={20} className="text-accent-purple" />
                      </div>
                      <h3 className="font-medium text-white mb-1">Natural Language</h3>
                      <p className="text-sm text-dark-400">
                        Just say "drank 3 glasses of water" - AI understands
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <div className="w-10 h-10 rounded-lg bg-accent-green/20 flex items-center justify-center mb-3">
                        <RefreshCw size={20} className="text-accent-green" />
                      </div>
                      <h3 className="font-medium text-white mb-1">Syncs Automatically</h3>
                      <p className="text-sm text-dark-400">
                        Updates appear instantly in this web app
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual Flow */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 text-center">
                      <div className="w-14 h-14 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                        <Smartphone size={24} className="text-blue-400" />
                      </div>
                      <div className="text-xs text-dark-500 mb-1">Step 1</div>
                      <h3 className="font-medium text-white text-sm">Send Message</h3>
                      <p className="text-xs text-dark-400 mt-1">"Done with 30 mins meditation"</p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 text-center">
                      <div className="w-14 h-14 mx-auto rounded-full bg-accent-purple/20 flex items-center justify-center mb-3">
                        <Server size={24} className="text-accent-purple" />
                      </div>
                      <div className="text-xs text-dark-500 mb-1">Step 2</div>
                      <h3 className="font-medium text-white text-sm">AI Processes</h3>
                      <p className="text-xs text-dark-400 mt-1">OpenClaw reads skill & calls API</p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 text-center">
                      <div className="w-14 h-14 mx-auto rounded-full bg-accent-green/20 flex items-center justify-center mb-3">
                        <Database size={24} className="text-accent-green" />
                      </div>
                      <div className="text-xs text-dark-500 mb-1">Step 3</div>
                      <h3 className="font-medium text-white text-sm">Habit Logged</h3>
                      <p className="text-xs text-dark-400 mt-1">Saved & synced to this app</p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700 text-center">
                      <div className="w-14 h-14 mx-auto rounded-full bg-accent-orange/20 flex items-center justify-center mb-3">
                        <Bell size={24} className="text-accent-orange" />
                      </div>
                      <div className="text-xs text-dark-500 mb-1">Step 4</div>
                      <h3 className="font-medium text-white text-sm">Get Reminders</h3>
                      <p className="text-xs text-dark-400 mt-1">If you miss a habit</p>
                    </div>
                  </div>
                </div>

                {/* Prerequisites */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Prerequisites</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <CheckCircle2 size={20} className="text-accent-green flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-white text-sm">OpenClaw Installed</h3>
                        <p className="text-xs text-dark-400">Running on your computer or server</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <CheckCircle2 size={20} className="text-accent-green flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-white text-sm">Habit Tracker Backend</h3>
                        <p className="text-xs text-dark-400">Running locally or deployed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <CheckCircle2 size={20} className="text-accent-green flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-white text-sm">API Key Generated</h3>
                        <p className="text-xs text-dark-400">From Settings → API Access</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <CheckCircle2 size={20} className="text-accent-green flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-white text-sm">Messaging Platform</h3>
                        <p className="text-xs text-dark-400">Telegram connected to OpenClaw</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Architecture Section */}
            {activeSection === 'architecture' && (
              <div className="space-y-6">
                {/* High-Level Overview */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Understanding the Architecture
                  </h2>
                  <p className="text-dark-300 mb-4">
                    The integration follows a{' '}
                    <strong className="text-white">skill-based architecture</strong> where OpenClaw
                    acts as an intelligent middleware between messaging platforms and your Habit
                    Tracker backend. This design provides flexibility, security, and natural
                    language understanding.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-dark-800 border border-blue-500/20">
                      <h3 className="font-medium text-blue-400 mb-2">🧠 AI-First Design</h3>
                      <p className="text-sm text-dark-400">
                        Unlike traditional chatbots with rigid commands, OpenClaw uses LLMs
                        (Claude/GPT) to understand natural language and decide which API to call. No
                        memorizing commands!
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-accent-purple/10 to-dark-800 border border-accent-purple/20">
                      <h3 className="font-medium text-accent-purple mb-2">
                        🔌 Skill-Based Modularity
                      </h3>
                      <p className="text-sm text-dark-400">
                        Each skill is a self-contained unit with its own instructions, API
                        endpoints, and configuration. Skills can be added, removed, or updated
                        independently.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-accent-green/10 to-dark-800 border border-accent-green/20">
                      <h3 className="font-medium text-accent-green mb-2">🔐 API Key Isolation</h3>
                      <p className="text-sm text-dark-400">
                        Each skill has its own environment variables. Your habit tracker API key is
                        isolated and only accessible to the habit-tracker skill.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-accent-orange/10 to-dark-800 border border-accent-orange/20">
                      <h3 className="font-medium text-accent-orange mb-2">📱 Platform Agnostic</h3>
                      <p className="text-sm text-dark-400">
                        Message from Telegram, WhatsApp, Discord, or any supported platform. The
                        skill works identically across all channels.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Component Deep Dive */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Component Deep Dive</h2>

                  {/* OpenClaw Gateway */}
                  <div className="mb-6 p-4 rounded-xl bg-dark-800 border border-dark-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center">
                        <Server size={20} className="text-accent-purple" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">OpenClaw Gateway</h3>
                        <p className="text-xs text-dark-500">The AI orchestration layer</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-dark-300">
                      <p>
                        The gateway is the core of OpenClaw. It runs on your computer (or server)
                        and handles:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <strong className="text-white">Message Reception:</strong> Receives
                          messages via webhooks or polling from connected platforms
                        </li>
                        <li>
                          <strong className="text-white">Skill Matching:</strong> Analyzes the
                          message to determine which skill(s) to activate
                        </li>
                        <li>
                          <strong className="text-white">LLM Processing:</strong> Sends context +
                          skill instructions to Claude/GPT for understanding
                        </li>
                        <li>
                          <strong className="text-white">API Execution:</strong> Makes HTTP calls to
                          external APIs based on LLM decisions
                        </li>
                        <li>
                          <strong className="text-white">Response Formatting:</strong> Converts API
                          responses into user-friendly messages
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* SKILL.md File */}
                  <div className="mb-6 p-4 rounded-xl bg-dark-800 border border-dark-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <BookOpen size={20} className="text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">SKILL.md - The Skill Definition</h3>
                        <p className="text-xs text-dark-500">
                          Instructions that teach the AI what to do
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-dark-300">
                      <p>
                        The SKILL.md file is essentially a "prompt" that gets injected into the LLM
                        context when the skill is activated. It contains:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="p-3 rounded-lg bg-dark-900 border border-dark-600">
                          <h4 className="font-medium text-white text-xs mb-1">YAML Frontmatter</h4>
                          <p className="text-xs text-dark-400">
                            Name, description, trigger phrases, required env vars
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-dark-900 border border-dark-600">
                          <h4 className="font-medium text-white text-xs mb-1">API Documentation</h4>
                          <p className="text-xs text-dark-400">
                            Endpoints, methods, request/response formats
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-dark-900 border border-dark-600">
                          <h4 className="font-medium text-white text-xs mb-1">Behavior Rules</h4>
                          <p className="text-xs text-dark-400">
                            How to interpret user messages, edge cases
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-dark-900 border border-dark-600">
                          <h4 className="font-medium text-white text-xs mb-1">
                            Response Templates
                          </h4>
                          <p className="text-xs text-dark-400">
                            How to format replies with emojis, streaks, etc.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Habit Tracker Backend */}
                  <div className="mb-6 p-4 rounded-xl bg-dark-800 border border-dark-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-accent-green/20 flex items-center justify-center">
                        <Database size={20} className="text-accent-green" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Habit Tracker Backend</h3>
                        <p className="text-xs text-dark-500">Your data and business logic</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-dark-300">
                      <p>
                        The backend exposes a dedicated{' '}
                        <code className="text-primary-400">/api/bot/*</code> route specifically
                        designed for bot integrations:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <strong className="text-white">API Key Auth:</strong> Uses X-API-Key
                          header instead of JWT tokens
                        </li>
                        <li>
                          <strong className="text-white">Fuzzy Matching:</strong> Finds habits by
                          partial name match (e.g., "med" → "Meditation")
                        </li>
                        <li>
                          <strong className="text-white">Smart Responses:</strong> Returns streak
                          info, completion status, and progress
                        </li>
                        <li>
                          <strong className="text-white">Request Logging:</strong> Detailed logs
                          with 🤖 prefix for debugging
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* API Key */}
                  <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <Zap size={20} className="text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">API Key Authentication</h3>
                        <p className="text-xs text-dark-500">
                          Secure access without exposing credentials
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-dark-300">
                      <p>
                        Unlike the web app which uses JWT tokens, bot integrations use API keys
                        because:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>No login flow needed - the key is pre-configured</li>
                        <li>Can be revoked independently without logging out of web</li>
                        <li>Scoped to bot operations only (more secure)</li>
                        <li>Simpler for LLM to use in HTTP headers</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* System Architecture Diagram */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    System Architecture Diagram
                  </h2>
                  <div className="p-6 rounded-xl bg-dark-900 border border-dark-700 overflow-x-auto">
                    <pre className="text-xs md:text-sm text-dark-300 font-mono whitespace-pre">
                      {`┌─────────────────────────────────────────────────────────────────────────────┐
│                           YOUR ENVIRONMENT                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         OPENCLAW GATEWAY                                 │ │
│  │                                                                          │ │
│  │   ┌──────────────┐    ┌───────────────┐    ┌──────────────────────────┐ │ │
│  │   │   Telegram   │    │               │    │    Skills Directory      │ │ │
│  │   │   WhatsApp   │───▶│   LLM Engine  │───▶│    ~/.openclaw/skills/   │ │ │
│  │   │   Discord    │    │  (Claude/GPT) │    │                          │ │ │
│  │   └──────────────┘    └───────────────┘    │    ├─ habit-tracker/     │ │ │
│  │         ▲                     │            │    │   └─ SKILL.md       │ │ │
│  │         │                     │            │    ├─ other-skill/       │ │ │
│  │         │              Reads skill,        │    └─ ...                │ │ │
│  │   User Message         decides action      └──────────────────────────┘ │ │
│  │                               │                                          │ │
│  │                               ▼                                          │ │
│  │                    ┌───────────────────┐                                │ │
│  │                    │   HTTP Executor   │                                │ │
│  │                    │                   │                                │ │
│  │                    │  Injects env vars │                                │ │
│  │                    │  Makes API calls  │                                │ │
│  │                    └─────────┬─────────┘                                │ │
│  │                              │                                          │ │
│  └──────────────────────────────┼──────────────────────────────────────────┘ │
│                                 │                                            │
│                    HTTP Request │ Headers: X-API-Key: <key>                  │
│                                 │ Body: { name, value, ... }                 │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      HABIT TRACKER BACKEND                               │ │
│  │                                                                          │ │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐ │ │
│  │   │  API Key     │    │              │    │                          │ │ │
│  │   │  Middleware  │───▶│  Bot Service │───▶│   PostgreSQL Database    │ │ │
│  │   │              │    │              │    │                          │ │ │
│  │   │ Validates    │    │ Fuzzy match  │    │  Users, Habits, Logs     │ │ │
│  │   │ X-API-Key    │    │ Create logs  │    │  API Keys, Streaks       │ │ │
│  │   └──────────────┘    └──────────────┘    └──────────────────────────┘ │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘`}
                    </pre>
                  </div>
                </div>

                {/* Detailed Data Flow */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Detailed Request Flow</h2>
                  <p className="text-dark-300 mb-4">
                    Let's trace exactly what happens when you send "Done with 30 minutes of
                    meditation" from Telegram:
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        step: 1,
                        title: 'Message Sent',
                        subtitle: 'Telegram → OpenClaw',
                        description:
                          'You type the message in Telegram. The Telegram bot forwards it to OpenClaw via webhook or polling.',
                        icon: Smartphone,
                        color: 'blue',
                        details: [
                          'Telegram bot receives your message',
                          'Forwards to OpenClaw gateway running locally',
                          'Message includes: text, chat ID, user info',
                        ],
                      },
                      {
                        step: 2,
                        title: 'Skill Matching',
                        subtitle: 'OpenClaw Gateway',
                        description:
                          'OpenClaw analyzes the message and determines which skill to use based on content.',
                        icon: Zap,
                        color: 'yellow',
                        details: [
                          'Checks message against skill triggers/descriptions',
                          '"meditation", "done", "30 minutes" → habit-tracker skill',
                          'Loads SKILL.md content into context',
                        ],
                      },
                      {
                        step: 3,
                        title: 'LLM Processing',
                        subtitle: 'Claude/GPT',
                        description:
                          'The LLM receives the message + skill instructions and decides what API call to make.',
                        icon: Server,
                        color: 'purple',
                        details: [
                          'LLM reads: user message + SKILL.md instructions',
                          'Understands: habit="meditation", value=30, action=check-in',
                          'Decides: POST /api/bot/habits/check-in-by-name',
                          'Constructs: {"name": "meditation", "value": 30, "completed": true}',
                        ],
                      },
                      {
                        step: 4,
                        title: 'API Call Executed',
                        subtitle: 'HTTP Request',
                        description:
                          'OpenClaw makes the actual HTTP request to your backend with proper authentication.',
                        icon: Code,
                        color: 'green',
                        details: [
                          'URL: $HABIT_TRACKER_API_URL/api/bot/habits/check-in-by-name',
                          'Header: X-API-Key: $HABIT_TRACKER_API_KEY',
                          'Body: {"name": "meditation", "value": 30, "completed": true}',
                          'Environment variables injected from openclaw.json',
                        ],
                      },
                      {
                        step: 5,
                        title: 'Backend Processing',
                        subtitle: 'Habit Tracker API',
                        description:
                          'Your backend validates the request, finds the habit, and creates the log entry.',
                        icon: Database,
                        color: 'cyan',
                        details: [
                          'API Key middleware validates X-API-Key header',
                          'Extracts userId from API key record',
                          'Fuzzy search: "meditation" matches "Daily Meditation"',
                          'Creates HabitLog in PostgreSQL with value=30',
                          'Calculates streak, completion percentage',
                        ],
                      },
                      {
                        step: 6,
                        title: 'Response Returned',
                        subtitle: 'Backend → OpenClaw',
                        description:
                          'Backend returns structured JSON with habit details, streak, and completion status.',
                        icon: RefreshCw,
                        color: 'green',
                        details: [
                          'Response: {success: true, data: {habit, log, streak: 5}}',
                          'Includes: name, target, current value, isComplete',
                          'Streak info: currentStreak, bestStreak',
                        ],
                      },
                      {
                        step: 7,
                        title: 'User Response',
                        subtitle: 'OpenClaw → Telegram',
                        description:
                          'LLM formats the API response into a friendly message and sends it back to you.',
                        icon: MessageCircle,
                        color: 'green',
                        details: [
                          'LLM reads API response + SKILL.md formatting rules',
                          'Formats: "✅ Logged: Meditation - 30/30 minutes"',
                          'Adds: "🔥 Streak: 5 days - keep it going!"',
                          'Sends via Telegram bot to your chat',
                        ],
                      },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="p-4 rounded-xl bg-dark-800 border border-dark-700"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={clsx(
                              'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                              item.color === 'blue' && 'bg-blue-500/20',
                              item.color === 'purple' && 'bg-accent-purple/20',
                              item.color === 'yellow' && 'bg-yellow-500/20',
                              item.color === 'green' && 'bg-accent-green/20',
                              item.color === 'cyan' && 'bg-cyan-500/20'
                            )}
                          >
                            <item.icon
                              size={24}
                              className={clsx(
                                item.color === 'blue' && 'text-blue-400',
                                item.color === 'purple' && 'text-accent-purple',
                                item.color === 'yellow' && 'text-yellow-400',
                                item.color === 'green' && 'text-accent-green',
                                item.color === 'cyan' && 'text-cyan-400'
                              )}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-dark-500">
                                Step {item.step}
                              </span>
                              <span className="text-xs text-dark-600">•</span>
                              <span className="text-xs text-dark-500">{item.subtitle}</span>
                            </div>
                            <h3 className="font-medium text-white mb-1">{item.title}</h3>
                            <p className="text-sm text-dark-400 mb-3">{item.description}</p>
                            <div className="p-3 rounded-lg bg-dark-900 border border-dark-600">
                              <ul className="text-xs text-dark-400 space-y-1">
                                {item.details.map((detail, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-dark-600 mt-0.5">→</span>
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Model */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Security Model</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <h3 className="font-medium text-white mb-2">🔑 API Key Storage</h3>
                      <p className="text-sm text-dark-400">
                        Your API key is stored locally in{' '}
                        <code className="text-primary-400">~/.openclaw/openclaw.json</code>. It
                        never leaves your machine except when making API calls to your own backend.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <h3 className="font-medium text-white mb-2">🔒 Key Hashing</h3>
                      <p className="text-sm text-dark-400">
                        The backend stores only a SHA-256 hash of your API key. Even if the database
                        is compromised, the actual key cannot be recovered.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <h3 className="font-medium text-white mb-2">🚫 Scope Limitation</h3>
                      <p className="text-sm text-dark-400">
                        Bot API endpoints can only access habits and create logs. They cannot delete
                        accounts, change passwords, or access sensitive settings.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <h3 className="font-medium text-white mb-2">🔄 Key Rotation</h3>
                      <p className="text-sm text-dark-400">
                        You can revoke and regenerate your API key at any time from Settings → API
                        Access. The old key immediately stops working.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Environment Variables */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Environment Variables</h2>
                  <p className="text-dark-300 mb-4">
                    OpenClaw injects these variables into the skill execution context:
                  </p>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-dark-800 border border-dark-700">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-primary-400 font-mono">HABIT_TRACKER_API_URL</code>
                      </div>
                      <p className="text-sm text-dark-400">
                        The base URL of your backend (e.g., http://localhost:8080)
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-dark-800 border border-dark-700">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-primary-400 font-mono">HABIT_TRACKER_API_KEY</code>
                      </div>
                      <p className="text-sm text-dark-400">
                        Your API key from Settings → API Access
                      </p>
                    </div>
                  </div>
                </div>

                {/* Why This Design */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Why This Design?</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-dark-800 border border-primary-500/20">
                      <h3 className="font-medium text-primary-400 mb-2">
                        Flexibility over Rigidity
                      </h3>
                      <p className="text-sm text-dark-400">
                        Traditional bots require exact commands like "/log meditation 30". With
                        AI-first design, you can say "just did 30 mins of meditating", "meditated
                        for half an hour", or even "finally sat down and cleared my mind for 30
                        minutes" - they all work.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-accent-green/10 to-dark-800 border border-accent-green/20">
                      <h3 className="font-medium text-accent-green mb-2">Privacy by Default</h3>
                      <p className="text-sm text-dark-400">
                        OpenClaw runs on YOUR machine. Your messages, habits, and data never pass
                        through third-party servers (except the LLM API for processing, which
                        doesn't store data).
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-accent-purple/10 to-dark-800 border border-accent-purple/20">
                      <h3 className="font-medium text-accent-purple mb-2">Extensibility</h3>
                      <p className="text-sm text-dark-400">
                        Want to add a new feature? Just update the SKILL.md file. Add new endpoints
                        to the backend, document them in the skill, and the AI will learn to use
                        them automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Setup Section */}
            {activeSection === 'setup' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-6">Step-by-Step Setup</h2>

                  {/* Step 1 */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleStep(1)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                        1
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-white">Generate an API Key</h3>
                        <p className="text-sm text-dark-400">
                          Get your authentication key from the app
                        </p>
                      </div>
                      {expandedSteps.includes(1) ? (
                        <ChevronDown size={20} className="text-dark-400" />
                      ) : (
                        <ChevronRight size={20} className="text-dark-400" />
                      )}
                    </button>
                    {expandedSteps.includes(1) && (
                      <div className="mt-2 p-4 rounded-xl bg-dark-900 border border-dark-700 ml-14">
                        <ol className="list-decimal list-inside space-y-2 text-dark-300">
                          <li>
                            Go to <strong className="text-white">Settings → API Access</strong>
                          </li>
                          <li>
                            Click <strong className="text-primary-400">"Generate API Key"</strong>
                          </li>
                          <li>Copy and save the key (it won't be shown again!)</li>
                        </ol>
                        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
                            <p className="text-sm text-yellow-300">
                              Keep your API key secret! It provides full access to your habits.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2 */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleStep(2)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-white">Install OpenClaw</h3>
                        <p className="text-sm text-dark-400">One-line installer for macOS/Linux</p>
                      </div>
                      {expandedSteps.includes(2) ? (
                        <ChevronDown size={20} className="text-dark-400" />
                      ) : (
                        <ChevronRight size={20} className="text-dark-400" />
                      )}
                    </button>
                    {expandedSteps.includes(2) && (
                      <div className="mt-2 p-4 rounded-xl bg-dark-900 border border-dark-700 ml-14 space-y-4">
                        <CodeBlock
                          code="curl -fsSL https://openclaw.ai/install.sh | bash"
                          copyLabel="Install command"
                        />
                        <p className="text-sm text-dark-400">Or install via npm:</p>
                        <CodeBlock code="npm install -g openclaw" copyLabel="npm command" />
                        <a
                          href="https://openclaw.ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
                        >
                          Learn more about OpenClaw <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Step 3 */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleStep(3)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                        3
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-white">Copy the Skill</h3>
                        <p className="text-sm text-dark-400">Add habit-tracker skill to OpenClaw</p>
                      </div>
                      {expandedSteps.includes(3) ? (
                        <ChevronDown size={20} className="text-dark-400" />
                      ) : (
                        <ChevronRight size={20} className="text-dark-400" />
                      )}
                    </button>
                    {expandedSteps.includes(3) && (
                      <div className="mt-2 p-4 rounded-xl bg-dark-900 border border-dark-700 ml-14 space-y-4">
                        <p className="text-sm text-dark-300">
                          From the habit-tracker project directory:
                        </p>
                        <CodeBlock
                          code="cp -r openclaw/habit-tracker ~/.openclaw/skills/"
                          copyLabel="Copy command"
                        />
                      </div>
                    )}
                  </div>

                  {/* Step 4 */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleStep(4)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                        4
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-white">Configure Environment Variables</h3>
                        <p className="text-sm text-dark-400">
                          Add API credentials to OpenClaw config
                        </p>
                      </div>
                      {expandedSteps.includes(4) ? (
                        <ChevronDown size={20} className="text-dark-400" />
                      ) : (
                        <ChevronRight size={20} className="text-dark-400" />
                      )}
                    </button>
                    {expandedSteps.includes(4) && (
                      <div className="mt-2 p-4 rounded-xl bg-dark-900 border border-dark-700 ml-14 space-y-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-white mb-2">
                              Option A: Using CLI (Recommended)
                            </p>
                            <p className="text-xs text-dark-400 mb-3">
                              Set environment variables using OpenClaw commands:
                            </p>
                            <CodeBlock
                              code={`openclaw config set skills.entries.habit-tracker.enabled true
openclaw config set skills.entries.habit-tracker.env.HABIT_TRACKER_API_URL http://localhost:8080
openclaw config set skills.entries.habit-tracker.env.HABIT_TRACKER_API_KEY your_api_key_here`}
                              copyLabel="CLI commands"
                            />
                          </div>
                          <div className="pt-3 border-t border-dark-700">
                            <p className="text-sm font-medium text-white mb-2">
                              Option B: Manual Configuration
                            </p>
                            <p className="text-xs text-dark-400 mb-3">
                              Or edit{' '}
                              <code className="text-primary-400">~/.openclaw/openclaw.json</code>{' '}
                              directly:
                            </p>
                            <CodeBlock
                              language="json"
                              code={`{
  "skills": {
    "entries": {
      "habit-tracker": {
        "enabled": true,
        "env": {
          "HABIT_TRACKER_API_URL": "http://localhost:8080",
          "HABIT_TRACKER_API_KEY": "your_api_key_here"
        }
      }
    }
  }
}`}
                              copyLabel="JSON config"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 5 */}
                  <div className="mb-4">
                    <button
                      onClick={() => toggleStep(5)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                        5
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-white">Verify the Skill</h3>
                        <p className="text-sm text-dark-400">Check that everything is configured</p>
                      </div>
                      {expandedSteps.includes(5) ? (
                        <ChevronDown size={20} className="text-dark-400" />
                      ) : (
                        <ChevronRight size={20} className="text-dark-400" />
                      )}
                    </button>
                    {expandedSteps.includes(5) && (
                      <div className="mt-2 p-4 rounded-xl bg-dark-900 border border-dark-700 ml-14 space-y-4">
                        <CodeBlock code="openclaw skills info habit-tracker" copyLabel="Command" />
                        <p className="text-sm text-dark-300">You should see:</p>
                        <div className="p-3 rounded-lg bg-dark-800 border border-dark-700">
                          <pre className="text-sm text-dark-300 font-mono">
                            {`📦 habit-tracker ✓ Ready

Requirements:
  Environment: ✓ HABIT_TRACKER_API_URL, ✓ HABIT_TRACKER_API_KEY`}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 6 */}
                  <div>
                    <button
                      onClick={() => toggleStep(6)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent-green flex items-center justify-center text-white font-bold">
                        6
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-white">Start Using It!</h3>
                        <p className="text-sm text-dark-400">Send a message to test</p>
                      </div>
                      {expandedSteps.includes(6) ? (
                        <ChevronDown size={20} className="text-dark-400" />
                      ) : (
                        <ChevronRight size={20} className="text-dark-400" />
                      )}
                    </button>
                    {expandedSteps.includes(6) && (
                      <div className="mt-2 p-4 rounded-xl bg-accent-green/10 border border-accent-green/20 ml-14">
                        <p className="text-sm text-dark-300 mb-3">
                          Send one of these messages via Telegram:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            'Show my habits',
                            "What's left today?",
                            'Done with meditation',
                            'Drank 5 glasses of water',
                          ].map((msg) => (
                            <div
                              key={msg}
                              className="px-3 py-2 rounded-lg bg-dark-800 text-sm text-dark-300 border border-dark-700"
                            >
                              "{msg}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* API Reference Section */}
            {activeSection === 'api' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Bot API Endpoints</h2>
                  <p className="text-dark-300 mb-4">
                    All endpoints require the <code className="text-primary-400">X-API-Key</code>{' '}
                    header.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark-700">
                          <th className="text-left py-3 px-4 text-dark-300 font-medium">Method</th>
                          <th className="text-left py-3 px-4 text-dark-300 font-medium">
                            Endpoint
                          </th>
                          <th className="text-left py-3 px-4 text-dark-300 font-medium">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-dark-800">
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded bg-accent-green/20 text-accent-green text-xs font-mono">
                              GET
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm text-dark-300">
                            /api/bot/habits/today
                          </td>
                          <td className="py-3 px-4 text-dark-400">
                            Get today's habits with status
                          </td>
                        </tr>
                        <tr className="border-b border-dark-800">
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">
                              POST
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm text-dark-300">
                            /api/bot/habits/check-in-by-name
                          </td>
                          <td className="py-3 px-4 text-dark-400">
                            Log a habit by name (fuzzy match)
                          </td>
                        </tr>
                        <tr className="border-b border-dark-800">
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">
                              POST
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm text-dark-300">
                            /api/bot/habits/check-in
                          </td>
                          <td className="py-3 px-4 text-dark-400">Log a habit by ID</td>
                        </tr>
                        <tr className="border-b border-dark-800">
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded bg-accent-green/20 text-accent-green text-xs font-mono">
                              GET
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm text-dark-300">
                            /api/bot/habits/summary
                          </td>
                          <td className="py-3 px-4 text-dark-400">Get daily completion summary</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">
                              POST
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm text-dark-300">
                            /api/bot/register-chat
                          </td>
                          <td className="py-3 px-4 text-dark-400">Register chat for reminders</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Habit Types */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Habit Types</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-dark-800 border border-dark-700">
                      <h3 className="font-medium text-white mb-2">BOOLEAN</h3>
                      <p className="text-sm text-dark-400 mb-2">
                        Simple yes/no habits like "Journal" or "Take vitamins"
                      </p>
                      <CodeBlock
                        language="json"
                        code='{"name": "journal", "completed": true}'
                        copyLabel="Example"
                      />
                    </div>
                    <div className="p-4 rounded-lg bg-dark-800 border border-dark-700">
                      <h3 className="font-medium text-white mb-2">NUMERIC</h3>
                      <p className="text-sm text-dark-400 mb-2">
                        Count-based habits like "Drink Water" (8 glasses)
                      </p>
                      <CodeBlock
                        language="json"
                        code='{"name": "water", "completed": true, "value": 5}'
                        copyLabel="Example"
                      />
                    </div>
                    <div className="p-4 rounded-lg bg-dark-800 border border-dark-700">
                      <h3 className="font-medium text-white mb-2">DURATION</h3>
                      <p className="text-sm text-dark-400 mb-2">
                        Time-based habits like "Meditation" (30 minutes)
                      </p>
                      <CodeBlock
                        language="json"
                        code='{"name": "meditation", "completed": true, "value": 25}'
                        copyLabel="Example"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Examples Section */}
            {activeSection === 'examples' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Example Conversations</h2>

                  <div className="space-y-6">
                    {/* Example 1 */}
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <h3 className="font-medium text-white mb-3">Viewing Habits</h3>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">You</span>
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-dark-900 text-dark-300">
                            Show my habits
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">🤖</span>
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-accent-purple/10 border border-accent-purple/20 text-dark-300">
                            <p className="mb-2">📋 Today's Habits (2/4):</p>
                            <p>✅ Drink Water - 6/8 glasses</p>
                            <p>✅ Morning Stretch - Done</p>
                            <p>⬜ Reading - 0/30 minutes</p>
                            <p>⬜ Meditation - 0/20 minutes</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Example 2 */}
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <h3 className="font-medium text-white mb-3">Logging a Habit</h3>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">You</span>
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-dark-900 text-dark-300">
                            Just finished 30 minutes of reading
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">🤖</span>
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-accent-green/10 border border-accent-green/20 text-dark-300">
                            ✅ Logged: Reading - 30/30 minutes. Goal reached! 🎉
                            <br />
                            Streak: 8 days - keep it going!
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Example 3 */}
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <h3 className="font-medium text-white mb-3">Asking for Value</h3>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">You</span>
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-dark-900 text-dark-300">
                            Did meditation
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">🤖</span>
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-accent-purple/10 border border-accent-purple/20 text-dark-300">
                            How long did you meditate? Your goal is 20 minutes.
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">You</span>
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-dark-900 text-dark-300">
                            About 15 minutes
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs">🤖</span>
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-accent-green/10 border border-accent-green/20 text-dark-300">
                            ✅ Logged: Meditation - 15/20 minutes. Almost there!
                            <br />
                            Streak: 3 days.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Messages */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Quick Messages to Try</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'Show my habits',
                      "What's left today?",
                      'How am I doing?',
                      'Done with journaling',
                      'Drank 5 glasses of water',
                      'Meditated for 20 minutes',
                      'Finished my workout',
                      'Read for half an hour',
                      'Register this chat',
                    ].map((msg) => (
                      <button
                        key={msg}
                        onClick={() => copyToClipboard(msg, 'Message')}
                        className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors text-left"
                      >
                        <span className="text-sm text-dark-300">"{msg}"</span>
                        {copiedText === msg ? (
                          <Check size={14} className="text-accent-green" />
                        ) : (
                          <Copy size={14} className="text-dark-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Troubleshooting Section */}
            {activeSection === 'troubleshooting' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Common Issues</h2>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-medium text-white">Skill not found</h3>
                          <p className="text-sm text-dark-400 mt-1">
                            <code>openclaw skills list</code> doesn't show habit-tracker
                          </p>
                          <div className="mt-3">
                            <p className="text-sm text-dark-300 mb-2">Solution:</p>
                            <CodeBlock
                              code="cp -r openclaw/habit-tracker ~/.openclaw/skills/"
                              copyLabel="Command"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-medium text-white">Missing environment variables</h3>
                          <p className="text-sm text-dark-400 mt-1">Skill shows ✗ for env vars</p>
                          <p className="text-sm text-dark-300 mt-3">
                            Solution: Add env vars to{' '}
                            <code className="text-primary-400">~/.openclaw/openclaw.json</code>{' '}
                            under{' '}
                            <code className="text-primary-400">
                              skills.entries.habit-tracker.env
                            </code>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-medium text-white">401 Unauthorized errors</h3>
                          <p className="text-sm text-dark-400 mt-1">
                            API calls fail with authentication errors
                          </p>
                          <p className="text-sm text-dark-300 mt-3">
                            Solution: Verify your API key is correct. Regenerate it from Settings →
                            API Access if needed.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-medium text-white">Rate limit error (HTTP 429)</h3>
                          <p className="text-sm text-dark-400 mt-1">
                            "This request would exceed your account's rate limit"
                          </p>
                          <p className="text-sm text-dark-300 mt-3">
                            Cause: Claude/OpenAI API rate limit reached.
                            <br />
                            Solution: Wait a few minutes and try again. Check your API usage at the
                            provider's console.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-medium text-white">No response to messages</h3>
                          <p className="text-sm text-dark-400 mt-1">
                            Messages appear in dashboard but no reply
                          </p>
                          <p className="text-sm text-dark-300 mt-3">Solutions:</p>
                          <ul className="list-disc list-inside text-sm text-dark-400 mt-2 space-y-1">
                            <li>Check for rate limit errors</li>
                            <li>Send habit-specific messages (not just "hello")</li>
                            <li>Check OpenClaw gateway logs for errors</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Debug Commands */}
                <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Debug Commands</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-dark-300 mb-2">Check skill status:</p>
                      <CodeBlock code="openclaw skills info habit-tracker" copyLabel="Command" />
                    </div>
                    <div>
                      <p className="text-sm text-dark-300 mb-2">View backend logs (Docker):</p>
                      <CodeBlock
                        code='docker-compose -f docker-compose.dev.yml logs -f backend | grep "🤖 Bot"'
                        copyLabel="Command"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-dark-300 mb-2">Test API connection:</p>
                      <CodeBlock
                        code={`curl -s "$HABIT_TRACKER_API_URL/api/bot/habits/today" \\
  -H "X-API-Key: $HABIT_TRACKER_API_KEY"`}
                        copyLabel="Command"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDocs;
