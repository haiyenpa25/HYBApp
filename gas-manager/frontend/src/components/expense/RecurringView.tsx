// ─── RecurringView.tsx ───────────────────────────────────
// Tab "Định kỳ" — sử dụng TemplateCard + TemplateForm tách riêng
// ──────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { server } from '../../utils/gas'
import { Plus, CheckCircle2, Clock, X, AlertTriangle, Zap } from 'lucide-react'
import TemplateCard from './TemplateCard'
import TemplateForm from './TemplateForm'

export interface Template {
  id: string; name: string; type: 'Income' | 'Expense'
  categoryId: string; walletId: string; fundId: string
  defaultAmount: number; dayOfMonth: number; budgetMonthOffset: number
  icon: string; color: string; isActive: boolean; lastAppliedMonth: string
}

interface Props {
  categories: any[]; wallets: any[]; funds: any[]
  formatMoney: (v: number) => string
  onTransactionAdded: () => void
  onBadgeCount?: (n: number) => void   // notify parent about pending count
}

const EMPTY_FORM = {
  name: '', type: 'Income' as const, categoryId: '', walletId: '', fundId: '',
  defaultAmount: '', dayOfMonth: '1', budgetMonthOffset: '0', icon: '💼', color: '#6366f1'
} as const satisfies Record<string, string>

export default function RecurringView({ categories, wallets, funds, formatMoney, onTransactionAdded, onBadgeCount }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [applyingTmpl, setApplyingTmpl] = useState<Template | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTmpl, setEditingTmpl] = useState<Template | null>(null)
  const [form, setForm] = useState<{ name: string; type: 'Income' | 'Expense'; categoryId: string; walletId: string; fundId: string; defaultAmount: string; dayOfMonth: string; budgetMonthOffset: string; icon: string; color: string }>(EMPTY_FORM as any)
  // Apply form
  const [applyAmount, setApplyAmount] = useState('')
  const [applyDate, setApplyDate] = useState('')
  const [applyNote, setApplyNote] = useState('')
  const [applySubmitting, setApplySubmitting] = useState(false)
  const [applyingAll, setApplyingAll]     = useState(false)

  const currentMonth = new Date().toISOString().substring(0, 7)
  const today = new Date().getDate()

  const isOverdue = (t: Template) =>
    today > t.dayOfMonth && t.lastAppliedMonth !== currentMonth

  const load = useCallback(async () => {
    setLoading(true)
    const data: Template[] = await server.getRecurringTemplates() || []
    setTemplates(data)
    setLoading(false)
    // notify parent about overdue count
    const overdueCount = data.filter(t => t.isActive && t.lastAppliedMonth !== currentMonth && today > t.dayOfMonth).length
    onBadgeCount?.(overdueCount)
  }, [currentMonth, today, onBadgeCount])

  useEffect(() => { load() }, [load])

  const pending = templates.filter(t => t.isActive && t.lastAppliedMonth !== currentMonth)
  const applied = templates.filter(t => t.isActive && t.lastAppliedMonth === currentMonth)
  const overdueCount = pending.filter(isOverdue).length

  // Planned vs Actual summary
  const plannedIncome  = templates.filter(t => t.isActive && t.type === 'Income').reduce((s, t) => s + t.defaultAmount, 0)
  const actualIncome   = templates.filter(t => t.isActive && t.type === 'Income' && t.lastAppliedMonth === currentMonth).reduce((s, t) => s + t.defaultAmount, 0)
  const plannedExpense = templates.filter(t => t.isActive && t.type === 'Expense').reduce((s, t) => s + t.defaultAmount, 0)
  const actualExpense  = templates.filter(t => t.isActive && t.type === 'Expense' && t.lastAppliedMonth === currentMonth).reduce((s, t) => s + t.defaultAmount, 0)

  const openApply = (t: Template) => {
    setApplyingTmpl(t)
    setApplyAmount(String(t.defaultAmount))
    // Smart date: fill template's dayOfMonth for current month
    const d = new Date(); d.setDate(t.dayOfMonth)
    setApplyDate(d.toISOString().split('T')[0])
    setApplyNote(t.name)
  }

  const handleApply = async () => {
    if (!applyingTmpl || !applyAmount) return
    setApplySubmitting(true)
    const ok = await server.applyTemplate(applyingTmpl.id, Number(applyAmount), applyDate, applyNote)
    setApplySubmitting(false)
    if (ok) { setApplyingTmpl(null); load(); onTransactionAdded() }
  }

  const handleApplyAll = async () => {
    if (applyingAll || pending.length === 0) return
    setApplyingAll(true)
    const date = new Date().toISOString().split('T')[0]
    for (const t of pending) {
      await server.applyTemplate(t.id, t.defaultAmount, date, t.name)
    }
    setApplyingAll(false)
    load()
    onTransactionAdded()
  }

  const handleAdd = async () => {
    if (!form.name || !form.categoryId || !form.walletId || !form.defaultAmount) return
    await server.addRecurringTemplate(
      form.name, form.type, form.categoryId, form.walletId, form.fundId,
      Number(form.defaultAmount), Number(form.dayOfMonth),
      Number(form.budgetMonthOffset), form.icon, form.color
    )
    setShowAddModal(false); setForm(EMPTY_FORM); load()
  }

  const handleUpdate = async () => {
    if (!editingTmpl) return
    await server.updateRecurringTemplate(
      editingTmpl.id, form.name, Number(form.defaultAmount),
      Number(form.dayOfMonth), Number(form.budgetMonthOffset), true
    )
    setEditingTmpl(null); setForm(EMPTY_FORM); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa mẫu định kỳ này?')) return
    setTemplates(prev => prev.filter(t => t.id !== id))
    await server.deleteRecurringTemplate(id)
  }

  const openEdit = (t: Template) => {
    setEditingTmpl(t)
    setForm({ name: t.name, type: t.type as 'Income' | 'Expense', categoryId: t.categoryId, walletId: t.walletId, fundId: t.fundId, defaultAmount: String(t.defaultAmount), dayOfMonth: String(t.dayOfMonth), budgetMonthOffset: String(t.budgetMonthOffset), icon: t.icon, color: t.color })
  }

  const getCategoryName = (id: string) => { const c = categories.find(x => x.id === id); return c ? `${c.icon} ${c.name}` : '' }
  const getWalletName   = (id: string) => wallets.find(x => x.id === id)?.name || ''

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Planned vs Actual */}
        {templates.length > 0 && (
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">💰 Thu kế hoạch</p>
              <p className="font-black text-slate-800 dark:text-white text-sm">{formatMoney(plannedIncome)}</p>
              <p className="text-xs text-emerald-500 font-semibold mt-0.5">✓ {formatMoney(actualIncome)} đã nhận</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">💸 Chi kế hoạch</p>
              <p className="font-black text-slate-800 dark:text-white text-sm">{formatMoney(plannedExpense)}</p>
              <p className="text-xs text-rose-500 font-semibold mt-0.5">✓ {formatMoney(actualExpense)} đã chi</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Clock size={13} />
                    Chờ áp dụng ({pending.length})
                    {overdueCount > 0 && (
                      <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={11} /> {overdueCount} quá hạn
                      </span>
                    )}
                  </div>
                  <button onClick={handleApplyAll} disabled={applyingAll}
                    className="flex items-center gap-1.5 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl disabled:opacity-60 transition-colors">
                    {applyingAll
                      ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang áp dụng...</>
                      : <><Zap size={12} /> Áp dụng tất cả</>}
                  </button>
                </div>
                <div className="space-y-2">
                  {pending.map(t => (
                    <TemplateCard key={t.id} t={t} isApplied={false} isOverdue={isOverdue(t)}
                      categoryName={getCategoryName(t.categoryId)} walletName={getWalletName(t.walletId)}
                      formatMoney={formatMoney} onApply={openApply} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}

            {applied.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  Đã áp dụng tháng này ({applied.length})
                </div>
                <div className="space-y-2">
                  {applied.map(t => (
                    <TemplateCard key={t.id} t={t} isApplied={true} isOverdue={false}
                      categoryName={getCategoryName(t.categoryId)} walletName={getWalletName(t.walletId)}
                      formatMoney={formatMoney} onApply={openApply} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}

            {templates.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-medium">Chưa có mẫu định kỳ</p>
                <p className="text-sm mt-1">Thêm lương, tiền điện... để áp dụng nhanh mỗi tháng</p>
              </div>
            )}
          </>
        )}

        <button onClick={() => { setShowAddModal(true); setForm(EMPTY_FORM) }}
          className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <Plus size={18} /> Thêm mẫu định kỳ
        </button>
      </div>

      {/* Apply Modal */}
      {applyingTmpl && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-5 flex justify-between items-center border-b border-slate-100 dark:border-slate-800"
              style={{ backgroundColor: applyingTmpl.color + '15' }}>
              <div>
                <div className="text-2xl mb-1">{applyingTmpl.icon}</div>
                <h2 className="font-black text-slate-800 dark:text-white">{applyingTmpl.name}</h2>
                {applyingTmpl.budgetMonthOffset > 0 && (
                  <p className="text-xs text-indigo-500 font-medium mt-0.5">ℹ️ Tính vào ngân sách tháng sau</p>
                )}
              </div>
              <button onClick={() => setApplyingTmpl(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số tiền thực nhận/trả</label>
                <input type="number" value={applyAmount} onChange={e => setApplyAmount(e.target.value)} autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-lg dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ngày</label>
                <input type="date" value={applyDate} onChange={e => setApplyDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ghi chú</label>
                <input type="text" value={applyNote} onChange={e => setApplyNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button onClick={() => setApplyingTmpl(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
              <button onClick={handleApply} disabled={applySubmitting || !applyAmount}
                className="flex-1 py-3 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center"
                style={{ backgroundColor: applyingTmpl.color }}>
                {applySubmitting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '✅ Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editingTmpl) && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="font-black text-slate-800 dark:text-white text-lg">{editingTmpl ? 'Sửa mẫu' : 'Thêm mẫu định kỳ'}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingTmpl(null) }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
            </div>
            <TemplateForm form={form} setForm={setForm as any} categories={categories} wallets={wallets} funds={funds} isEdit={!!editingTmpl} />
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button onClick={() => { setShowAddModal(false); setEditingTmpl(null) }} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
              <button onClick={editingTmpl ? handleUpdate : handleAdd}
                className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors">
                {editingTmpl ? 'Lưu thay đổi' : 'Thêm mẫu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
