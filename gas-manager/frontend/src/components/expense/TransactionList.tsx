// ─── TransactionList.tsx ─────────────────────────────────
// Danh sách giao dịch + search/filter bar + edit/delete
// ──────────────────────────────────────────────────────────
import { Search, Filter, Trash2, Pencil } from 'lucide-react'

interface Props {
  transactions: any[]
  categories: any[]
  wallets: any[]
  loading: boolean
  filterMonth: string
  filterCategoryId: string
  searchQuery: string
  isPrivacyMode: boolean
  setFilterMonth: (v: string) => void
  setFilterCategoryId: (v: string) => void
  setSearchQuery: (v: string) => void
  onDeleteRequest: (id: string) => void
  onEditRequest: (tx: any) => void
  formatMoney: (v: number) => string
}

export default function TransactionList({
  transactions, categories, wallets, loading,
  filterMonth, filterCategoryId, searchQuery, isPrivacyMode,
  setFilterMonth, setFilterCategoryId, setSearchQuery,
  onDeleteRequest, onEditRequest, formatMoney
}: Props) {
  const filtered = transactions.filter(t => {
    const matchMonth  = filterMonth ? t.date.startsWith(filterMonth) : true
    const matchCat    = filterCategoryId ? t.categoryId === filterCategoryId : true
    const matchSearch = searchQuery ? (t.note || '').toLowerCase().includes(searchQuery.toLowerCase()) : true
    return matchMonth && matchCat && matchSearch
  })

  return (
    <>
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap p-4 bg-white/60 dark:bg-slate-800/60 rounded-t-xl border-b border-slate-100 dark:border-slate-700">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo ghi chú..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" />
        </div>
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2">
          <Filter size={14} className="text-slate-400" />
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="py-2 text-sm outline-none bg-transparent dark:text-white" />
        </div>
        <select value={filterCategoryId} onChange={e => setFilterCategoryId(e.target.value)}
          className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm outline-none dark:text-white">
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <span className="text-xs font-medium bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm text-slate-500 dark:text-slate-400">
          {filtered.length} / {transactions.length}
        </span>
      </div>

      {/* List */}
      <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
        {loading && transactions.length === 0 ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-50 dark:border-slate-700 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-32" />
                </div>
              </div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm font-medium">Không có giao dịch nào</p>
          </div>
        ) : (
          filtered.map(t => {
            const cat = categories.find(c => c.id === t.categoryId)
            const wallet = wallets.find(w => w.id === t.walletId)
            const isExpense  = t.type === 'Expense'
            const isTransfer = t.type === 'Transfer'
            const isTemp     = t.id.startsWith('temp-')
            return (
              <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-50 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0"
                    style={{ backgroundColor: isTransfer ? '#e0f2fe' : (cat?.color || '#ccc') + '15', color: isTransfer ? '#0284c7' : cat?.color }}>
                    {isTransfer ? '🔄' : cat?.icon || '💰'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{t.note || (isTransfer ? 'Chuyển tiền nội bộ' : 'Giao dịch')}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                      <span>{t.date}</span>
                      {wallet && <><span>•</span><span>{wallet.name}</span></>}
                      {cat && !isTransfer && <><span>•</span><span>{cat.icon} {cat.name}</span></>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <div className={`text-lg font-bold ${isExpense || isTransfer ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isExpense || isTransfer ? '-' : '+'}{isPrivacyMode ? '***,*** ₫' : formatMoney(t.amount)}
                  </div>
                  {!isTemp && !isTransfer && (
                    <>
                      <button onClick={() => onEditRequest(t)}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => onDeleteRequest(t.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
