import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Unplug, Loader2, Wifi, WifiOff } from 'lucide-react';
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
    description: 'Track habits through WhatsApp messages.',
    comingSoon: true,
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

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
          <Wifi size={20} className="text-accent-purple" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Connected Apps</h3>
          <p className="text-sm text-dark-400">
            Connect messaging platforms via OpenClaw to track habits by chat
          </p>
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
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{provider.name}</h4>
                      {provider.comingSoon && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-dark-700 text-dark-400">
                          Coming Soon
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
                    <div className="flex items-center gap-1 text-dark-500">
                      <WifiOff size={16} />
                      <span className="text-xs">Not connected</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Setup Instructions */}
          <div className="mt-4 p-4 rounded-xl bg-dark-900 border border-dark-700">
            <h4 className="text-sm font-medium text-white mb-2">How to connect</h4>
            <ol className="text-sm text-dark-400 space-y-2 list-decimal list-inside">
              <li>Generate an API key in the "API Access" section above</li>
              <li>
                Install{' '}
                <a
                  href="https://openclaw.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300"
                >
                  OpenClaw
                </a>{' '}
                on your computer
              </li>
              <li>
                Copy the{' '}
                <code className="px-1 py-0.5 bg-dark-800 rounded text-xs">habit-tracker</code> skill
                to{' '}
                <code className="px-1 py-0.5 bg-dark-800 rounded text-xs">~/.openclaw/skills/</code>
              </li>
              <li>Set your API URL and key in OpenClaw&apos;s environment</li>
              <li>Connect OpenClaw to your preferred messaging platform</li>
              <li>Send &quot;register this chat for reminders&quot; to link the chat</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectedApps;
