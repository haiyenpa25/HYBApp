// ─── EditTransactionModal.tsx ─────────────────────────────
// Modal chỉnh sửa giao dịch — pre-filled, hỗ trợ amount/note/date/category
// ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

interface Props {
  transaction: any
  categories: any[]
  onConfirm: (id: string, amount: number, categoryId: string, note: string, date: string) => void
  onClose: () => void
  formatMoney: (v: number) => string
}

export default function EditTransactionModal({ transaction, categories, onConfirm, onClose, formatMoney }: Props) {
  const [amount, setAmount]     = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote]         = useState('')
  const [date, setDate]         = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount))
      setCategoryId(transaction.categoryId)
      setNote(transaction.note || '')
      setDate(transaction.date?.split('T')[0] || new Date().toISOString().split('T')[0])
    }
  }, [transaction])

  if (!transaction) return null

  const filteredCats = categories.filter(c => c.type === transaction.type)
  const cat = filteredCats.find(c => c.id === categoryId) || filteredCats[0]

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) return
    setSubmitting(true)
    await onConfirm(transaction.id, Number(amount), categoryId, note, date)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[150] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">

        {/* Header */}
        <div className={`p-5 text-white flex justify-between items-center ${transaction.type === 'Income' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-pink-600'}`}>
          <div>
            <p className="text-sm text-white/70 font-medium">Chỉnh sửa giao dịch</p>
            <p className="font-black text-lg mt-0.5">{transaction.type === 'Income' ? 'Thu nhập' : 'Chi tiêu'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số tiền</label>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)} autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-black text-xl dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Danh mục</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm font-semibold">
              {filteredCats.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ghi chú</label>
            <input
              type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ngày</label>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
            />
          </div>

          {/* Preview */}
          {cat && (
            <div className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold ${transaction.type === 'Income' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
              <span>{cat.icon} {cat.name}</span>
              <span>{transaction.type === 'Income' ? '+' : '-'}{formatMoney(Number(amount) || 0)}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
          <button onClick={handleSave} disabled={submitting || !amount || Number(amount) <= 0}
            className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <><Save size={16} /> Lưu thay đổi</>}
          </button>
        </div>
      </div>
    </div>
  )
}
