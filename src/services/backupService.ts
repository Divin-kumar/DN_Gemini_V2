import { db } from '../db';
import { getAppSettings, updateAppSettings } from '../db/repository';
import type { DNBackup, RestorePreview, DatabaseSnapshot } from '../types';

/**
 * Generate a SHA-256 checksum for backup integrity verification.
 */
async function calculateChecksum(content: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Deterministic fallback hash if crypto.subtle is unavailable
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * Create a full export snapshot object from current database.
 */
export async function createBackupPayload(includesMedia: boolean): Promise<DNBackup> {
  const [
    events,
    activities,
    expenses,
    rawPhotos,
    relationships,
    eventTypes,
    activityTypes,
    customFields,
    codeLists,
    budgets,
    savingsGoals,
    settings,
  ] = await Promise.all([
    db.events.toArray(),
    db.activities.toArray(),
    db.expenses.toArray(),
    db.photos.toArray(),
    db.relationships.toArray(),
    db.eventTypes.toArray(),
    db.activityTypes.toArray(),
    db.customFields.toArray(),
    db.codeLists.toArray(),
    db.budgets.toArray(),
    db.savingsGoals.toArray(),
    getAppSettings(),
  ]);

  // If Standard Backup (no media), omit heavy dataUrl but keep metadata & relationships
  const photos = rawPhotos.map(p => {
    if (includesMedia) return p;
    return {
      ...p,
      dataUrl: '', // Stripped for lightweight standard backup
    };
  });

  const now = new Date().toISOString();
  const backup: DNBackup = {
    format: 'dn-backup',
    formatVersion: 1,
    schemaVersion: 1,
    exportedAt: now,
    appVersion: '1.0.0',
    includesMedia,
    data: {
      events,
      activities,
      expenses,
      photos,
      relationships,
      eventTypes,
      activityTypes,
      customFields,
      codeLists,
      budgets,
      savingsGoals,
      settings,
    },
  };

  const payloadString = JSON.stringify(backup.data);
  backup.checksum = await calculateChecksum(payloadString);

  return backup;
}

/**
 * Export backup to a downloadable file or via native Web Share (iPhone Files / iCloud Drive).
 */
export async function exportBackupToFile(includesMedia: boolean): Promise<{ filename: string; sizeBytes: number }> {
  const backup = await createBackupPayload(includesMedia);
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Format: DN-backup-YYYY-MM-DD-HHmmss.json
  const d = new Date();
  const timestamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
  const filename = `DN-backup-${timestamp}${includesMedia ? '-complete' : '-standard'}.json`;

  const file = new File([blob], filename, { type: 'application/json' });

  // Check if Web Share API with files is available (great for iOS Safari save to Files)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'DN Backup',
        text: `DN Backup from ${d.toLocaleDateString()}`,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        // Fallback to link download
        triggerBrowserDownload(blob, filename);
      }
    }
  } else {
    triggerBrowserDownload(blob, filename);
  }

  // Update backup metadata only after generation succeeds
  await updateAppSettings({
    lastBackupDate: new Date().toISOString(),
    lastBackupType: includesMedia ? 'complete' : 'standard',
  });

  return {
    filename,
    sizeBytes: blob.size,
  };
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate imported backup string and generate preview.
 */
export async function validateAndPreviewBackup(jsonString: string): Promise<{
  isValid: boolean;
  error?: string;
  preview?: RestorePreview;
  backup?: DNBackup;
}> {
  try {
    const parsed = JSON.parse(jsonString) as DNBackup;

    if (!parsed || parsed.format !== 'dn-backup') {
      return {
        isValid: false,
        error: 'Invalid backup format. File must be a valid DN backup JSON file.',
      };
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      return {
        isValid: false,
        error: 'Corrupted backup file: missing data section.',
      };
    }

    const { data } = parsed;
    const warnings: string[] = [];

    if (!parsed.includesMedia) {
      warnings.push('This is a Standard Backup. It contains structured records, but does not contain binary photo media.');
    }

    // Verify Checksum if present
    if (parsed.checksum) {
      const currentChecksum = await calculateChecksum(JSON.stringify(data));
      if (currentChecksum !== parsed.checksum) {
        warnings.push('Checksum verification mismatch. File contents may have been manually modified or truncated.');
      }
    }

    const preview: RestorePreview = {
      isValid: true,
      formatVersion: parsed.formatVersion || 1,
      exportedAt: parsed.exportedAt,
      includesMedia: parsed.includesMedia ?? false,
      counts: {
        events: Array.isArray(data.events) ? data.events.length : 0,
        activities: Array.isArray(data.activities) ? data.activities.length : 0,
        expenses: Array.isArray(data.expenses) ? data.expenses.length : 0,
        photos: Array.isArray(data.photos) ? data.photos.length : 0,
        relationships: Array.isArray(data.relationships) ? data.relationships.length : 0,
        eventTypes: Array.isArray(data.eventTypes) ? data.eventTypes.length : 0,
        activityTypes: Array.isArray(data.activityTypes) ? data.activityTypes.length : 0,
        customFields: Array.isArray(data.customFields) ? data.customFields.length : 0,
        codeLists: Array.isArray(data.codeLists) ? data.codeLists.length : 0,
        budgets: Array.isArray(data.budgets) ? data.budgets.length : 0,
        savingsGoals: Array.isArray(data.savingsGoals) ? data.savingsGoals.length : 0,
      },
      warnings,
    };

    return {
      isValid: true,
      preview,
      backup: parsed,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Failed to parse backup file: ${err.message || 'Syntax error'}`,
    };
  }
}

/**
 * Creates an automatic pre-restore safety snapshot in IndexedDB.
 */
export async function createSafetySnapshot(description: string): Promise<DatabaseSnapshot> {
  const currentBackup = await createBackupPayload(true);
  const snapshot: DatabaseSnapshot = {
    id: `snap_${Date.now()}`,
    createdAt: new Date().toISOString(),
    description,
    backupPayload: JSON.stringify(currentBackup),
  };
  await db.snapshots.add(snapshot);

  // Keep max 5 snapshots to avoid bloating IndexedDB
  const allSnapshots = await db.snapshots.orderBy('createdAt').toArray();
  if (allSnapshots.length > 5) {
    const toDelete = allSnapshots.slice(0, allSnapshots.length - 5);
    await db.snapshots.bulkDelete(toDelete.map(s => s.id));
  }

  return snapshot;
}

/**
 * Replace Existing Data restore mode:
 * Restores the backup as the active dataset, taking a safety snapshot first.
 */
export async function restoreBackupReplace(backup: DNBackup): Promise<void> {
  // 1. Take safety snapshot
  await createSafetySnapshot(`Pre-restore auto-snapshot before importing backup from ${backup.exportedAt}`);

  const { data } = backup;

  // 2. Perform transactional wipe and rebuild
  await db.transaction(
    'rw',
    [
      db.events,
      db.activities,
      db.expenses,
      db.photos,
      db.relationships,
      db.eventTypes,
      db.activityTypes,
      db.customFields,
      db.codeLists,
      db.budgets,
      db.savingsGoals,
      db.appSettings,
    ],
    async () => {
      await Promise.all([
        db.events.clear(),
        db.activities.clear(),
        db.expenses.clear(),
        db.photos.clear(),
        db.relationships.clear(),
        db.eventTypes.clear(),
        db.activityTypes.clear(),
        db.customFields.clear(),
        db.codeLists.clear(),
        db.budgets.clear(),
        db.savingsGoals.clear(),
      ]);

      if (data.events?.length) await db.events.bulkAdd(data.events);
      if (data.activities?.length) await db.activities.bulkAdd(data.activities);
      if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses);
      if (data.photos?.length) await db.photos.bulkAdd(data.photos);
      if (data.relationships?.length) await db.relationships.bulkAdd(data.relationships);
      if (data.eventTypes?.length) await db.eventTypes.bulkAdd(data.eventTypes);
      if (data.activityTypes?.length) await db.activityTypes.bulkAdd(data.activityTypes);
      if (data.customFields?.length) await db.customFields.bulkAdd(data.customFields);
      if (data.codeLists?.length) await db.codeLists.bulkAdd(data.codeLists);
      if (data.budgets?.length) await db.budgets.bulkAdd(data.budgets);
      if (data.savingsGoals?.length) await db.savingsGoals.bulkAdd(data.savingsGoals);

      if (data.settings) {
        await db.appSettings.put({
          ...data.settings,
          lastRestoreDate: new Date().toISOString(),
        });
      }
    }
  );
}

/**
 * Merge With Existing Data restore mode:
 * Merges records according to stable IDs.
 * Preserves items existing only in current DB and items existing in backup.
 */
export async function restoreBackupMerge(backup: DNBackup): Promise<{
  added: number;
  updated: number;
}> {
  await createSafetySnapshot(`Pre-merge auto-snapshot before importing backup from ${backup.exportedAt}`);

  const { data } = backup;
  let added = 0;
  let updated = 0;

  await db.transaction(
    'rw',
    [
      db.events,
      db.activities,
      db.expenses,
      db.photos,
      db.relationships,
      db.eventTypes,
      db.activityTypes,
      db.customFields,
      db.codeLists,
      db.budgets,
      db.savingsGoals,
    ],
    async () => {
      // Helper for merge
      async function mergeCollection(table: any, items: any[]) {
        if (!items || !items.length) return;
        for (const item of items) {
          const existing = await table.get(item.id);
          if (existing) {
            // Check updatedAt to avoid overwriting newer data
            const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            const incomingTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
            if (incomingTime >= existingTime) {
              await table.put(item);
              updated++;
            }
          } else {
            await table.add(item);
            added++;
          }
        }
      }

      await mergeCollection(db.events, data.events || []);
      await mergeCollection(db.activities, data.activities || []);
      await mergeCollection(db.expenses, data.expenses || []);
      await mergeCollection(db.photos, data.photos || []);
      await mergeCollection(db.relationships, data.relationships || []);
      await mergeCollection(db.eventTypes, data.eventTypes || []);
      await mergeCollection(db.activityTypes, data.activityTypes || []);
      await mergeCollection(db.customFields, data.customFields || []);
      await mergeCollection(db.codeLists, data.codeLists || []);
      await mergeCollection(db.budgets, data.budgets || []);
      await mergeCollection(db.savingsGoals, data.savingsGoals || []);
    }
  );

  await updateAppSettings({
    lastRestoreDate: new Date().toISOString(),
  });

  return { added, updated };
}

/**
 * Rollback to a saved snapshot.
 */
export async function rollbackSnapshot(snapshotId: string): Promise<void> {
  const snapshot = await db.snapshots.get(snapshotId);
  if (!snapshot) throw new Error('Snapshot not found');

  const parsed = JSON.parse(snapshot.backupPayload) as DNBackup;
  await restoreBackupReplace(parsed);
}
