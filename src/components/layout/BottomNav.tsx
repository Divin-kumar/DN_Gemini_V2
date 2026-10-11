import React from 'react';
import { LayoutDashboard, Calendar, CheckSquare, Receipt, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'dashboard' | 'events' | 'activities' | 'expenses' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'events' | 'activities' | 'expenses' | 'settings') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'activities', label: 'Activities', icon: CheckSquare },
    { id: 'expenses', label: 'Finance', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 pb-[env(safe-area-inset-bottom,8px)]">
      <div className="grid grid-cols-5 items-center h-14">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
                isActive
                  ? 'text-emerald-800 dark:text-emerald-400 font-semibold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
