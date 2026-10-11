import React, { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import type { BudgetRecord, CodeListDefinition, AppSettings } from '../../types';

interface BudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: BudgetRecord[];
  categoryList?: CodeListDefinition;
  settings: AppSettings;
  onSaveBudget: (budget: Omit<BudgetRecord, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
}

export const BudgetsModal: React.FC<BudgetsModalProps> = ({
  isOpen,
  onClose,
  budgets,
  categoryList,
  settings,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedCategory, setSelectedCategory] = useState(categoryList?.values[0]?.label || 'Food & Dining');
  const [monthlyLimit, setMonthlyLimit] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const currentPeriodBudgets = budgets.filter(b => b.period === currentPeriod);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyLimit || monthlyLimit <= 0 || !selectedCategory) return;

    setSaving(true);
    try {
      await onSaveBudget({
        category: selectedCategory,
        monthlyLimit: Number(monthlyLimit),
        period: currentPeriod,
      });
      setMonthlyLimit('');
    } finally {
      setSaving(false);
    }
  };

  const categories = categoryList?.values.filter(v => v.enabled) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Monthly Category Budgets
            </h3>
            <span className="text-xs text-stone-500 font-medium">Period: {currentPeriod}</span>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Add Budget Form */}
          <form onSubmit={handleAddBudget} className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl space-y-3 border border-stone-200/60 dark:border-stone-700/60">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              Set Category Limit
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-500">Monthly Limit</label>
                <input
                  type="number"
                  required
                  value={monthlyLimit}
                  onChange={e => setMonthlyLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 15000"
                  className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition flex items-center justify-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Budget</span>
            </button>
          </form>

          {/* Active Budgets List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Current Limits ({currentPeriodBudgets.length})
            </h4>

            {currentPeriodBudgets.length > 0 ? (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {currentPeriodBudgets.map(b => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {b.category}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                        {settings.currencySymbol}
                        {b.monthlyLimit.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => onDeleteBudget(b.id)}
                        className="text-stone-400 hover:text-rose-500 p-1"
                        title="Delete limit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-stone-400">
                No budgets set for this month yet.
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
