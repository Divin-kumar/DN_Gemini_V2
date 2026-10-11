import 'fake-indexeddb/auto';
import { db, initializeDatabase } from '../db';
import {
  createEvent,
  getAllEvents,
  deleteEvent,
  createActivity,
  getAllActivities,
  toggleActivityStatus,
  createExpense,
  getAllExpenses,
  saveEventType,
  saveCustomField,
  getCustomFields,
  getOrCreateMonthlyDiaryEvent,
  getAppSettings,
} from '../db/repository';
import {
  createBackupPayload,
  validateAndPreviewBackup,
  restoreBackupReplace,
  restoreBackupMerge,
} from '../services/backupService';
import {
  loadSampleData,
  clearSampleData,
  hasDemoData,
  getDemoRecordCounts,
  DEMO_DATASET_ID,
} from '../services/sampleDataService';
import {
  calculateNextAnniversary,
  calculatePregnancyProgress,
  evaluateEventSummary,
} from '../services/summaryEngine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n=============================================');
  console.log('  RUNNING DN AUTOMATED VERIFICATION TEST SUITE');
  console.log('=============================================\n');

  // Test 1: Database Initialization & Seeding
  console.log('[1] Database Initialization & Seeding');
  await initializeDatabase();
  const settings = await getAppSettings();
  assert(settings.id === 'global' && settings.currency === 'INR', 'Default settings initialized with INR');

  const initialTypes = await db.eventTypes.toArray();
  assert(initialTypes.length >= 5, `Default event types seeded (${initialTypes.length} types)`);
  assert(initialTypes.some(t => t.id === 'ev_type_birthday'), 'Birthday event type exists');
  assert(initialTypes.some(t => t.id === 'ev_type_pregnancy'), 'Pregnancy journey event type exists');
  assert(initialTypes.some(t => t.id === 'ev_type_diary'), 'Diary event type exists');

  // Test 2: Event CRUD
  console.log('\n[2] Event Management');
  const userEvent = await createEvent({
    title: 'User Real Event — Tokyo Vacation',
    eventTypeId: 'ev_type_task_tracker',
    description: 'Real personal trip planning',
    startDate: '2026-11-01',
    status: 'active',
    icon: 'Plane',
    color: '#0284c7',
    tags: ['Travel', 'RealUser'],
    customFieldValues: {},
    summaryCardEnabled: true,
  });
  assert(!!userEvent.id, 'User event created with stable ID');

  let allEvents = await getAllEvents();
  assert(allEvents.some(e => e.id === userEvent.id), 'User event returned in list');

  // Test 3: Unique Diary Month Event Uniqueness
  console.log('\n[3] Diary Month Deduplication');
  const diary1 = await getOrCreateMonthlyDiaryEvent('2026-10-15');
  const diary2 = await getOrCreateMonthlyDiaryEvent('2026-10-20');
  assert(diary1.id === diary2.id, 'Reopening app or adding entries in same month reuses single month container');

  // Test 4: Activities and Quick Toggle
  console.log('\n[4] Activity Management & Status Toggle');
  const act = await createActivity({
    title: 'Book Shinkansen tickets',
    activityTypeId: 'act_type_task',
    eventId: userEvent.id,
    description: 'Tokyo to Kyoto bullet train',
    date: '2026-10-25',
    status: 'pending',
    priority: 'high',
    tags: ['Travel'],
    customFieldValues: {},
  });
  assert(act.status === 'pending', 'Activity created with pending status');

  const toggled = await toggleActivityStatus(act.id);
  assert(toggled.status === 'completed' && !!toggled.completedAt, 'Activity toggled to completed with timestamp');

  // Test 5: Dynamic Custom Event Type & Dynamic Custom Field Builder
  console.log('\n[5] Dynamic Event Types & Field Builder (No Code Changes)');
  const customType = await saveEventType({
    name: 'Vehicle Maintenance',
    description: 'Track car servicing and odometer readings',
    icon: 'Car',
    color: '#f97316',
    allowedActivityTypeIds: ['act_type_task'],
    summaryCardConfig: {
      showGlobally: true,
      showCountdown: false,
      showActivityProgress: true,
      showExpenseTotal: true,
      showRecentPhotos: true,
      fieldsToShow: ['cf_odometer'],
    },
    displayOrder: 10,
    enabled: true,
  });
  assert(!!customType.id, 'New user-defined event type created dynamically');

  const customField = await saveCustomField({
    entityType: 'event',
    targetTypeId: customType.id,
    label: 'Current Odometer (km)',
    key: 'cf_odometer',
    type: 'number',
    required: true,
    displayOrder: 1,
    archived: false,
  });
  assert(!!customField.id, 'Custom field added to dynamic event type');

  const fieldsForType = await getCustomFields('event', customType.id);
  assert(fieldsForType.some(f => f.key === 'cf_odometer'), 'Custom field query returns newly created field');

  // Test 6: Expenses & Financial Records
  console.log('\n[6] Expense Management');
  const exp = await createExpense({
    type: 'expense',
    amount: 12000,
    currency: 'INR',
    category: 'Transport & Fuel',
    date: '2026-10-12',
    paymentMethod: 'Credit Card',
    notes: 'JR Pass booking',
    eventId: userEvent.id,
    activityId: act.id,
  });
  assert(exp.amount === 12000, 'Expense recorded and linked to event & activity');

  // Test 7: Summary Engine Calculations
  console.log('\n[7] Summary Engine Calculations');
  const bdayCalc = calculateNextAnniversary('1996-10-24');
  assert(bdayCalc.yearsElapsed >= 30, 'Birthday calculation computes years elapsed accurately');

  const pregCalc = calculatePregnancyProgress('2026-05-01', '2027-02-05');
  assert(pregCalc.weeks > 0 && pregCalc.trimester >= 1, 'Pregnancy calculation computes gestational weeks and trimester');

  const summary = evaluateEventSummary(
    userEvent,
    initialTypes[0],
    [act],
    [exp],
    [],
    '₹'
  );
  assert(summary.totalExpenses === 12000, 'Summary engine computes linked expense totals correctly');
  assert(summary.totalActivities === 1, 'Summary engine counts activities correctly');

  // Test 8: Backup Export (Standard and Complete)
  console.log('\n[8] Backup Export (Standard & Complete)');
  const stdBackup = await createBackupPayload(false);
  assert(stdBackup.format === 'dn-backup', 'Backup format tag is dn-backup');
  assert(stdBackup.includesMedia === false, 'Standard backup includesMedia is false');
  assert(stdBackup.data.events.length > 0, 'Standard backup includes structured events');
  assert(!!stdBackup.checksum, 'Backup includes integrity checksum');

  const completeBackup = await createBackupPayload(true);
  assert(completeBackup.includesMedia === true, 'Complete backup includesMedia is true');

  // Test 9: Backup Validation and Pre-Restore Preview
  console.log('\n[9] Backup Validation & Pre-Restore Preview');
  const validationRes = await validateAndPreviewBackup(JSON.stringify(completeBackup));
  assert(validationRes.isValid === true, 'Backup string validated successfully');
  assert(validationRes.preview?.counts.events === completeBackup.data.events.length, 'Restore preview shows accurate event counts');
  assert(validationRes.preview?.counts.expenses === completeBackup.data.expenses.length, 'Restore preview shows accurate expense counts');

  // Test corrupted backup rejection
  const corruptedRes = await validateAndPreviewBackup('{"invalid": true}');
  assert(corruptedRes.isValid === false, 'Corrupted / invalid backup is safely rejected');

  // Test 10: Sample Data Loading and Provenance Isolation
  console.log('\n[10] Sample Data Loading & Provenance Isolation');
  const loadDemoRes = await loadSampleData(false);
  assert(loadDemoRes.success === true, 'Sample data loaded successfully');
  assert(await hasDemoData(), 'hasDemoData() correctly identifies demo records');

  const countsBefore = await getDemoRecordCounts();
  assert(countsBefore.events > 0, `Demo events generated (${countsBefore.events} demo events)`);
  assert(countsBefore.activities > 0, `Demo activities generated (${countsBefore.activities} demo activities)`);

  // Idempotency: Calling loadSampleData again without forceReset does not duplicate
  const secondLoad = await loadSampleData(false);
  assert(secondLoad.success === false, 'Idempotent: prevents duplicate demo loads unless force reset requested');

  // Verify real user event still exists alongside demo data
  const eventsWithDemo = await getAllEvents();
  assert(eventsWithDemo.some(e => e.id === userEvent.id), 'User real event preserved alongside demo data');

  // Test 11: Clear Sample Data (CRITICAL SAFETY TEST)
  console.log('\n[11] Clear Sample Data Isolation (Preserving Real Records)');
  const clearDemoRes = await clearSampleData();
  assert(clearDemoRes.success === true, 'clearSampleData() reported success');
  assert(!(await hasDemoData()), 'Demo records successfully removed');

  const eventsAfterClear = await getAllEvents();
  const userEventSurvived = eventsAfterClear.some(e => e.id === userEvent.id);
  assert(userEventSurvived, 'CRITICAL PASS: Real user event survived demo cleanup intact!');

  const remainingRealActs = await getAllActivities();
  assert(remainingRealActs.some(a => a.id === act.id), 'CRITICAL PASS: Real user activity survived demo cleanup!');

  // Test 12: Replace Restore and Merge Restore
  console.log('\n[12] Backup Restore Modes (Replace & Merge)');
  // Restore replace using the earlier backup
  await restoreBackupReplace(completeBackup);
  const eventsAfterReplace = await getAllEvents();
  assert(eventsAfterReplace.some(e => e.id === userEvent.id), 'Replace restore restored dataset and preserved user records');

  // Merge restore test
  const mergeResult = await restoreBackupMerge(completeBackup);
  assert(typeof mergeResult.added === 'number' && typeof mergeResult.updated === 'number', 'Merge restore executed conflict-safe resolution');

  // Clean up test user event
  await deleteEvent(userEvent.id);

  console.log('\n=============================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
