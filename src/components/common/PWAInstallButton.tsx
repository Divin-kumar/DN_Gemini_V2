import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 font-medium transition-all ${
          compact
            ? 'px-2.5 py-1 text-xs bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg'
            : 'px-3.5 py-2 text-xs bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg shadow-sm'
        }`}
        title="Install DN to Home Screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 font-medium transition-all ${
            compact
              ? 'px-2.5 py-1 text-xs border border-emerald-700/50 hover:bg-emerald-800/30 text-emerald-800 dark:text-emerald-300 rounded-lg'
              : 'px-3.5 py-2 text-xs border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg'
          }`}
          title="Install on iPhone"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Install on iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                  Install DN on iPhone
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-sm text-stone-600 dark:text-stone-300">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    Tap the <strong className="text-stone-900 dark:text-white">Share</strong> button in Safari's bottom toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    Scroll down and tap <strong className="text-stone-900 dark:text-white">Add to Home Screen</strong> <PlusSquare className="inline w-4 h-4 ml-0.5 text-emerald-600" />.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <div>
                    Tap <strong className="text-stone-900 dark:text-white">Add</strong> in the top right. DN will launch in full-screen standalone mode with offline storage!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
