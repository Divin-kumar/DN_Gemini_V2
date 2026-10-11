import { db } from '../db';
import type {
  EventRecord,
  ActivityRecord,
  ExpenseRecord,
  PhotoRecord,
  BudgetRecord,
  SavingsGoalRecord,
} from '../types';

export const DEMO_DATASET_ID = 'demo-dn-v1';

/**
 * Check if demo data currently exists in the database.
 */
export async function hasDemoData(): Promise<boolean> {
  const demoEvents = await db.events.where('demoDatasetId').equals(DEMO_DATASET_ID).count();
  return demoEvents > 0;
}

/**
 * Count how many demo records are currently present across tables.
 */
export async function getDemoRecordCounts(): Promise<{
  events: number;
  activities: number;
  expenses: number;
  photos: number;
  budgets: number;
  savingsGoals: number;
  total: number;
}> {
  const [events, activities, expenses, photos, budgets, savingsGoals] = await Promise.all([
    db.events.where('demoDatasetId').equals(DEMO_DATASET_ID).count(),
    db.activities.where('demoDatasetId').equals(DEMO_DATASET_ID).count(),
    db.expenses.where('demoDatasetId').equals(DEMO_DATASET_ID).count(),
    db.photos.where('demoDatasetId').equals(DEMO_DATASET_ID).count(),
    db.budgets.where('demoDatasetId').equals(DEMO_DATASET_ID).count(),
    db.savingsGoals.where('demoDatasetId').equals(DEMO_DATASET_ID).count(),
  ]);

  return {
    events,
    activities,
    expenses,
    photos,
    budgets,
    savingsGoals,
    total: events + activities + expenses + photos + budgets + savingsGoals,
  };
}

/**
 * Generate a lightweight, self-contained SVG Data URI for demo photos
 */
function createDemoSvgDataUri(title: string, color: string, sub: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="${color}"/>
    <circle cx="300" cy="180" r="80" fill="white" opacity="0.15"/>
    <text x="300" y="190" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">${title}</text>
    <text x="300" y="230" font-family="system-ui, sans-serif" font-size="16" fill="white" opacity="0.85" text-anchor="middle">${sub}</text>
    <rect x="20" y="20" width="560" height="360" rx="16" fill="none" stroke="white" stroke-width="2" opacity="0.2"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Load synthetic demo dataset into the database safely.
 */
export async function loadSampleData(forceReset: boolean = false): Promise<{
  success: boolean;
  message: string;
}> {
  const existing = await hasDemoData();
  if (existing && !forceReset) {
    return {
      success: false,
      message: 'Sample data is already loaded. Use reset to reload fresh demo records.',
    };
  }

  if (existing && forceReset) {
    await clearSampleData();
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowIso = now.toISOString();

  // Next week date
  const nextWeek = new Date(now.getTime() + 7 * 86400000);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);

  // Month string (e.g. October 2026)
  const currentMonthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // 1. Demo Events
  const demoEvents: EventRecord[] = [
    {
      id: 'demo_evt_birthday',
      title: "Diya's 30th Milestone Birthday",
      eventTypeId: 'ev_type_birthday',
      description: 'Planning a memorable 30th celebration dinner with close family and college friends.',
      startDate: todayStr,
      status: 'active',
      icon: 'Cake',
      color: '#10b981',
      tags: ['Birthday', 'Family', 'Celebration'],
      customFieldValues: {
        person_name: 'Diya Sharma',
        dob: '1996-10-24',
        relationship: 'Partner',
        notes: 'Loves Italian dining and artisan cheesecakes.',
      },
      summaryCardEnabled: true,
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_evt_pregnancy',
      title: "Pooja's Pregnancy Journey",
      eventTypeId: 'ev_type_pregnancy',
      description: 'First pregnancy journey! Tracking trimester progress, scans, doctor appointments, and nursery prep.',
      startDate: '2026-05-15',
      status: 'active',
      icon: 'HeartHandshake',
      color: '#ec4899',
      tags: ['Baby', 'Health', 'Milestone'],
      customFieldValues: {
        lmp_date: '2026-05-01',
        due_date: '2027-02-05',
        doctor: 'Dr. Priya Rao (MD, DGO)',
        hospital: 'Cloudnine Maternity Care',
      },
      summaryCardEnabled: true,
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_evt_task_tracker',
      title: 'Q4 Home Office Renovation',
      eventTypeId: 'ev_type_task_tracker',
      description: 'Setting up an ergonomic workspace with dual monitors, acoustic panels, and warm ambient lighting.',
      startDate: todayStr,
      status: 'active',
      icon: 'CheckSquare',
      color: '#3b82f6',
      tags: ['Home', 'Productivity'],
      customFieldValues: {
        priority: 'High',
      },
      summaryCardEnabled: true,
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_evt_bug_logs',
      title: 'DN App Performance & Memory Tuning',
      eventTypeId: 'ev_type_bug_logs',
      description: 'Investigating high memory usage during image compression and background blob serialization.',
      startDate: todayStr,
      status: 'active',
      icon: 'Bug',
      color: '#ef4444',
      tags: ['Engineering', 'Performance'],
      customFieldValues: {
        severity: 'High',
        environment: 'Production',
      },
      summaryCardEnabled: true,
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_evt_diary',
      title: `Diary — ${currentMonthYear}`,
      eventTypeId: 'ev_type_diary',
      description: `Reflections, milestones, and daily notes for ${currentMonthYear}.`,
      startDate: `${todayStr.slice(0, 7)}-01`,
      status: 'active',
      icon: 'BookOpen',
      color: '#8b5cf6',
      tags: ['Diary', 'Reflections'],
      customFieldValues: {
        month_year: currentMonthYear,
      },
      summaryCardEnabled: true,
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  // 2. Demo Activities
  const demoActivities: ActivityRecord[] = [
    // For Birthday
    {
      id: 'demo_act_bday_1',
      title: 'Reserve table at Olive Bistro',
      activityTypeId: 'act_type_celebration',
      eventId: 'demo_evt_birthday',
      description: 'Book private terrace table for 8 guests with birthday arrangement.',
      date: todayStr,
      time: '19:30',
      status: 'completed',
      priority: 'high',
      dueDate: todayStr,
      tags: ['Reservation', 'Dining'],
      customFieldValues: {},
      completedAt: nowIso,
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_act_bday_2',
      title: 'Order Pistachio Raspberry Cheesecake',
      activityTypeId: 'act_type_task',
      eventId: 'demo_evt_birthday',
      description: 'Pickup from Magnolia Bakery at 4 PM.',
      date: nextWeekStr,
      time: '16:00',
      status: 'pending',
      priority: 'high',
      dueDate: nextWeekStr,
      tags: ['Cake', 'Surprise'],
      customFieldValues: {},
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // For Pregnancy Journey
    {
      id: 'demo_act_preg_1',
      title: 'Anomaly (TIFFA) Ultrasound Scan',
      activityTypeId: 'act_type_appointment',
      eventId: 'demo_evt_pregnancy',
      description: 'Detailed anatomy scan with Dr. Swaminathan. Baby growth metrics on track!',
      date: todayStr,
      time: '11:00',
      status: 'completed',
      priority: 'urgent',
      tags: ['Ultrasound', 'Medical'],
      customFieldValues: {},
      completedAt: nowIso,
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_act_preg_2',
      title: 'Trimester 3 Glucose Screening',
      activityTypeId: 'act_type_appointment',
      eventId: 'demo_evt_pregnancy',
      description: 'Routine blood panel & fasting glucose test.',
      date: nextWeekStr,
      time: '09:00',
      status: 'pending',
      priority: 'high',
      dueDate: nextWeekStr,
      tags: ['Lab', 'Routine'],
      customFieldValues: {},
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // For Task Tracker
    {
      id: 'demo_act_task_1',
      title: 'Assemble Standing Desk & Cable Management',
      activityTypeId: 'act_type_task',
      eventId: 'demo_evt_task_tracker',
      description: 'Mount cable spine, power strip, and monitor arms.',
      date: todayStr,
      status: 'in_progress',
      priority: 'medium',
      dueDate: todayStr,
      tags: ['Setup'],
      customFieldValues: {},
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // For Bug Logs
    {
      id: 'demo_act_bug_1',
      title: 'Profile Dexie Index Queries on Mobile Safari',
      activityTypeId: 'act_type_bug_issue',
      eventId: 'demo_evt_bug_logs',
      description: 'Verify memory curve across large blob imports. Optimize chunk size to 1MB.',
      date: todayStr,
      status: 'pending',
      priority: 'urgent',
      tags: ['Optimization'],
      customFieldValues: {},
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // For Diary
    {
      id: 'demo_act_diary_1',
      title: 'Morning Walk & Serene Sunday',
      activityTypeId: 'act_type_diary_entry',
      eventId: 'demo_evt_diary',
      description:
        'Walked 6km around the lake at sunrise. Had a delicious filter coffee and planned the week ahead in peace.',
      date: todayStr,
      time: '08:00',
      status: 'completed',
      priority: 'low',
      tags: ['Gratitude', 'Peace'],
      customFieldValues: {
        mood: 'Joyful',
      },
      completedAt: nowIso,
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  // 3. Demo Expenses
  const demoExpenses: ExpenseRecord[] = [
    {
      id: 'demo_exp_1',
      type: 'expense',
      amount: 4500,
      currency: 'INR',
      category: 'Healthcare & Medical',
      date: todayStr,
      paymentMethod: 'UPI / Google Pay / PhonePe',
      notes: 'Anomaly Ultrasound Scan fees at Cloudnine',
      eventId: 'demo_evt_pregnancy',
      activityId: 'demo_act_preg_1',
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_exp_2',
      type: 'expense',
      amount: 3200,
      currency: 'INR',
      category: 'Food & Dining',
      date: todayStr,
      paymentMethod: 'Credit Card',
      notes: 'Olive Bistro advance reservation deposit',
      eventId: 'demo_evt_birthday',
      activityId: 'demo_act_bday_1',
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_exp_3',
      type: 'expense',
      amount: 14500,
      currency: 'INR',
      category: 'Shopping',
      date: todayStr,
      paymentMethod: 'Credit Card',
      notes: 'Ergonomic dual-motor motorized desk frame',
      eventId: 'demo_evt_task_tracker',
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_exp_4',
      type: 'expense',
      amount: 2800,
      currency: 'INR',
      category: 'Groceries',
      date: todayStr,
      paymentMethod: 'UPI / Google Pay / PhonePe',
      notes: 'Weekly fresh fruits, vegetables, and pantry staples',
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_exp_5',
      type: 'income',
      amount: 125000,
      currency: 'INR',
      category: 'Salary',
      date: `${todayStr.slice(0, 7)}-01`,
      paymentMethod: 'Net Banking',
      notes: 'Monthly compensation credit',
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_exp_6',
      type: 'income',
      amount: 18500,
      currency: 'INR',
      category: 'Freelance & Consulting',
      date: todayStr,
      paymentMethod: 'UPI / Google Pay / PhonePe',
      notes: 'Design consulting retainer for fintech client',
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  // 4. Demo Photos
  const demoPhotos: PhotoRecord[] = [
    {
      id: 'demo_pho_1',
      caption: 'TIFFA Ultrasound scan preview — baby yawning!',
      dataUrl: createDemoSvgDataUri('Ultrasound Scan', '#065f46', 'Cloudnine Medical · 21 Weeks'),
      mimeType: 'image/svg+xml',
      date: todayStr,
      size: 4200,
      eventId: 'demo_evt_pregnancy',
      activityId: 'demo_act_preg_1',
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo_pho_2',
      caption: 'Quiet morning walk by the lake',
      dataUrl: createDemoSvgDataUri('Sunrise at Lake', '#3b82f6', 'Golden hour reflection'),
      mimeType: 'image/svg+xml',
      date: todayStr,
      size: 3800,
      eventId: 'demo_evt_diary',
      activityId: 'demo_act_diary_1',
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  // 5. Demo Budgets
  const demoBudgets: BudgetRecord[] = [
    {
      id: 'demo_bdg_food',
      category: 'Food & Dining',
      monthlyLimit: 15000,
      period: todayStr.slice(0, 7),
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
    },
    {
      id: 'demo_bdg_groceries',
      category: 'Groceries',
      monthlyLimit: 12000,
      period: todayStr.slice(0, 7),
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
    },
    {
      id: 'demo_bdg_health',
      category: 'Healthcare & Medical',
      monthlyLimit: 10000,
      period: todayStr.slice(0, 7),
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
    },
  ];

  // 6. Demo Savings Goals
  const demoSavingsGoals: SavingsGoalRecord[] = [
    {
      id: 'demo_svg_emergency',
      name: '6-Month Emergency Fund',
      targetAmount: 300000,
      currentAmount: 215000,
      targetDate: '2027-04-30',
      color: '#10b981',
      icon: 'ShieldCheck',
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
    },
    {
      id: 'demo_svg_baby',
      name: 'Baby Nursery & Hospital Fund',
      targetAmount: 150000,
      currentAmount: 110000,
      targetDate: '2027-02-01',
      color: '#ec4899',
      icon: 'Heart',
      demoDatasetId: DEMO_DATASET_ID,
      createdAt: nowIso,
    },
  ];

  // Save all atomically
  await db.transaction(
    'rw',
    [db.events, db.activities, db.expenses, db.photos, db.budgets, db.savingsGoals],
    async () => {
      await db.events.bulkPut(demoEvents);
      await db.activities.bulkPut(demoActivities);
      await db.expenses.bulkPut(demoExpenses);
      await db.photos.bulkPut(demoPhotos);
      await db.budgets.bulkPut(demoBudgets);
      await db.savingsGoals.bulkPut(demoSavingsGoals);
    }
  );

  return {
    success: true,
    message: 'Sample data loaded successfully. All records are isolated and can be removed at any time.',
  };
}

/**
 * Clear ONLY demo records, completely preserving user-created records and configurations!
 */
export async function clearSampleData(): Promise<{
  success: boolean;
  deletedCounts: {
    events: number;
    activities: number;
    expenses: number;
    photos: number;
    budgets: number;
    savingsGoals: number;
  };
}> {
  const counts = await getDemoRecordCounts();

  await db.transaction(
    'rw',
    [db.events, db.activities, db.expenses, db.photos, db.budgets, db.savingsGoals, db.relationships],
    async () => {
      await db.events.where('demoDatasetId').equals(DEMO_DATASET_ID).delete();
      await db.activities.where('demoDatasetId').equals(DEMO_DATASET_ID).delete();
      await db.expenses.where('demoDatasetId').equals(DEMO_DATASET_ID).delete();
      await db.photos.where('demoDatasetId').equals(DEMO_DATASET_ID).delete();
      await db.budgets.where('demoDatasetId').equals(DEMO_DATASET_ID).delete();
      await db.savingsGoals.where('demoDatasetId').equals(DEMO_DATASET_ID).delete();
      await db.relationships.where('demoDatasetId').equals(DEMO_DATASET_ID).delete();

      // If any real user record was linked to a demo record, safely detach the link
      await db.expenses.filter(e => Boolean(e.eventId?.startsWith('demo_'))).modify({ eventId: undefined, activityId: undefined });
      await db.photos.filter(p => Boolean(p.eventId?.startsWith('demo_'))).modify({ eventId: undefined, activityId: undefined });
      await db.activities.filter(a => Boolean(a.eventId?.startsWith('demo_'))).modify({ eventId: undefined });
    }
  );

  return {
    success: true,
    deletedCounts: {
      events: counts.events,
      activities: counts.activities,
      expenses: counts.expenses,
      photos: counts.photos,
      budgets: counts.budgets,
      savingsGoals: counts.savingsGoals,
    },
  };
}
