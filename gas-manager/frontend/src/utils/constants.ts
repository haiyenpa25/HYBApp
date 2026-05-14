// =============================================================
// CONSTANTS — Tập trung hằng số, tránh magic string/number
// Tính đóng gói: thay đổi 1 chỗ → áp dụng toàn app
// =============================================================

import type { TaskPriority } from '../types'

// --- KANBAN ---
export const TASK_COLUMNS = [
  { id: 'TODO', title: 'Cần làm', color: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50' },
  { id: 'IN_PROGRESS', title: 'Đang làm', color: 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50' },
  { id: 'DONE', title: 'Hoàn thành', color: 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' },
] as const

// --- PRIORITY ---
export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; border: string }> = {
  P1: { label: 'P1 Cao', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800/50' },
  P2: { label: 'P2 Vừa', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800/50' },
  P3: { label: 'P3 Thấp', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800/50' },
}

// --- HABIT ICONS ---
export const HABIT_ICONS = ['🔥','💪','📚','🏃','🧘','💊','🥗','💧','😴','✍️','🎯','🌱','🎵','🏊','🚴']

// --- GOAL ICONS ---
export const GOAL_ICONS = ['🎯','🚗','🏠','💻','📱','🏖️','💍','🎓','🏥','✈️','🎸','🏋️','📷','🌍','💎']

// --- SHARED COLORS ---
export const PALETTE = [
  '#f43f5e','#ec4899','#d946ef','#a855f7','#8b5cf6',
  '#6366f1','#3b82f6','#0ea5e9','#06b6d4','#14b8a6',
  '#10b981','#22c55e','#84cc16','#eab308','#f59e0b',
  '#f97316','#ef4444'
]

// --- WALLET TYPES ---
export const WALLET_TYPES = [
  { value: 'Cash', label: '💵 Tiền mặt' },
  { value: 'Bank', label: '🏦 Ngân hàng' },
  { value: 'EWallet', label: '📱 Ví điện tử' },
  { value: 'Other', label: '📂 Khác' },
] as const

// --- POMODORO ---
export const POMODORO_DURATION = 25 * 60 // 25 minutes in seconds

// --- BUDGET THRESHOLDS ---
export const BUDGET_WARN_THRESHOLD = 0.8  // 80%
export const BUDGET_OVER_THRESHOLD = 1.0  // 100%

// --- CACHE ---
export const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

// --- CALENDAR COLORS ---
export const CALENDAR_EVENT_COLORS = {
  DONE: '10',        // Green
  IN_PROGRESS: '5',  // Yellow
  TODO: '9',         // Blue
} as const
