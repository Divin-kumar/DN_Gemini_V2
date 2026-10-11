import React, { useState, useEffect } from 'react';
import { initializeDatabase } from './db';
import {
  getAllEvents,
  getAllActivities,
  getAllExpenses,
  getAllPhotos,
  getEventTypes,
  getActivityTypes,
  getCodeLists,
  getBudgets,
  getSavingsGoals,
  getAppSettings,
  updateAppSettings,
  createEvent,
  updateEvent,
  archiveEvent,
  deleteEvent,
  createActivity,
  updateActivity,
  toggleActivityStatus,
  deleteActivity,
  createExpense,
  updateExpense,
  deleteExpense,
  unlinkExpense,
  saveBudget,
  deleteBudget,
  saveSavingsGoal,
  updateSavingsGoalAmount,
  deleteSavingsGoal,
  createPhoto,
  updatePhoto,
  deletePhoto,
  unlinkPhoto,
  getOrCreateMonthlyDiaryEvent,
  getCustomFields,
} from './db/repository';
import type {
  EventRecord,
  ActivityRecord,
  ExpenseRecord,
  PhotoRecord,
  EventTypeDefinition,
  ActivityTypeDefinition,
  CodeListDefinition,
  BudgetRecord,
  SavingsGoalRecord,
  AppSettings,
} from './types';
import { useTheme } from './hooks/useTheme';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { BackupReminderBanner } from './components/common/BackupReminderBanner';
import { QuickAddModal } from './components/common/QuickAddModal';
import { ConfirmDeleteModal, type DeleteTargetInfo } from './components/common/ConfirmDeleteModal';
import { EventsDashboard } from './components/dashboard/EventsDashboard';
import { ExpensesDashboard } from './components/dashboard/ExpensesDashboard';
import { EventList } from './components/events/EventList';
import { EventDetail } from './components/events/EventDetail';
import { EventModal } from './components/events/EventModal';
import { ActivityList } from './components/activities/ActivityList';
import { ActivityModal } from './components/activities/ActivityModal';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { BudgetsModal } from './components/expenses/BudgetsModal';
import { SavingsGoalModal } from './components/expenses/SavingsGoalModal';
import { PhotoUploadModal } from './components/photos/PhotoUploadModal';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  const { theme } = useTheme();

  // Primary Data State
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({
    id: 'global',
    currency: 'INR',
    currencySymbol: '₹',
    theme: 'system',
    dashboardMode: 'events',
    backupReminderIntervalDays: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeDefinition[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeDefinition[]>([]);
  const [codeLists, setCodeLists] = useState<CodeListDefinition[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoalRecord[]>([]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'activities' | 'expenses' | 'settings'>('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Modals State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [activityDefaultEventId, setActivityDefaultEventId] = useState<string | undefined>(undefined);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [expenseDefaultEventId, setExpenseDefaultEventId] = useState<string | undefined>(undefined);
  const [expenseDefaultActivityId, setExpenseDefaultActivityId] = useState<string | undefined>(undefined);

  const [isBudgetsModalOpen, setIsBudgetsModalOpen] = useState(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoRecord | null>(null);
  const [photoDefaultEventId, setPhotoDefaultEventId] = useState<string | undefined>(undefined);

  // In-app Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<DeleteTargetInfo | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Selected event custom fields for detail view
  const [selectedEventCustomFields, setSelectedEventCustomFields] = useState<any[]>([]);

  // Initial load
  useEffect(() => {
    async function loadAll() {
      try {
        await initializeDatabase();
        await refreshAllData();
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const refreshAllData = async () => {
    const [
      loadedSettings,
      loadedEvents,
      loadedActivities,
      loadedExpenses,
      loadedPhotos,
      loadedEventTypes,
      loadedActivityTypes,
      loadedCodeLists,
      loadedBudgets,
      loadedSavingsGoals,
    ] = await Promise.all([
      getAppSettings(),
      getAllEvents({ includeArchived: true }),
      getAllActivities(),
      getAllExpenses(),
      getAllPhotos(),
      getEventTypes(),
      getActivityTypes(),
      getCodeLists(),
      getBudgets(),
      getSavingsGoals(),
    ]);

    setSettings(loadedSettings);
    setEvents(loadedEvents);
    setActivities(loadedActivities);
    setExpenses(loadedExpenses);
    setPhotos(loadedPhotos);
    setEventTypes(loadedEventTypes);
    setActivityTypes(loadedActivityTypes);
    setCodeLists(loadedCodeLists);
    setBudgets(loadedBudgets);
    setSavingsGoals(loadedSavingsGoals);
  };

  // When selected event changes, load its custom fields
  useEffect(() => {
    if (selectedEventId) {
      const ev = events.find(e => e.id === selectedEventId);
      if (ev) {
        getCustomFields('event', ev.eventTypeId).then(setSelectedEventCustomFields);
      }
    }
  }, [selectedEventId, events]);

  // Dashboard Toggle Handler (Expenses | Events)
  const handleToggleDashboardMode = async (mode: 'expenses' | 'events') => {
    const updated = await updateAppSettings({ dashboardMode: mode });
    setSettings(updated);
  };

  // Quick Add router
  const handleQuickAddAction = async (action: 'expense' | 'activity' | 'event' | 'diary') => {
    if (action === 'expense') {
      setEditingExpense(null);
      setExpenseDefaultEventId(undefined);
      setExpenseDefaultActivityId(undefined);
      setIsExpenseModalOpen(true);
    } else if (action === 'activity') {
      setEditingActivity(null);
      setActivityDefaultEventId(undefined);
      setIsActivityModalOpen(true);
    } else if (action === 'event') {
      setEditingEvent(null);
      setIsEventModalOpen(true);
    } else if (action === 'diary') {
      const today = new Date().toISOString().slice(0, 10);
      const diaryEvent = await getOrCreateMonthlyDiaryEvent(today);
      await refreshAllData();
      setEditingActivity(null);
      setActivityDefaultEventId(diaryEvent.id);
      setIsActivityModalOpen(true);
    }
  };

  // Activity toggle
  const handleToggleActivity = async (id: string) => {
    await toggleActivityStatus(id);
    const updatedActs = await getAllActivities();
    setActivities(updatedActs);
  };

  // ----------------------------------------------------
  // Central Swipe-to-Edit & Swipe-to-Delete Handlers
  // ----------------------------------------------------

  const handleEditExpense = (exp: ExpenseRecord) => {
    setEditingExpense(exp);
    setExpenseDefaultEventId(exp.eventId);
    setExpenseDefaultActivityId(exp.activityId);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (exp: ExpenseRecord) => {
    setDeleteTarget({
      type: exp.type === 'income' ? 'income' : 'expense',
      id: exp.id,
      title: exp.notes || exp.category,
      subtitle: `${exp.type === 'income' ? 'Income Transaction' : 'Expense Transaction'} · ${exp.category}`,
      amountFormatted: `${exp.type === 'income' ? '+' : '-'}${settings.currencySymbol}${exp.amount.toLocaleString('en-IN')}`,
      date: exp.date,
      category: exp.category,
      paymentMethod: exp.paymentMethod,
      transactionType: exp.type,
      isLinked: !!(exp.eventId || exp.activityId),
      linkedParentTitle: exp.eventId ? events.find(e => e.id === exp.eventId)?.title : undefined,
      onUnlinkInstead:
        exp.eventId || exp.activityId
          ? async () => {
              await unlinkExpense(exp.id);
              await refreshAllData();
            }
          : undefined,
    });
    setIsConfirmDeleteOpen(true);
  };

  const handleUnlinkExpense = async (expId: string) => {
    await unlinkExpense(expId);
    await refreshAllData();
  };

  const handleEditEvent = (evt: EventRecord) => {
    setEditingEvent(evt);
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = (evt: EventRecord) => {
    const typeDef = eventTypes.find(t => t.id === evt.eventTypeId);
    setDeleteTarget({
      type: 'event',
      id: evt.id,
      title: evt.title,
      subtitle: `Event Type: ${typeDef?.name || 'Event'}`,
      date: evt.startDate,
    });
    setIsConfirmDeleteOpen(true);
  };

  const handleEditActivity = (act: ActivityRecord) => {
    setEditingActivity(act);
    setActivityDefaultEventId(act.eventId);
    setIsActivityModalOpen(true);
  };

  const handleDeleteActivity = (act: ActivityRecord) => {
    const parentEvent = events.find(e => e.id === act.eventId);
    setDeleteTarget({
      type: 'activity',
      id: act.id,
      title: act.title,
      subtitle: parentEvent ? `Event: ${parentEvent.title}` : 'Standalone Activity',
      date: act.date,
    });
    setIsConfirmDeleteOpen(true);
  };

  const handleEditPhoto = (p: PhotoRecord) => {
    setEditingPhoto(p);
    setPhotoDefaultEventId(p.eventId);
    setIsPhotoModalOpen(true);
  };

  const handleDeletePhoto = (p: PhotoRecord) => {
    setDeleteTarget({
      type: 'photo',
      id: p.id,
      title: p.caption || 'Photo attachment',
      subtitle: p.eventId ? `Event Attachment` : 'Memory Photo',
      date: p.date,
    });
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'expense' || deleteTarget.type === 'income') {
      await deleteExpense(deleteTarget.id);
    } else if (deleteTarget.type === 'event') {
      await deleteEvent(deleteTarget.id);
      if (selectedEventId === deleteTarget.id) {
        setSelectedEventId(null);
      }
    } else if (deleteTarget.type === 'activity') {
      await deleteActivity(deleteTarget.id);
    } else if (deleteTarget.type === 'photo') {
      await deletePhoto(deleteTarget.id);
    }

    await refreshAllData();
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg animate-pulse mb-3">
          DN
        </div>
        <div className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
          Initializing Local Storage...
        </div>
      </div>
    );
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedEventType = selectedEvent
    ? eventTypes.find(t => t.id === selectedEvent.eventTypeId)
    : undefined;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans pb-20 md:pb-8 selection:bg-emerald-500/20">
      {/* 1. Stale / Unbacked Storage Warning Banner */}
      <BackupReminderBanner
        settings={settings}
        onNavigateToBackup={() => {
          setSelectedEventId(null);
          setActiveTab('settings');
        }}
      />

      {/* 2. Top App Bar (One-Row, 3-Zone Contract) */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={tab => {
          setSelectedEventId(null);
          setActiveTab(tab);
        }}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* 3. Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {/* Render Event Detail View if an event is selected */}
        {selectedEventId && selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            eventType={selectedEventType}
            activities={activities.filter(a => a.eventId === selectedEvent.id)}
            expenses={expenses.filter(e => e.eventId === selectedEvent.id)}
            photos={photos.filter(p => p.eventId === selectedEvent.id)}
            customFields={selectedEventCustomFields}
            settings={settings}
            onBack={() => setSelectedEventId(null)}
            onEdit={() => handleEditEvent(selectedEvent)}
            onArchive={async () => {
              await archiveEvent(selectedEvent.id);
              await refreshAllData();
              setSelectedEventId(null);
            }}
            onDelete={() => handleDeleteEvent(selectedEvent)}
            onToggleActivity={handleToggleActivity}
            onAddActivity={() => {
              setEditingActivity(null);
              setActivityDefaultEventId(selectedEvent.id);
              setIsActivityModalOpen(true);
            }}
            onEditActivity={handleEditActivity}
            onDeleteActivity={handleDeleteActivity}
            onAddExpense={() => {
              setEditingExpense(null);
              setExpenseDefaultEventId(selectedEvent.id);
              setExpenseDefaultActivityId(undefined);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            onUnlinkExpense={handleUnlinkExpense}
            onAddPhoto={() => {
              setEditingPhoto(null);
              setPhotoDefaultEventId(selectedEvent.id);
              setIsPhotoModalOpen(true);
            }}
            onEditPhoto={handleEditPhoto}
            onDeletePhoto={handleDeletePhoto}
            onUnlinkPhoto={async photoId => {
              await unlinkPhoto(photoId, 'event');
              const updatedPhotos = await getAllPhotos();
              setPhotos(updatedPhotos);
            }}
          />
        ) : (
          <>
            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Mode Switch: Expenses | Events */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center p-1 bg-stone-200/70 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
                    <button
                      onClick={() => handleToggleDashboardMode('events')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        settings.dashboardMode === 'events'
                          ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      Events View
                    </button>
                    <button
                      onClick={() => handleToggleDashboardMode('expenses')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        settings.dashboardMode === 'expenses'
                          ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      Expenses View
                    </button>
                  </div>
                </div>

                {settings.dashboardMode === 'events' ? (
                  <EventsDashboard
                    events={events.filter(e => e.status !== 'archived')}
                    activities={activities}
                    expenses={expenses}
                    photos={photos}
                    eventTypes={eventTypes}
                    settings={settings}
                    onToggleActivity={handleToggleActivity}
                    onSelectEvent={id => setSelectedEventId(id)}
                    onOpenCreateEvent={() => {
                      setEditingEvent(null);
                      setIsEventModalOpen(true);
                    }}
                    onOpenCreateActivity={() => {
                      setEditingActivity(null);
                      setActivityDefaultEventId(undefined);
                      setIsActivityModalOpen(true);
                    }}
                    onEditActivity={handleEditActivity}
                    onDeleteActivity={handleDeleteActivity}
                  />
                ) : (
                  <ExpensesDashboard
                    expenses={expenses}
                    budgets={budgets}
                    savingsGoals={savingsGoals}
                    settings={settings}
                    onOpenAddExpense={() => {
                      setEditingExpense(null);
                      setExpenseDefaultEventId(undefined);
                      setExpenseDefaultActivityId(undefined);
                      setIsExpenseModalOpen(true);
                    }}
                    onOpenManageBudgets={() => setIsBudgetsModalOpen(true)}
                    onOpenManageSavings={() => setIsSavingsModalOpen(true)}
                    onEditExpense={handleEditExpense}
                    onDeleteExpense={handleDeleteExpense}
                    onUnlinkExpense={handleUnlinkExpense}
                  />
                )}
              </div>
            )}

            {/* TAB: EVENTS */}
            {activeTab === 'events' && (
              <EventList
                events={events}
                eventTypes={eventTypes}
                settings={settings}
                onSelectEvent={id => setSelectedEventId(id)}
                onOpenCreateEvent={() => {
                  setEditingEvent(null);
                  setIsEventModalOpen(true);
                }}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            )}

            {/* TAB: ACTIVITIES */}
            {activeTab === 'activities' && (
              <ActivityList
                activities={activities}
                activityTypes={activityTypes}
                events={events}
                onToggleStatus={handleToggleActivity}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
                onOpenCreateActivity={() => {
                  setEditingActivity(null);
                  setActivityDefaultEventId(undefined);
                  setIsActivityModalOpen(true);
                }}
                onSelectEvent={id => setSelectedEventId(id)}
              />
            )}

            {/* TAB: EXPENSES */}
            {activeTab === 'expenses' && (
              <ExpensesDashboard
                expenses={expenses}
                budgets={budgets}
                savingsGoals={savingsGoals}
                settings={settings}
                onOpenAddExpense={() => {
                  setEditingExpense(null);
                  setExpenseDefaultEventId(undefined);
                  setExpenseDefaultActivityId(undefined);
                  setIsExpenseModalOpen(true);
                }}
                onOpenManageBudgets={() => setIsBudgetsModalOpen(true)}
                onOpenManageSavings={() => setIsSavingsModalOpen(true)}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
                onUnlinkExpense={handleUnlinkExpense}
              />
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                eventTypes={eventTypes}
                activityTypes={activityTypes}
                codeLists={codeLists}
                onUpdateSettings={async updates => {
                  const updated = await updateAppSettings(updates);
                  setSettings(updated);
                }}
                onRefreshData={refreshAllData}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Mobile Bottom Tab Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={tab => {
          setSelectedEventId(null);
          setActiveTab(tab);
        }}
      />

      {/* 5. Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* 6. Quick Add Floating Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSelectAction={handleQuickAddAction}
      />

      {/* 7. Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        initialData={editingEvent}
        eventTypes={eventTypes}
        currencySymbol={settings.currencySymbol}
        onSave={async data => {
          if (editingEvent) {
            await updateEvent(editingEvent.id, data);
          } else {
            await createEvent(data);
          }
          await refreshAllData();
        }}
      />

      {/* 8. Activity Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setEditingActivity(null);
        }}
        initialData={editingActivity}
        activityTypes={activityTypes}
        events={events}
        defaultEventId={activityDefaultEventId}
        currencySymbol={settings.currencySymbol}
        onSave={async data => {
          if (editingActivity) {
            await updateActivity(editingActivity.id, data);
          } else {
            await createActivity(data);
          }
          await refreshAllData();
        }}
      />

      {/* 9. Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        initialData={editingExpense}
        events={events}
        activities={activities}
        defaultEventId={expenseDefaultEventId}
        defaultActivityId={expenseDefaultActivityId}
        categoryList={codeLists.find(cl => cl.key === 'expense_categories')}
        paymentMethodList={codeLists.find(cl => cl.key === 'payment_methods')}
        settings={settings}
        onSave={async data => {
          if (editingExpense) {
            await updateExpense(editingExpense.id, data);
          } else {
            await createExpense(data);
          }
          await refreshAllData();
        }}
      />

      {/* 10. Budgets Modal */}
      <BudgetsModal
        isOpen={isBudgetsModalOpen}
        onClose={() => setIsBudgetsModalOpen(false)}
        budgets={budgets}
        categoryList={codeLists.find(cl => cl.key === 'expense_categories')}
        settings={settings}
        onSaveBudget={async b => {
          await saveBudget(b);
          const updated = await getBudgets();
          setBudgets(updated);
        }}
        onDeleteBudget={async id => {
          await deleteBudget(id);
          const updated = await getBudgets();
          setBudgets(updated);
        }}
      />

      {/* 11. Savings Goals Modal */}
      <SavingsGoalModal
        isOpen={isSavingsModalOpen}
        onClose={() => setIsSavingsModalOpen(false)}
        savingsGoals={savingsGoals}
        settings={settings}
        onSaveGoal={async g => {
          await saveSavingsGoal(g);
          const updated = await getSavingsGoals();
          setSavingsGoals(updated);
        }}
        onUpdateAmount={async (id, amt) => {
          await updateSavingsGoalAmount(id, amt);
          const updated = await getSavingsGoals();
          setSavingsGoals(updated);
        }}
        onDeleteGoal={async id => {
          await deleteSavingsGoal(id);
          const updated = await getSavingsGoals();
          setSavingsGoals(updated);
        }}
      />

      {/* 12. Photo / Attachment Modal */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          setEditingPhoto(null);
        }}
        initialData={editingPhoto}
        events={events}
        activities={activities}
        defaultEventId={photoDefaultEventId}
        onSave={async p => {
          if (editingPhoto) {
            await updatePhoto(editingPhoto.id, p);
          } else {
            await createPhoto(p);
          }
          const updated = await getAllPhotos();
          setPhotos(updated);
        }}
      />

      {/* 13. App-Wide Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        target={deleteTarget}
        currencySymbol={settings.currencySymbol}
      />
    </div>
  );
}
