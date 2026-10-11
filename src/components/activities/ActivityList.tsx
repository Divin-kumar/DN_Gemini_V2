import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Plus, Search, CheckCircle2, Circle, Clock, Trash2, Edit2 } from 'lucide-react';
import type {
  ActivityRecord,
  ActivityTypeDefinition,
  EventRecord,
} from '../../types';

interface ActivityListProps {
  activities: ActivityRecord[];
  activityTypes: ActivityTypeDefinition[];
  events: EventRecord[];
  onToggleStatus: (id: string) => void;
  onEditActivity: (act: ActivityRecord) => void;
  onDeleteActivity: (id: string) => void;
  onOpenCreateActivity: () => void;
  onSelectEvent: (eventId: string) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  activityTypes,
  events,
  onToggleStatus,
  onEditActivity,
  onDeleteActivity,
  onOpenCreateActivity,
  onSelectEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterEventId, setFilterEventId] = useState<string>('all');

  const filtered = activities.filter(act => {
    const matchesStatus = filterStatus === 'all' || act.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || act.priority === filterPriority;
    const matchesEvent = filterEventId === 'all' || act.eventId === filterEventId;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      act.title.toLowerCase().includes(q) ||
      act.description.toLowerCase().includes(q) ||
      act.tags?.some(t => t.toLowerCase().includes(q));
    return matchesStatus && matchesPriority && matchesEvent && matchesSearch;
  });

  const handleToggle = (act: ActivityRecord) => {
    const willComplete = act.status !== 'completed';
    onToggleStatus(act.id);
    if (willComplete) {
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#059669'],
        });
      } catch {
        // Safe
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Activities & Action Items
          </h2>
          <div className="text-xs text-stone-500 mt-0.5">
            Tasks, appointments, daily reflections, and milestones.
          </div>
        </div>

        <button
          onClick={onOpenCreateActivity}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Activity</span>
        </button>
      </div>

      {/* Filters Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <select
          value={filterEventId}
          onChange={e => setFilterEventId(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium text-stone-700 dark:text-stone-300"
        >
          <option value="all">All Events</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium text-stone-700 dark:text-stone-300"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium text-stone-700 dark:text-stone-300"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Activities List */}
      {filtered.length > 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden shadow-2xs">
          {filtered.map(act => {
            const isDone = act.status === 'completed';
            const parentEvent = events.find(e => e.id === act.eventId);
            const typeDef = activityTypes.find(t => t.id === act.activityTypeId);

            return (
              <div
                key={act.id}
                className="p-4 flex items-start justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition group"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggle(act)}
                    className="mt-0.5 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 shrink-0"
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
                      className={`text-sm font-semibold ${
                        isDone
                          ? 'line-through text-stone-400 dark:text-stone-500'
                          : 'text-stone-900 dark:text-stone-100'
                      }`}
                    >
                      {act.title}
                    </div>

                    {act.description && (
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                        {act.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 flex-wrap">
                      <span>{typeDef?.name || 'Activity'}</span>
                      <span aria-hidden="true">·</span>
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{new Date(act.date).toLocaleDateString()}</span>
                      {act.time && <span>{act.time}</span>}
                      {parentEvent && (
                        <>
                          <span aria-hidden="true">·</span>
                          <button
                            onClick={() => onSelectEvent(parentEvent.id)}
                            className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline truncate max-w-[160px]"
                          >
                            {parentEvent.title}
                          </button>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{act.priority}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => onEditActivity(act)}
                    className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg"
                    title="Edit activity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteActivity(act.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg"
                    title="Delete activity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center text-xs text-stone-400 space-y-3">
          <div>No activities found matching your criteria.</div>
          <button
            onClick={onOpenCreateActivity}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Activity</span>
          </button>
        </div>
      )}
    </div>
  );
};
