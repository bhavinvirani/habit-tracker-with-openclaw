import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface QuickLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: number, completed: boolean) => void;
  habitName: string;
  habitIcon: string | null;
  habitColor: string;
  currentValue: number;
  targetValue: number;
  unit: string | null;
  loading?: boolean;
}

function getQuickAddButtons(target: number): number[] {
  if (target <= 10) return [1, 2, 5];
  if (target <= 30) return [1, 5, 10];
  return [5, 10, 15];
}

const QuickLogDialog: React.FC<QuickLogDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  habitName,
  habitIcon,
  habitColor,
  currentValue,
  targetValue,
  unit,
  loading = false,
}) => {
  const [customValue, setCustomValue] = useState(currentValue);
  const [showCustom, setShowCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCustomValue(currentValue);
      setShowCustom(false);
    }
  }, [isOpen, currentValue]);

  // Focus input when custom section opens
  useEffect(() => {
    if (showCustom) {
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [showCustom]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && showCustom && customValue !== currentValue) {
        e.preventDefault();
        onSubmit(customValue, customValue >= targetValue);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSubmit, showCustom, customValue, currentValue, targetValue]);

  if (!isOpen) return null;

  const quickAddButtons = getQuickAddButtons(targetValue);
  const remaining = targetValue - currentValue;
  const progress = Math.min((currentValue / targetValue) * 100, 100);

  // Immediately submit: add amount to current value
  const handleQuickAdd = (amount: number) => {
    const newValue = currentValue + amount;
    onSubmit(newValue, newValue >= targetValue);
  };

  // Immediately submit: complete
  const handleComplete = () => {
    onSubmit(targetValue, true);
  };

  // Custom value handlers
  const handleIncrement = (amount: number) => {
    setCustomValue((prev) => Math.max(0, prev + amount));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setCustomValue(0);
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setCustomValue(num);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue !== currentValue) {
      onSubmit(customValue, customValue >= targetValue);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-log-title"
        className="relative bg-dark-800 border border-dark-600 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-4">
          <h3
            id="quick-log-title"
            className="text-lg font-semibold text-white flex items-center gap-2"
          >
            {habitIcon && <span>{habitIcon}</span>}
            {habitName}
          </h3>
          <p className="text-sm text-dark-400 mt-0.5">
            {currentValue} / {targetValue} {unit || ''}{' '}
            <span className="text-dark-500">({remaining} left)</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: habitColor,
              }}
            />
          </div>
        </div>

        {/* Quick-add buttons — each click submits immediately */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {quickAddButtons.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickAdd(amount)}
              disabled={loading}
              className="py-3 rounded-xl bg-dark-700 text-base font-semibold text-white hover:bg-dark-600 active:scale-95 transition-all"
            >
              +{amount} {unit || ''}
            </button>
          ))}
          {/* Complete button — submits immediately */}
          <button
            onClick={handleComplete}
            disabled={loading}
            className="py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: `${habitColor}20`,
              color: habitColor,
            }}
          >
            <Check size={16} />
            Complete
          </button>
        </div>

        {/* Custom value toggle */}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-dark-400 hover:text-dark-300 transition-colors"
        >
          Custom value
          <ChevronDown
            size={14}
            className={clsx('transition-transform', showCustom && 'rotate-180')}
          />
        </button>

        {/* Custom value section (collapsible) */}
        {showCustom && (
          <div className="mt-2 pt-3 border-t border-dark-700">
            <div className="flex items-center justify-center gap-3 mb-3">
              <button
                onClick={() => handleIncrement(-1)}
                disabled={customValue <= 0}
                className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                  customValue <= 0
                    ? 'bg-dark-700 text-dark-600 cursor-not-allowed'
                    : 'bg-dark-700 text-white hover:bg-dark-600 active:scale-95'
                )}
              >
                <Minus size={16} />
              </button>
              <input
                ref={inputRef}
                type="number"
                min={0}
                value={customValue}
                onChange={handleInputChange}
                className="w-24 h-10 rounded-xl bg-dark-700 border border-dark-500 text-center text-lg font-bold text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => handleIncrement(1)}
                className="w-10 h-10 rounded-xl bg-dark-700 text-white hover:bg-dark-600 active:scale-95 transition-all flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={handleCustomSubmit}
              disabled={loading || customValue === currentValue}
              className={clsx(
                'w-full py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                customValue === currentValue
                  ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.98]'
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                `Set to ${customValue} ${unit || ''}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default QuickLogDialog;
