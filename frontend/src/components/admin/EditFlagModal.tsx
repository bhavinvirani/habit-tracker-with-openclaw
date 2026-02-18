import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { featuresApi } from '../../services/features';
import { FeatureFlag } from '../../types';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import Button from '../ui/Button';

interface EditFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  flag: FeatureFlag | null;
  existingCategories: string[];
}

const EditFlagModal: React.FC<EditFlagModalProps> = ({
  isOpen,
  onClose,
  flag,
  existingCategories,
}) => {
  const queryClient = useQueryClient();
  const { refetch: refetchFeatureFlags } = useFeatureFlags();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [metadataStr, setMetadataStr] = useState('');

  useEffect(() => {
    if (flag && isOpen) {
      setName(flag.name);
      setDescription(flag.description || '');
      setCategory(flag.category);
      setMetadataStr(flag.metadata ? JSON.stringify(flag.metadata, null, 2) : '{}');
    }
  }, [flag, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof featuresApi.updateFlag>[1]) =>
      featuresApi.updateFlag(flag!.key, data),
    onSuccess: () => {
      toast.success(`Flag "${flag!.key}" updated successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-features'] });
      refetchFeatureFlags();
      onClose();
    },
    onError: () => {
      toast.error('Failed to update feature flag');
    },
  });

  if (!isOpen || !flag) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let metadata: Record<string, unknown> | undefined;
    try {
      const parsed = JSON.parse(metadataStr);
      if (typeof parsed === 'object' && parsed !== null) {
        metadata = parsed;
      }
    } catch {
      toast.error('Invalid JSON in metadata field');
      return;
    }

    updateMutation.mutate({
      name,
      description: description || undefined,
      category: category || undefined,
      metadata,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-800 border border-dark-600 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold text-white mb-1">Edit Feature Flag</h3>
        <p className="text-sm text-dark-400 mb-4">
          <code className="px-1.5 py-0.5 rounded bg-dark-700 text-dark-300">{flag.key}</code>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-400 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="edit-flag-categories"
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm"
            />
            <datalist id="edit-flag-categories">
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm text-dark-400 mb-1">Metadata (JSON)</label>
            <textarea
              value={metadataStr}
              onChange={(e) => setMetadataStr(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-mono resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name || updateMutation.isPending}
              loading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFlagModal;
