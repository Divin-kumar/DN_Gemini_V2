import React from 'react';
import { Plus } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface NavbarProps {
  activeTab: 'dashboard' | 'events' | 'activities' | 'expenses' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'events' | 'activities' | 'expenses' | 'settings') => void;
  onOpenQuickAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onOpenQuickAdd }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-14">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className="text-xl font-bold tracking-tight text-emerald-800 dark:text-emerald-400 whitespace-nowrap shrink-0 flex items-center gap-2 text-left"
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
            DN
          </span>
          <span className="hidden sm:inline font-bold text-stone-900 dark:text-stone-100">DN</span>
        </button>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard'
                ? 'text-emerald-800 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('events')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'events'
                ? 'text-emerald-800 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => onSelectTab('activities')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'activities'
                ? 'text-emerald-800 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Activities
          </button>
          <button
            onClick={() => onSelectTab('expenses')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'expenses'
                ? 'text-emerald-800 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'text-emerald-800 dark:text-emerald-400 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Settings
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton compact />
          <button
            onClick={onOpenQuickAdd}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[36px]"
          >
            <Plus className="w-4 h-4" />
            <span>Record</span>
          </button>
        </div>
      </div>
    </header>
  );
};
