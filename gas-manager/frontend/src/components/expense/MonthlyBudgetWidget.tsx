// ─── MonthlyBudgetWidget.tsx ─────────────────────────────
// Widget hiển thị ngân sách tháng hiện tại + nút tất toán
// ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { server } from '../../utils/gas'
import { TrendingUp, TrendingDown, Calendar, X, AlertCircle } from 'lucide-react'

interface MonthlyBudget {
  month: string
  carryoverIn: number
  totalIncome: number
  totalExpense: number
  surplus: number
  sentToSavings: number
  sentToEmergency: number
  carryoverOut: number
  closedAt: string | null
  isClosed: boolean
}

interface Props {
  formatMoney: (v: number) => string
  onRefreshExpenses?: () => void
}



export default function MonthlyBudgetWidget({ formatMoney, onRefreshExpenses }: Props) {
  const [budget, setBudget] = useState<MonthlyBudget | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [saving, setSaving] = useState(0)
  const [emergency, setEmergency] = useState(0)
  const [closeNote, setCloseNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentMonth = new Date().toISOString().substring(0, 7)
  const today = new Date().getDate()
  const showCloseButton = today >= 25

  const load = async () => {
    setLoading(true)
    const data = await server.getMonthlyBudget(currentMonth)
    setBudget(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Auto-set savings suggestion (70% of surplus)
  useEffect(() => {
    if (showCloseModal && budget && budget.surplus > 0) {
      setSaving(Math.floor(budget.surplus * 0.7))
      setEmergency(Math.floor(budget.surplus * 0.1))
    }
  }, [showCloseModal, budget])

  const carryover = budget ? Math.max(0, budget.surplus - saving - emergency) : 0

  const handleCloseMonth = async () => {
    if (!budget) return
    setSubmitting(true)
    const result = await server.closeMonth(currentMonth, saving, emergency, closeNote)
    setSubmitting(false)
    if (result?.success) {
      setShowCloseModal(false)
      load()
      onRefreshExpenses?.()
    }
  }

  if (loading) return (
    <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
    </div>
  )

  if (!budget) return null

  const totalBudget = budget.carryoverIn + budget.totalIncome
  const spentPct = totalBudget > 0 ? Math.min(100, (budget.totalExpense / totalBudget) * 100) : 0
  const isOverBudget = budget.totalExpense > totalBudget

  return (
    <>
      <div className={`rounded-2xl p-5 border shadow-sm ${budget.isClosed ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700' : 'bg-white/80 dark:bg-slate-800/60 border-indigo-100 dark:border-indigo-500/20'}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ngân sách {new Date(currentMonth + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </span>
              {budget.isClosed && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full font-bold">Đã tất toán</span>}
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatMoney(totalBudget)}</p>
          </div>
          {!budget.isClosed && showCloseButton && (
            <button onClick={() => setShowCloseModal(true)}
              className="text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
              <TrendingUp size={13} /> Tất toán tháng
            </button>
          )}
        </div>

        {/* Income / Expense row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
              <TrendingUp size={13} /> Thu nhập
            </div>
            <p className="font-black text-slate-800 dark:text-white text-sm">{formatMoney(budget.totalIncome)}</p>
            {budget.carryoverIn > 0 && <p className="text-xs text-slate-400 mt-0.5">+ {formatMoney(budget.carryoverIn)} carry</p>}
          </div>
          <div className="bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 text-xs font-bold mb-1">
              <TrendingDown size={13} /> Chi tiêu
            </div>
            <p className={`font-black text-sm ${isOverBudget ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>
              {formatMoney(budget.totalExpense)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>{spentPct.toFixed(1)}% đã dùng</span>
            <span className={budget.surplus >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
              {budget.surplus >= 0 ? 'Còn: ' : 'Bội chi: '}{formatMoney(Math.abs(budget.surplus))}
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : spentPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${spentPct}%` }} />
          </div>
        </div>

        {/* Footer */}
        {budget.isClosed && (
          <div className="text-xs text-slate-400 flex gap-4">
            <span>💰 Tiết kiệm: {formatMoney(budget.sentToSavings)}</span>
            <span>🛡️ Khẩn cấp: {formatMoney(budget.sentToEmergency)}</span>
            <span>📦 Carry T+1: {formatMoney(budget.carryoverOut)}</span>
          </div>
        )}
      </div>

      {/* Close Month Modal */}
      {showCloseModal && budget && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black">Tất Toán Tháng</h2>
                <p className="text-sm text-white/80 mt-0.5">{new Date(currentMonth + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</p>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="hover:bg-white/20 p-1.5 rounded-xl"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Summary */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Thu nhập</span>
                  <span className="font-bold text-emerald-600">+{formatMoney(budget.totalIncome)}</span>
                </div>
                {budget.carryoverIn > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carryover từ tháng trước</span>
                    <span className="font-bold text-indigo-500">+{formatMoney(budget.carryoverIn)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Chi tiêu</span>
                  <span className="font-bold text-rose-500">-{formatMoney(budget.totalExpense)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-black">
                  <span>Số dư</span>
                  <span className={budget.surplus >= 0 ? 'text-emerald-600' : 'text-rose-500'}>{formatMoney(budget.surplus)}</span>
                </div>
              </div>

              {budget.surplus <= 0 ? (
                <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium">
                  <AlertCircle size={18} className="shrink-0" />
                  Tháng này bội chi. Carryover = 0₫. Không có tiền để phân bổ.
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Phân bổ số dư {formatMoney(budget.surplus)}:</p>
                  {/* Savings slider — max = surplus - emergency */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">💰 Quỹ Tiết Kiệm</label>
                      <input type="number" value={saving}
                        onChange={e => setSaving(Math.min(Number(e.target.value), budget.surplus - emergency))}
                        className="w-36 px-3 py-1.5 text-right font-bold text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <input type="range" min={0} max={budget.surplus - emergency} value={saving}
                      onChange={e => setSaving(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  </div>
                  {/* Emergency slider — max = surplus - saving */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">🛡️ Quỹ Khẩn Cấp</label>
                      <input type="number" value={emergency}
                        onChange={e => setEmergency(Math.min(Number(e.target.value), budget.surplus - saving))}
                        className="w-36 px-3 py-1.5 text-right font-bold text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <input type="range" min={0} max={budget.surplus - saving} value={emergency}
                      onChange={e => setEmergency(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">📦 Carry sang tháng sau</span>
                    <span className={`font-black text-sm ${carryover < 0 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{formatMoney(carryover)}</span>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ghi chú</label>
                <input type="text" value={closeNote} onChange={e => setCloseNote(e.target.value)}
                  placeholder="VD: Tháng 5 ổn định, tiết kiệm tốt"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm" />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
              <button onClick={handleCloseMonth} disabled={submitting || carryover < 0}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang lưu...</> : '✅ Xác nhận tất toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
