/**
 * DN — Domain Models & Type Specifications
 */

export type RecordId = string;

export interface BaseRecord {
  id: RecordId;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  demoDatasetId?: string; // Provocative marker for sample data
}

export type EntityStatus = 'active' | 'completed' | 'cancelled' | 'archived';
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface EventRecord extends BaseRecord {
  title: string;
  eventTypeId: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  status: EntityStatus;
  icon: string;
  color: string;
  tags: string[];
  customFieldValues: Record<string, any>;
  summaryCardEnabled: boolean;
  recurrence?: {
    frequency: 'yearly' | 'monthly' | 'none';
  };
}

export interface ActivityRecord extends BaseRecord {
  title: string;
  activityTypeId: string;
  eventId?: string; // Optional parent event
  description: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: ActivityPriority;
  dueDate?: string;
  reminderDate?: string;
  tags: string[];
  customFieldValues: Record<string, any>;
  completedAt?: string;
  cancelledAt?: string;
}

export interface ExpenseRecord extends BaseRecord {
  type: 'expense' | 'income';
  amount: number;
  currency: string; // Default 'INR'
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  notes: string;
  eventId?: string;
  activityId?: string;
  isRecurring?: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'yearly';
}

export interface PhotoRecord extends BaseRecord {
  caption: string;
  dataUrl: string; // base64 or blob URL data
  mimeType: string;
  date: string;
  size: number;
  eventId?: string;
  activityId?: string;
}

export interface RelationshipRecord {
  id: string;
  sourceType: 'event' | 'activity' | 'expense' | 'photo';
  sourceId: string;
  targetType: 'event' | 'activity' | 'expense' | 'photo';
  targetId: string;
  relation: string; // e.g. 'linked', 'receipt_of', 'memory_of'
  createdAt: string;
  demoDatasetId?: string;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'date'
  | 'time'
  | 'datetime'
  | 'boolean'
  | 'checkbox'
  | 'select'
  | 'multiselect'
  | 'url'
  | 'email'
  | 'phone'
  | 'rating'
  | 'duration'
  | 'computed';

export interface CustomFieldDefinition {
  id: string;
  entityType: 'event' | 'activity';
  targetTypeId: string; // eventTypeId or activityTypeId
  label: string;
  key: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select, multiselect
  minValue?: number;
  maxValue?: number;
  computationRule?: {
    calcType: 'days_since' | 'days_until' | 'sum' | 'percentage';
    sourceFieldKey?: string;
    targetFieldKey?: string;
  };
  displayOrder: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  demoDatasetId?: string;
}

export interface SummaryCardConfig {
  showGlobally: boolean;
  showCountdown: boolean;
  countdownField?: string; // e.g. 'birthday_date' or 'expected_due_date'
  showActivityProgress: boolean;
  showExpenseTotal: boolean;
  showRecentPhotos: boolean;
  metricType?: 'none' | 'birthday_age' | 'pregnancy_week' | 'bug_counts' | 'diary_days';
  fieldsToShow: string[]; // custom field keys/ids to show
}

export interface EventTypeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isSystem?: boolean;
  allowedActivityTypeIds: string[];
  summaryCardConfig: SummaryCardConfig;
  displayOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  demoDatasetId?: string;
}

export interface ActivityTypeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultStatus: string;
  defaultPriority: string;
  displayOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  demoDatasetId?: string;
}

export interface CodeListItem {
  id: string;
  label: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
  enabled: boolean;
}

export interface CodeListDefinition {
  id: string;
  key: string; // 'expense_categories' | 'income_categories' | 'payment_methods' | 'activity_statuses' | 'priorities' | 'tags' | 'bug_severities'
  name: string;
  description: string;
  values: CodeListItem[];
  createdAt: string;
  updatedAt: string;
  demoDatasetId?: string;
}

export interface BudgetRecord {
  id: string;
  category: string;
  monthlyLimit: number;
  period: string; // 'YYYY-MM'
  createdAt: string;
  demoDatasetId?: string;
}

export interface SavingsGoalRecord {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  color: string;
  icon: string;
  createdAt: string;
  demoDatasetId?: string;
}

export interface AppSettings {
  id: 'global';
  currency: string;
  currencySymbol: string;
  theme: 'system' | 'light' | 'dark';
  dashboardMode: 'expenses' | 'events';
  lastBackupDate?: string;
  lastBackupType?: 'standard' | 'complete';
  lastRestoreDate?: string;
  backupReminderIntervalDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSnapshot {
  id: string;
  createdAt: string;
  description: string;
  backupPayload: string; // JSON string
}

/**
 * Portable Versioned Backup Format
 */
export interface DNBackup {
  format: 'dn-backup';
  formatVersion: number;
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  includesMedia: boolean;
  checksum?: string;
  data: {
    events: EventRecord[];
    activities: ActivityRecord[];
    expenses: ExpenseRecord[];
    photos: PhotoRecord[];
    relationships: RelationshipRecord[];
    eventTypes: EventTypeDefinition[];
    activityTypes: ActivityTypeDefinition[];
    customFields: CustomFieldDefinition[];
    codeLists: CodeListDefinition[];
    budgets: BudgetRecord[];
    savingsGoals: SavingsGoalRecord[];
    settings: AppSettings;
  };
}

export interface RestorePreview {
  isValid: boolean;
  formatVersion: number;
  exportedAt: string;
  includesMedia: boolean;
  counts: {
    events: number;
    activities: number;
    expenses: number;
    photos: number;
    relationships: number;
    eventTypes: number;
    activityTypes: number;
    customFields: number;
    codeLists: number;
    budgets: number;
    savingsGoals: number;
  };
  warnings: string[];
}
