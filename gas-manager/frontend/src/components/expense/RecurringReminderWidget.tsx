// ─── RecurringReminderWidget.tsx ─────────────────────────
// Widget nhỏ nhắc nhở các khoản định kỳ chưa áp dụng tháng này
// Hiện ngay trên trang chính, không cần vào Tab Định kỳ
// ──────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { server } from '../../utils/gas'
import { Bell, ChevronRight, CheckCircle2, X, Zap } from 'lucide-react'

interface Template {
  id: string; name: string; type: 'Income' | 'Expense'
  categoryId: string; walletId: string; fundId: string
  defaultAmount: number; dayOfMonth: number; budgetMonthOffset: number
  icon: string; color: string; isActive: boolean; lastAppliedMonth: string
}

interface Props {
  formatMoney: (v: number) => string
  onApplied: () => void
  onNavigateToTab: () => void
}

export default function RecurringReminderWidget({ formatMoney, onApplied, onNavigateToTab }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [applyingAll, setApplyingAll] = useState(false)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const currentMonth = new Date().toISOString().substring(0, 7)
  const today = new Date().getDate()

  const load = useCallback(async () => {
    const data: Template[] = await server.getRecurringTemplates() || []
    setTemplates(data)
  }, [])

  useEffect(() => { load() }, [load])

  // Pending = active + chưa apply tháng này
  const pending = templates.filter(t => t.isActive && t.lastAppliedMonth !== currentMonth)
  const overdue = pending.filter(t => today > t.dayOfMonth)

  // Hide if nothing pending or user dismissed
  if (pending.length === 0 || dismissed) return null

  const handleApplyOne = async (t: Template) => {
    setApplyingId(t.id)
    await server.applyTemplate(t.id, t.defaultAmount, new Date().toISOString().split('T')[0], t.name)
    setApplyingId(null)
    await load()
    onApplied()
  }

  const handleApplyAll = async () => {
    setApplyingAll(true)
    const date = new Date().toISOString().split('T')[0]
    for (const t of pending) {
      await server.applyTemplate(t.id, t.defaultAmount, date, t.name)
    }
    setApplyingAll(false)
    setDismissed(true)
    await load()
    onApplied()
  }

  const totalIncome  = pending.filter(t => t.type === 'Income').reduce((s, t) => s + t.defaultAmount, 0)
  const totalExpense = pending.filter(t => t.type === 'Expense').reduce((s, t) => s + t.defaultAmount, 0)

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${overdue.length > 0 ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/5' : 'border-indigo-100 dark:border-indigo-500/20 bg-white/80 dark:bg-slate-800/60'}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${overdue.length > 0 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-indigo-100 dark:bg-indigo-500/20'}`}>
            <Bell size={15} className={overdue.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-500'} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 dark:text-white">
              {overdue.length > 0
                ? `⚠️ ${overdue.length} khoản quá hạn chưa ghi`
                : `📋 ${pending.length} khoản định kỳ chờ áp dụng`}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalIncome > 0 && <span className="text-emerald-500 font-semibold">+{formatMoney(totalIncome)} </span>}
              {totalExpense > 0 && <span className="text-rose-500 font-semibold">-{formatMoney(totalExpense)}</span>}
              <span className="ml-1">tháng {currentMonth.substring(5)}</span>
            </p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          <X size={14} />
        </button>
      </div>

      {/* Template pills — max 4 hiện inline */}
      <div className="px-5 pb-3 flex flex-wrap gap-2">
        {pending.slice(0, 4).map(t => (
          <button key={t.id}
            onClick={() => handleApplyOne(t)}
            disabled={!!applyingId || applyingAll}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all disabled:opacity-60"
            style={{ backgroundColor: t.color + '15', borderColor: t.color + '40', color: t.color }}>
            {applyingId === t.id
              ? <span className="w-3 h-3 border-2 border-current/40 border-t-current rounded-full animate-spin" />
              : <span>{t.icon}</span>}
            {t.name}
            <span className="text-slate-500 font-normal">
              {t.type === 'Income' ? '+' : '-'}{formatMoney(t.defaultAmount)}
            </span>
          </button>
        ))}
        {pending.length > 4 && (
          <button onClick={onNavigateToTab}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
            +{pending.length - 4} khác <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-4 flex items-center gap-3">
        <button onClick={handleApplyAll} disabled={applyingAll || !!applyingId}
          className="flex items-center gap-1.5 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl disabled:opacity-50 transition-colors">
          {applyingAll
            ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang áp dụng...</>
            : <><Zap size={13} /> Áp dụng tất cả ({pending.length})</>}
        </button>
        <button onClick={onNavigateToTab}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-500 transition-colors">
          <CheckCircle2 size={13} /> Xem chi tiết
        </button>
      </div>
    </div>
  )
}
