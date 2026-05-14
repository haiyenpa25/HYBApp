// =============================================================
// gas.ts — BRIDGE / FACADE LAYER
// Giữ nguyên interface `server.xxx()` để các component hiện tại
// không cần sửa import. Tất cả logic delegate sang gasRunner.
//
// ⚠️ KHÔNG viết logic thực thi ở đây.
// Tất cả mock data, business rules → api/ hoặc hooks/
// =============================================================

import { gasRun } from './gasRunner'
import type {
  Wallet, Category, Transaction, Budget, Fund, Debt,
  Habit, Goal, UserStats, Note, Task, TaskCategory, StockTransaction
} from '../types'

export const server = {
  // ─── USER ─────────────────────────────────────────────────
  getCurrentUser: () =>
    gasRun<{ email: string; name: string }>('getCurrentUser', [], { email: 'user@gmail.com', name: 'User' }),

  getUserStats: () =>
    gasRun<UserStats>('getUserStats', [], {
      exp: 150, level: 2, currentLevelExp: 50,
      currentLevelExpPercent: 50, title: 'Thực Tập Sinh', expPerLevel: 100
    }),

  getDashboardSummary: () =>
    gasRun<any>('getDashboardSummary', [], null, 500),

  // ─── TASKS ────────────────────────────────────────────────
  getTasks: () =>
    gasRun<Task[]>('getTasks', [], [
      { id: '1', title: 'Hoàn thành báo cáo', status: 'TODO', date: '2026-05-15', calendarId: 'default', priority: 'P1', subtasks: [], noteId: null },
    ]),

  addTask: (title: string, date: string, calendarId = 'default', priority = 'P3') =>
    gasRun<boolean>('addTask', [title, date, calendarId, priority]),

  updateTaskStatus: (id: string, status: string) =>
    gasRun<boolean>('updateTaskStatus', [id, status]),

  updateTaskDetails: (id: string, priority: string, subtasksJson: string, noteId?: string | null, calendarId?: string) =>
    gasRun<boolean>('updateTaskDetails', [id, priority, subtasksJson, noteId, calendarId]),

  updateTaskCore: (id: string, title: string, date: string, calendarId: string) =>
    gasRun<boolean>('updateTaskCore', [id, title, date, calendarId]),

  deleteTask: (id: string) =>
    gasRun<boolean>('deleteTask', [id]),

  getTaskCategories: () =>
    gasRun<TaskCategory[]>('getTaskCategories', [], [
      { id: 'default', name: 'Lịch mặc định', color: '#3b82f6' },
    ]),

  addTaskCategory: (name: string) =>
    gasRun<TaskCategory>('addTaskCategory', [name], { id: 'new', name, color: '#10b981' }),

  deleteTaskCategory: (id: string) =>
    gasRun<boolean>('deleteTaskCategory', [id]),

  // ─── WALLETS ──────────────────────────────────────────────
  getWallets: () =>
    gasRun<Wallet[]>('getWallets', [], [
      { id: 'w1', name: 'Tiền mặt', type: 'Cash', balance: 5000000 },
      { id: 'w2', name: 'Thẻ Vietcombank', type: 'Bank', balance: 15000000 },
    ]),

  addWallet: (name: string, type: string, initialBalance: number) =>
    gasRun<boolean>('addWallet', [name, type, initialBalance]),

  updateWallet: (id: string, name: string, type: string) =>
    gasRun<boolean>('updateWallet', [id, name, type]),

  deleteWallet: (id: string) =>
    gasRun<boolean>('deleteWallet', [id]),

  reconcileWallet: (id: string, actualBalance: number, note: string) =>
    gasRun<boolean>('reconcileWallet', [id, actualBalance, note]),

  transferBetweenWallets: (fromId: string, toId: string, amount: number, note: string, date: string) =>
    gasRun<boolean>('transferBetweenWallets', [fromId, toId, amount, note, date]),

  // ─── CATEGORIES ───────────────────────────────────────────
  getCategories: () =>
    gasRun<Category[]>('getCategories', [], [
      { id: 'c1', name: 'Ăn uống', type: 'Expense', icon: '🍔', color: '#f43f5e', parentId: '' },
      { id: 'c2', name: 'Lương', type: 'Income', icon: '💰', color: '#22c55e', parentId: '' },
    ]),

  addCategory: (name: string, type: string, icon: string, color: string, parentId = '') =>
    gasRun<boolean>('addCategory', [name, type, icon, color, parentId]),

  updateCategory: (id: string, name: string, type: string, icon: string, color: string, parentId = '') =>
    gasRun<boolean>('updateCategory', [id, name, type, icon, color, parentId]),

  deleteCategory: (id: string) =>
    gasRun<boolean>('deleteCategory', [id]),

  seedCategories: (mode: 'safe' | 'reset' = 'reset') =>
    gasRun<string>('seedCategories', [mode]),

  // ─── TRANSACTIONS ─────────────────────────────────────────
  getTransactions: () =>
    gasRun<Transaction[]>('getTransactions', [], [
      { id: 't1', walletId: 'w1', categoryId: 'c1', amount: 50000, type: 'Expense', date: '2026-05-07', note: 'Phở sáng' },
      { id: 't2', walletId: 'w2', categoryId: 'c2', amount: 20000000, type: 'Income', date: '2026-05-05', note: 'Lương tháng 4' },
    ]),

  addTransaction: (walletId: string, categoryId: string, amount: number, type: string, date: string, note: string, fundId = '', debtId = '') =>
    gasRun<boolean>('addTransaction', [walletId, categoryId, amount, type, date, note, fundId, debtId]),

  updateTransaction: (id: string, newAmount: number, newCategoryId: string, newNote: string, newDate: string) =>
    gasRun<boolean>('updateTransaction', [id, newAmount, newCategoryId, newNote, newDate]),

  deleteTransaction: (id: string) =>
    gasRun<boolean>('deleteTransaction', [id]),

  // ─── BUDGETS ──────────────────────────────────────────────
  getBudgets: (month: string) =>
    gasRun<Budget[]>('getBudgets', [month], [
      { id: 'b1', categoryId: 'c1', amount: 5000000, month }
    ]),

  setBudget: (categoryId: string, amount: number, month: string) =>
    gasRun<boolean>('setBudget', [categoryId, amount, month]),

  // ─── FUNDS (JARS) ─────────────────────────────────────────
  getFunds: () =>
    gasRun<Fund[]>('getFunds', [], [
      { id: 'f_chung', name: 'Quỹ Chung', defaultPercentage: 0, balance: 15000000, icon: '💰', color: '#3b82f6' },
      { id: 'f_sinhhoat', name: 'Sinh hoạt', defaultPercentage: 55, balance: 5000000, icon: '🏠', color: '#f43f5e' },
    ]),

  addFund: (name: string, defaultPercentage: number, icon: string, color: string) =>
    gasRun<boolean>('addFund', [name, defaultPercentage, icon, color]),

  updateFund: (id: string, name: string, defaultPercentage: number, balance: number, icon: string, color: string) =>
    gasRun<boolean>('updateFund', [id, name, defaultPercentage, balance, icon, color]),

  deleteFund: (id: string) =>
    gasRun<boolean>('deleteFund', [id]),

  updateFundBalance: (id: string, newBalance: number) =>
    gasRun<boolean>('updateFundBalance', [id, newBalance]),

  setFundTarget: (id: string, targetAmount: number) =>
    gasRun<boolean>('setFundTarget', [id, targetAmount]),

  depositToFund: (fundId: string, amount: number, walletId: string, note: string, date: string) =>
    gasRun<boolean>('depositToFund', [fundId, amount, walletId, note, date]),

  // ─── DEBTS ────────────────────────────────────────────────
  getDebts: () =>
    gasRun<Debt[]>('getDebts', [], []),

  addDebt: (personName: string, type: string, principalAmount: number, interestRate: number, date: string, dueDate: string) =>
    gasRun<boolean>('addDebt', [personName, type, principalAmount, interestRate, date, dueDate]),

  updateDebtPaidAmount: (id: string, newPaidAmount: number, newStatus: string) =>
    gasRun<boolean>('updateDebtPaidAmount', [id, newPaidAmount, newStatus]),

  payDebt: (debtId: string, amount: number, walletId: string, date: string, note: string) =>
    gasRun<boolean>('payDebt', [debtId, amount, walletId, date, note]),

  // ─── HABITS ───────────────────────────────────────────────
  getHabits: () =>
    gasRun<Habit[]>('getHabits', [], [
      { id: 'h1', title: 'Đọc sách 30p', icon: '📚', color: '#f59e0b', streak: 5, lastCheckedDate: '', history: [] },
    ]),

  addHabit: (title: string, icon: string, color: string) =>
    gasRun<boolean>('addHabit', [title, icon, color]),

  checkHabit: (id: string, date: string) =>
    gasRun<boolean>('checkHabit', [id, date]),

  updateHabit: (id: string, title: string, icon: string, color: string) =>
    gasRun<boolean>('updateHabit', [id, title, icon, color]),

  deleteHabit: (id: string) =>
    gasRun<boolean>('deleteHabit', [id]),

  freezeHabitStreak: (id: string) =>
    gasRun<boolean>('freezeHabitStreak', [id]),

  // ─── GOALS ────────────────────────────────────────────────
  getGoals: () =>
    gasRun<Goal[]>('getGoals', [], [
      { id: 'g1', name: 'Mua iPhone 16', targetAmount: 30000000, savedAmount: 5000000, deadline: '2026-12-31', icon: '📱', color: '#3b82f6' },
    ]),

  addGoal: (name: string, targetAmount: number, deadline: string, icon: string, color: string) =>
    gasRun<boolean>('addGoal', [name, targetAmount, deadline, icon, color]),

  updateGoal: (id: string, name: string, targetAmount: number, deadline: string, icon: string, color: string) =>
    gasRun<boolean>('updateGoal', [id, name, targetAmount, deadline, icon, color]),

  deleteGoal: (id: string) =>
    gasRun<boolean>('deleteGoal', [id]),

  addMoneyToGoal: (goalId: string, amount: number, sourceWalletId: string) =>
    gasRun<boolean>('addMoneyToGoal', [goalId, amount, sourceWalletId]),

  // ─── NOTES / VAULT ────────────────────────────────────────
  getNotes: () =>
    gasRun<Note[]>('getNotes', [], [
      { id: 'n1', title: 'Ý tưởng', content: '...', lastEdited: new Date().toISOString() },
    ]),

  saveNote: (id: string | null, title: string, content: string) =>
    gasRun<string>('saveNote', [id, title, content], 'n_new'),

  deleteNote: (id: string) =>
    gasRun<boolean>('deleteNote', [id]),

  // ─── STOCKS / WEALTH ──────────────────────────────────────
  getStocks: () =>
    gasRun<any[]>('getStocks', [], []),

  getStockTransactions: () =>
    gasRun<StockTransaction[]>('getStockTransactions', [], []),

  addStockTransaction: (ticker: string, type: string, quantity: number, price: number, fee: number, tax: number, date: string, walletId: string, fundId: string, note: string) =>
    gasRun<boolean>('addStockTransaction', [ticker, type, quantity, price, fee, tax, date, walletId, fundId, note]),

  updateStockPrice: (ticker: string, newPrice: number) =>
    gasRun<boolean>('updateStockPrice', [ticker, newPrice]),

  // ─── GAMIFICATION ─────────────────────────────────────────
  getGamificationConfig: () =>
    gasRun<any>('getGamificationConfig', [], { expPerLevel: 100, expPerAction: 20, titles: [] }),

  updateGamificationConfig: (config: any) =>
    gasRun<boolean>('updateGamificationConfig', [config]),

  // ─── TELEGRAM ─────────────────────────────────────────────
  getWeeklyReportStatus: () =>
    gasRun<boolean>('getWeeklyReportStatus', [], false),

  toggleWeeklyReport: (enabled: boolean) =>
    gasRun<boolean>('toggleWeeklyReport', [enabled]),

  // ─── MONTHLY BUDGET CYCLE ─────────────────────────────────
  getMonthlyBudget: (month: string) =>
    gasRun<any>('getMonthlyBudget', [month], {
      month, carryoverIn: 0, totalIncome: 0, totalExpense: 0,
      surplus: 0, sentToSavings: 0, sentToEmergency: 0,
      carryoverOut: 0, closedAt: null, isClosed: false
    }),

  closeMonth: (month: string, sentToSavings: number, sentToEmergency: number, note: string) =>
    gasRun<{ success: boolean; carryoverOut: number }>('closeMonth', [month, sentToSavings, sentToEmergency, note]),

  getMonthlyHistory: () =>
    gasRun<any[]>('getMonthlyHistory', [], []),

  getCurrentCarryover: () =>
    gasRun<number>('getCurrentCarryover', [], 0),

  // ─── RECURRING TEMPLATES ──────────────────────────────────
  getRecurringTemplates: () =>
    gasRun<any[]>('getRecurringTemplates', [], []),

  addRecurringTemplate: (
    name: string, type: string, categoryId: string, walletId: string, fundId: string,
    defaultAmount: number, dayOfMonth: number, budgetMonthOffset: number,
    icon: string, color: string
  ) =>
    gasRun<string | null>('addRecurringTemplate', [name, type, categoryId, walletId, fundId, defaultAmount, dayOfMonth, budgetMonthOffset, icon, color]),

  updateRecurringTemplate: (
    id: string, name: string, defaultAmount: number,
    dayOfMonth: number, budgetMonthOffset: number, isActive: boolean
  ) =>
    gasRun<boolean>('updateRecurringTemplate', [id, name, defaultAmount, dayOfMonth, budgetMonthOffset, isActive]),

  deleteRecurringTemplate: (id: string) =>
    gasRun<boolean>('deleteRecurringTemplate', [id]),

  applyTemplate: (templateId: string, amount: number, date: string, note: string) =>
    gasRun<boolean>('applyTemplate', [templateId, amount, date, note]),
}
