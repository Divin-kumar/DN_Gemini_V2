import React from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type {
  EventRecord,
  ActivityRecord,
  ExpenseRecord,
  PhotoRecord,
  EventTypeDefinition,
  AppSettings,
} from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { evaluateEventSummary } from '../../services/summaryEngine';

interface EventsDashboardProps {
  events: EventRecord[];
  activities: ActivityRecord[];
  expenses: ExpenseRecord[];
  photos: PhotoRecord[];
  eventTypes: EventTypeDefinition[];
  settings: AppSettings;
  onToggleActivity: (actId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onOpenCreateEvent: () => void;
  onOpenCreateActivity: () => void;
}

export const EventsDashboard: React.FC<EventsDashboardProps> = ({
  events,
  activities,
  expenses,
  photos,
  eventTypes,
  settings,
  onToggleActivity,
  onSelectEvent,
  onOpenCreateEvent,
  onOpenCreateActivity,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Today's activities
  const todaysActivities = activities.filter(a => a.date === todayStr);

  // Overdue activities (dueDate < today and not completed/cancelled)
  const overdueActivities = activities.filter(
    a =>
      a.dueDate &&
      a.dueDate < todayStr &&
      a.status !== 'completed' &&
      a.status !== 'cancelled'
  );

  // Upcoming activities (date > today)
  const upcomingActivities = activities
    .filter(a => a.date > todayStr && a.status !== 'completed' && a.status !== 'cancelled')
    .slice(0, 5);

  // Enabled summary cards
  const summaryCardEvents = events.filter(e => {
    if (!e.summaryCardEnabled) return false;
    const typeDef = eventTypes.find(t => t.id === e.eventTypeId);
    return typeDef?.summaryCardConfig.showGlobally ?? true;
  });

  const handleComplete = (actId: string, isDone: boolean) => {
    onToggleActivity(actId);
    if (!isDone) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#059669'],
        });
      } catch {
        // Safe if canvas not available
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Today & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Today’s Life Agenda
          </h2>
          <div className="text-xs text-stone-500 mt-0.5">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateActivity}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-700/30 hover:bg-emerald-100 rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Activity</span>
          </button>
          <button
            onClick={onOpenCreateEvent}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* 2. Overdue Warning Strip if any */}
      {overdueActivities.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-3.5 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-rose-900 dark:text-rose-200">
              {overdueActivities.length} Overdue {overdueActivities.length === 1 ? 'Action' : 'Actions'}
            </div>
            <div className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 truncate">
              {overdueActivities.map(a => a.title).join(' · ')}
            </div>
          </div>
        </div>
      )}

      {/* 3. Today's Activities List */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Today’s Actions ({todaysActivities.length})
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            {todaysActivities.filter(a => a.status === 'completed').length}/{todaysActivities.length} Done
          </span>
        </div>

        {todaysActivities.length > 0 ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800 pt-1">
            {todaysActivities.map(act => {
              const isDone = act.status === 'completed';
              const parentEvent = events.find(e => e.id === act.eventId);

              return (
                <div
                  key={act.id}
                  className="py-3 flex items-start gap-3 group hover:bg-stone-50/50 dark:hover:bg-stone-800/20 px-2 rounded-xl transition"
                >
                  <button
                    onClick={() => handleComplete(act.id, isDone)}
                    className="mt-0.5 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
                    title={isDone ? 'Mark Pending' : 'Mark Completed'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-400 hover:text-emerald-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-medium ${
                        isDone
                          ? 'line-through text-stone-400 dark:text-stone-500'
                          : 'text-stone-900 dark:text-stone-100'
                      }`}
                    >
                      {act.title}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5 flex-wrap">
                      {act.time && (
                        <span>{act.time}</span>
                      )}
                      {parentEvent && (
                        <>
                          <span aria-hidden="true">·</span>
                          <button
                            onClick={() => onSelectEvent(parentEvent.id)}
                            className="text-emerald-700 dark:text-emerald-400 hover:underline truncate max-w-[200px]"
                          >
                            {parentEvent.title}
                          </button>
                        </>
                      )}
                      {act.priority && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{act.priority} priority</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-stone-400">
            No activities scheduled for today. Enjoy your day or add a quick task!
          </div>
        )}
      </div>

      {/* 4. Generic Configurable Summary Cards Engine */}
      {summaryCardEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Active Focus & Summary Cards
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaryCardEvents.map(event => {
              const eventType = eventTypes.find(t => t.id === event.eventTypeId);
              const linkedActs = activities.filter(a => a.eventId === event.id);
              const linkedExps = expenses.filter(e => e.eventId === event.id);
              const linkedPhs = photos.filter(p => p.eventId === event.id);

              const summary = evaluateEventSummary(
                event,
                eventType,
                linkedActs,
                linkedExps,
                linkedPhs,
                settings.currencySymbol
              );

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event.id)}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 hover:border-emerald-700/60 dark:hover:border-emerald-500/60 transition cursor-pointer shadow-2xs group flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top: Type Icon, Title, and Chevron */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-2xs"
                          style={{ backgroundColor: event.color || eventType?.color || '#059669' }}
                        >
                          <DynamicIcon name={event.icon || eventType?.icon || 'Calendar'} className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-400">
                            {eventType?.name || 'Event'}
                          </span>
                          <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition truncate max-w-[240px]">
                            {event.title}
                          </h4>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                    </div>

                    {/* Calculated Primary Metric Badge / Hero */}
                    <div className="mt-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-stone-500">
                          {summary.primaryLabel}
                        </div>
                        <div className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono">
                          {summary.primaryValue}
                        </div>
                      </div>
                      {summary.secondaryValue && (
                        <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                          {summary.secondaryValue}
                        </div>
                      )}
                    </div>

                    {/* Progress Bar if present */}
                    {summary.progressPercent !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                          <span>Progress</span>
                          <span className="font-mono">{summary.progressLabel}</span>
                        </div>
                        <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${summary.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Custom Fields Highlights */}
                    {summary.customFieldsDisplay.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
                        {summary.customFieldsDisplay.map((cf, idx) => (
                          <div key={idx}>
                            <span className="text-stone-400">{cf.label}:</span>{' '}
                            <span className="font-medium text-stone-800 dark:text-stone-200">
                              {cf.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Expense Total & Activity Count */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <span>{summary.totalActivities} activities</span>
                      {summary.totalExpenses > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono font-medium text-stone-800 dark:text-stone-200">
                            {summary.totalExpensesFormatted} spent
                          </span>
                        </>
                      )}
                    </div>

                    {summary.recentPhotos.length > 0 && (
                      <div className="flex -space-x-2 overflow-hidden">
                        {summary.recentPhotos.map(p => (
                          <img
                            key={p.id}
                            src={p.dataUrl}
                            alt={p.caption || 'Attachment'}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-stone-900 object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Upcoming Activities & Future Agenda */}
      {upcomingActivities.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-500" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Upcoming This Week
              </h3>
            </div>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800 pt-1">
            {upcomingActivities.map(act => (
              <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="font-medium text-stone-900 dark:text-stone-100 truncate block">
                    {act.title}
                  </span>
                  <span className="text-stone-500">
                    {new Date(act.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {act.time ? ` at ${act.time}` : ''}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-stone-500 capitalize bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                  {act.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
