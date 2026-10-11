import { db } from './index';
import type {
  EventRecord,
  ActivityRecord,
  ExpenseRecord,
  PhotoRecord,
  RelationshipRecord,
  EventTypeDefinition,
  ActivityTypeDefinition,
  CustomFieldDefinition,
  CodeListDefinition,
  BudgetRecord,
  SavingsGoalRecord,
  AppSettings,
  DatabaseSnapshot,
} from '../types';

export function generateId(prefix: string = 'rec'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ==========================================
// EVENTS REPOSITORY
// ==========================================

export async function getAllEvents(options?: {
  typeId?: string;
  status?: string;
  search?: string;
  includeArchived?: boolean;
}): Promise<EventRecord[]> {
  let collection = db.events.toCollection();

  let records = await collection.toArray();

  if (!options?.includeArchived) {
    records = records.filter(r => r.status !== 'archived');
  }

  if (options?.typeId) {
    records = records.filter(r => r.eventTypeId === options.typeId);
  }

  if (options?.status && options.status !== 'all') {
    records = records.filter(r => r.status === options.status);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    records = records.filter(
      r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return records.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getEventById(id: string): Promise<EventRecord | undefined> {
  return db.events.get(id);
}

export async function createEvent(
  data: Omit<EventRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EventRecord> {
  const now = new Date().toISOString();
  const event: EventRecord = {
    ...data,
    id: generateId('evt'),
    createdAt: now,
    updatedAt: now,
  };
  await db.events.add(event);
  return event;
}

export async function updateEvent(
  id: string,
  updates: Partial<Omit<EventRecord, 'id' | 'createdAt'>>
): Promise<EventRecord> {
  const existing = await db.events.get(id);
  if (!existing) throw new Error(`Event ${id} not found`);

  const updated: EventRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.events.put(updated);
  return updated;
}

export async function archiveEvent(id: string): Promise<void> {
  await updateEvent(id, {
    status: 'archived',
    archivedAt: new Date().toISOString(),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await db.transaction('rw', [db.events, db.activities, db.expenses, db.photos, db.relationships], async () => {
    // Unlink or clean up references
    await db.events.delete(id);
    // Note: Do not silently delete associated expenses or photos; decouple them
    await db.expenses.where('eventId').equals(id).modify({ eventId: undefined });
    await db.photos.where('eventId').equals(id).modify({ eventId: undefined });
    await db.relationships.where('sourceId').equals(id).delete();
    await db.relationships.where('targetId').equals(id).delete();
  });
}

/**
 * Unique Diary month helper:
 * Enforces exactly one monthly container event per month (e.g. "October 2026")
 */
export async function getOrCreateMonthlyDiaryEvent(dateString: string): Promise<EventRecord> {
  const d = new Date(dateString);
  const monthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });
  const yearMonthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

  const existing = await db.events
    .where('eventTypeId')
    .equals('ev_type_diary')
    .filter(e => e.title === `Diary — ${monthName}` || e.customFieldValues?.month_year === monthName)
    .first();

  if (existing) return existing;

  const now = new Date().toISOString();
  const newDiaryEvent: EventRecord = {
    id: generateId('evt_diary'),
    title: `Diary — ${monthName}`,
    eventTypeId: 'ev_type_diary',
    description: `Personal memories and reflections for ${monthName}`,
    startDate: yearMonthStart,
    status: 'active',
    icon: 'BookOpen',
    color: '#8b5cf6',
    tags: ['Diary', 'Journal', monthName],
    customFieldValues: {
      month_year: monthName,
    },
    summaryCardEnabled: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.events.add(newDiaryEvent);
  return newDiaryEvent;
}

// ==========================================
// ACTIVITIES REPOSITORY
// ==========================================

export async function getAllActivities(options?: {
  eventId?: string;
  activityTypeId?: string;
  status?: string;
  priority?: string;
  date?: string;
  search?: string;
}): Promise<ActivityRecord[]> {
  let records = await db.activities.toArray();

  if (options?.eventId) {
    records = records.filter(r => r.eventId === options.eventId);
  }

  if (options?.activityTypeId) {
    records = records.filter(r => r.activityTypeId === options.activityTypeId);
  }

  if (options?.status && options.status !== 'all') {
    records = records.filter(r => r.status === options.status);
  }

  if (options?.priority && options.priority !== 'all') {
    records = records.filter(r => r.priority === options.priority);
  }

  if (options?.date) {
    records = records.filter(r => r.date === options.date);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    records = records.filter(
      r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getActivityById(id: string): Promise<ActivityRecord | undefined> {
  return db.activities.get(id);
}

export async function createActivity(
  data: Omit<ActivityRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ActivityRecord> {
  const now = new Date().toISOString();
  const activity: ActivityRecord = {
    ...data,
    id: generateId('act'),
    createdAt: now,
    updatedAt: now,
  };
  await db.activities.add(activity);
  return activity;
}

export async function updateActivity(
  id: string,
  updates: Partial<Omit<ActivityRecord, 'id' | 'createdAt'>>
): Promise<ActivityRecord> {
  const existing = await db.activities.get(id);
  if (!existing) throw new Error(`Activity ${id} not found`);

  const updated: ActivityRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.activities.put(updated);
  return updated;
}

export async function toggleActivityStatus(id: string): Promise<ActivityRecord> {
  const act = await db.activities.get(id);
  if (!act) throw new Error(`Activity ${id} not found`);

  const isCompleted = act.status === 'completed';
  const now = new Date().toISOString();

  const updated: ActivityRecord = {
    ...act,
    status: isCompleted ? 'pending' : 'completed',
    completedAt: isCompleted ? undefined : now,
    updatedAt: now,
  };

  await db.activities.put(updated);
  return updated;
}

export async function deleteActivity(id: string): Promise<void> {
  await db.transaction('rw', [db.activities, db.expenses, db.photos, db.relationships], async () => {
    await db.activities.delete(id);
    await db.expenses.where('activityId').equals(id).modify({ activityId: undefined });
    await db.photos.where('activityId').equals(id).modify({ activityId: undefined });
    await db.relationships.where('sourceId').equals(id).delete();
    await db.relationships.where('targetId').equals(id).delete();
  });
}

// ==========================================
// EXPENSES & INCOME REPOSITORY
// ==========================================

export async function getAllExpenses(options?: {
  type?: 'expense' | 'income';
  category?: string;
  eventId?: string;
  activityId?: string;
  search?: string;
  month?: string; // YYYY-MM
}): Promise<ExpenseRecord[]> {
  let records = await db.expenses.toArray();

  if (options?.type) {
    records = records.filter(r => r.type === options.type);
  }

  if (options?.category && options.category !== 'all') {
    records = records.filter(r => r.category === options.category);
  }

  if (options?.eventId) {
    records = records.filter(r => r.eventId === options.eventId);
  }

  if (options?.activityId) {
    records = records.filter(r => r.activityId === options.activityId);
  }

  if (options?.month) {
    records = records.filter(r => r.date.startsWith(options.month!));
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    records = records.filter(
      r =>
        r.notes.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.paymentMethod.toLowerCase().includes(q)
    );
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createExpense(
  data: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExpenseRecord> {
  const now = new Date().toISOString();
  const expense: ExpenseRecord = {
    ...data,
    id: generateId('exp'),
    createdAt: now,
    updatedAt: now,
  };
  await db.expenses.add(expense);
  return expense;
}

export async function updateExpense(
  id: string,
  updates: Partial<Omit<ExpenseRecord, 'id' | 'createdAt'>>
): Promise<ExpenseRecord> {
  const existing = await db.expenses.get(id);
  if (!existing) throw new Error(`Expense ${id} not found`);

  const updated: ExpenseRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.expenses.put(updated);
  return updated;
}

export async function deleteExpense(id: string): Promise<void> {
  await db.expenses.delete(id);
}

// ==========================================
// PHOTOS & ATTACHMENTS REPOSITORY
// ==========================================

export async function getAllPhotos(): Promise<PhotoRecord[]> {
  const photos = await db.photos.toArray();
  return photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPhotosByEvent(eventId: string): Promise<PhotoRecord[]> {
  const photos = await db.photos.where('eventId').equals(eventId).toArray();
  return photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPhotosByActivity(activityId: string): Promise<PhotoRecord[]> {
  const photos = await db.photos.where('activityId').equals(activityId).toArray();
  return photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createPhoto(
  data: Omit<PhotoRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PhotoRecord> {
  const now = new Date().toISOString();
  const photo: PhotoRecord = {
    ...data,
    id: generateId('pho'),
    createdAt: now,
    updatedAt: now,
  };
  await db.photos.add(photo);
  return photo;
}

export async function unlinkPhoto(photoId: string, fromType: 'event' | 'activity'): Promise<void> {
  const photo = await db.photos.get(photoId);
  if (!photo) return;

  if (fromType === 'event') {
    await db.photos.update(photoId, { eventId: undefined });
  } else {
    await db.photos.update(photoId, { activityId: undefined });
  }
}

export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id);
}

// ==========================================
// CONFIGURATION ENGINE (TYPES, FIELDS, LISTS)
// ==========================================

export async function getEventTypes(): Promise<EventTypeDefinition[]> {
  const types = await db.eventTypes.toArray();
  return types.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function saveEventType(
  data: Omit<EventTypeDefinition, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<EventTypeDefinition> {
  const now = new Date().toISOString();
  const id = data.id || generateId('ev_type');
  const existing = await db.eventTypes.get(id);

  const eventType: EventTypeDefinition = {
    ...data,
    id,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
  await db.eventTypes.put(eventType);
  return eventType;
}

export async function deleteEventType(id: string): Promise<{ success: boolean; reason?: string }> {
  // Check if events are using this type
  const inUseCount = await db.events.where('eventTypeId').equals(id).count();
  if (inUseCount > 0) {
    return {
      success: false,
      reason: `Cannot delete: ${inUseCount} event(s) are currently assigned to this type. Archive it instead or reassign the events.`,
    };
  }

  await db.eventTypes.delete(id);
  // Also clean up any associated custom fields
  await db.customFields.where('targetTypeId').equals(id).delete();
  return { success: true };
}

export async function getActivityTypes(): Promise<ActivityTypeDefinition[]> {
  const types = await db.activityTypes.toArray();
  return types.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function saveActivityType(
  data: Omit<ActivityTypeDefinition, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<ActivityTypeDefinition> {
  const now = new Date().toISOString();
  const id = data.id || generateId('act_type');
  const existing = await db.activityTypes.get(id);

  const actType: ActivityTypeDefinition = {
    ...data,
    id,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
  await db.activityTypes.put(actType);
  return actType;
}

export async function deleteActivityType(id: string): Promise<{ success: boolean; reason?: string }> {
  const inUseCount = await db.activities.where('activityTypeId').equals(id).count();
  if (inUseCount > 0) {
    return {
      success: false,
      reason: `Cannot delete: ${inUseCount} activity(s) are currently assigned to this type.`,
    };
  }

  await db.activityTypes.delete(id);
  await db.customFields.where('targetTypeId').equals(id).delete();
  return { success: true };
}

export async function getCustomFields(
  entityType?: 'event' | 'activity',
  targetTypeId?: string
): Promise<CustomFieldDefinition[]> {
  let fields = await db.customFields.toArray();

  if (entityType) {
    fields = fields.filter(f => f.entityType === entityType);
  }
  if (targetTypeId) {
    fields = fields.filter(f => f.targetTypeId === targetTypeId);
  }

  return fields
    .filter(f => !f.archived)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function saveCustomField(
  data: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<CustomFieldDefinition> {
  const now = new Date().toISOString();
  const id = data.id || generateId('cf');
  const existing = await db.customFields.get(id);

  const field: CustomFieldDefinition = {
    ...data,
    id,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
  await db.customFields.put(field);
  return field;
}

export async function archiveCustomField(id: string): Promise<void> {
  const existing = await db.customFields.get(id);
  if (!existing) return;
  await db.customFields.put({
    ...existing,
    archived: true,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCustomField(id: string): Promise<void> {
  await db.customFields.delete(id);
}

export async function getCodeLists(): Promise<CodeListDefinition[]> {
  return db.codeLists.toArray();
}

export async function getCodeList(key: string): Promise<CodeListDefinition | undefined> {
  return db.codeLists.where('key').equals(key).first();
}

export async function saveCodeList(codeList: CodeListDefinition): Promise<void> {
  await db.codeLists.put({
    ...codeList,
    updatedAt: new Date().toISOString(),
  });
}

// ==========================================
// BUDGETS & SAVINGS GOALS
// ==========================================

export async function getBudgets(): Promise<BudgetRecord[]> {
  return db.budgets.toArray();
}

export async function saveBudget(budget: Omit<BudgetRecord, 'id' | 'createdAt'> & { id?: string }): Promise<BudgetRecord> {
  const id = budget.id || generateId('bdg');
  const record: BudgetRecord = {
    ...budget,
    id,
    createdAt: new Date().toISOString(),
  };
  await db.budgets.put(record);
  return record;
}

export async function deleteBudget(id: string): Promise<void> {
  await db.budgets.delete(id);
}

export async function getSavingsGoals(): Promise<SavingsGoalRecord[]> {
  return db.savingsGoals.toArray();
}

export async function saveSavingsGoal(
  goal: Omit<SavingsGoalRecord, 'id' | 'createdAt'> & { id?: string }
): Promise<SavingsGoalRecord> {
  const id = goal.id || generateId('svg');
  const record: SavingsGoalRecord = {
    ...goal,
    id,
    createdAt: new Date().toISOString(),
  };
  await db.savingsGoals.put(record);
  return record;
}

export async function updateSavingsGoalAmount(id: string, newCurrentAmount: number): Promise<void> {
  const existing = await db.savingsGoals.get(id);
  if (!existing) return;
  await db.savingsGoals.update(id, { currentAmount: newCurrentAmount });
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await db.savingsGoals.delete(id);
}

// ==========================================
// APP SETTINGS REPOSITORY
// ==========================================

export async function getAppSettings(): Promise<AppSettings> {
  const settings = await db.appSettings.get('global');
  if (settings) return settings;

  const now = new Date().toISOString();
  const defaultSettings: AppSettings = {
    id: 'global',
    currency: 'INR',
    currencySymbol: '₹',
    theme: 'system',
    dashboardMode: 'events',
    backupReminderIntervalDays: 7,
    createdAt: now,
    updatedAt: now,
  };
  await db.appSettings.put(defaultSettings);
  return defaultSettings;
}

export async function updateAppSettings(updates: Partial<Omit<AppSettings, 'id' | 'createdAt'>>): Promise<AppSettings> {
  const existing = await getAppSettings();
  const updated: AppSettings = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.appSettings.put(updated);
  return updated;
}
