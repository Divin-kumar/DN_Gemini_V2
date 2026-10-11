import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { EventRecord, EventTypeDefinition, CustomFieldDefinition } from '../../types';
import { getCustomFields } from '../../db/repository';
import { CustomFieldRenderer } from '../common/CustomFieldRenderer';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<EventRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  eventTypes: EventTypeDefinition[];
  initialData?: EventRecord | null;
  currencySymbol?: string;
}

const PRESET_COLORS = [
  '#065f46', '#047857', '#059669', '#10b981',
  '#0284c7', '#2563eb', '#6366f1', '#8b5cf6',
  '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#84cc16', '#475569',
];

const PRESET_ICONS = [
  'Calendar', 'Cake', 'HeartHandshake', 'CheckSquare', 'Bug', 'BookOpen',
  'Flag', 'Briefcase', 'GraduationCap', 'Plane', 'Car', 'Home',
  'Stethoscope', 'Sparkles', 'Activity', 'Award'
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventTypes,
  initialData,
  currencySymbol = '₹',
}) => {
  const [title, setTitle] = useState('');
  const [eventTypeId, setEventTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'cancelled' | 'archived'>('active');
  const [color, setColor] = useState('#059669');
  const [icon, setIcon] = useState('Calendar');
  const [tagsInput, setTagsInput] = useState('');
  const [summaryCardEnabled, setSummaryCardEnabled] = useState(true);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setEventTypeId(initialData.eventTypeId);
      setDescription(initialData.description || '');
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate || '');
      setStatus(initialData.status);
      setColor(initialData.color || '#059669');
      setIcon(initialData.icon || 'Calendar');
      setTagsInput(initialData.tags?.join(', ') || '');
      setSummaryCardEnabled(initialData.summaryCardEnabled ?? true);
      setCustomFieldValues(initialData.customFieldValues || {});
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setTitle('');
      const defaultType = eventTypes[0]?.id || '';
      setEventTypeId(defaultType);
      setDescription('');
      setStartDate(today);
      setEndDate('');
      setStatus('active');
      setColor(eventTypes[0]?.color || '#059669');
      setIcon(eventTypes[0]?.icon || 'Calendar');
      setTagsInput('');
      setSummaryCardEnabled(true);
      setCustomFieldValues({});
    }
  }, [initialData, eventTypes, isOpen]);

  // Load custom fields whenever selected event type changes
  useEffect(() => {
    if (eventTypeId) {
      getCustomFields('event', eventTypeId).then(fields => {
        setCustomFields(fields);
      });
      const selectedType = eventTypes.find(t => t.id === eventTypeId);
      if (selectedType && !initialData) {
        setColor(selectedType.color || '#059669');
        setIcon(selectedType.icon || 'Calendar');
      }
    }
  }, [eventTypeId, eventTypes, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventTypeId || !startDate) return;

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await onSave({
        title: title.trim(),
        eventTypeId,
        description: description.trim(),
        startDate,
        endDate: endDate || undefined,
        status,
        color,
        icon,
        tags,
        summaryCardEnabled,
        customFieldValues,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleCustomFieldChange = (key: string, val: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [key]: val,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            {initialData ? 'Edit Event' : 'Create New Event'}
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
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Diya's 30th Birthday, Trip to Japan"
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Event Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={eventTypeId}
              onChange={e => setEventTypeId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {eventTypes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add key context, intentions, or notes..."
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
            />
          </div>

          {/* Color & Icon Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Accent Color
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-110 border-stone-900 dark:border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Icon
              </label>
              <select
                value={icon}
                onChange={e => setIcon(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {PRESET_ICONS.map(ic => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Card Toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
              <input
                type="checkbox"
                checked={summaryCardEnabled}
                onChange={e => setSummaryCardEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
              />
              <span>Display Focus Card on Events Dashboard</span>
            </label>
          </div>

          {/* Dynamic Custom Fields Section */}
          {customFields.length > 0 && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Custom Fields for {eventTypes.find(t => t.id === eventTypeId)?.name}
              </h4>
              <CustomFieldRenderer
                fields={customFields}
                values={customFieldValues}
                onChange={handleCustomFieldChange}
                currencySymbol={currencySymbol}
              />
            </div>
          )}

          {/* Tags */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. Milestone, Family, Travel"
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Modal Footer */}
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
              {saving ? 'Saving...' : initialData ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
