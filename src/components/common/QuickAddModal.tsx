import React from 'react';
import { X, Receipt, CheckSquare, Calendar, BookOpen } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'expense' | 'activity' | 'event' | 'diary') => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'expense',
      label: 'Record Expense or Income',
      desc: 'Track cash flow, payment method, and category',
      icon: Receipt,
      color: 'bg-emerald-800 text-white',
    },
    {
      id: 'activity',
      label: 'Add Action or Task',
      desc: 'Create to-do item, appointment, or milestone',
      icon: CheckSquare,
      color: 'bg-blue-600 text-white',
    },
    {
      id: 'event',
      label: 'Create Life Event',
      desc: 'Birthday, journey, project, or celebration container',
      icon: Calendar,
      color: 'bg-amber-600 text-white',
    },
    {
      id: 'diary',
      label: 'Quick Daily Diary Memory',
      desc: 'Save reflections and mood to this month’s diary',
      icon: BookOpen,
      color: 'bg-purple-600 text-white',
    },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Quick Record
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {actions.map(act => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-emerald-700/60 dark:hover:border-emerald-500/60 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition flex items-center gap-3 text-left group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${act.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                    {act.label}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate">
                    {act.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
