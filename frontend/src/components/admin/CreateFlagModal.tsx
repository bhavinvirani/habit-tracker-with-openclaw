import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { featuresApi } from '../../services/features';
import Button from '../ui/Button';

interface CreateFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCategories: string[];
}

const CreateFlagModal: React.FC<CreateFlagModalProps> = ({
  isOpen,
  onClose,
  existingCategories,
}) => {
  const queryClient = useQueryClient();
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [enabled, setEnabled] = useState(false);

  const createMutation = useMutation({
    mutationFn: featuresApi.createFlag,
    onSuccess: (flag) => {
      toast.success(`Flag "${flag.key}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-features'] });
      onClose();
    },
    onError: (error: { response?: { data?: { error?: { message: string } } } }) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create feature flag');
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setKey('');
      setName('');
      setDescription('');
      setCategory('');
      setEnabled(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      key,
      name,
      description: description || undefined,
      category: category || undefined,
      enabled,
    });
  };

  const isValid = key.length > 0 && /^[a-z0-9_]+$/.test(key) && name.length > 0;

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

        <h3 className="text-lg font-semibold text-white mb-4">Create Feature Flag</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1">
              Key <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="e.g. dark_mode"
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm"
            />
            <p className="text-xs text-dark-500 mt-1">
              Lowercase letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label className="block text-sm text-dark-400 mb-1">
              Name <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dark Mode"
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
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
              placeholder="e.g. general"
              list="flag-categories"
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm"
            />
            <datalist id="flag-categories">
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-accent-green' : 'bg-dark-600'}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : ''}`}
              />
            </button>
            <span className="text-sm text-dark-300">
              {enabled ? 'Enabled' : 'Disabled'} by default
            </span>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={onClose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createMutation.isPending}
              loading={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Flag'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFlagModal;
