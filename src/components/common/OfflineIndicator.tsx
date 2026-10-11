import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center justify-between gap-3 rounded-xl bg-amber-900/90 text-amber-100 border border-amber-700/50 px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-300" />
        <span>Offline Mode — All records and cached media remain fully accessible locally.</span>
      </div>
    </div>
  );
};
