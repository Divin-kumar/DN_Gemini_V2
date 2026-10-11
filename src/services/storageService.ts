/**
 * Service to manage browser persistent storage requests and quota awareness.
 */

export interface StorageStatus {
  isPersisted: boolean;
  usageBytes: number;
  quotaBytes: number;
  percentUsed: number;
  supportsPersist: boolean;
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const supportsPersist = typeof navigator !== 'undefined' && 'storage' in navigator && 'persist' in navigator.storage;
  let isPersisted = false;
  let usageBytes = 0;
  let quotaBytes = 0;

  if (supportsPersist) {
    try {
      isPersisted = await navigator.storage.persisted();
    } catch {
      isPersisted = false;
    }
  }

  if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    } catch {
      // Ignore
    }
  }

  const percentUsed = quotaBytes > 0 ? Math.min(100, Math.round((usageBytes / quotaBytes) * 100)) : 0;

  return {
    isPersisted,
    usageBytes,
    quotaBytes,
    percentUsed,
    supportsPersist,
  };
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'storage' in navigator && 'persist' in navigator.storage) {
    try {
      const granted = await navigator.storage.persist();
      return granted;
    } catch {
      return false;
    }
  }
  return false;
}
