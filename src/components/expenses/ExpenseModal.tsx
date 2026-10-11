import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type {
  ExpenseRecord,
  EventRecord,
  ActivityRecord,
  CodeListDefinition,
  AppSettings,
} from '../../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  events: EventRecord[];
  activities: ActivityRecord[];
  categoryList?: CodeListDefinition;
  paymentMethodList?: CodeListDefinition;
  initialData?: ExpenseRecord | null;
  defaultEventId?: string;
  defaultActivityId?: string;
  settings: AppSettings;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  events,
  activities,
  categoryList,
  paymentMethodList,
  initialData,
  defaultEventId,
  defaultActivityId,
  settings,
}) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const [activityId, setActivityId] = useState<string | undefined>(undefined);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount);
      setCategory(initialData.category);
      setDate(initialData.date);
      setPaymentMethod(initialData.paymentMethod);
      setNotes(initialData.notes || '');
      setEventId(initialData.eventId);
      setActivityId(initialData.activityId);
      setIsRecurring(initialData.isRecurring || false);
      setRecurringInterval(initialData.recurringInterval || 'monthly');
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setType('expense');
      setAmount('');
      setCategory(categoryList?.values[0]?.label || 'Food & Dining');
      setDate(today);
      setPaymentMethod(paymentMethodList?.values[0]?.label || 'UPI / Google Pay / PhonePe');
      setNotes('');
      setEventId(defaultEventId || undefined);
      setActivityId(defaultActivityId || undefined);
      setIsRecurring(false);
      setRecurringInterval('monthly');
    }
  }, [initialData, categoryList, paymentMethodList, defaultEventId, defaultActivityId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || !category || !date) return;

    setSaving(true);
    try {
      await onSave({
        type,
        amount: Number(amount),
        currency: settings.currency || 'INR',
        category,
        date,
        paymentMethod: paymentMethod || 'UPI / Google Pay / PhonePe',
        notes: notes.trim(),
        eventId: eventId || undefined,
        activityId: activityId || undefined,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const categories = categoryList?.values.filter(v => v.enabled) || [];
  const paymentMethods = paymentMethodList?.values.filter(v => v.enabled) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            {initialData ? 'Edit Transaction' : 'Record Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Transaction Type Segmented Toggle */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                type === 'expense'
                  ? 'bg-white dark:bg-stone-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                type === 'income'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Amount ({settings.currencySymbol}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-stone-400 font-bold text-base">
                {settings.currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 text-lg font-bold font-mono tabular-nums bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {categories.map(c => (
                <option key={c.id} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {paymentMethods.map(pm => (
                  <option key={pm.id} value={pm.label}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linked Event & Linked Activity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Link to Event (Optional)
              </label>
              <select
                value={eventId || ''}
                onChange={e => setEventId(e.target.value || undefined)}
                className="mt-1 w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="">None (Personal)</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Link to Activity (Optional)
              </label>
              <select
                value={activityId || ''}
                onChange={e => setActivityId(e.target.value || undefined)}
                className="mt-1 w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="">None</option>
                {activities.map(act => (
                  <option key={act.id} value={act.id}>
                    {act.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Notes & Description
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Birthday dinner deposit, pharmacy medicines"
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Recurring Option */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
              />
              <span>Recurring Transaction</span>
            </label>

            {isRecurring && (
              <div className="mt-2 pl-6 flex items-center gap-2 text-xs">
                <span className="text-stone-500">Repeats:</span>
                <select
                  value={recurringInterval}
                  onChange={e => setRecurringInterval(e.target.value as any)}
                  className="px-2 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialData ? 'Update Record' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
