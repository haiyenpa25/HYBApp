import { useState } from 'react'

interface Props {
  categories: any[]
  transactions: any[]
  budgets: any[]
  currentMonth: string
  isPrivacyMode: boolean
  onSetBudget: (categoryId: string, amount: number) => void
  formatMoney: (v: number) => string
}

export default function BudgetsView({ categories, transactions, budgets, currentMonth, isPrivacyMode, onSetBudget, formatMoney }: Props) {
  const [editCat, setEditCat] = useState<any>(null)
  const [editValue, setEditValue] = useState('')

  return (
    <>
      <div className="p-2 space-y-4">
        {categories.filter(c => c.type === 'Expense').map(cat => {
          const budget = budgets.find(b => b.categoryId === cat.id)
          const spent = transactions
            .filter(t => t.categoryId === cat.id && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + Number(t.amount), 0)
          const limit = budget ? Number(budget.amount) : 0
          const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
          const isOver = spent > limit && limit > 0

          return (
            <div key={cat.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-50 dark:border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  <span>{cat.icon}</span> {cat.name}
                </div>
                <div className="text-sm font-bold">
                  <span className={isOver ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}>
                    {isPrivacyMode ? '***' : formatMoney(spent)}
                  </span>
                  <span className="text-slate-400 mx-1">/</span>
                  {limit > 0 ? (
                    <span className="text-primary-600 dark:text-primary-400 cursor-pointer hover:underline"
                      onClick={() => { setEditCat(cat); setEditValue(limit.toString()) }}>
                      {isPrivacyMode ? '***' : formatMoney(limit)}
                    </span>
                  ) : (
                    <button onClick={() => { setEditCat(cat); setEditValue('1000000') }}
                      className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-2 py-1 rounded text-slate-500 dark:text-slate-300">
                      Đặt ngân sách
                    </button>
                  )}
                </div>
              </div>
              {limit > 0 && (
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : percent > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    style={{ width: `${percent}%` }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Budget Edit Modal */}
      {editCat && (
        <div className="fixed inset-0 bg-slate-900/70 z-[150] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl max-w-sm w-[90%] border border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-white mb-1">Thiết lập ngân sách</h3>
            <p className="text-sm text-slate-500 mb-4">
              Danh mục: <span className="font-bold text-slate-700 dark:text-slate-200">{editCat.icon} {editCat.name}</span>
            </p>
            <input autoFocus type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
              placeholder="VD: 2000000"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-lg mb-4 dark:text-white" />
            <div className="flex gap-3">
              <button onClick={() => setEditCat(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
              <button onClick={() => {
                if (editValue) onSetBudget(editCat.id, Number(editValue))
                setEditCat(null)
              }} className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
