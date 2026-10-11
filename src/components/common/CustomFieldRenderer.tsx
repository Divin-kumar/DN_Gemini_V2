import React from 'react';
import { Star } from 'lucide-react';
import type { CustomFieldDefinition } from '../../types';

interface CustomFieldRendererProps {
  fields: CustomFieldDefinition[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  currencySymbol?: string;
  readOnly?: boolean;
}

export const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  fields,
  values,
  onChange,
  currencySymbol = '₹',
  readOnly = false,
}) => {
  if (!fields.length) return null;

  return (
    <div className="space-y-4">
      {fields.map(field => {
        const val = values[field.key] ?? field.defaultValue ?? '';

        return (
          <div key={field.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                {field.label}
                {field.required && <span className="text-rose-500 ml-1">*</span>}
              </label>
              {field.type === 'computed' && (
                <span className="text-[10px] text-stone-400 font-mono">Calculated</span>
              )}
            </div>

            {/* Short text */}
            {field.type === 'text' && (
              <input
                type="text"
                disabled={readOnly}
                value={val}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                onChange={e => onChange(field.key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            )}

            {/* Long text / Textarea */}
            {field.type === 'textarea' && (
              <textarea
                disabled={readOnly}
                rows={3}
                value={val}
                placeholder={field.placeholder || `Enter notes for ${field.label.toLowerCase()}`}
                onChange={e => onChange(field.key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60 resize-none"
              />
            )}

            {/* Integer or Decimal or Number */}
            {(field.type === 'number' || field.type === 'decimal') && (
              <input
                type="number"
                step={field.type === 'decimal' ? '0.01' : '1'}
                disabled={readOnly}
                value={val}
                placeholder={field.placeholder || '0'}
                onChange={e => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                required={field.required}
                min={field.minValue}
                max={field.maxValue}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            )}

            {/* Currency */}
            {field.type === 'currency' && (
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-400 font-medium text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  disabled={readOnly}
                  value={val}
                  placeholder="0.00"
                  onChange={e => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                  required={field.required}
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                />
              </div>
            )}

            {/* Date */}
            {field.type === 'date' && (
              <input
                type="date"
                disabled={readOnly}
                value={val}
                onChange={e => onChange(field.key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            )}

            {/* Time */}
            {field.type === 'time' && (
              <input
                type="time"
                disabled={readOnly}
                value={val}
                onChange={e => onChange(field.key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            )}

            {/* Datetime */}
            {field.type === 'datetime' && (
              <input
                type="datetime-local"
                disabled={readOnly}
                value={val}
                onChange={e => onChange(field.key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            )}

            {/* Boolean / Yes-No */}
            {field.type === 'boolean' && (
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={Boolean(val)}
                    onChange={e => onChange(field.key, e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
                  />
                  <span>{Boolean(val) ? 'Yes' : 'No'}</span>
                </label>
              </div>
            )}

            {/* Checkbox */}
            {field.type === 'checkbox' && (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-700 dark:text-stone-300 pt-1">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={Boolean(val)}
                  onChange={e => onChange(field.key, e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
                />
                <span>Confirm {field.label}</span>
              </label>
            )}

            {/* Single Select */}
            {field.type === 'select' && (
              <select
                disabled={readOnly}
                value={val}
                onChange={e => onChange(field.key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              >
                <option value="">Select {field.label}...</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {/* Multi Select */}
            {field.type === 'multiselect' && (
              <div className="flex flex-wrap gap-2 pt-1">
                {field.options?.map(opt => {
                  const arr = Array.isArray(val) ? val : [];
                  const isChecked = arr.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      disabled={readOnly}
                      onClick={() => {
                        if (isChecked) {
                          onChange(field.key, arr.filter((x: string) => x !== opt));
                        } else {
                          onChange(field.key, [...arr, opt]);
                        }
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                        isChecked
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* URL */}
            {field.type === 'url' && (
              <input
                type="url"
                disabled={readOnly}
                value={val}
                placeholder="https://"
                onChange={e => onChange(field.key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            )}

            {/* Email */}
            {field.type === 'email' && (
              <input
                type="email"
                disabled={readOnly}
                value={val}
                placeholder="email@example.com"
                onChange={e => onChange(field.key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            )}

            {/* Phone */}
            {field.type === 'phone' && (
              <input
                type="tel"
                disabled={readOnly}
                value={val}
                placeholder="+91 98765 43210"
                onChange={e => onChange(field.key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
              />
            )}

            {/* Rating (1 to 5 stars) */}
            {field.type === 'rating' && (
              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    disabled={readOnly}
                    onClick={() => onChange(field.key, star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        Number(val) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300 dark:text-stone-600'
                      }`}
                    />
                  </button>
                ))}
                {val > 0 && <span className="text-xs text-stone-500 ml-2 font-medium">{val}/5</span>}
              </div>
            )}

            {/* Duration */}
            {field.type === 'duration' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  disabled={readOnly}
                  value={val}
                  placeholder="30"
                  onChange={e => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-24 px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <span className="text-xs text-stone-500">minutes</span>
              </div>
            )}

            {/* Computed Field */}
            {field.type === 'computed' && (
              <div className="px-3 py-2 bg-stone-100 dark:bg-stone-800/60 rounded-xl text-sm font-medium text-stone-800 dark:text-stone-200">
                {String(val || 'N/A')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
