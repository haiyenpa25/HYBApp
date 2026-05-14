// =============================================================
// useHabits — Controller Hook cho Habit Management
// Tách toàn bộ business logic ra khỏi LifeOS.tsx (View)
// Single Responsibility: View chỉ nhận props và render
// =============================================================

import { useState, useCallback } from 'react'
import { habitApi } from '../api/lifeApi'
import { getToday } from '../utils/formatters'
import type { Habit } from '../types'

export function useHabits(initialHabits: Habit[] = []) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits)
  const [loading, setLoading] = useState(false)
  const today = getToday()

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await habitApi.getAll()
    setHabits(data)
    setLoading(false)
  }, [])

  const add = useCallback(async (title: string, icon: string, color: string) => {
    const optimistic: Habit = {
      id: 'tmp-' + Date.now(), title, icon, color,
      streak: 0, lastCheckedDate: '', history: []
    }
    setHabits(prev => [optimistic, ...prev])
    await habitApi.add(title, icon, color)
    refresh()
  }, [refresh])

  const update = useCallback(async (id: string, title: string, icon: string, color: string) => {
    // Optimistic update
    setHabits(prev => prev.map(h => h.id === id ? { ...h, title, icon, color } : h))
    await habitApi.update(id, title, icon, color)
  }, [])

  const remove = useCallback(async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    await habitApi.delete(id)
  }, [])

  const check = useCallback(async (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id || h.lastCheckedDate === today) return h
      return { ...h, streak: Number(h.streak) + 1, lastCheckedDate: today }
    }))
    await habitApi.check(id, today)
    refresh()
  }, [today, refresh])

  const freeze = useCallback(async (id: string) => {
    setHabits(prev => prev.map(h =>
      h.id === id ? { ...h, lastCheckedDate: today } : h
    ))
    await habitApi.freeze(id)
  }, [today])

  const checkedCount = habits.filter(h => h.lastCheckedDate === today).length
  const pendingHabits = habits.filter(h => h.lastCheckedDate !== today)

  return {
    habits, loading,
    checkedCount, pendingHabits,
    refresh, add, update, remove, check, freeze
  }
}
