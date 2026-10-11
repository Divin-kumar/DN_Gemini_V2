import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';
import type { AppSettings } from '../../types';

interface BackupReminderBannerProps {
  settings: AppSettings;
  onNavigateToBackup: () => void;
}

export const BackupReminderBanner: React.FC<BackupReminderBannerProps> = ({
  settings,
  onNavigateToBackup,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const now = new Date();
  let daysSinceLastBackup = 999;
  let status: 'none' | 'stale_7' | 'stale_30' | 'fresh' = 'none';

  if (settings.lastBackupDate) {
    const lastDate = new Date(settings.lastBackupDate);
    const diffMs = now.getTime() - lastDate.getTime();
    daysSinceLastBackup = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysSinceLastBackup < (settings.backupReminderIntervalDays || 7)) {
      status = 'fresh';
    } else if (daysSinceLastBackup < 30) {
      status = 'stale_7';
    } else {
      status = 'stale_30';
    }
  }

  // If fresh, do not display a disruptive banner
  if (status === 'fresh') return null;

  return (
    <div className="bg-emerald-950 text-emerald-100 border-b border-emerald-800/60 px-4 py-2.5 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {status === 'none' && (
              <>
                <strong className="text-white">Local Storage Notice:</strong> DN stores data offline in your browser. Create a portable backup file to protect your memories and records.
              </>
            )}
            {status === 'stale_7' && (
              <>
                <strong className="text-white">Backup Recommended:</strong> Last backup was {daysSinceLastBackup} days ago. Export your latest records to keep them safe.
              </>
            )}
            {status === 'stale_30' && (
              <>
                <strong className="text-white">Backup Notice:</strong> It has been {daysSinceLastBackup} days since your last backup export.
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNavigateToBackup}
            className="flex items-center gap-1 font-semibold text-emerald-300 hover:text-white transition underline underline-offset-2"
          >
            <span>Data & Backup</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-emerald-400 hover:text-white rounded"
            title="Dismiss reminder"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
