import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import type { PhotoRecord, EventRecord, ActivityRecord } from '../../types';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (photo: Omit<PhotoRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  events: EventRecord[];
  activities: ActivityRecord[];
  initialData?: PhotoRecord | null;
  defaultEventId?: string;
  defaultActivityId?: string;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  events,
  activities,
  initialData,
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

  useEffect(() => {
    if (initialData) {
      setCaption(initialData.caption || '');
      setPreviewUrl(initialData.dataUrl || '');
      setMimeType(initialData.mimeType || 'image/jpeg');
      setFileSize(initialData.size || 0);
      setEventId(initialData.eventId);
      setActivityId(initialData.activityId);
      setDate(initialData.date || new Date().toISOString().slice(0, 10));
    } else {
      setCaption('');
      setPreviewUrl('');
      setMimeType('image/jpeg');
      setFileSize(0);
      setEventId(defaultEventId || undefined);
      setActivityId(defaultActivityId || undefined);
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [initialData, defaultEventId, defaultActivityId, isOpen]);

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
            {initialData ? 'Edit Photograph / Memory' : 'Attach Photograph / Scan'}
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* File Picker / Dropzone */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              {initialData ? 'Image (choose new to replace)' : 'Select Image'}
            </label>
            <div className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-4 text-center hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
              {previewUrl ? (
                <div className="relative group w-full flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 rounded-lg object-contain"
                  />
                  <label className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer hover:underline">
                    <span>Change Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Tap to upload from device
                  </span>
                  <span className="text-[11px] text-stone-400 mt-0.5">
                    JPEG, PNG, WebP up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Caption / Description
            </label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="e.g. Birthday cake cutting, Ultrasound scan"
              className="mt-1 w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Date Captured
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
            />
          </div>

          {/* Optional Event Linking */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Link to Event (Optional)
            </label>
            <select
              value={eventId || ''}
              onChange={e => setEventId(e.target.value || undefined)}
              className="mt-1 w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="">None (Standalone)</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Activity Linking */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Link to Activity (Optional)
            </label>
            <select
              value={activityId || ''}
              onChange={e => setActivityId(e.target.value || undefined)}
              className="mt-1 w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="">None (Standalone)</option>
              {activities
                .filter(a => !eventId || a.eventId === eventId)
                .map(act => (
                  <option key={act.id} value={act.id}>
                    {act.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
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
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : initialData ? 'Update Photo' : 'Save Attachment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
