import { CheckCircle2, AlertTriangle, ChevronRight, Pencil, Trash2 } from 'lucide-react'

interface Template {
  id: string; name: string; type: 'Income' | 'Expense'
  categoryId: string; walletId: string; fundId: string
  defaultAmount: number; dayOfMonth: number; budgetMonthOffset: number
  icon: string; color: string; isActive: boolean; lastAppliedMonth: string
}
interface Props {
  t: Template
  isApplied: boolean
  isOverdue: boolean
  categoryName: string
  walletName: string
  formatMoney: (v: number) => string
  onApply: (t: Template) => void
  onEdit: (t: Template) => void
  onDelete: (id: string) => void
}

export default function TemplateCard({ t, isApplied, isOverdue, categoryName, walletName, formatMoney, onApply, onEdit, onDelete }: Props) {
  return (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl border transition-all ${isApplied ? 'border-slate-100 dark:border-slate-700 opacity-70' : isOverdue ? 'border-amber-200 dark:border-amber-500/30 shadow-sm' : 'border-slate-100 dark:border-slate-700 shadow-sm'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: t.color + '20', color: t.color }}>{t.icon}</div>
          <div className="min-w-0">
            <div className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <span className="truncate">{t.name}</span>
              {isOverdue && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className={t.type === 'Income' ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>{formatMoney(t.defaultAmount)}</span>
              <span>•</span>
              <span>Ngày {t.dayOfMonth}</span>
              {categoryName && <><span>•</span><span className="text-slate-500">{categoryName}</span></>}
              {walletName && <><span>•</span><span className="text-indigo-400">{walletName}</span></>}
              {t.budgetMonthOffset > 0 && <span className="text-purple-400 font-medium">→ T+{t.budgetMonthOffset}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isApplied ? (
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1.5 rounded-lg">
              <CheckCircle2 size={12} /> Đã dùng
            </div>
          ) : (
            <button onClick={() => onApply(t)}
              className="flex items-center gap-1 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg transition-colors">
              <ChevronRight size={13} /> Áp dụng
            </button>
          )}
          <button onClick={() => onEdit(t)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Pencil size={13} /></button>
          <button onClick={() => onDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  )
}
