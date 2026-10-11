import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import type { PhotoRecord, EventRecord, ActivityRecord } from '../../types';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (photo: Omit<PhotoRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  events: EventRecord[];
  activities: ActivityRecord[];
  defaultEventId?: string;
  defaultActivityId?: string;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  events,
  activities,
  defaultEventId,
  defaultActivityId,
}) => {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [fileSize, setFileSize] = useState(0);
  const [eventId, setEventId] = useState<string | undefined>(defaultEventId);
  const [activityId, setActivityId] = useState<string | undefined>(defaultActivityId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        // Downscale image to max 1200px for efficient IndexedDB storage & mobile speed
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewUrl(compressedDataUrl);
        } else {
          setPreviewUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) return;

    setSaving(true);
    try {
      await onSave({
        caption: caption.trim() || 'Photo memory',
        dataUrl: previewUrl,
        mimeType,
        size: fileSize,
        date,
        eventId: eventId || undefined,
        activityId: activityId || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Attach Photograph / Scan
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* File Picker & Preview */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Select Image <span className="text-rose-500">*</span>
            </label>

            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 aspect-16/10 bg-stone-100 dark:bg-stone-800">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPreviewUrl('')}
                  className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-lg hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                <Upload className="w-8 h-8 text-stone-400 mb-2" />
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Choose Photo from Device
                </span>
                <span className="text-[11px] text-stone-400 mt-0.5">
                  PNG, JPG, or WebP up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Caption / Label
            </label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="e.g. Ultrasound Scan at 21 Weeks, Lake Sunrise"
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Date Captured
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Link to Event */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Link to Event
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
                Link to Activity
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
              disabled={!previewUrl || saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {saving ? 'Attaching...' : 'Save Attachment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
