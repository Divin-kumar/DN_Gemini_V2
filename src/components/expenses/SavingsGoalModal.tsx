import React, { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import type { SavingsGoalRecord, AppSettings } from '../../types';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  savingsGoals: SavingsGoalRecord[];
  settings: AppSettings;
  onSaveGoal: (goal: Omit<SavingsGoalRecord, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateAmount: (id: string, newAmount: number) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  savingsGoals,
  settings,
  onSaveGoal,
  onUpdateAmount,
  onDeleteGoal,
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [currentAmount, setCurrentAmount] = useState<number | ''>('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount || Number(targetAmount) <= 0 || !targetDate) return;

    setSaving(true);
    try {
      await onSaveGoal({
        name: name.trim(),
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        targetDate,
        color: '#10b981',
        icon: 'Target',
      });
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Savings & Financial Goals
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* New Goal Form */}
          <form onSubmit={handleCreate} className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl space-y-3 border border-stone-200/60 dark:border-stone-700/60">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              Create New Goal
            </h4>
            <div>
              <label className="text-[11px] font-semibold text-stone-500">Goal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Emergency Fund, Japan Trip 2027"
                className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Target Amount</label>
                <input
                  type="number"
                  required
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="300000"
                  className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-500">Current Saved</label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={e => setCurrentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="50000"
                  className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-500">Target Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition flex items-center justify-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </form>

          {/* Active Goals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Active Goals ({savingsGoals.length})
            </h4>

            {savingsGoals.length > 0 ? (
              <div className="space-y-3">
                {savingsGoals.map(goal => {
                  const pct = Math.min(
                    100,
                    Math.round((goal.currentAmount / goal.targetAmount) * 100)
                  );
                  return (
                    <div
                      key={goal.id}
                      className="p-3 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            {goal.name}
                          </span>
                          <div className="text-[10px] text-stone-400">
                            Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteGoal(goal.id)}
                          className="text-stone-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-full bg-stone-100 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <span className="text-stone-500">Saved:</span>
                          <input
                            type="number"
                            defaultValue={goal.currentAmount}
                            onBlur={e => {
                              const val = Number(e.target.value);
                              if (!isNaN(val) && val >= 0) {
                                onUpdateAmount(goal.id, val);
                              }
                            }}
                            className="w-24 px-1.5 py-0.5 border border-stone-200 dark:border-stone-600 rounded text-xs bg-stone-50 dark:bg-stone-800 font-bold"
                          />
                        </div>
                        <span className="text-stone-500">
                          Goal: {settings.currencySymbol}
                          {goal.targetAmount.toLocaleString('en-IN')} ({pct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-stone-400">
                No savings goals created yet.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 dark:border-stone-800 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
