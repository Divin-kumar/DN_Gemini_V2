import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, Target, PiggyBank, Search } from 'lucide-react';
import type { ExpenseRecord, BudgetRecord, SavingsGoalRecord, AppSettings } from '../../types';

interface ExpensesDashboardProps {
  expenses: ExpenseRecord[];
  budgets: BudgetRecord[];
  savingsGoals: SavingsGoalRecord[];
  settings: AppSettings;
  onOpenAddExpense: () => void;
  onOpenManageBudgets: () => void;
  onOpenManageSavings: () => void;
  onSelectExpense?: (exp: ExpenseRecord) => void;
}

export const ExpensesDashboard: React.FC<ExpensesDashboardProps> = ({
  expenses,
  budgets,
  savingsGoals,
  settings,
  onOpenAddExpense,
  onOpenManageBudgets,
  onOpenManageSavings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  // Filtered transactions for list
  const filteredList = expenses.filter(e => {
    const matchesSearch =
      searchTerm === '' ||
      e.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
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

      {/* 2. Savings Goals Carousel/Grid */}
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

      {/* 4. Transactions List with Filter & Search */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Recent Transactions
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by notes or category..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>

        {filteredList.length > 0 ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden shadow-2xs">
            {filteredList.slice(0, 10).map(tx => (
              <div
                key={tx.id}
                className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {tx.notes || tx.category}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                    <span>{tx.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{tx.paymentMethod}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(tx.date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
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
                </div>
              </div>
            ))}
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
