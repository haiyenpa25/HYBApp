// ─── QuickEntryForm.tsx ──────────────────────────────────
// Form ghi chép nhanh Thu / Chi
// Props: nhận data + handlers từ ExpenseManager
// ──────────────────────────────────────────────────────────


interface Props {
  // Data
  wallets: any[]
  categories: any[]
  funds: any[]
  // Form state
  amount: string
  note: string
  selectedWallet: string
  selectedCategory: string
  selectedFund: string
  transactionType: 'Expense' | 'Income'
  syncing: boolean
  entryDate: string
  // Setters
  setAmount: (v: string) => void
  setNote: (v: string) => void
  setEntryDate: (v: string) => void
  setSelectedWallet: (v: string) => void
  setSelectedCategory: (v: string) => void
  setSelectedFund: (v: string) => void
  setTransactionType: (v: 'Expense' | 'Income') => void
  setShowCategoryManager: (v: boolean) => void
  // Handler
  onSubmit: (e: React.FormEvent) => void
  formatMoney: (v: number) => string
}

export default function QuickEntryForm({
  wallets, categories, funds,
  amount, note, entryDate, selectedWallet, selectedCategory, selectedFund, transactionType, syncing,
  setAmount, setNote, setEntryDate, setSelectedWallet, setSelectedCategory, setSelectedFund,
  setTransactionType, setShowCategoryManager, onSubmit, formatMoney
}: Props) {
  return (
    <div className="glass-panel p-6 col-span-1 md:col-span-2 bg-white/60 dark:bg-slate-800/60 flex flex-col justify-center">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">Ghi chép nhanh</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCategoryManager(true)} className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors shadow-sm">
            ⚙️ Quản lý danh mục
          </button>
          <div className="flex bg-slate-200/50 dark:bg-slate-700/50 rounded-lg p-1">
            <button onClick={(e) => { e.preventDefault(); setTransactionType('Expense') }} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${transactionType === 'Expense' ? 'bg-white dark:bg-slate-800 shadow-sm text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>Chi tiêu</button>
            <button onClick={(e) => { e.preventDefault(); setTransactionType('Income') }} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${transactionType === 'Income' ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}>Thu nhập</button>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex gap-3 flex-wrap items-end">
        {/* Amount */}
        <div className="w-full md:w-auto flex-1 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Số tiền</label>
          <input required type="number" value={amount} onChange={e => setAmount(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-primary-500 font-bold outline-none transition-all ${transactionType === 'Expense' ? 'text-rose-500' : 'text-emerald-500'}`}
            placeholder="0 ₫" />
        </div>

        {/* Category */}
        <div className="w-full md:w-auto space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Danh mục</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-primary-500 font-medium outline-none cursor-pointer">
            {transactionType === 'Income' ? (
              categories.filter(c => c.type === 'Income').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)
            ) : (
              categories.filter(c => c.type === 'Expense' && !c.parentId).map(parent => (
                <optgroup key={parent.id} label={`${parent.icon} ${parent.name}`}>
                  <option value={parent.id}>{parent.icon} {parent.name} (Chung)</option>
                  {categories.filter(c => c.parentId === parent.id).map(sub => (
                    <option key={sub.id} value={sub.id}>-- {sub.icon} {sub.name}</option>
                  ))}
                </optgroup>
              ))
            )}
          </select>
        </div>

        {/* Wallet */}
        <div className="w-full md:w-48 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nguồn / Ví</label>
          <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-primary-500 font-medium outline-none cursor-pointer">
            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        {/* Fund (Expense only) */}
        {transactionType === 'Expense' && (
          <div className="w-full md:w-48 space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trừ vào Quỹ</label>
            <select value={selectedFund} onChange={e => setSelectedFund(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-primary-500 font-medium outline-none cursor-pointer">
              <option value="">-- Chọn Quỹ --</option>
              {funds.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name} ({formatMoney(f.balance)})</option>)}
            </select>
          </div>
        )}

        {/* Date + Note row */}
        <div className="w-full flex gap-3 mt-2">
          <div className="w-44 shrink-0 space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày</label>
            <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ghi chú</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-400"
              placeholder="Thêm ghi chú (không bắt buộc)..." />
          </div>
        </div>

        {/* Submit */}
        <div className="w-full mt-4">
          {syncing && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 justify-end">
              <span className="w-3 h-3 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin"></span>
              <span>Đang đồng bộ...</span>
            </div>
          )}
          <button type="submit" className="w-full btn-hover bg-slate-800 dark:bg-primary-600 hover:bg-slate-900 dark:hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
            Lưu giao dịch
          </button>
        </div>
      </form>
    </div>
  )
}
