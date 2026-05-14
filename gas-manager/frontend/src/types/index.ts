// =============================================================
// CENTRAL TYPE DEFINITIONS — Single Source of Truth
// Áp dụng: Interface Segregation, Strong Typing (thay cho any[])
// =============================================================

// --- DOMAIN: Transaction & Finance ---
export type TransactionType = 'Income' | 'Expense'

export interface Wallet {
  id: string
  name: string
  type: 'Cash' | 'Bank' | 'EWallet' | 'Other'
  balance: number
}

export interface Category {
  id: string
  name: string
  type: TransactionType
  icon: string
  color: string
  parentId: string
}

export interface Transaction {
  id: string
  walletId: string
  categoryId: string
  amount: number
  type: TransactionType
  date: string
  note: string
  fundId?: string
  debtId?: string
}

export interface Budget {
  id: string
  categoryId: string
  amount: number
  month: string
}

export interface Fund {
  id: string
  name: string
  balance: number
  defaultPercentage: number
  color: string
  icon: string
}

export type DebtType = 'BORROW' | 'LEND'
export type DebtStatus = 'PENDING' | 'PAID'

export interface Debt {
  id: string
  personName: string
  type: DebtType
  principalAmount: number
  interestRate: number
  paidAmount: number
  date: string
  dueDate: string
  status: DebtStatus
}

// --- DOMAIN: Task & Calendar ---
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'P1' | 'P2' | 'P3'

export interface Subtask {
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  date: string
  eventId?: string
  calendarId: string
  priority: TaskPriority
  subtasks: Subtask[]
  noteId?: string | null
}

export interface TaskCategory {
  id: string
  name: string
  color: string
}

// --- DOMAIN: Habit & Goal (Life OS) ---
export interface Habit {
  id: string
  title: string
  icon: string
  color: string
  streak: number
  lastCheckedDate: string
  history: string[]
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  deadline: string
  icon: string
  color: string
}

// --- DOMAIN: Gamification ---
export interface UserStats {
  exp: number
  level: number
  currentLevelExp: number
  currentLevelExpPercent: number
  title: string
  expPerLevel: number
}

// --- DOMAIN: Notes ---
export interface Note {
  id: string
  title: string
  content: string
  lastEdited: string
}

// --- DOMAIN: Stocks ---
export interface Stock {
  ticker: string
  totalQuantity: number
  avgCost: number
  currentPrice: number
  totalValue: number
  totalCost: number
  pnl: number
  pnlPercent: number
  transactions: StockTransaction[]
}

export interface StockTransaction {
  id: string
  ticker: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  fee: number
  tax: number
  date: string
  note: string
}

// --- GENERIC UTILITY TYPES ---
export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

export interface SelectOption {
  value: string
  label: string
}

export interface LoadingState {
  isLoading: boolean
  error: string | null
}
