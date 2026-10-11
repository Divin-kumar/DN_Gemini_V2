import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type {
  ActivityRecord,
  ActivityTypeDefinition,
  EventRecord,
  CustomFieldDefinition,
} from '../../types';
import { getCustomFields } from '../../db/repository';
import { CustomFieldRenderer } from '../common/CustomFieldRenderer';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ActivityRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  activityTypes: ActivityTypeDefinition[];
  events: EventRecord[];
  initialData?: ActivityRecord | null;
  defaultEventId?: string;
  currencySymbol?: string;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  activityTypes,
  events,
  initialData,
  defaultEventId,
  currencySymbol = '₹',
}) => {
  const [title, setTitle] = useState('');
  const [activityTypeId, setActivityTypeId] = useState('');
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('pending');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setActivityTypeId(initialData.activityTypeId);
      setEventId(initialData.eventId);
      setDescription(initialData.description || '');
      setDate(initialData.date);
      setTime(initialData.time || '');
      setStatus(initialData.status);
      setPriority(initialData.priority);
      setDueDate(initialData.dueDate || '');
      setTagsInput(initialData.tags?.join(', ') || '');
      setCustomFieldValues(initialData.customFieldValues || {});
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setTitle('');
      setActivityTypeId(activityTypes[0]?.id || '');
      setEventId(defaultEventId || undefined);
      setDescription('');
      setDate(today);
      setTime('');
      setStatus('pending');
      setPriority('medium');
      setDueDate('');
      setTagsInput('');
      setCustomFieldValues({});
    }
  }, [initialData, activityTypes, defaultEventId, isOpen]);

  useEffect(() => {
    if (activityTypeId) {
      getCustomFields('activity', activityTypeId).then(fields => {
        setCustomFields(fields);
      });
    }
  }, [activityTypeId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activityTypeId || !date) return;

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await onSave({
        title: title.trim(),
        activityTypeId,
        eventId: eventId || undefined,
        description: description.trim(),
        date,
        time: time || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
        tags,
        customFieldValues,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            {initialData ? 'Edit Activity' : 'Add Activity'}
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
              Activity Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Doctor Ultrasound Scan, Reserve table, Write journal"
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Activity Type & Parent Event */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Activity Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={activityTypeId}
                onChange={e => setActivityTypeId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {activityTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Parent Event (Optional)
              </label>
              <select
                value={eventId || ''}
                onChange={e => setEventId(e.target.value || undefined)}
                className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="">None (Independent Task)</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
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
                Time (Optional)
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Notes & Details
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add extra context, address, or reminders..."
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
            />
          </div>

          {/* Dynamic Custom Fields Section */}
          {customFields.length > 0 && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Custom Fields for {activityTypes.find(t => t.id === activityTypeId)?.name}
              </h4>
              <CustomFieldRenderer
                fields={customFields}
                values={customFieldValues}
                onChange={(key, val) => setCustomFieldValues(prev => ({ ...prev, [key]: val }))}
                currencySymbol={currencySymbol}
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. Ultrasound, Critical, Daily"
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
              {saving ? 'Saving...' : initialData ? 'Update Activity' : 'Save Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
