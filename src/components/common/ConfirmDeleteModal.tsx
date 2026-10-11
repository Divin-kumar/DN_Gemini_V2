import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Link2Off, AlertCircle } from 'lucide-react';

export interface DeleteTargetInfo {
  type: 'expense' | 'income' | 'event' | 'activity' | 'codelist' | 'customfield' | 'photo' | 'budget' | 'goal';
  id: string;
  title: string;
  subtitle?: string;
  amountFormatted?: string;
  date?: string;
  category?: string;
  paymentMethod?: string;
  transactionType?: 'expense' | 'income';
  isLinked?: boolean;
  linkedParentTitle?: string;
  usageCount?: number;
  onUnlinkInstead?: () => void;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  target: DeleteTargetInfo | null;
  currencySymbol?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  target,
  currencySymbol = '₹',
}) => {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !target) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    setErrorMsg(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete record. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const isTx = target.type === 'expense' || target.type === 'income';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Confirm Permanent Deletion
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={deleting}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-xs text-stone-600 dark:text-stone-300">
            {isTx
              ? 'Are you sure you want to permanently delete this transaction? This removes the entry from all totals, summaries, and history.'
              : `Are you sure you want to permanently delete this ${target.type}? This action cannot be undone.`}
          </p>

          {/* Record Details Card with Full Identification */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 rounded-xl space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate flex-1">
                {target.title}
              </div>
              {target.transactionType && (
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    target.transactionType === 'income'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {target.transactionType}
                </span>
              )}
            </div>

            {target.subtitle && (
              <div className="text-stone-500">{target.subtitle}</div>
            )}

            {target.amountFormatted && (
              <div className="font-mono font-bold text-base text-stone-900 dark:text-stone-100">
                Amount: {target.amountFormatted}
              </div>
            )}

            <div className="flex items-center gap-2 text-stone-500 flex-wrap pt-0.5 text-[11px]">
              {target.category && <span>Category: <strong>{target.category}</strong></span>}
              {target.paymentMethod && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Payment: {target.paymentMethod}</span>
                </>
              )}
              {target.date && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Date: {new Date(target.date).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>

          {/* Contextual Warning & Linked Unlink Alternative */}
          {isTx && target.isLinked && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs space-y-2 text-amber-900 dark:text-amber-200">
              <p>
                <strong>Notice:</strong> This transaction is linked to{' '}
                <em>{target.linkedParentTitle || 'an event or activity'}</em>. Deleting it removes it permanently.
              </p>
              {target.onUnlinkInstead && (
                <button
                  type="button"
                  onClick={() => {
                    target.onUnlinkInstead?.();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 underline underline-offset-2 hover:text-amber-900"
                >
                  <Link2Off className="w-3.5 h-3.5" />
                  <span>Unlink instead (keep transaction in main records)</span>
                </button>
              )}
            </div>
          )}

          {target.type === 'event' && (
            <p className="text-[11px] text-stone-500">
              Associated expenses and photos will be preserved and safely unlinked rather than deleted.
            </p>
          )}

          {target.type === 'activity' && (
            <p className="text-[11px] text-stone-500">
              Associated expenses and photos will be preserved and safely unlinked rather than deleted.
            </p>
          )}

          {target.type === 'codelist' && (target.usageCount ?? 0) > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300">
              <strong>Warning:</strong> {target.usageCount} active record(s) currently reference this value. We recommend disabling or archiving it instead to prevent data inconsistency.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-850 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting...' : 'Permanently Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
