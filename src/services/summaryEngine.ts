import type { EventRecord, ActivityRecord, ExpenseRecord, PhotoRecord, EventTypeDefinition } from '../types';

export interface SummaryCardMetrics {
  primaryLabel: string;
  primaryValue: string;
  secondaryValue?: string;
  progressPercent?: number;
  progressLabel?: string;
  totalExpenses: number;
  totalExpensesFormatted: string;
  totalActivities: number;
  completedActivities: number;
  recentPhotos: PhotoRecord[];
  customFieldsDisplay: Array<{ label: string; value: string }>;
}

/**
 * Calculates days remaining until the next anniversary of a date (e.g. Birthday).
 * Handles leap years and rolls over to next year if already passed this year.
 */
export function calculateNextAnniversary(targetDateStr?: string): {
  daysRemaining: number;
  nextDate: Date;
  yearsElapsed: number;
} {
  if (!targetDateStr) {
    return { daysRemaining: 0, nextDate: new Date(), yearsElapsed: 0 };
  }

  const birthDate = new Date(targetDateStr);
  if (isNaN(birthDate.getTime())) {
    return { daysRemaining: 0, nextDate: new Date(), yearsElapsed: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
  nextBirthday.setHours(0, 0, 0, 0);

  // If birthday already passed this year, look at next year
  if (nextBirthday.getTime() < today.getTime()) {
    nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
  }

  const diffMs = nextBirthday.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const yearsElapsed = nextBirthday.getFullYear() - birthDate.getFullYear();

  return { daysRemaining, nextDate: nextBirthday, yearsElapsed };
}

/**
 * Calculates gestational age and trimester from LMP or due date.
 */
export function calculatePregnancyProgress(lmpDateStr?: string, dueDateStr?: string): {
  weeks: number;
  days: number;
  trimester: 1 | 2 | 3;
  daysUntilDue: number;
  progressPercent: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lmp: Date;

  if (lmpDateStr) {
    lmp = new Date(lmpDateStr);
  } else if (dueDateStr) {
    // If only due date provided, estimate LMP as 280 days prior
    const due = new Date(dueDateStr);
    lmp = new Date(due.getTime() - 280 * 86400000);
  } else {
    return { weeks: 0, days: 0, trimester: 1, daysUntilDue: 0, progressPercent: 0 };
  }

  const diffMs = today.getTime() - lmp.getTime();
  const totalDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  let trimester: 1 | 2 | 3 = 1;
  if (weeks >= 28) trimester = 3;
  else if (weeks >= 14) trimester = 2;

  let daysUntilDue = 280 - totalDays;
  if (dueDateStr) {
    const due = new Date(dueDateStr);
    daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round((totalDays / 280) * 100)));

  return { weeks, days, trimester, daysUntilDue, progressPercent };
}

/**
 * Evaluates summary card metrics dynamically based on event type configuration and real stored records.
 */
export function evaluateEventSummary(
  event: EventRecord,
  eventType: EventTypeDefinition | undefined,
  linkedActivities: ActivityRecord[],
  linkedExpenses: ExpenseRecord[],
  linkedPhotos: PhotoRecord[],
  currencySymbol: string = '₹'
): SummaryCardMetrics {
  const config = eventType?.summaryCardConfig;
  const metricType = config?.metricType || 'none';

  let primaryLabel = 'Status';
  let primaryValue: string = event.status;
  let secondaryValue: string | undefined;
  let progressPercent: number | undefined;
  let progressLabel: string | undefined;

  // 1. Metric Type Calculations
  if (metricType === 'birthday_age') {
    const dob = event.customFieldValues?.dob || event.startDate;
    const { daysRemaining, yearsElapsed } = calculateNextAnniversary(dob);
    primaryLabel = 'Next Birthday';
    if (daysRemaining === 0) {
      primaryValue = `Today! (Turns ${yearsElapsed})`;
    } else if (daysRemaining === 1) {
      primaryValue = `Tomorrow (Turning ${yearsElapsed})`;
    } else {
      primaryValue = `In ${daysRemaining} days`;
      secondaryValue = `Turning ${yearsElapsed}`;
    }
  } else if (metricType === 'pregnancy_week') {
    const lmp = event.customFieldValues?.lmp_date;
    const due = event.customFieldValues?.due_date;
    const { weeks, days, trimester, daysUntilDue, progressPercent: pct } = calculatePregnancyProgress(lmp, due);

    primaryLabel = `Week ${weeks}, Day ${days}`;
    primaryValue = `Trimester ${trimester}`;
    secondaryValue = daysUntilDue > 0 ? `${daysUntilDue} days to due date` : 'Full Term';
    progressPercent = pct;
    progressLabel = `${pct}% Gestation`;
  } else if (metricType === 'bug_counts') {
    const total = linkedActivities.length;
    const closed = linkedActivities.filter(a => a.status === 'completed' || a.status === 'cancelled').length;
    const open = total - closed;
    primaryLabel = 'Active Issues';
    primaryValue = `${open} open`;
    secondaryValue = `${closed} resolved`;
    if (total > 0) {
      progressPercent = Math.round((closed / total) * 100);
      progressLabel = `${progressPercent}% Fixed`;
    }
  } else if (metricType === 'diary_days') {
    const entries = linkedActivities.length;
    primaryLabel = 'Memories Recorded';
    primaryValue = `${entries} ${entries === 1 ? 'entry' : 'entries'}`;
    secondaryValue = event.customFieldValues?.month_year || 'This Month';
  }

  // 2. Activity Progress if enabled and not already overridden
  const totalActivities = linkedActivities.length;
  const completedActivities = linkedActivities.filter(a => a.status === 'completed').length;

  if (config?.showActivityProgress && progressPercent === undefined && totalActivities > 0) {
    progressPercent = Math.round((completedActivities / totalActivities) * 100);
    progressLabel = `${completedActivities}/${totalActivities} done (${progressPercent}%)`;
  }

  // 3. Expense Totals
  const totalExpenses = linkedExpenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalExpensesFormatted = `${currencySymbol}${totalExpenses.toLocaleString('en-IN')}`;

  // 4. Custom fields to display
  const customFieldsDisplay: Array<{ label: string; value: string }> = [];
  if (config?.fieldsToShow && config.fieldsToShow.length > 0) {
    for (const key of config.fieldsToShow) {
      const val = event.customFieldValues?.[key];
      if (val !== undefined && val !== null && val !== '') {
        // Human label
        const formattedKey = key.replace(/^cf_/, '').replace(/_/g, ' ');
        const label = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
        customFieldsDisplay.push({ label, value: String(val) });
      }
    }
  }

  return {
    primaryLabel,
    primaryValue,
    secondaryValue,
    progressPercent,
    progressLabel,
    totalExpenses,
    totalExpensesFormatted,
    totalActivities,
    completedActivities,
    recentPhotos: config?.showRecentPhotos ? linkedPhotos.slice(0, 3) : [],
    customFieldsDisplay,
  };
}
