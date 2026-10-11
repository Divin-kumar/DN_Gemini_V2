import Dexie, { type Table } from 'dexie';
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

export class DNDatabase extends Dexie {
  events!: Table<EventRecord, string>;
  activities!: Table<ActivityRecord, string>;
  expenses!: Table<ExpenseRecord, string>;
  photos!: Table<PhotoRecord, string>;
  relationships!: Table<RelationshipRecord, string>;
  eventTypes!: Table<EventTypeDefinition, string>;
  activityTypes!: Table<ActivityTypeDefinition, string>;
  customFields!: Table<CustomFieldDefinition, string>;
  codeLists!: Table<CodeListDefinition, string>;
  budgets!: Table<BudgetRecord, string>;
  savingsGoals!: Table<SavingsGoalRecord, string>;
  appSettings!: Table<AppSettings, string>;
  snapshots!: Table<DatabaseSnapshot, string>;

  constructor() {
    super('DN_LifeManagement_DB');

    // Schema Version 1
    this.version(1).stores({
      events: 'id, eventTypeId, startDate, status, summaryCardEnabled, demoDatasetId, createdAt',
      activities: 'id, eventId, activityTypeId, date, status, priority, dueDate, demoDatasetId, createdAt',
      expenses: 'id, type, category, date, paymentMethod, eventId, activityId, demoDatasetId, createdAt',
      photos: 'id, date, eventId, activityId, demoDatasetId, createdAt',
      relationships: 'id, sourceType, sourceId, targetType, targetId, demoDatasetId',
      eventTypes: 'id, name, displayOrder, enabled, demoDatasetId',
      activityTypes: 'id, name, displayOrder, enabled, demoDatasetId',
      customFields: 'id, entityType, targetTypeId, key, displayOrder, archived, demoDatasetId',
      codeLists: 'id, key, demoDatasetId',
      budgets: 'id, category, period, demoDatasetId',
      savingsGoals: 'id, targetDate, demoDatasetId',
      appSettings: 'id',
      snapshots: 'id, createdAt',
    });
  }
}

export const db = new DNDatabase();

/**
 * Seed foundational configuration if database is empty.
 * Fully user-editable and non-hardcoded.
 */
export async function initializeDatabase(): Promise<void> {
  const settingsCount = await db.appSettings.count();
  if (settingsCount > 0) return;

  const now = new Date().toISOString();

  // 1. Foundational Settings
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

  // 2. Default Code Lists
  const defaultCodeLists: CodeListDefinition[] = [
    {
      id: 'cl_expense_cat',
      key: 'expense_categories',
      name: 'Expense Categories',
      description: 'Categories for organizing personal and household expenses',
      values: [
        { id: 'cat_food', label: 'Food & Dining', color: '#10b981', enabled: true, isDefault: true },
        { id: 'cat_groceries', label: 'Groceries', color: '#059669', enabled: true },
        { id: 'cat_rent', label: 'Housing & Rent', color: '#6366f1', enabled: true },
        { id: 'cat_transport', label: 'Transport & Fuel', color: '#3b82f6', enabled: true },
        { id: 'cat_utilities', label: 'Bills & Utilities', color: '#f59e0b', enabled: true },
        { id: 'cat_health', label: 'Healthcare & Medical', color: '#ec4899', enabled: true },
        { id: 'cat_shopping', label: 'Shopping', color: '#8b5cf6', enabled: true },
        { id: 'cat_entertainment', label: 'Entertainment & Leisure', color: '#14b8a6', enabled: true },
        { id: 'cat_celebration', label: 'Gifts & Celebration', color: '#f43f5e', enabled: true },
        { id: 'cat_other', label: 'Miscellaneous', color: '#64748b', enabled: true },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cl_income_cat',
      key: 'income_categories',
      name: 'Income Categories',
      description: 'Categories for organizing personal revenue sources',
      values: [
        { id: 'inc_salary', label: 'Salary', color: '#10b981', enabled: true, isDefault: true },
        { id: 'inc_freelance', label: 'Freelance & Consulting', color: '#3b82f6', enabled: true },
        { id: 'inc_investments', label: 'Dividends & Returns', color: '#8b5cf6', enabled: true },
        { id: 'inc_gifts', label: 'Gifts & Reimbursements', color: '#ec4899', enabled: true },
        { id: 'inc_other', label: 'Other Income', color: '#64748b', enabled: true },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cl_pay_methods',
      key: 'payment_methods',
      name: 'Payment Methods',
      description: 'Payment modes used for settling expenses and receiving income',
      values: [
        { id: 'pm_upi', label: 'UPI / Google Pay / PhonePe', color: '#10b981', enabled: true, isDefault: true },
        { id: 'pm_cc', label: 'Credit Card', color: '#6366f1', enabled: true },
        { id: 'pm_dc', label: 'Debit Card', color: '#3b82f6', enabled: true },
        { id: 'pm_cash', label: 'Cash', color: '#f59e0b', enabled: true },
        { id: 'pm_netbanking', label: 'Net Banking', color: '#8b5cf6', enabled: true },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cl_priorities',
      key: 'priorities',
      name: 'Priorities',
      description: 'Priority levels for activities and tasks',
      values: [
        { id: 'prio_low', label: 'Low', color: '#94a3b8', enabled: true },
        { id: 'prio_med', label: 'Medium', color: '#3b82f6', enabled: true, isDefault: true },
        { id: 'prio_high', label: 'High', color: '#f59e0b', enabled: true },
        { id: 'prio_urgent', label: 'Urgent', color: '#ef4444', enabled: true },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cl_severities',
      key: 'bug_severities',
      name: 'Bug Severities',
      description: 'Severity ratings for bug tracking',
      values: [
        { id: 'sev_crit', label: 'Critical', color: '#dc2626', enabled: true },
        { id: 'sev_high', label: 'High', color: '#f97316', enabled: true },
        { id: 'sev_med', label: 'Medium', color: '#eab308', enabled: true, isDefault: true },
        { id: 'sev_low', label: 'Low', color: '#3b82f6', enabled: true },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.codeLists.bulkPut(defaultCodeLists);

  // 3. Default Activity Types
  const defaultActivityTypes: ActivityTypeDefinition[] = [
    {
      id: 'act_type_task',
      name: 'Task',
      description: 'Action item or to-do',
      icon: 'CheckSquare',
      color: '#3b82f6',
      defaultStatus: 'pending',
      defaultPriority: 'medium',
      displayOrder: 1,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'act_type_appointment',
      name: 'Appointment',
      description: 'Meeting, doctor visit, or consultation',
      icon: 'Calendar',
      color: '#10b981',
      defaultStatus: 'pending',
      defaultPriority: 'high',
      displayOrder: 2,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'act_type_celebration',
      name: 'Celebration Plan',
      description: 'Dinner, party, gift purchase, or outing',
      icon: 'PartyPopper',
      color: '#f59e0b',
      defaultStatus: 'pending',
      defaultPriority: 'medium',
      displayOrder: 3,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'act_type_diary_entry',
      name: 'Daily Memory',
      description: 'Daily journal entry or reflections',
      icon: 'BookOpen',
      color: '#8b5cf6',
      defaultStatus: 'completed',
      defaultPriority: 'low',
      displayOrder: 4,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'act_type_bug_issue',
      name: 'Bug Investigation & Fix',
      description: 'Reproduction, fixing, or testing step',
      icon: 'Bug',
      color: '#ef4444',
      defaultStatus: 'pending',
      defaultPriority: 'high',
      displayOrder: 5,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'act_type_milestone',
      name: 'Milestone',
      description: 'Important checkpoint or milestone reached',
      icon: 'Flag',
      color: '#06b6d4',
      defaultStatus: 'completed',
      defaultPriority: 'medium',
      displayOrder: 6,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.activityTypes.bulkPut(defaultActivityTypes);

  // 4. Default Event Types (Editable Configs!)
  const defaultEventTypes: EventTypeDefinition[] = [
    {
      id: 'ev_type_birthday',
      name: 'Birthday',
      description: 'Track birthdays, milestone ages, gift ideas, and celebrations',
      icon: 'Cake',
      color: '#10b981',
      allowedActivityTypeIds: ['act_type_task', 'act_type_celebration', 'act_type_milestone'],
      summaryCardConfig: {
        showGlobally: true,
        showCountdown: true,
        countdownField: 'dob',
        showActivityProgress: true,
        showExpenseTotal: true,
        showRecentPhotos: true,
        metricType: 'birthday_age',
        fieldsToShow: ['cf_bday_person', 'cf_bday_rel'],
      },
      displayOrder: 1,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ev_type_pregnancy',
      name: 'Pregnancy Journey',
      description: 'Track trimesters, medical checkups, ultrasound scans, and milestones',
      icon: 'HeartHandshake',
      color: '#ec4899',
      allowedActivityTypeIds: ['act_type_appointment', 'act_type_milestone', 'act_type_task'],
      summaryCardConfig: {
        showGlobally: true,
        showCountdown: true,
        countdownField: 'cf_preg_due_date',
        showActivityProgress: true,
        showExpenseTotal: true,
        showRecentPhotos: true,
        metricType: 'pregnancy_week',
        fieldsToShow: ['cf_preg_doctor', 'cf_preg_hospital'],
      },
      displayOrder: 2,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ev_type_task_tracker',
      name: 'Task Tracker',
      description: 'Personal projects, sprints, to-dos, and actionable milestones',
      icon: 'CheckSquare',
      color: '#3b82f6',
      allowedActivityTypeIds: ['act_type_task', 'act_type_milestone'],
      summaryCardConfig: {
        showGlobally: true,
        showCountdown: false,
        showActivityProgress: true,
        showExpenseTotal: false,
        showRecentPhotos: false,
        metricType: 'none',
        fieldsToShow: ['cf_task_prio'],
      },
      displayOrder: 3,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ev_type_bug_logs',
      name: 'Bug Logs',
      description: 'Track bugs, reproduction steps, testing notes, and fixes',
      icon: 'Bug',
      color: '#ef4444',
      allowedActivityTypeIds: ['act_type_bug_issue', 'act_type_task'],
      summaryCardConfig: {
        showGlobally: true,
        showCountdown: false,
        showActivityProgress: true,
        showExpenseTotal: false,
        showRecentPhotos: false,
        metricType: 'bug_counts',
        fieldsToShow: ['cf_bug_sev', 'cf_bug_env'],
      },
      displayOrder: 4,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'ev_type_diary',
      name: 'Diary',
      description: 'Monthly life journals, thoughts, reflections, and daily entries',
      icon: 'BookOpen',
      color: '#8b5cf6',
      allowedActivityTypeIds: ['act_type_diary_entry'],
      summaryCardConfig: {
        showGlobally: true,
        showCountdown: false,
        showActivityProgress: true,
        showExpenseTotal: true,
        showRecentPhotos: true,
        metricType: 'diary_days',
        fieldsToShow: ['cf_diary_month'],
      },
      displayOrder: 5,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.eventTypes.bulkPut(defaultEventTypes);

  // 5. Default Custom Fields for the initial types
  const defaultCustomFields: CustomFieldDefinition[] = [
    // Birthday fields
    {
      id: 'cf_bday_person',
      entityType: 'event',
      targetTypeId: 'ev_type_birthday',
      label: "Person's Name",
      key: 'person_name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Diya Sharma',
      displayOrder: 1,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cf_bday_dob',
      entityType: 'event',
      targetTypeId: 'ev_type_birthday',
      label: 'Date of Birth',
      key: 'dob',
      type: 'date',
      required: true,
      displayOrder: 2,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cf_bday_rel',
      entityType: 'event',
      targetTypeId: 'ev_type_birthday',
      label: 'Relationship',
      key: 'relationship',
      type: 'select',
      required: false,
      options: ['Partner', 'Child', 'Parent', 'Sibling', 'Friend', 'Colleague', 'Self'],
      defaultValue: 'Friend',
      displayOrder: 3,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },

    // Pregnancy Journey fields
    {
      id: 'cf_preg_lmp',
      entityType: 'event',
      targetTypeId: 'ev_type_pregnancy',
      label: 'LMP Date (Last Menstrual Period)',
      key: 'lmp_date',
      type: 'date',
      required: false,
      displayOrder: 1,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cf_preg_due_date',
      entityType: 'event',
      targetTypeId: 'ev_type_pregnancy',
      label: 'Expected Due Date',
      key: 'due_date',
      type: 'date',
      required: true,
      displayOrder: 2,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cf_preg_doctor',
      entityType: 'event',
      targetTypeId: 'ev_type_pregnancy',
      label: 'Doctor / Obstetrician',
      key: 'doctor',
      type: 'text',
      required: false,
      placeholder: 'e.g. Dr. Priya Rao',
      displayOrder: 3,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cf_preg_hospital',
      entityType: 'event',
      targetTypeId: 'ev_type_pregnancy',
      label: 'Hospital / Clinic',
      key: 'hospital',
      type: 'text',
      required: false,
      placeholder: 'e.g. Cloudnine Hospital',
      displayOrder: 4,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },

    // Task Tracker fields
    {
      id: 'cf_task_prio',
      entityType: 'event',
      targetTypeId: 'ev_type_task_tracker',
      label: 'Project Priority',
      key: 'priority',
      type: 'select',
      required: false,
      options: ['Low', 'Medium', 'High', 'Urgent'],
      defaultValue: 'Medium',
      displayOrder: 1,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },

    // Bug Logs fields
    {
      id: 'cf_bug_sev',
      entityType: 'event',
      targetTypeId: 'ev_type_bug_logs',
      label: 'Default Severity',
      key: 'severity',
      type: 'select',
      required: false,
      options: ['Critical', 'High', 'Medium', 'Low'],
      defaultValue: 'Medium',
      displayOrder: 1,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cf_bug_env',
      entityType: 'event',
      targetTypeId: 'ev_type_bug_logs',
      label: 'Environment',
      key: 'environment',
      type: 'select',
      options: ['Production', 'Staging', 'Development', 'Local'],
      defaultValue: 'Production',
      required: false,
      displayOrder: 2,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },

    // Diary fields
    {
      id: 'cf_diary_month',
      entityType: 'event',
      targetTypeId: 'ev_type_diary',
      label: 'Month & Year',
      key: 'month_year',
      type: 'text',
      required: true,
      placeholder: 'e.g. October 2026',
      displayOrder: 1,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },

    // Activity Custom Field: Daily Diary Mood
    {
      id: 'cf_act_mood',
      entityType: 'activity',
      targetTypeId: 'act_type_diary_entry',
      label: 'Mood of the Day',
      key: 'mood',
      type: 'select',
      options: ['Joyful', 'Peaceful', 'Productive', 'Reflective', 'Tired', 'Challenging'],
      defaultValue: 'Peaceful',
      required: false,
      displayOrder: 1,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.customFields.bulkPut(defaultCustomFields);
}
