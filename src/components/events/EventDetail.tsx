import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Receipt,
  Image as ImageIcon,
  Info,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Archive,
  Edit2,
  Clock,
} from 'lucide-react';
import type {
  EventRecord,
  ActivityRecord,
  ExpenseRecord,
  PhotoRecord,
  EventTypeDefinition,
  CustomFieldDefinition,
  AppSettings,
} from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';

interface EventDetailProps {
  event: EventRecord;
  eventType?: EventTypeDefinition;
  activities: ActivityRecord[];
  expenses: ExpenseRecord[];
  photos: PhotoRecord[];
  customFields: CustomFieldDefinition[];
  settings: AppSettings;
  onBack: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onToggleActivity: (actId: string) => void;
  onAddActivity: () => void;
  onAddExpense: () => void;
  onAddPhoto: () => void;
  onUnlinkPhoto: (photoId: string) => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({
  event,
  eventType,
  activities,
  expenses,
  photos,
  customFields,
  settings,
  onBack,
  onEdit,
  onArchive,
  onDelete,
  onToggleActivity,
  onAddActivity,
  onAddExpense,
  onAddPhoto,
  onUnlinkPhoto,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'expenses' | 'photos' | 'details'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const totalSpent = expenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const completedActivitiesCount = activities.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl transition flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={onArchive}
            className="p-1.5 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 rounded-xl transition"
            title="Archive Event"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-xl transition"
            title="Delete Event"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Alert */}
      {showDeleteConfirm && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
            Confirm Event Deletion
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300">
            Are you sure you want to delete <strong className="text-rose-900 dark:text-white">"{event.title}"</strong>? Associated expenses and photos will be unlinked safely rather than deleted.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Event Header Hero */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-2xs"
            style={{ backgroundColor: event.color || '#059669' }}
          >
            <DynamicIcon name={event.icon || 'Calendar'} className="w-6 h-6 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>{eventType?.name || 'Event'}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{event.status}</span>
              {event.summaryCardEnabled && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Focus Card Enabled</span>
                </>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-0.5">
              {event.title}
            </h1>

            {event.description && (
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
                {event.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-stone-500 mt-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(event.startDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {event.endDate && ` – ${new Date(event.endDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`}
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
          <div>
            <div className="text-[11px] text-stone-500">Activities</div>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono">
              {completedActivitiesCount} / {activities.length} Done
            </div>
          </div>

          <div>
            <div className="text-[11px] text-stone-500">Linked Expenses</div>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono tabular-nums">
              {settings.currencySymbol}
              {totalSpent.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-stone-500">Attached Media</div>
            <div className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono">
              {photos.length} Photos
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-stone-200 dark:border-stone-800 pb-px overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Info },
          { id: 'activities', label: `Activities (${activities.length})`, icon: CheckSquare },
          { id: 'expenses', label: `Expenses (${expenses.length})`, icon: Receipt },
          { id: 'photos', label: `Photos (${photos.length})`, icon: ImageIcon },
          { id: 'details', label: 'Details', icon: Calendar },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                isActive
                  ? 'border-emerald-800 text-emerald-800 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Custom Fields Card */}
          {customFields.length > 0 && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                {eventType?.name} Attributes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customFields.map(f => {
                  const val = event.customFieldValues?.[f.key];
                  if (val === undefined || val === '') return null;
                  return (
                    <div key={f.id} className="space-y-0.5">
                      <div className="text-xs text-stone-500">{f.label}</div>
                      <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {Array.isArray(val) ? val.join(', ') : String(val)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-stone-500">Tags</h4>
              <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                {event.tags.map((t, i) => (
                  <React.Fragment key={t}>
                    {i > 0 && <span aria-hidden="true">·</span>}
                    <span>#{t}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Activities */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Linked Activities & Tasks
            </h3>
            <button
              onClick={onAddActivity}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Activity</span>
            </button>
          </div>

          {activities.length > 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden shadow-2xs">
              {activities.map(act => {
                const isDone = act.status === 'completed';
                return (
                  <div
                    key={act.id}
                    className="p-4 flex items-start gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition"
                  >
                    <button
                      onClick={() => onToggleActivity(act.id)}
                      className="mt-0.5 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-400 hover:text-emerald-600" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-semibold ${
                          isDone
                            ? 'line-through text-stone-400 dark:text-stone-500'
                            : 'text-stone-900 dark:text-stone-100'
                        }`}
                      >
                        {act.title}
                      </div>

                      {act.description && (
                        <p className="text-xs text-stone-500 mt-0.5">{act.description}</p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 flex-wrap">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{new Date(act.date).toLocaleDateString()}</span>
                        {act.time && <span>{act.time}</span>}
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{act.priority} priority</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center text-xs text-stone-400">
              No activities linked yet. Tap "Add Activity" to plan tasks, milestones, or appointments.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Linked Expenses
              </h3>
              <div className="text-xs text-stone-500 font-mono tabular-nums">
                Total: {settings.currencySymbol}
                {totalSpent.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              onClick={onAddExpense}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>

          {expenses.length > 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden shadow-2xs">
              {expenses.map(exp => (
                <div
                  key={exp.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {exp.notes || exp.category}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                      <span>{exp.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{exp.paymentMethod}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                      {settings.currencySymbol}
                      {exp.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center text-xs text-stone-400">
              No expenses recorded for this event.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Photos */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Attached Photographs & Scans
            </h3>
            <button
              onClick={onAddPhoto}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Photo</span>
            </button>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map(p => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden group shadow-2xs flex flex-col justify-between"
                >
                  <div className="aspect-4/3 relative bg-stone-100 dark:bg-stone-800">
                    <img
                      src={p.dataUrl}
                      alt={p.caption || 'Photo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                        {p.caption || 'Photo'}
                      </div>
                      <div className="text-[10px] text-stone-400">{new Date(p.date).toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => onUnlinkPhoto(p.id)}
                      className="text-stone-400 hover:text-rose-500 p-1 rounded"
                      title="Unlink from this event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center text-xs text-stone-400">
              No photos attached yet. Add memories, receipts, scans, or snapshots.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Details / System */}
      {activeTab === 'details' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            System & Audit Metadata
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-stone-400">Record ID:</span>{' '}
              <span className="font-mono text-stone-800 dark:text-stone-200">{event.id}</span>
            </div>
            <div>
              <span className="text-stone-400">Event Type ID:</span>{' '}
              <span className="font-mono text-stone-800 dark:text-stone-200">{event.eventTypeId}</span>
            </div>
            <div>
              <span className="text-stone-400">Created At:</span>{' '}
              <span className="text-stone-800 dark:text-stone-200">{new Date(event.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-stone-400">Last Updated:</span>{' '}
              <span className="text-stone-800 dark:text-stone-200">{new Date(event.updatedAt).toLocaleString()}</span>
            </div>
            {event.demoDatasetId && (
              <div className="col-span-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                Demo Dataset Provenance: {event.demoDatasetId}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
