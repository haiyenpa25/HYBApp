// =============================================================
// useExpense — Controller Hook cho toàn bộ ExpenseManager
// Tách 1004 dòng logic ra khỏi View component
// =============================================================

import { useState, useEffect, useCallback, useContext } from 'react'
import { walletApi, transactionApi, categoryApi, budgetApi } from '../api/transactionApi'
import { gasRun } from '../utils/gasRunner'
import { PrivacyContext } from '../App'
import { formatMoney, getCurrentMonth, getToday } from '../utils/formatters'
import { BUDGET_WARN_THRESHOLD, BUDGET_OVER_THRESHOLD } from '../utils/constants'
import type { Wallet, Transaction, Category, Budget, Fund, Debt } from '../types'

export function useExpense() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(false)
  const [budgetAlert, setBudgetAlert] = useState<{ message: string; type: 'warn' | 'over' } | null>(null)

  const isPrivacyMode = useContext(PrivacyContext)
  const currentMonth = getCurrentMonth()

  // ─── Load all data ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    const [w, c, t, b, f, d] = await Promise.all([
      walletApi.getAll(),
      categoryApi.getAll(),
      transactionApi.getAll(),
      budgetApi.getByMonth(currentMonth),
      gasRun<Fund[]>('getFunds', [], []),
      gasRun<Debt[]>('getDebts', [], []),
    ])
    setWallets(w)
    setCategories(c)
    setTransactions([...t].reverse())
    setBudgets(b)
    setFunds(f)
    setDebts(d)
    setLoading(false)
    return { wallets: w, categories: c }
  }, [currentMonth])

  useEffect(() => { loadData() }, [loadData])

  // ─── Budget Alert Helper ────────────────────────────────────
  const checkBudgetAlert = useCallback((categoryId: string, addedAmount: number, catName: string) => {
    const catBudget = budgets.find(b => b.categoryId === categoryId)
    if (!catBudget) return
    const spent = transactions
      .filter(t => t.categoryId === categoryId && t.date.startsWith(currentMonth) && t.type === 'Expense')
      .reduce((s, t) => s + Number(t.amount), 0) + addedAmount
    const pct = spent / Number(catBudget.amount)
    if (pct >= BUDGET_OVER_THRESHOLD) {
      setBudgetAlert({ message: `⚠️ Vượt ngân sách! "${catName}" đã dùng ${Math.round(pct * 100)}%`, type: 'over' })
    } else if (pct >= BUDGET_WARN_THRESHOLD) {
      setBudgetAlert({ message: `🔔 Cảnh báo! "${catName}" đã dùng ${Math.round(pct * 100)}%`, type: 'warn' })
    }
    setTimeout(() => setBudgetAlert(null), 5000)
  }, [budgets, transactions, currentMonth])

  // ─── Add Transaction ────────────────────────────────────────
  const addTransaction = useCallback(async (
    walletId: string, categoryId: string, amount: number,
    type: string, note: string, fundId: string
  ) => {
    const cat = categories.find(c => c.id === categoryId)
    const date = getToday()
    const tempId = 'tmp-' + Date.now()

    // Optimistic update
    setTransactions(prev => [{ id: tempId, walletId, categoryId, amount, type: type as any, date, note, fundId }, ...prev])
    setWallets(prev => prev.map(w =>
      w.id === walletId ? { ...w, balance: w.balance + (type === 'Income' ? amount : -amount) } : w
    ))

    try {
      await transactionApi.add(walletId, categoryId, amount, type, date, note, fundId)
      await loadData()
      if (type === 'Expense' && cat) checkBudgetAlert(categoryId, amount, cat.name)
    } catch {
      setTransactions(prev => prev.filter(t => t.id !== tempId))
    }
  }, [categories, loadData, checkBudgetAlert])

  // ─── Delete Transaction ─────────────────────────────────────
  const deleteTransaction = useCallback(async (id: string) => {
    const tx = transactions.find(t => t.id === id)
    if (!tx) return
    setTransactions(prev => prev.filter(t => t.id !== id))
    setWallets(prev => prev.map(w =>
      w.id === tx.walletId
        ? { ...w, balance: w.balance + (tx.type === 'Income' ? -tx.amount : tx.amount) }
        : w
    ))
    try {
      await transactionApi.delete(id)
    } catch {
      loadData()
    }
  }, [transactions, loadData])

  // ─── Transfer Between Wallets ───────────────────────────────
  const transfer = useCallback(async (fromId: string, toId: string, amount: number, note: string) => {
    setLoading(true)
    await walletApi.transfer(fromId, toId, amount, note, getToday())
    await loadData()
  }, [loadData])

  // ─── Computed values ────────────────────────────────────────
  const monthlyTx = transactions.filter(t => t.date.startsWith(currentMonth))
  const totalIncome = monthlyTx.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = monthlyTx.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0)
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0)

  const fmt = (v: number) => formatMoney(v, isPrivacyMode)

  return {
    // State
    wallets, categories, transactions, budgets, funds, debts,
    loading, budgetAlert, currentMonth,
    // Computed
    monthlyTx, totalIncome, totalExpense, totalBalance,
    // Actions
    loadData, addTransaction, deleteTransaction, transfer,
    setWallets, setFunds, setDebts, setBudgetAlert,
    // Helpers
    fmt,
  }
}
