import React, { useState } from 'react';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Target,
  PiggyBank,
  Search,
  Edit2,
  Trash2,
  Link2Off,
} from 'lucide-react';
import type { ExpenseRecord, BudgetRecord, SavingsGoalRecord, AppSettings } from '../../types';
import { SwipeableRow, type SwipeActionItem } from '../common/SwipeableRow';

interface ExpensesDashboardProps {
  expenses: ExpenseRecord[];
  budgets: BudgetRecord[];
  savingsGoals: SavingsGoalRecord[];
  settings: AppSettings;
  onOpenAddExpense: () => void;
  onOpenManageBudgets: () => void;
  onOpenManageSavings: () => void;
  onEditExpense: (exp: ExpenseRecord) => void;
  onDeleteExpense: (exp: ExpenseRecord) => void;
  onUnlinkExpense?: (expId: string) => void;
}

export const ExpensesDashboard: React.FC<ExpensesDashboardProps> = ({
  expenses,
  budgets,
  savingsGoals,
  settings,
  onOpenAddExpense,
  onOpenManageBudgets,
  onOpenManageSavings,
  onEditExpense,
  onDeleteExpense,
  onUnlinkExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter expenses for current month
  const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonthKey));

  const totalIncome = monthExpenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = monthExpenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Category breakdown for expenses
  const categoryTotals: Record<string, number> = {};
  for (const e of monthExpenses) {
    if (e.type === 'expense') {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    }
  }

  // Total budget for this month
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const budgetSpentPercent =
    totalBudgetLimit > 0 ? Math.min(100, Math.round((totalExpense / totalBudgetLimit) * 100)) : 0;

  // Filtered transactions for list (with search, category, and type filter)
  const filteredList = expenses.filter(e => {
    const matchesSearch =
      searchTerm === '' ||
      e.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesType = selectedTypeFilter === 'all' || e.type === selectedTypeFilter;
    return matchesSearch && matchesCat && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* 1. Monthly Financial Overview Hero */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Overview · {currentMonthName}
            </div>
            <div className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-1 font-mono tabular-nums">
              {settings.currencySymbol}
              {netBalance.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              Net cash flow this month
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddExpense}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* 2-Column KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Income</span>
            </div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
              +{settings.currencySymbol}
              {totalIncome.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
              <span>Expenses</span>
            </div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
              -{settings.currencySymbol}
              {totalExpense.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-stone-500" />
                <span>Monthly Budget</span>
              </span>
              <button
                onClick={onOpenManageBudgets}
                className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
              >
                Configure
              </button>
            </div>
            {totalBudgetLimit > 0 ? (
              <div>
                <div className="flex items-center justify-between text-xs font-mono tabular-nums font-medium text-stone-800 dark:text-stone-200">
                  <span>
                    {settings.currencySymbol}
                    {totalExpense.toLocaleString('en-IN')}
                  </span>
                  <span className="text-stone-400">
                    / {settings.currencySymbol}
                    {totalBudgetLimit.toLocaleString('en-IN')} ({budgetSpentPercent}%)
                  </span>
                </div>
                <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budgetSpentPercent > 90 ? 'bg-rose-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${budgetSpentPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-400 pt-1">
                No budget defined for this month
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Savings Goals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Savings Goals
            </h3>
          </div>
          <button
            onClick={onOpenManageSavings}
            className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
          >
            Manage Goals
          </button>
        </div>

        {savingsGoals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savingsGoals.map(goal => {
              const pct = Math.min(
                100,
                Math.round((goal.currentAmount / goal.targetAmount) * 100)
              );
              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {goal.name}
                    </span>
                    <span className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400">
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500 font-mono tabular-nums">
                    <span>
                      {settings.currencySymbol}
                      {goal.currentAmount.toLocaleString('en-IN')} saved
                    </span>
                    <span>
                      Target: {settings.currencySymbol}
                      {goal.targetAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl p-6 text-center">
            <Target className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
            <p className="text-xs text-stone-500">
              No savings goals yet. Create targets for emergency funds, vacations, or milestones.
            </p>
            <button
              onClick={onOpenManageSavings}
              className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              + Create Savings Goal
            </button>
          </div>
        )}
      </div>

      {/* 3. Category Spending Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Top Spending by Category ({currentMonthName})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 4)
              .map(([cat, amt]) => {
                const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
                return (
                  <div
                    key={cat}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 space-y-1"
                  >
                    <div className="text-xs text-stone-500 truncate" title={cat}>
                      {cat}
                    </div>
                    <div className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono tabular-nums">
                      {settings.currencySymbol}
                      {amt.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono">{pct}% of total</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 4. Transactions List with Swipe Actions & Filters */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Transactions & Records
            </h3>
            <p className="text-[11px] text-stone-400">
              Swipe left on any row for Edit, Unlink, or Delete actions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter */}
            <div className="flex items-center p-0.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setSelectedTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md transition ${
                  selectedTypeFilter === 'all'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedTypeFilter('expense')}
                className={`px-2.5 py-1 rounded-md transition ${
                  selectedTypeFilter === 'expense'
                    ? 'bg-white dark:bg-stone-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setSelectedTypeFilter('income')}
                className={`px-2.5 py-1 rounded-md transition ${
                  selectedTypeFilter === 'income'
                    ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Income
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search notes or category..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>
        </div>

        {filteredList.length > 0 ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden shadow-2xs">
            {filteredList.map(tx => {
              const isLinked = !!(tx.eventId || tx.activityId);

              // Build swipe actions for this transaction
              const actions: SwipeActionItem[] = [
                {
                  id: 'edit',
                  label: 'Edit',
                  icon: <Edit2 className="w-3.5 h-3.5" />,
                  variant: 'edit',
                  onClick: () => onEditExpense(tx),
                  ariaLabel: `Edit transaction ${tx.notes || tx.category}`,
                },
              ];

              if (isLinked && onUnlinkExpense) {
                actions.push({
                  id: 'unlink',
                  label: 'Unlink',
                  icon: <Link2Off className="w-3.5 h-3.5" />,
                  variant: 'unlink',
                  onClick: () => onUnlinkExpense(tx.id),
                  ariaLabel: `Unlink transaction ${tx.notes || tx.category}`,
                });
              }

              actions.push({
                id: 'delete',
                label: 'Delete',
                icon: <Trash2 className="w-3.5 h-3.5" />,
                variant: 'delete',
                onClick: () => onDeleteExpense(tx),
                ariaLabel: `Delete transaction ${tx.notes || tx.category}`,
              });

              return (
                <SwipeableRow
                  key={tx.id}
                  id={tx.id}
                  activeRowId={activeSwipeId}
                  onRowOpen={setActiveSwipeId}
                  onRowClose={() => setActiveSwipeId(null)}
                  actions={actions}
                >
                  <div className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition group">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {tx.notes || tx.category}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5 flex-wrap">
                        <span>{tx.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.paymentMethod}</span>
                        <span aria-hidden="true">·</span>
                        <span>{new Date(tx.date).toLocaleDateString()}</span>
                        {isLinked && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                              Linked
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-sm font-bold font-mono tabular-nums ${
                          tx.type === 'income'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-stone-900 dark:text-stone-100'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {settings.currencySymbol}
                        {tx.amount.toLocaleString('en-IN')}
                      </span>

                      {/* Visible Non-Swipe Action Alternative */}
                      <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => onEditExpense(tx)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isLinked && onUnlinkExpense && (
                          <button
                            type="button"
                            onClick={() => onUnlinkExpense(tx.id)}
                            className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg"
                            title="Unlink"
                          >
                            <Link2Off className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(tx)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
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
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center text-stone-400 text-xs">
            No transactions found. Tap "Add Transaction" to record expenses or income.
          </div>
        )}
      </div>
    </div>
  );
};
