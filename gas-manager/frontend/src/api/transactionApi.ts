// =============================================================
// TRANSACTION API — Domain API cho chi tiêu
// Tách từ gas.ts, áp dụng gasRunner generic
// =============================================================

import { gasRun } from '../utils/gasRunner'
import type { Transaction, Category, Budget, Wallet } from '../types'

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', walletId: 'w1', categoryId: 'c1', amount: 50000, type: 'Expense', date: '2026-05-07', note: 'Phở sáng', fundId: 'f1' },
  { id: 't2', walletId: 'w2', categoryId: 'c2', amount: 20000000, type: 'Income', date: '2026-05-05', note: 'Lương tháng 4', fundId: '' },
]

const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Ăn uống', type: 'Expense', icon: '🍔', color: '#f43f5e', parentId: '' },
  { id: 'c2', name: 'Lương', type: 'Income', icon: '💰', color: '#22c55e', parentId: '' },
]

export const transactionApi = {
  getAll: () =>
    gasRun<Transaction[]>('getTransactions', [], MOCK_TRANSACTIONS),

  add: (walletId: string, categoryId: string, amount: number, type: string, date: string, note: string, fundId = '', debtId = '') =>
    gasRun<boolean>('addTransaction', [walletId, categoryId, amount, type, date, note, fundId, debtId]),

  delete: (id: string) =>
    gasRun<boolean>('deleteTransaction', [id]),
}

export const categoryApi = {
  getAll: () =>
    gasRun<Category[]>('getCategories', [], MOCK_CATEGORIES),

  add: (name: string, type: string, icon: string, color: string, parentId = '') =>
    gasRun<boolean>('addCategory', [name, type, icon, color, parentId]),

  update: (id: string, name: string, type: string, icon: string, color: string, parentId = '') =>
    gasRun<boolean>('updateCategory', [id, name, type, icon, color, parentId]),

  delete: (id: string) =>
    gasRun<boolean>('deleteCategory', [id]),
}

export const budgetApi = {
  getByMonth: (month: string) =>
    gasRun<Budget[]>('getBudgets', [month], []),

  set: (categoryId: string, amount: number, month: string) =>
    gasRun<boolean>('setBudget', [categoryId, amount, month]),
}

export const walletApi = {
  getAll: () =>
    gasRun<Wallet[]>('getWallets', [], [
      { id: 'w1', name: 'Tiền mặt', type: 'Cash', balance: 5000000 },
      { id: 'w2', name: 'Thẻ Vietcombank', type: 'Bank', balance: 15000000 },
    ]),

  add: (name: string, type: string, initialBalance: number) =>
    gasRun<boolean>('addWallet', [name, type, initialBalance]),

  update: (id: string, name: string, type: string) =>
    gasRun<boolean>('updateWallet', [id, name, type]),

  delete: (id: string) =>
    gasRun<boolean>('deleteWallet', [id]),

  reconcile: (id: string, actualBalance: number, note: string) =>
    gasRun<boolean>('reconcileWallet', [id, actualBalance, note]),

  transfer: (fromId: string, toId: string, amount: number, note: string, date: string) =>
    gasRun<boolean>('transferBetweenWallets', [fromId, toId, amount, note, date]),
}
