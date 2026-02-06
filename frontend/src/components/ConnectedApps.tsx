import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle,
  Unplug,
  Loader2,
  Wifi,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Key,
  Download,
  Terminal,
  Send,
  CheckCircle2,
  ArrowRight,
  Bell,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { integrationsApi, ConnectedApp } from '../services/integrations';
import clsx from 'clsx';

const PROVIDERS = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: MessageCircle,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Send habit updates and receive reminders via Telegram.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Message yourself on WhatsApp to track habits via OpenClaw.',
    requiresOpenClaw: true,
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: MessageCircle,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    description: 'Use Discord to manage your habits.',
    comingSoon: true,
  },
];

const ConnectedApps: React.FC = () => {
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const { data: connectedApps, isLoading } = useQuery({
    queryKey: ['connected-apps'],
    queryFn: integrationsApi.getConnectedApps,
  });

  const disconnectMutation = useMutation({
    mutationFn: integrationsApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-apps'] });
      toast.success('App disconnected');
    },
    onError: () => {
      toast.error('Failed to disconnect');
    },
  });

  const getAppConnection = (providerId: string): ConnectedApp | undefined => {
    return connectedApps?.find((app) => app.provider === providerId && app.isActive);
  };

  const hasAnyConnection = connectedApps && connectedApps.length > 0;

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const setupSteps = [
    {
      number: 1,
      title: 'Create Telegram Bot',
      icon: Smartphone,
      description: 'Set up a bot using @BotFather on Telegram',
      action: (
        <div className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-sm text-dark-300">
            <li>
              Open Telegram and search for <code className="text-primary-400">@BotFather</code>
            </li>
            <li>
              Send <code className="text-primary-400">/newbot</code> and follow the prompts
            </li>
            <li>
              Copy the bot token (format:{' '}
              <code className="text-xs text-dark-400">123456789:ABCdef...</code>)
            </li>
            <li>
              Add <code className="text-primary-400">TELEGRAM_BOT_TOKEN</code> to your backend
              environment
            </li>
          </ol>
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-300">⚠️ Keep your bot token secret!</p>
          </div>
        </div>
      ),
    },
    {
      number: 2,
      title: 'Get your API Key',
      icon: Key,
      description: 'Generate an API key from the "API Access" section above',
      action: (
        <p className="text-sm text-dark-400">
          Scroll up to <span className="text-primary-400 font-medium">API Access</span> and click
          "Generate API Key"
        </p>
      ),
    },
    {
      number: 3,
      title: 'Install OpenClaw',
      icon: Download,
      description: 'Install the OpenClaw CLI on your computer',
      action: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-dark-800 rounded-lg text-sm text-dark-300 font-mono">
              npm install -g openclaw
            </code>
            <button
              onClick={() => copyToClipboard('npm install -g openclaw', 'Command')}
              className="btn btn-sm bg-dark-700 hover:bg-dark-600"
            >
              {copiedText === 'npm install -g openclaw' ? (
                <Check size={14} className="text-accent-green" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
          <a
            href="https://openclaw.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
          >
            Learn more about OpenClaw <ExternalLink size={12} />
          </a>
        </div>
      ),
    },
    {
      number: 4,
      title: 'Configure & Connect',
      icon: Send,
      description: 'Set up environment variables and register your chat',
      action: (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-dark-800 border border-dark-700">
            <p className="text-sm text-dark-300 mb-2">
              <strong className="text-white">Set environment variables using CLI:</strong>
            </p>
            <div className="space-y-1 text-xs font-mono text-dark-400">
              <p>openclaw config set skills.entries.habit-tracker.enabled true</p>
              <p>
                openclaw config set skills.entries.habit-tracker.env.HABIT_TRACKER_API_URL
                http://localhost:8080
              </p>
              <p>
                openclaw config set skills.entries.habit-tracker.env.HABIT_TRACKER_API_KEY
                your_api_key
              </p>
            </div>
          </div>
          <p className="text-sm text-dark-400">
            Then send{' '}
            <code className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded">
              register this chat
            </code>{' '}
            to your Telegram bot
          </p>
          <a
            href="/docs/integration"
            className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
          >
            View full setup guide <ExternalLink size={12} />
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
          <Wifi size={20} className="text-accent-purple" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Connected Apps</h3>
          <p className="text-sm text-dark-400">
            Track habits from Telegram — updates sync here automatically
          </p>
        </div>
      </div>

      {/* How It Works - Visual Flow */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary-500/10 via-accent-purple/10 to-accent-green/10 border border-dark-700">
        <h4 className="text-sm font-medium text-white mb-3">How it works</h4>
        <div className="flex items-center justify-between gap-2 text-center">
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
              <Smartphone size={18} className="text-blue-400" />
            </div>
            <p className="text-xs text-dark-300">Send to yourself</p>
            <p className="text-[10px] text-dark-500">On Telegram or WhatsApp</p>
          </div>
          <ArrowRight size={16} className="text-dark-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-accent-purple/20 flex items-center justify-center mb-2">
              <CheckCircle2 size={18} className="text-accent-purple" />
            </div>
            <p className="text-xs text-dark-300">OpenClaw processes</p>
            <p className="text-[10px] text-dark-500">Logs to habit tracker</p>
          </div>
          <ArrowRight size={16} className="text-dark-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-accent-green/20 flex items-center justify-center mb-2">
              <Bell size={18} className="text-accent-green" />
            </div>
            <p className="text-xs text-dark-300">Get confirmation</p>
            <p className="text-[10px] text-dark-500">See streak & progress</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {PROVIDERS.map((provider) => {
            const connection = getAppConnection(provider.id);
            const Icon = provider.icon;
            const isConnected = !!connection;

            return (
              <div
                key={provider.id}
                className={clsx(
                  'p-4 rounded-xl border transition-colors',
                  provider.comingSoon
                    ? 'bg-dark-900/50 border-dark-800 opacity-50'
                    : isConnected
                      ? 'bg-dark-800 border-dark-600'
                      : 'bg-dark-900 border-dark-700 hover:border-dark-600'
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      provider.bgColor
                    )}
                  >
                    <Icon size={24} className={provider.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-white">{provider.name}</h4>
                      {provider.comingSoon && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-dark-700 text-dark-400">
                          Coming Soon
                        </span>
                      )}
                      {provider.requiresOpenClaw && !isConnected && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-accent-purple/20 text-accent-purple">
                          Requires OpenClaw
                        </span>
                      )}
                      {isConnected && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-accent-green/20 text-accent-green">
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-400 mt-0.5">{provider.description}</p>
                    {isConnected && connection.username && (
                      <p className="text-xs text-dark-500 mt-1">@{connection.username}</p>
                    )}
                  </div>

                  {!provider.comingSoon && isConnected && (
                    <button
                      onClick={() => disconnectMutation.mutate(provider.id)}
                      disabled={disconnectMutation.isPending}
                      className="btn bg-accent-red/20 text-accent-red hover:bg-accent-red/30 btn-sm"
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Unplug size={14} />
                      )}
                      Disconnect
                    </button>
                  )}

                  {!provider.comingSoon && !isConnected && (
                    <button
                      onClick={() => setShowSetup(true)}
                      className="btn btn-sm bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Setup Guide - Collapsible */}
          <div className="mt-4">
            <button
              onClick={() => setShowSetup(!showSetup)}
              className={clsx(
                'w-full p-4 rounded-xl border transition-all flex items-center justify-between',
                showSetup
                  ? 'bg-dark-800 border-primary-500/30'
                  : 'bg-dark-900 border-dark-700 hover:border-dark-600'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    showSetup ? 'bg-primary-500/20' : 'bg-dark-800'
                  )}
                >
                  {hasAnyConnection ? (
                    <CheckCircle2 size={16} className="text-accent-green" />
                  ) : (
                    <Terminal
                      size={16}
                      className={showSetup ? 'text-primary-400' : 'text-dark-400'}
                    />
                  )}
                </div>
                <div className="text-left">
                  <h4
                    className={clsx(
                      'text-sm font-medium',
                      showSetup ? 'text-white' : 'text-dark-300'
                    )}
                  >
                    {hasAnyConnection ? 'Connection Guide' : 'How to Connect'}
                  </h4>
                  <p className="text-xs text-dark-500">
                    {hasAnyConnection
                      ? 'View setup instructions again'
                      : '4 simple steps to get started'}
                  </p>
                </div>
              </div>
              {showSetup ? (
                <ChevronDown size={18} className="text-dark-400" />
              ) : (
                <ChevronRight size={18} className="text-dark-400" />
              )}
            </button>

            {showSetup && (
              <div className="mt-3 space-y-2">
                {setupSteps.map((step) => {
                  const StepIcon = step.icon;
                  const isExpanded = expandedStep === step.number;

                  return (
                    <div
                      key={step.number}
                      className={clsx(
                        'rounded-xl border transition-all overflow-hidden',
                        isExpanded ? 'bg-dark-800 border-dark-600' : 'bg-dark-900 border-dark-700'
                      )}
                    >
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                        className="w-full p-4 flex items-center gap-3 text-left"
                      >
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                            isExpanded ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-400'
                          )}
                        >
                          {step.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <StepIcon
                              size={16}
                              className={isExpanded ? 'text-primary-400' : 'text-dark-500'}
                            />
                            <span
                              className={clsx(
                                'font-medium',
                                isExpanded ? 'text-white' : 'text-dark-300'
                              )}
                            >
                              {step.title}
                            </span>
                          </div>
                          {!isExpanded && (
                            <p className="text-xs text-dark-500 mt-0.5 truncate">
                              {step.description}
                            </p>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-dark-400" />
                        ) : (
                          <ChevronRight size={16} className="text-dark-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="ml-11">{step.action}</div>
                          {step.number < 4 && (
                            <div className="ml-11 mt-4">
                              <button
                                onClick={() => setExpandedStep(step.number + 1)}
                                className="btn btn-sm bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
                              >
                                Next Step
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Success hint */}
                <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-accent-green mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-accent-green">You're all set!</p>
                      <p className="text-xs text-dark-400 mt-1">
                        Once connected, your Telegram bot will appear as "Connected" above. You can
                        then set up habit reminders in the Notifications section below.
                      </p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Specific Instructions */}
                <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/20">
                  <h4 className="text-sm font-medium text-accent-green mb-3">
                    📱 WhatsApp Setup (Easy!)
                  </h4>
                  <ol className="space-y-2 text-sm text-dark-300">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green font-bold">1.</span>
                      <span>
                        Open WhatsApp and start a chat{' '}
                        <strong className="text-white">with yourself</strong> (Message Yourself
                        option)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green font-bold">2.</span>
                      <span>
                        Make sure OpenClaw gateway is running:{' '}
                        <code className="px-2 py-0.5 bg-dark-800 text-primary-400 rounded text-xs">
                          openclaw gateway start
                        </code>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green font-bold">3.</span>
                      <span>
                        Send{' '}
                        <code className="px-2 py-0.5 bg-dark-800 text-primary-400 rounded text-xs">
                          register this chat
                        </code>{' '}
                        to yourself on WhatsApp
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green font-bold">4.</span>
                      <span>Start tracking! Send "Done with meditation" or "Show my habits"</span>
                    </li>
                  </ol>
                </div>

                {/* Example Messages */}
                <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
                  <h4 className="text-sm font-medium text-white mb-3">
                    💬 Example messages you can send
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Done with meditation',
                      'Drank 5 glasses of water',
                      'Read for 30 minutes',
                      'Finished my workout',
                      "What's left today?",
                      'Show my habits',
                    ].map((msg) => (
                      <div
                        key={msg}
                        className="px-3 py-2 rounded-lg bg-dark-800 text-sm text-dark-300 border border-dark-700"
                      >
                        "{msg}"
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-dark-500 mt-3">
                    Send these to <strong>yourself on WhatsApp</strong> — OpenClaw intercepts and
                    processes them!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectedApps;
