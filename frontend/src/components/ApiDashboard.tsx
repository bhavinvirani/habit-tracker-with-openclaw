import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Key,
  Copy,
  RefreshCw,
  Trash2,
  Check,
  AlertTriangle,
  ExternalLink,
  Code,
  Loader2,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import clsx from 'clsx';

interface ApiKeyData {
  hasKey: boolean;
  apiKey: string | null;
  createdAt: string | null;
}

const ApiDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch API key status
  const { data: apiKeyData, isLoading } = useQuery<ApiKeyData>({
    queryKey: ['api-key'],
    queryFn: async () => {
      const response = await api.get('/users/api-key');
      return response.data.data;
    },
  });

  // Generate new API key
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/users/api-key');
      return response.data.data.apiKey;
    },
    onSuccess: (key) => {
      setNewKey(key);
      setShowKey(true);
      queryClient.invalidateQueries({ queryKey: ['api-key'] });
      toast.success("API key generated! Copy it now - you won't see it again.");
    },
    onError: () => {
      toast.error('Failed to generate API key');
    },
  });

  // Revoke API key
  const revokeMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/users/api-key');
    },
    onSuccess: () => {
      setNewKey(null);
      queryClient.invalidateQueries({ queryKey: ['api-key'] });
      toast.success('API key revoked');
    },
    onError: () => {
      toast.error('Failed to revoke API key');
    },
  });

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const displayKey = newKey || apiKeyData?.apiKey;

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
          <Key size={20} className="text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">API Access</h3>
          <p className="text-sm text-dark-400">Integrate with external tools and automations</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
        </div>
      ) : (
        <>
          {/* API Key Display */}
          {apiKeyData?.hasKey || newKey ? (
            <div className="space-y-4">
              {/* Key Display */}
              <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Your API Key</span>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-dark-400 hover:text-white transition-colors"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm text-white bg-dark-800 px-3 py-2 rounded-lg overflow-x-auto">
                    {showKey ? displayKey : '•'.repeat(40)}
                  </code>
                  {displayKey && (
                    <button
                      onClick={() => handleCopy(displayKey)}
                      className={clsx(
                        'p-2 rounded-lg transition-colors',
                        copied
                          ? 'bg-accent-green/20 text-accent-green'
                          : 'bg-dark-800 text-dark-400 hover:text-white'
                      )}
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  )}
                </div>
                {apiKeyData?.createdAt && (
                  <p className="text-xs text-dark-500 mt-2">
                    Created {new Date(apiKeyData.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Warning for new key */}
              {newKey && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-yellow/10 border border-accent-yellow/20">
                  <AlertTriangle size={20} className="text-accent-yellow flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-accent-yellow">Save your API key now!</p>
                    <p className="text-sm text-dark-400 mt-1">
                      This is the only time you'll see the full key. Store it securely.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="btn btn-secondary flex-1"
                >
                  {generateMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  Regenerate Key
                </button>
                <button
                  onClick={() => revokeMutation.mutate()}
                  disabled={revokeMutation.isPending}
                  className="btn bg-accent-red/20 text-accent-red hover:bg-accent-red/30"
                >
                  {revokeMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Revoke
                </button>
              </div>
            </div>
          ) : (
            /* No API Key */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-dark-500" />
              </div>
              <h4 className="font-medium text-white mb-2">No API Key</h4>
              <p className="text-sm text-dark-400 mb-4">
                Generate an API key to integrate with external tools
              </p>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="btn btn-primary"
              >
                {generateMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Key size={16} />
                )}
                Generate API Key
              </button>
            </div>
          )}

          {/* API Documentation Link */}
          <div className="mt-6 pt-6 border-t border-dark-700">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Code size={16} className="text-primary-400" />
              Quick Start
            </h4>
            <div className="p-3 rounded-lg bg-dark-900 border border-dark-700">
              <code className="text-xs text-dark-300 font-mono">
                curl -H "Authorization: Bearer YOUR_API_KEY" \<br />
                &nbsp;&nbsp;{window.location.origin}/api/habits
              </code>
            </div>
            <a
              href="/docs/api"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
            >
              View API Documentation
              <ExternalLink size={14} />
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default ApiDashboard;
