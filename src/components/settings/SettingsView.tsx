import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Sliders,
  Sparkles,
  Download,
  Upload,
  HardDrive,
  Moon,
  Sun,
  Laptop,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import type {
  AppSettings,
  EventTypeDefinition,
  ActivityTypeDefinition,
  CodeListDefinition,
  CodeListItem,
  CustomFieldDefinition,
  RestorePreview,
  DNBackup,
  DatabaseSnapshot,
} from '../../types';
import {
  saveEventType,
  deleteEventType,
  saveActivityType,
  deleteActivityType,
  saveCodeList,
  saveCustomField,
  archiveCustomField,
  deleteCustomField,
  getCustomFields,
  checkCodeListValueUsage,
} from '../../db/repository';
import {
  exportBackupToFile,
  validateAndPreviewBackup,
  restoreBackupReplace,
  restoreBackupMerge,
  rollbackSnapshot,
} from '../../services/backupService';
import {
  hasDemoData,
  getDemoRecordCounts,
  loadSampleData,
  clearSampleData,
} from '../../services/sampleDataService';
import { getStorageStatus, requestPersistentStorage, type StorageStatus } from '../../services/storageService';
import { DynamicIcon } from '../common/DynamicIcon';
import { SwipeableRow, type SwipeActionItem } from '../common/SwipeableRow';
import { ConfirmDeleteModal, type DeleteTargetInfo } from '../common/ConfirmDeleteModal';
import { db } from '../../db';

interface SettingsViewProps {
  settings: AppSettings;
  eventTypes: EventTypeDefinition[];
  activityTypes: ActivityTypeDefinition[];
  codeLists: CodeListDefinition[];
  onUpdateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  eventTypes,
  activityTypes,
  codeLists,
  onUpdateSettings,
  onRefreshData,
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'codelists' | 'fields' | 'backup' | 'demo'>('general');
  const [codeListSubTab, setCodeListSubTab] = useState<'events' | 'activities' | 'lookups'>('events');
  const [selectedLookupKey, setSelectedLookupKey] = useState<string>('expense_categories');
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

  // Storage status
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);

  // Demo status
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoCounts, setDemoCounts] = useState<{ total: number } | null>(null);

  // Backup & Restore states
  const [exporting, setExporting] = useState(false);
  const [, setRestoreFileJson] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null);
  const [validatedBackup, setValidatedBackup] = useState<DNBackup | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<DatabaseSnapshot[]>([]);

  // Code Lists & Field Builder sub-states
  const [selectedEventTypeForFields, setSelectedEventTypeForFields] = useState<string>(eventTypes[0]?.id || '');
  const [customFieldsList, setCustomFieldsList] = useState<CustomFieldDefinition[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState<any>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // Editing dialogs
  const [editingEventType, setEditingEventType] = useState<EventTypeDefinition | null>(null);
  const [editingActivityType, setEditingActivityType] = useState<ActivityTypeDefinition | null>(null);
  const [editingLookupItem, setEditingLookupItem] = useState<{ listKey: string; item: CodeListItem } | null>(null);
  const [editingCustomField, setEditingCustomField] = useState<CustomFieldDefinition | null>(null);

  // In-app delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTargetInfo | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Event Type creation modal / form
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('Calendar');
  const [newTypeColor, setNewTypeColor] = useState('#059669');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  // Activity Type creation form
  const [newActName, setNewActName] = useState('');
  const [newActIcon, setNewActIcon] = useState('CheckSquare');
  const [newActColor, setNewActColor] = useState('#3b82f6');
  const [newActDesc, setNewActDesc] = useState('');

  // Lookup Value creation form
  const [newLookupLabel, setNewLookupLabel] = useState('');
  const [newLookupColor, setNewLookupColor] = useState('#10b981');

  // Feedback message
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    getStorageStatus().then(setStorageStatus);
    checkDemoStatus();
    loadSnapshots();
  }, []);

  useEffect(() => {
    if (selectedEventTypeForFields) {
      getCustomFields('event', selectedEventTypeForFields).then(setCustomFieldsList);
    }
  }, [selectedEventTypeForFields]);

  const checkDemoStatus = async () => {
    const active = await hasDemoData();
    setIsDemoActive(active);
    if (active) {
      const counts = await getDemoRecordCounts();
      setDemoCounts(counts);
    } else {
      setDemoCounts(null);
    }
  };

  const loadSnapshots = async () => {
    const list = await db.snapshots.orderBy('createdAt').reverse().toArray();
    setSnapshots(list);
  };

  const handleRequestStorage = async () => {
    const granted = await requestPersistentStorage();
    const updated = await getStorageStatus();
    setStorageStatus(updated);
    setActionFeedback(
      granted
        ? 'Persistent browser storage granted by your device!'
        : 'Persistent storage permission prompt closed or already managed by browser.'
    );
  };

  // Backup Export
  const handleExport = async (includesMedia: boolean) => {
    setExporting(true);
    setActionFeedback(null);
    try {
      const res = await exportBackupToFile(includesMedia);
      setActionFeedback(
        `Backup created successfully: ${res.filename} (${(res.sizeBytes / 1024).toFixed(1)} KB)`
      );
      await onRefreshData();
    } catch (err: any) {
      setActionFeedback(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // File selected for restore
  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccessMsg(null);
    setRestorePreview(null);
    setValidatedBackup(null);

    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      setRestoreFileJson(text);
      const res = await validateAndPreviewBackup(text);
      if (res.isValid && res.preview && res.backup) {
        setRestorePreview(res.preview);
        setValidatedBackup(res.backup);
      } else {
        setRestoreError(res.error || 'Failed to validate backup format.');
      }
    };
    reader.readAsText(file);
  };

  // Execute Replace Restore
  const handleExecuteReplaceRestore = async () => {
    if (!validatedBackup) return;
    if (!window.confirm('Replace all active data with the backup? A safety snapshot will be created automatically.')) {
      return;
    }

    setRestoring(true);
    setRestoreError(null);
    try {
      await restoreBackupReplace(validatedBackup);
      setRestoreSuccessMsg('Backup restored successfully! All records and configuration are active.');
      setRestorePreview(null);
      setValidatedBackup(null);
      await onRefreshData();
      await loadSnapshots();
    } catch (err: any) {
      setRestoreError(`Restore failed: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  // Execute Merge Restore
  const handleExecuteMergeRestore = async () => {
    if (!validatedBackup) return;

    setRestoring(true);
    setRestoreError(null);
    try {
      const result = await restoreBackupMerge(validatedBackup);
      setRestoreSuccessMsg(
        `Merge complete! Added ${result.added} new records and updated ${result.updated} records.`
      );
      setRestorePreview(null);
      setValidatedBackup(null);
      await onRefreshData();
      await loadSnapshots();
    } catch (err: any) {
      setRestoreError(`Merge failed: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  // Rollback to Snapshot
  const handleRollbackSnapshot = async (id: string) => {
    if (!window.confirm('Rollback database state to this snapshot?')) return;
    try {
      await rollbackSnapshot(id);
      setActionFeedback('Database successfully rolled back to selected snapshot.');
      await onRefreshData();
      await loadSnapshots();
    } catch (err: any) {
      setActionFeedback(`Rollback failed: ${err.message}`);
    }
  };

  // Sample Data Handlers
  const handleLoadDemo = async (force: boolean) => {
    setActionFeedback('Loading sample dataset...');
    const res = await loadSampleData(force);
    setActionFeedback(res.message);
    await checkDemoStatus();
    await onRefreshData();
  };

  const handleClearDemo = async () => {
    if (!window.confirm('Clear all demo sample records? Real user data will be preserved.')) return;
    const res = await clearSampleData();
    setActionFeedback(
      `Sample data cleared! Removed ${res.deletedCounts.events} events, ${res.deletedCounts.activities} activities, and ${res.deletedCounts.expenses} expenses.`
    );
    await checkDemoStatus();
    await onRefreshData();
  };

  // Event Type Management
  const handleCreateEventType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    await saveEventType({
      name: newTypeName.trim(),
      description: newTypeDesc.trim(),
      icon: newTypeIcon,
      color: newTypeColor,
      allowedActivityTypeIds: ['act_type_task'],
      summaryCardConfig: {
        showGlobally: true,
        showCountdown: false,
        showActivityProgress: true,
        showExpenseTotal: true,
        showRecentPhotos: true,
        metricType: 'none',
        fieldsToShow: [],
      },
      displayOrder: eventTypes.length + 1,
      enabled: true,
    });

    setNewTypeName('');
    setNewTypeDesc('');
    setActionFeedback('New event type created successfully!');
    await onRefreshData();
  };

  const handleUpdateEventType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventType) return;
    await saveEventType(editingEventType);
    setEditingEventType(null);
    setActionFeedback('Event type updated successfully.');
    await onRefreshData();
  };

  const handleDeleteEventType = (t: EventTypeDefinition) => {
    setDeleteTarget({
      type: 'codelist',
      id: t.id,
      title: t.name,
      subtitle: 'Event Type Definition',
    });
    setIsConfirmDeleteOpen(true);
  };

  // Activity Type Management
  const handleCreateActivityType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActName.trim()) return;

    await saveActivityType({
      name: newActName.trim(),
      description: newActDesc.trim(),
      icon: newActIcon,
      color: newActColor,
      defaultStatus: 'pending',
      defaultPriority: 'medium',
      displayOrder: activityTypes.length + 1,
      enabled: true,
    });

    setNewActName('');
    setNewActDesc('');
    setActionFeedback('Activity type created successfully!');
    await onRefreshData();
  };

  const handleUpdateActivityType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivityType) return;
    await saveActivityType(editingActivityType);
    setEditingActivityType(null);
    setActionFeedback('Activity type updated successfully.');
    await onRefreshData();
  };

  const handleDeleteActivityType = (at: ActivityTypeDefinition) => {
    setDeleteTarget({
      type: 'codelist',
      id: at.id,
      title: at.name,
      subtitle: 'Activity Type Definition',
    });
    setIsConfirmDeleteOpen(true);
  };

  // Lookup Code List Values Management
  const currentLookupList = codeLists.find(cl => cl.key === selectedLookupKey);

  const handleAddLookupValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLookupLabel.trim() || !currentLookupList) return;

    const newValue: CodeListItem = {
      id: `val_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: newLookupLabel.trim(),
      color: newLookupColor,
      enabled: true,
    };

    const updatedList: CodeListDefinition = {
      ...currentLookupList,
      values: [...currentLookupList.values, newValue],
    };

    await saveCodeList(updatedList);
    setNewLookupLabel('');
    setActionFeedback(`Added "${newValue.label}" to ${currentLookupList.name}.`);
    await onRefreshData();
  };

  const handleUpdateLookupItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLookupItem) return;

    const list = codeLists.find(cl => cl.key === editingLookupItem.listKey);
    if (!list) return;

    const updatedValues = list.values.map(v =>
      v.id === editingLookupItem.item.id ? editingLookupItem.item : v
    );

    await saveCodeList({
      ...list,
      values: updatedValues,
    });

    setEditingLookupItem(null);
    setActionFeedback(`Updated code list item.`);
    await onRefreshData();
  };

  const handleDeleteLookupValue = async (item: CodeListItem) => {
    if (!currentLookupList) return;

    const usageCount = await checkCodeListValueUsage(currentLookupList.key, item.label);
    setDeleteTarget({
      type: 'codelist',
      id: item.id,
      title: item.label,
      subtitle: `${currentLookupList.name} value`,
      usageCount,
      onUnlinkInstead:
        usageCount > 0
          ? async () => {
              const updatedValues = currentLookupList.values.map(v =>
                v.id === item.id ? { ...v, enabled: false } : v
              );
              await saveCodeList({ ...currentLookupList, values: updatedValues });
              setActionFeedback(`Disabled "${item.label}" safely.`);
              await onRefreshData();
            }
          : undefined,
    });
    setIsConfirmDeleteOpen(true);
  };

  // Custom Field Management
  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !newFieldKey.trim()) return;

    const options =
      newFieldType === 'select' || newFieldType === 'multiselect'
        ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean)
        : undefined;

    await saveCustomField({
      entityType: 'event',
      targetTypeId: selectedEventTypeForFields,
      label: newFieldLabel.trim(),
      key: newFieldKey.trim(),
      type: newFieldType,
      options,
      required: false,
      displayOrder: customFieldsList.length + 1,
      archived: false,
    });

    setNewFieldLabel('');
    setNewFieldKey('');
    setNewFieldOptions('');
    const updated = await getCustomFields('event', selectedEventTypeForFields);
    setCustomFieldsList(updated);
    setActionFeedback('Custom field added successfully!');
  };

  const handleUpdateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomField) return;

    await saveCustomField(editingCustomField);
    setEditingCustomField(null);
    const updated = await getCustomFields('event', selectedEventTypeForFields);
    setCustomFieldsList(updated);
    setActionFeedback(`Updated custom field "${editingCustomField.label}".`);
  };

  const handleArchiveField = async (id: string) => {
    await archiveCustomField(id);
    const updated = await getCustomFields('event', selectedEventTypeForFields);
    setCustomFieldsList(updated);
    setActionFeedback('Custom field archived.');
  };

  const handleDeleteFieldPermanently = (f: CustomFieldDefinition) => {
    setDeleteTarget({
      type: 'customfield',
      id: f.id,
      title: f.label,
      subtitle: `Target Type ID: ${f.targetTypeId} · Key: ${f.key}`,
    });
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'codelist') {
      const isEvType = eventTypes.some(t => t.id === deleteTarget.id);
      const isActType = activityTypes.some(at => at.id === deleteTarget.id);

      if (isEvType) {
        const res = await deleteEventType(deleteTarget.id);
        if (!res.success) {
          setActionFeedback(res.reason || 'Cannot delete event type.');
        } else {
          setActionFeedback(`Event type "${deleteTarget.title}" deleted.`);
          await onRefreshData();
        }
      } else if (isActType) {
        const res = await deleteActivityType(deleteTarget.id);
        if (!res.success) {
          setActionFeedback(res.reason || 'Cannot delete activity type.');
        } else {
          setActionFeedback(`Activity type "${deleteTarget.title}" deleted.`);
          await onRefreshData();
        }
      } else if (currentLookupList) {
        const updatedValues = currentLookupList.values.filter(v => v.id !== deleteTarget.id);
        await saveCodeList({ ...currentLookupList, values: updatedValues });
        setActionFeedback(`Removed "${deleteTarget.title}".`);
        await onRefreshData();
      }
    } else if (deleteTarget.type === 'customfield') {
      await deleteCustomField(deleteTarget.id);
      const updated = await getCustomFields('event', selectedEventTypeForFields);
      setCustomFieldsList(updated);
      setActionFeedback(`Field "${deleteTarget.title}" permanently deleted.`);
    }

    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            System & Data Preferences
          </h2>
          <div className="text-xs text-stone-500 mt-0.5">
            Configure code lists, custom field schemas, storage persistence, and portable backups. Swipe left on rows to edit or delete.
          </div>
        </div>

        {isDemoActive && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-700/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Data Active ({demoCounts?.total || 0} records)</span>
          </div>
        )}
      </div>

      {/* Global Feedback Alert if any */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-700/30 rounded-xl text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-stone-400 hover:text-stone-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {[
          { id: 'general', label: 'General & Storage', icon: SettingsIcon },
          { id: 'codelists', label: 'Code Lists & Types', icon: Sliders },
          { id: 'fields', label: 'Custom Field Builder', icon: Sliders },
          { id: 'backup', label: 'Data & Backup', icon: Database },
          { id: 'demo', label: 'Sample Data', icon: Sparkles },
        ].map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------- SECTION 1: GENERAL & STORAGE ---------------- */}
      {activeSection === 'general' && (
        <div className="space-y-6">
          {/* Appearance & Theme */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Appearance & Theme
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System Match', icon: Laptop },
              ].map(t => {
                const Icon = t.icon;
                const isSelected = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onUpdateSettings({ theme: t.id as any })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency Configuration */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Default Currency
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Currency Code
                </label>
                <select
                  value={settings.currency}
                  onChange={e => {
                    const code = e.target.value;
                    const sym = code === 'INR' ? '₹' : code === 'USD' ? '$' : code === 'EUR' ? '€' : '£';
                    onUpdateSettings({ currency: code, currencySymbol: sym });
                  }}
                  className="mt-1 w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                >
                  <option value="INR">INR (Indian Rupee · ₹)</option>
                  <option value="USD">USD (US Dollar · $)</option>
                  <option value="EUR">EUR (Euro · €)</option>
                  <option value="GBP">GBP (British Pound · £)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Symbol Display
                </label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={e => onUpdateSettings({ currencySymbol: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs font-mono bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Persistent Browser Storage Awareness */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Browser Storage & Persistence Status
                </h3>
              </div>
              <button
                onClick={handleRequestStorage}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-700/30 rounded-xl hover:bg-emerald-100 transition"
              >
                Request Persistence
              </button>
            </div>

            <p className="text-xs text-stone-500">
              DN utilizes local IndexedDB. Browsers on iOS and mobile may evict cached storage when device disk space is low. Requesting persistent storage prevents eviction.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl">
                <div className="text-stone-400">Persistence Granted</div>
                <div className="font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {storageStatus?.isPersisted ? 'Yes (Protected)' : 'No (Best-effort)'}
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl">
                <div className="text-stone-400">Estimated Usage</div>
                <div className="font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
                  {((storageStatus?.usageBytes || 0) / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl col-span-2 sm:col-span-1">
                <div className="text-stone-400">Storage Quota</div>
                <div className="font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
                  {((storageStatus?.quotaBytes || 0) / (1024 * 1024 * 1024)).toFixed(1)} GB Available
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: CODE LISTS & CUSTOM TYPES ---------------- */}
      {activeSection === 'codelists' && (
        <div className="space-y-6">
          {/* Sub Tab Switcher */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setCodeListSubTab('events')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                codeListSubTab === 'events'
                  ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Event Types ({eventTypes.length})
            </button>
            <button
              onClick={() => setCodeListSubTab('activities')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                codeListSubTab === 'activities'
                  ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Activity Types ({activityTypes.length})
            </button>
            <button
              onClick={() => setCodeListSubTab('lookups')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                codeListSubTab === 'lookups'
                  ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Lookup Lists ({codeLists.length})
            </button>
          </div>

          {/* SUB-TAB 1: EVENT TYPES */}
          {codeListSubTab === 'events' && (
            <div className="space-y-6">
              {/* Create New Event Type Form */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Create New Event Type
                </h3>
                <p className="text-xs text-stone-500">
                  Define custom entities (e.g. Vehicle Maintenance, Baby Milestones, Book Reading, Travel Journal) without writing code!
                </p>

                <form onSubmit={handleCreateEventType} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500">Type Name</label>
                      <input
                        type="text"
                        required
                        value={newTypeName}
                        onChange={e => setNewTypeName(e.target.value)}
                        placeholder="e.g. Vehicle Maintenance"
                        className="mt-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-500">Icon</label>
                      <select
                        value={newTypeIcon}
                        onChange={e => setNewTypeIcon(e.target.value)}
                        className="mt-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                      >
                        <option value="Car">Car / Vehicle</option>
                        <option value="Plane">Plane / Travel</option>
                        <option value="BookOpen">Book / Reading</option>
                        <option value="GraduationCap">Education / Study</option>
                        <option value="Home">Home / Property</option>
                        <option value="Briefcase">Career / Work</option>
                        <option value="Activity">Fitness / Health</option>
                        <option value="Award">Award / Achievement</option>
                        <option value="Calendar">General Calendar</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-500">Color</label>
                      <input
                        type="color"
                        value={newTypeColor}
                        onChange={e => setNewTypeColor(e.target.value)}
                        className="mt-1 w-full h-8 p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-500">Description</label>
                    <input
                      type="text"
                      value={newTypeDesc}
                      onChange={e => setNewTypeDesc(e.target.value)}
                      placeholder="e.g. Track car servicing, oil changes, tire rotations and fuel costs"
                      className="mt-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event Type</span>
                  </button>
                </form>
              </div>

              {/* Event Types List with SwipeableRows */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Active Event Types ({eventTypes.length})
                  </h3>
                  <span className="text-[11px] text-stone-400">Swipe row to Edit or Delete</span>
                </div>

                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {eventTypes.map(t => {
                    const actions: SwipeActionItem[] = [
                      {
                        id: 'edit',
                        label: 'Edit',
                        icon: <Edit2 className="w-3.5 h-3.5" />,
                        variant: 'edit',
                        onClick: () => setEditingEventType(t),
                        ariaLabel: `Edit event type ${t.name}`,
                      },
                      {
                        id: 'delete',
                        label: 'Delete',
                        icon: <Trash2 className="w-3.5 h-3.5" />,
                        variant: 'delete',
                        onClick: () => handleDeleteEventType(t),
                        ariaLabel: `Delete event type ${t.name}`,
                      },
                    ];

                    return (
                      <SwipeableRow
                        key={t.id}
                        id={`evt_type_${t.id}`}
                        activeRowId={activeSwipeId}
                        onRowOpen={setActiveSwipeId}
                        onRowClose={() => setActiveSwipeId(null)}
                        actions={actions}
                      >
                        <div className="py-3 px-2 flex items-center justify-between gap-3 text-xs group hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: t.color }}
                            >
                              <DynamicIcon name={t.icon} className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-stone-900 dark:text-stone-100">{t.name}</div>
                              <div className="text-stone-500 text-[11px]">{t.description}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEventTypeForFields(t.id);
                                setActiveSection('fields');
                              }}
                              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                            >
                              Fields
                            </button>
                            {/* Visible desktop buttons */}
                            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => setEditingEventType(t)}
                                className="p-1 text-stone-400 hover:text-stone-700 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEventType(t)}
                                className="p-1 text-stone-400 hover:text-rose-500 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </SwipeableRow>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: ACTIVITY TYPES */}
          {codeListSubTab === 'activities' && (
            <div className="space-y-6">
              {/* Create New Activity Type */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Create New Activity Type
                </h3>
                <form onSubmit={handleCreateActivityType} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500">Name</label>
                      <input
                        type="text"
                        required
                        value={newActName}
                        onChange={e => setNewActName(e.target.value)}
                        placeholder="e.g. Oil Change, Inspection"
                        className="mt-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500">Icon</label>
                      <select
                        value={newActIcon}
                        onChange={e => setNewActIcon(e.target.value)}
                        className="mt-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                      >
                        <option value="CheckSquare">Task</option>
                        <option value="Calendar">Appointment</option>
                        <option value="Flag">Milestone</option>
                        <option value="FileText">Note</option>
                        <option value="Clock">Reminder</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-500">Color</label>
                      <input
                        type="color"
                        value={newActColor}
                        onChange={e => setNewActColor(e.target.value)}
                        className="mt-1 w-full h-8 p-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-500">Description</label>
                    <input
                      type="text"
                      value={newActDesc}
                      onChange={e => setNewActDesc(e.target.value)}
                      placeholder="e.g. Routine vehicle inspection"
                      className="mt-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Activity Type</span>
                  </button>
                </form>
              </div>

              {/* Activity Types List with SwipeableRows */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Active Activity Types ({activityTypes.length})
                  </h3>
                  <span className="text-[11px] text-stone-400">Swipe row to Edit or Delete</span>
                </div>

                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {activityTypes.map(at => {
                    const actions: SwipeActionItem[] = [
                      {
                        id: 'edit',
                        label: 'Edit',
                        icon: <Edit2 className="w-3.5 h-3.5" />,
                        variant: 'edit',
                        onClick: () => setEditingActivityType(at),
                        ariaLabel: `Edit activity type ${at.name}`,
                      },
                      {
                        id: 'delete',
                        label: 'Delete',
                        icon: <Trash2 className="w-3.5 h-3.5" />,
                        variant: 'delete',
                        onClick: () => handleDeleteActivityType(at),
                        ariaLabel: `Delete activity type ${at.name}`,
                      },
                    ];

                    return (
                      <SwipeableRow
                        key={at.id}
                        id={`act_type_${at.id}`}
                        activeRowId={activeSwipeId}
                        onRowOpen={setActiveSwipeId}
                        onRowClose={() => setActiveSwipeId(null)}
                        actions={actions}
                      >
                        <div className="py-3 px-2 flex items-center justify-between gap-3 text-xs group hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: at.color }}
                            >
                              <DynamicIcon name={at.icon} className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-stone-900 dark:text-stone-100">{at.name}</div>
                              <div className="text-stone-500 text-[11px]">{at.description}</div>
                            </div>
                          </div>

                          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => setEditingActivityType(at)}
                              className="p-1 text-stone-400 hover:text-stone-700 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivityType(at)}
                              className="p-1 text-stone-400 hover:text-rose-500 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </SwipeableRow>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: REUSABLE LOOKUP LISTS (Categories, Statuses, Priorities, Methods) */}
          {codeListSubTab === 'lookups' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Configure Lookup List Values
                    </h3>
                    <p className="text-xs text-stone-500">
                      Select any code list to add, edit, or safely remove values. Swipe left on any value row.
                    </p>
                  </div>

                  <select
                    value={selectedLookupKey}
                    onChange={e => setSelectedLookupKey(e.target.value)}
                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                  >
                    {codeLists.map(cl => (
                      <option key={cl.id} value={cl.key}>
                        {cl.name} ({cl.values.length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Value Form */}
                <form onSubmit={handleAddLookupValue} className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl space-y-2 border border-stone-200/60 dark:border-stone-700/60">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Add New Value to {currentLookupList?.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={newLookupLabel}
                      onChange={e => setNewLookupLabel(e.target.value)}
                      placeholder="e.g. Travel, Urgent, PayPal"
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                    />
                    <input
                      type="color"
                      value={newLookupColor}
                      onChange={e => setNewLookupColor(e.target.value)}
                      className="w-8 h-8 p-0.5 rounded-lg border border-stone-300 dark:border-stone-700 cursor-pointer"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition flex items-center gap-1 shadow-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Value</span>
                    </button>
                  </div>
                </form>

                {/* Values List with SwipeableRows */}
                {currentLookupList && (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800 pt-1">
                    {currentLookupList.values.map(item => {
                      const actions: SwipeActionItem[] = [
                        {
                          id: 'edit',
                          label: 'Edit',
                          icon: <Edit2 className="w-3.5 h-3.5" />,
                          variant: 'edit',
                          onClick: () =>
                            setEditingLookupItem({
                              listKey: currentLookupList.key,
                              item,
                            }),
                          ariaLabel: `Edit lookup value ${item.label}`,
                        },
                        {
                          id: 'delete',
                          label: 'Delete',
                          icon: <Trash2 className="w-3.5 h-3.5" />,
                          variant: 'delete',
                          onClick: () => handleDeleteLookupValue(item),
                          ariaLabel: `Delete lookup value ${item.label}`,
                        },
                      ];

                      return (
                        <SwipeableRow
                          key={item.id}
                          id={`lookup_${item.id}`}
                          activeRowId={activeSwipeId}
                          onRowOpen={setActiveSwipeId}
                          onRowClose={() => setActiveSwipeId(null)}
                          actions={actions}
                        >
                          <div className="py-2.5 px-2 flex items-center justify-between text-xs group hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: item.color || '#10b981' }}
                              />
                              <span
                                className={`font-semibold ${
                                  item.enabled
                                    ? 'text-stone-900 dark:text-stone-100'
                                    : 'line-through text-stone-400'
                                }`}
                              >
                                {item.label}
                              </span>
                              {!item.enabled && (
                                <span className="text-[10px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-400">
                                  Disabled
                                </span>
                              )}
                            </div>

                            {/* Visible desktop actions */}
                            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingLookupItem({
                                    listKey: currentLookupList.key,
                                    item,
                                  })
                                }
                                className="p-1 text-stone-400 hover:text-stone-700 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLookupValue(item)}
                                className="p-1 text-stone-400 hover:text-rose-500 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </SwipeableRow>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 3: CUSTOM FIELD BUILDER ---------------- */}
      {activeSection === 'fields' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Visual Dynamic Field Builder
                </h3>
                <div className="text-xs text-stone-500">
                  Add custom structured inputs to any event or activity type. Swipe left on field rows to archive or delete.
                </div>
              </div>

              <select
                value={selectedEventTypeForFields}
                onChange={e => setSelectedEventTypeForFields(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-bold"
              >
                {eventTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    Fields for: {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field Creation Form */}
            <form onSubmit={handleCreateCustomField} className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl space-y-3 border border-stone-200/60 dark:border-stone-700/60">
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Add New Field
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-500">Display Label</label>
                  <input
                    type="text"
                    required
                    value={newFieldLabel}
                    onChange={e => {
                      setNewFieldLabel(e.target.value);
                      if (!newFieldKey) {
                        setNewFieldKey(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '_')
                            .slice(0, 20)
                        );
                      }
                    }}
                    placeholder="e.g. Doctor's Name, Mileage"
                    className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-500">Field Key (Stable ID)</label>
                  <input
                    type="text"
                    required
                    value={newFieldKey}
                    onChange={e => setNewFieldKey(e.target.value)}
                    placeholder="e.g. doctor_name"
                    className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-500">Field Type</label>
                  <select
                    value={newFieldType}
                    onChange={e => setNewFieldType(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  >
                    <option value="text">Short Text</option>
                    <option value="textarea">Long Text (Textarea)</option>
                    <option value="number">Integer Number</option>
                    <option value="decimal">Decimal Number</option>
                    <option value="currency">Currency</option>
                    <option value="date">Date</option>
                    <option value="time">Time</option>
                    <option value="datetime">Date & Time</option>
                    <option value="boolean">Boolean (Yes/No)</option>
                    <option value="checkbox">Checkbox Confirmation</option>
                    <option value="select">Single Selection</option>
                    <option value="multiselect">Multiple Selection</option>
                    <option value="url">URL Link</option>
                    <option value="email">Email Address</option>
                    <option value="phone">Phone Number</option>
                    <option value="rating">Rating (1 to 5 Stars)</option>
                    <option value="duration">Duration (Minutes)</option>
                  </select>
                </div>
              </div>

              {(newFieldType === 'select' || newFieldType === 'multiselect') && (
                <div>
                  <label className="text-[11px] font-semibold text-stone-500">
                    Dropdown Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={newFieldOptions}
                    onChange={e => setNewFieldOptions(e.target.value)}
                    placeholder="Option A, Option B, Option C"
                    className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>
              )}

              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Field Definition</span>
              </button>
            </form>

            {/* List of Fields with SwipeableRows */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Configured Fields ({customFieldsList.length})
              </h4>
              {customFieldsList.length > 0 ? (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {customFieldsList.map(f => {
                    const fieldActions: SwipeActionItem[] = [
                      {
                        id: 'edit',
                        label: 'Edit',
                        icon: <Edit2 className="w-3.5 h-3.5" />,
                        variant: 'edit',
                        onClick: () => setEditingCustomField(f),
                        ariaLabel: `Edit field ${f.label}`,
                      },
                      {
                        id: 'delete',
                        label: 'Delete',
                        icon: <Trash2 className="w-3.5 h-3.5" />,
                        variant: 'delete',
                        onClick: () => handleDeleteFieldPermanently(f),
                        ariaLabel: `Delete field ${f.label}`,
                      },
                    ];

                    return (
                      <SwipeableRow
                        key={f.id}
                        id={`cf_${f.id}`}
                        activeRowId={activeSwipeId}
                        onRowOpen={setActiveSwipeId}
                        onRowClose={() => setActiveSwipeId(null)}
                        actions={fieldActions}
                      >
                        <div className="py-2.5 px-2 flex items-center justify-between text-xs group hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition">
                          <div>
                            <span className="font-bold text-stone-900 dark:text-stone-100">{f.label}</span>
                            <span className="ml-2 font-mono text-[11px] text-stone-400">({f.key})</span>
                            <span className="ml-2 text-stone-500 uppercase text-[10px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                              {f.type}
                            </span>
                            {f.required && (
                              <span className="ml-1.5 text-rose-500 text-[10px] font-semibold">
                                Required
                              </span>
                            )}
                          </div>
                          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => setEditingCustomField(f)}
                              className="p-1 text-stone-400 hover:text-stone-700 rounded"
                              title="Edit field"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleArchiveField(f.id)}
                              className="p-1 text-stone-400 hover:text-stone-700 rounded text-[11px]"
                              title="Archive field"
                            >
                              Archive
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFieldPermanently(f)}
                              className="p-1 text-stone-400 hover:text-rose-500 rounded"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </SwipeableRow>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-stone-400">
                  No custom fields configured for this type yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 4: DATA & BACKUP ---------------- */}
      {activeSection === 'backup' && (
        <div className="space-y-6">
          {/* Backup Creator Card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Export Portable Backup
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              Download your complete data in the portable DN JSON backup format. Backups are versioned and can be restored on any device or fresh installation.
            </p>

            {settings.lastBackupDate && (
              <div className="text-xs text-stone-500">
                Last successful export: <strong className="text-stone-800 dark:text-stone-200">{new Date(settings.lastBackupDate).toLocaleString()}</strong> ({settings.lastBackupType} backup)
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Option A: Standard Backup */}
              <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Standard Backup (Fast & Compact)
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Includes all events, activities, expenses, budgets, custom fields, code lists, and metadata. Excludes binary photo files.
                  </p>
                </div>
                <button
                  onClick={() => handleExport(false)}
                  disabled={exporting}
                  className="mt-3 w-full py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-700/30 hover:bg-emerald-100 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exporting ? 'Generating...' : 'Export Standard Backup'}</span>
                </button>
              </div>

              {/* Option B: Complete Backup */}
              <div className="p-4 border border-stone-200 dark:border-stone-800 rounded-xl space-y-2 flex flex-col justify-between bg-stone-50/50 dark:bg-stone-800/30">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Complete Backup (Includes All Media)
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Includes every structured record, custom configuration, relationships AND all encoded photo images. Ideal for full device migration.
                  </p>
                </div>
                <button
                  onClick={() => handleExport(true)}
                  disabled={exporting}
                  className="mt-3 w-full py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exporting ? 'Generating...' : 'Export Complete Backup'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Backup Restorer Card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Restore from Backup File
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              Select a previously exported <code className="font-mono text-emerald-700">DN-backup-*.json</code> file. DN will validate integrity and display a detailed preview before applying any changes.
            </p>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
              <Upload className="w-7 h-7 text-stone-400 mb-2" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Choose DN Backup JSON File
              </span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFileSelected}
                className="hidden"
              />
            </label>

            {restoreError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{restoreError}</span>
              </div>
            )}

            {restoreSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-700/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                {restoreSuccessMsg}
              </div>
            )}

            {/* PRE-RESTORE PREVIEW */}
            {restorePreview && (
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-700">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Backup Contents Preview
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    Exported: {new Date(restorePreview.exportedAt).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-white dark:bg-stone-900 rounded-lg">
                    <span className="text-stone-400">Events:</span>{' '}
                    <strong className="font-mono">{restorePreview.counts.events}</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-stone-900 rounded-lg">
                    <span className="text-stone-400">Activities:</span>{' '}
                    <strong className="font-mono">{restorePreview.counts.activities}</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-stone-900 rounded-lg">
                    <span className="text-stone-400">Expenses:</span>{' '}
                    <strong className="font-mono">{restorePreview.counts.expenses}</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-stone-900 rounded-lg">
                    <span className="text-stone-400">Photos:</span>{' '}
                    <strong className="font-mono">{restorePreview.counts.photos}</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-stone-900 rounded-lg">
                    <span className="text-stone-400">Event Types:</span>{' '}
                    <strong className="font-mono">{restorePreview.counts.eventTypes}</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-stone-900 rounded-lg">
                    <span className="text-stone-400">Custom Fields:</span>{' '}
                    <strong className="font-mono">{restorePreview.counts.customFields}</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-stone-900 rounded-lg">
                    <span className="text-stone-400">Budgets:</span>{' '}
                    <strong className="font-mono">{restorePreview.counts.budgets}</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-stone-900 rounded-lg">
                    <span className="text-stone-400">Goals:</span>{' '}
                    <strong className="font-mono">{restorePreview.counts.savingsGoals}</strong>
                  </div>
                </div>

                {restorePreview.warnings.length > 0 && (
                  <div className="space-y-1">
                    {restorePreview.warnings.map((w, idx) => (
                      <div key={idx} className="text-[11px] text-amber-700 dark:text-amber-300">
                        Notice: {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Restoration Mode Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleExecuteReplaceRestore}
                    disabled={restoring}
                    className="flex-1 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition shadow-xs"
                  >
                    {restoring ? 'Restoring...' : 'Mode 1: Replace Active Data'}
                  </button>

                  <button
                    onClick={handleExecuteMergeRestore}
                    disabled={restoring}
                    className="flex-1 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-700/30 hover:bg-emerald-100 rounded-xl transition"
                  >
                    {restoring ? 'Merging...' : 'Mode 2: Merge with Existing Data'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Automatic Safety Snapshots Card */}
          {snapshots.length > 0 && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-stone-500" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Pre-Restore Safety Snapshots
                </h3>
              </div>
              <p className="text-xs text-stone-500">
                Safety snapshots created automatically before previous restore operations. You can roll back if needed.
              </p>

              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {snapshots.map(s => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-stone-800 dark:text-stone-200">
                        {s.description}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRollbackSnapshot(s.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-lg transition"
                    >
                      Rollback
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 5: SAMPLE DATA ---------------- */}
      {activeSection === 'demo' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Sample Data Management
              </h3>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Explore DN with synthetic life events: milestone Birthday (Diya Sharma), Pregnancy Journey (Pooja Rao with scans and appointments), Bug Logs, Q4 Home Renovation tasks, Monthly Diary entries, categorized expenses, and savings goals.
            </p>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 rounded-xl space-y-1">
              <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Data Safety Guarantee:
              </div>
              <p className="text-[11px] text-stone-500 leading-normal">
                Every demo record is stamped with a dedicated dataset identifier (<code className="font-mono text-emerald-700">demo-dn-v1</code>). Clearing demo data will <strong>never delete or modify your real user records</strong>.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleLoadDemo(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Data</span>
              </button>

              {isDemoActive && (
                <>
                  <button
                    onClick={() => handleLoadDemo(true)}
                    className="px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-xl transition"
                  >
                    Reset & Reload Demo
                  </button>
                  <button
                    onClick={handleClearDemo}
                    className="px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 rounded-xl transition"
                  >
                    Clear Sample Data
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL: Event Type */}
      {editingEventType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Edit Event Type
              </h3>
              <button onClick={() => setEditingEventType(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateEventType} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Name</label>
                <input
                  type="text"
                  required
                  value={editingEventType.name}
                  onChange={e => setEditingEventType({ ...editingEventType, name: e.target.value })}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Description</label>
                <input
                  type="text"
                  value={editingEventType.description}
                  onChange={e => setEditingEventType({ ...editingEventType, description: e.target.value })}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEventType(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL: Activity Type */}
      {editingActivityType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Edit Activity Type
              </h3>
              <button onClick={() => setEditingActivityType(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateActivityType} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Name</label>
                <input
                  type="text"
                  required
                  value={editingActivityType.name}
                  onChange={e => setEditingActivityType({ ...editingActivityType, name: e.target.value })}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Description</label>
                <input
                  type="text"
                  value={editingActivityType.description}
                  onChange={e => setEditingActivityType({ ...editingActivityType, description: e.target.value })}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingActivityType(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL: Lookup Code List Item */}
      {editingLookupItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Edit Lookup Value
              </h3>
              <button onClick={() => setEditingLookupItem(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateLookupItem} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Label</label>
                <input
                  type="text"
                  required
                  value={editingLookupItem.item.label}
                  onChange={e =>
                    setEditingLookupItem({
                      ...editingLookupItem,
                      item: { ...editingLookupItem.item, label: e.target.value },
                    })
                  }
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Color</label>
                <input
                  type="color"
                  value={editingLookupItem.item.color || '#10b981'}
                  onChange={e =>
                    setEditingLookupItem({
                      ...editingLookupItem,
                      item: { ...editingLookupItem.item, color: e.target.value },
                    })
                  }
                  className="mt-1 w-full h-8 p-0.5 rounded-lg border border-stone-300 dark:border-stone-700 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingLookupItem.item.enabled}
                    onChange={e =>
                      setEditingLookupItem({
                        ...editingLookupItem,
                        item: { ...editingLookupItem.item, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-700"
                  />
                  <span>Active & Visible in Forms</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLookupItem(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL: Custom Field */}
      {editingCustomField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Edit Custom Field
              </h3>
              <button
                onClick={() => setEditingCustomField(null)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomField} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Label</label>
                <input
                  type="text"
                  required
                  value={editingCustomField.label}
                  onChange={e =>
                    setEditingCustomField({ ...editingCustomField, label: e.target.value })
                  }
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Field Key</label>
                <input
                  type="text"
                  required
                  value={editingCustomField.key}
                  onChange={e =>
                    setEditingCustomField({ ...editingCustomField, key: e.target.value })
                  }
                  className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-500">Field Type</label>
                <select
                  value={editingCustomField.type}
                  onChange={e =>
                    setEditingCustomField({ ...editingCustomField, type: e.target.value as any })
                  }
                  className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                >
                  <option value="text">Short Text</option>
                  <option value="textarea">Long Text</option>
                  <option value="number">Number</option>
                  <option value="decimal">Decimal</option>
                  <option value="currency">Currency</option>
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                  <option value="datetime">Date & Time</option>
                  <option value="boolean">Boolean</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="select">Select Dropdown</option>
                  <option value="multiselect">Multi-Select</option>
                  <option value="url">URL Link</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="rating">Rating</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
              {(editingCustomField.type === 'select' ||
                editingCustomField.type === 'multiselect') && (
                <div>
                  <label className="text-[11px] font-semibold text-stone-500">
                    Dropdown Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editingCustomField.options?.join(', ') || ''}
                    onChange={e =>
                      setEditingCustomField({
                        ...editingCustomField,
                        options: e.target.value
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="mt-1 w-full px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCustomField.required || false}
                    onChange={e =>
                      setEditingCustomField({
                        ...editingCustomField,
                        required: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-700"
                  />
                  <span>Required in Forms</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomField(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Settings deletion */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        target={deleteTarget}
        currencySymbol={settings.currencySymbol}
      />
    </div>
  );
};
