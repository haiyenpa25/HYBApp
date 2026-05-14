// =============================================================
// HABIT + GOAL API — Domain API cho Life OS
// =============================================================

import { gasRun } from '../utils/gasRunner'
import type { Habit, Goal, UserStats } from '../types'

const MOCK_HABITS: Habit[] = [
  { id: 'h1', title: 'Tập thể dục', icon: '💪', color: '#10b981', streak: 7, lastCheckedDate: '', history: [] },
  { id: 'h2', title: 'Đọc sách', icon: '📚', color: '#6366f1', streak: 3, lastCheckedDate: '', history: [] },
]

const MOCK_GOALS: Goal[] = [
  { id: 'g1', name: 'Mua xe máy', targetAmount: 30000000, savedAmount: 12000000, deadline: '2026-12-31', icon: '🚗', color: '#f59e0b' },
]

export const habitApi = {
  getAll: () =>
    gasRun<Habit[]>('getHabits', [], MOCK_HABITS),

  add: (title: string, icon: string, color: string) =>
    gasRun<boolean>('addHabit', [title, icon, color]),

  update: (id: string, title: string, icon: string, color: string) =>
    gasRun<boolean>('updateHabit', [id, title, icon, color]),

  delete: (id: string) =>
    gasRun<boolean>('deleteHabit', [id]),

  check: (id: string, date: string) =>
    gasRun<boolean>('checkHabit', [id, date]),

  freeze: (id: string) =>
    gasRun<boolean>('freezeHabitStreak', [id]),
}

export const goalApi = {
  getAll: () =>
    gasRun<Goal[]>('getGoals', [], MOCK_GOALS),

  add: (name: string, targetAmount: number, deadline: string, icon: string, color: string) =>
    gasRun<boolean>('addGoal', [name, targetAmount, deadline, icon, color]),

  update: (id: string, name: string, targetAmount: number, deadline: string, icon: string, color: string) =>
    gasRun<boolean>('updateGoal', [id, name, targetAmount, deadline, icon, color]),

  delete: (id: string) =>
    gasRun<boolean>('deleteGoal', [id]),

  deposit: (goalId: string, amount: number, walletId: string) =>
    gasRun<boolean>('addMoneyToGoal', [goalId, amount, walletId]),
}

export const userApi = {
  getCurrent: () =>
    gasRun<{ email: string; name: string }>('getCurrentUser', [], { email: 'user@gmail.com', name: 'User' }),

  getStats: () =>
    gasRun<UserStats>('getUserStats', [], {
      exp: 0, level: 1, currentLevelExp: 0, currentLevelExpPercent: 0, title: 'Tân Binh', expPerLevel: 100
    }),

  getDashboardSummary: () =>
    gasRun<any>('getDashboardSummary', [], null, 500),
}
