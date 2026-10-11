import React, { useState } from 'react';
import { Plus, Search, Calendar, ArrowRight, Edit2, Trash2 } from 'lucide-react';
import type { EventRecord, EventTypeDefinition, AppSettings } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { SwipeableRow, type SwipeActionItem } from '../common/SwipeableRow';

interface EventListProps {
  events: EventRecord[];
  eventTypes: EventTypeDefinition[];
  settings: AppSettings;
  onSelectEvent: (eventId: string) => void;
  onOpenCreateEvent: () => void;
  onEditEvent?: (evt: EventRecord) => void;
  onDeleteEvent?: (evt: EventRecord) => void;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  eventTypes,
  onSelectEvent,
  onOpenCreateEvent,
  onEditEvent,
  onDeleteEvent,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

  const filtered = events.filter(e => {
    const matchesType = selectedType === 'all' || e.eventTypeId === selectedType;
    const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags?.some(t => t.toLowerCase().includes(q));
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Events & Milestones
          </h2>
          <div className="text-xs text-stone-500 mt-0.5">
            Organize personal life chapters, journeys, projects, and celebrations. Swipe left on any card to edit or delete.
          </div>
        </div>

        <button
          onClick={onOpenCreateEvent}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Filter Bars & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events by title, description, tags..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        {/* Type Selector */}
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium text-stone-700 dark:text-stone-300"
        >
          <option value="all">All Event Types</option>
          {eventTypes.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Status Selector */}
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium text-stone-700 dark:text-stone-300"
        >
          <option value="active">Active Only</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
          <option value="all">All Statuses</option>
        </select>
      </div>

      {/* Events Grid with SwipeableRows */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(evt => {
            const typeDef = eventTypes.find(t => t.id === evt.eventTypeId);

            const actions: SwipeActionItem[] = [];
            if (onEditEvent) {
              actions.push({
                id: 'edit',
                label: 'Edit',
                icon: <Edit2 className="w-3.5 h-3.5" />,
                variant: 'edit',
                onClick: () => onEditEvent(evt),
                ariaLabel: `Edit event ${evt.title}`,
              });
            }
            if (onDeleteEvent) {
              actions.push({
                id: 'delete',
                label: 'Delete',
                icon: <Trash2 className="w-3.5 h-3.5" />,
                variant: 'delete',
                onClick: () => onDeleteEvent(evt),
                ariaLabel: `Delete event ${evt.title}`,
              });
            }

            return (
              <SwipeableRow
                key={evt.id}
                id={evt.id}
                activeRowId={activeSwipeId}
                onRowOpen={setActiveSwipeId}
                onRowClose={() => setActiveSwipeId(null)}
                actions={actions}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:border-emerald-700/60 dark:hover:border-emerald-500/60 transition group"
              >
                <div
                  onClick={() => onSelectEvent(evt.id)}
                  className="p-5 cursor-pointer flex flex-col justify-between h-full bg-white dark:bg-stone-900"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-2xs"
                          style={{ backgroundColor: evt.color || typeDef?.color || '#059669' }}
                        >
                          <DynamicIcon name={evt.icon || typeDef?.icon || 'Calendar'} className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                            {typeDef?.name || 'Event'}
                          </span>
                          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition truncate max-w-[240px]">
                            {evt.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Visible non-swipe buttons for desktop */}
                        {onEditEvent && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onEditEvent(evt);
                            }}
                            className="hidden sm:inline-flex p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteEvent && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteEvent(evt);
                            }}
                            className="hidden sm:inline-flex p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>

                    {evt.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 mt-3">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(evt.startDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <span className="capitalize font-medium text-stone-600 dark:text-stone-400">
                      {evt.status}
                    </span>
                  </div>
                </div>
              </SwipeableRow>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center text-xs text-stone-400 space-y-3">
          <Calendar className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
          <div>No events match your criteria. Create a new event or adjust the filters.</div>
          <button
            onClick={onOpenCreateEvent}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </button>
        </div>
      )}
    </div>
  );
};
