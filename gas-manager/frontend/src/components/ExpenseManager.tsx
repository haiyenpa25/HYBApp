// ─── ExpenseManager.tsx ──────────────────────────────────
// ORCHESTRATOR — chỉ quản lý state + gọi handler
// Mọi UI đã được tách sang components/expense/
// ──────────────────────────────────────────────────────────
import { useState, useEffect, useContext } from 'react'
import { server } from '../utils/gas'
import { PrivacyContext } from '../App'
import { ArrowLeftRight, X } from 'lucide-react'
// Sub-components
import QuickEntryForm from './expense/QuickEntryForm'
import TransactionList from './expense/TransactionList'
import FundsView from './expense/FundsView'
import DebtsView from './expense/DebtsView'
import BudgetsView from './expense/BudgetsView'
import CategoryManager from './expense/CategoryManager'
import RecurringView from './expense/RecurringView'
import MonthlyBudgetWidget from './expense/MonthlyBudgetWidget'
import EditTransactionModal from './expense/EditTransactionModal'
import RecurringReminderWidget from './expense/RecurringReminderWidget'

type ViewMode = 'transactions' | 'funds' | 'debts' | 'budgets' | 'recurring'

export default function ExpenseManager() {
  const [wallets, setWallets] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [funds, setFunds] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('transactions')
  const [budgetAlert, setBudgetAlert] = useState<{ message: string; type: 'warn' | 'over' } | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null)
  const [editingTx, setEditingTx]       = useState<any>(null)
  const [recurringBadge, setRecurringBadge] = useState(0)  // pending overdue templates

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferFrom, setTransferFrom] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])

  // Quick entry form state
  const [amount, setAmount]           = useState('')
  const [note, setNote]               = useState('')
  const [entryDate, setEntryDate]     = useState(new Date().toISOString().split('T')[0])
  const [selectedWallet, setSelectedWallet]       = useState('')
  const [selectedCategory, setSelectedCategory]   = useState('')
  const [selectedFund, setSelectedFund]           = useState('')
  const [transactionType, setTransactionType]     = useState<'Expense' | 'Income'>('Expense')

  // Filter state
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7))
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const currentMonth = new Date().toISOString().substring(0, 7)
  const isPrivacyMode = useContext(PrivacyContext)

  // ─── Load Data ─────────────────────────────────────────
  const loadData = async (isInitial = false) => {
    if (isInitial) setLoading(true); else setSyncing(true)
    const [w, c, t, b, f, d] = await Promise.all([
      server.getWallets(), server.getCategories(), server.getTransactions(),
      server.getBudgets(currentMonth), server.getFunds(), server.getDebts()
    ])
    setWallets(w); setCategories(c); setTransactions([...t].reverse())
    setBudgets(b); setFunds(f); setDebts(d)
    if (isInitial) {
      if (w.length > 0) setSelectedWallet(w[0].id)
      if (c.length > 0) setSelectedCategory(c[0].id)
      setLoading(false)
    } else { setSyncing(false) }
  }

  useEffect(() => { loadData(true) }, [])

  // Auto-switch category when type changes
  useEffect(() => {
    const valid = categories.filter(c => c.type === transactionType)
    if (valid.length > 0 && !valid.find(c => c.id === selectedCategory)) {
      setSelectedCategory(valid[0].id)
    }
  }, [transactionType, categories])

  // ─── Handlers ──────────────────────────────────────────
  const formatMoney = (val: number) => {
    if (isPrivacyMode) return '***,*** ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    const cat = categories.find(c => c.id === selectedCategory)
    if (!cat) return
    const today = entryDate || new Date().toISOString().split('T')[0]
    if (transactionType === 'Expense') {
      const fund = funds.find(f => f.id === selectedFund)
      if (!fund) { alert('Vui lòng chọn Quỹ để chi tiêu.'); return }
      if (fund.balance < Number(amount)) {
        if (!confirm(`Quỹ "${fund.name}" không đủ. Tiếp tục ghi nhận?`)) return
      }
    }
    const amtSave = Number(amount), walletSave = selectedWallet
    const catSave = selectedCategory, typeSave = cat.type
    const noteSave = note, fundSave = typeSave === 'Income' && !selectedFund ? 'f_chung' : selectedFund
    const tempId = 'temp-' + Date.now()
    setTransactions(prev => [{ id: tempId, walletId: walletSave, categoryId: catSave, amount: amtSave, type: typeSave, date: today, note: noteSave, fundId: fundSave }, ...prev])
    setWallets(prev => prev.map(w => w.id === walletSave ? { ...w, balance: Number(w.balance) + (typeSave === 'Income' ? amtSave : -amtSave) } : w))
    if (typeSave === 'Expense') setFunds(prev => prev.map(f => f.id === fundSave ? { ...f, balance: Number(f.balance) - amtSave } : f))
    setAmount(''); setNote('')
    server.addTransaction(walletSave, catSave, amtSave, typeSave, today, noteSave, fundSave).then(() => {
      loadData(false)
      if (typeSave === 'Expense') {
        const catBudget = budgets.find(b => b.categoryId === catSave)
        if (catBudget) {
          const spent = transactions.filter(t => t.categoryId === catSave && t.date.startsWith(currentMonth) && t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0) + amtSave
          const pct = spent / Number(catBudget.amount)
          if (pct >= 1) { setBudgetAlert({ message: `⚠️ Vượt ngân sách! "${cat.name}" dùng ${Math.round(pct * 100)}%`, type: 'over' }); setTimeout(() => setBudgetAlert(null), 5000) }
          else if (pct >= 0.8) { setBudgetAlert({ message: `🔔 Cảnh báo! "${cat.name}" dùng ${Math.round(pct * 100)}%`, type: 'warn' }); setTimeout(() => setBudgetAlert(null), 4000) }
        }
      }
    }).catch(() => { setTransactions(prev => prev.filter(t => t.id !== tempId)); loadData(false) })
  }

  const handleEditTx = async (id: string, amount: number, categoryId: string, note: string, date: string) => {
    // Optimistic update
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, amount, categoryId, note, date } : t))
    await server.updateTransaction(id, amount, categoryId, note, date)
    loadData(false)
  }

  const handleDeleteTx = (id: string) => {
    setDeletingTxId(null)
    const tx = transactions.find(t => t.id === id)
    if (!tx) return
    setTransactions(prev => prev.filter(t => t.id !== id))
    setWallets(prev => prev.map(w => w.id === tx.walletId ? { ...w, balance: Number(w.balance) + (tx.type === 'Expense' ? tx.amount : -tx.amount) } : w))
    server.deleteTransaction(id).then(() => loadData(false)).catch(() => loadData(false))
  }

  const handleTransfer = () => {
    if (!transferFrom || !transferTo || !transferAmount || transferFrom === transferTo) return
    const amt = Number(transferAmount)
    setShowTransferModal(false)
    setWallets(prev => prev.map(w => w.id === transferFrom ? { ...w, balance: Number(w.balance) - amt } : w.id === transferTo ? { ...w, balance: Number(w.balance) + amt } : w))
    server.transferBetweenWallets(transferFrom, transferTo, amt, transferNote, transferDate).then(() => { setTransferAmount(''); setTransferNote(''); loadData(false) }).catch(() => loadData(false))
  }

  const handleDistribute = (allocation: Record<string, number>) => {
    setFunds(prev => prev.map(f => f.id === 'f_chung' ? { ...f, balance: 0 } : { ...f, balance: Number(f.balance) + (allocation[f.id] || 0) }))
    Promise.all([server.updateFundBalance('f_chung', 0), ...Object.entries(allocation).map(([fId, fAmt]) => {
      const f = funds.find(x => x.id === fId)
      return f && fAmt > 0 ? server.updateFundBalance(fId, Number(f.balance) + fAmt) : Promise.resolve(true)
    })]).then(() => loadData(false))
  }

  const handleAddDebt = (person: string, type: 'BORROW' | 'LEND', amount: number, interest: number, dueDate: string) => {
    const today = new Date().toISOString().split('T')[0]
    const tempId = 'temp-debt-' + Date.now()
    setDebts(prev => [{ id: tempId, personName: person, type, principalAmount: amount, interestRate: interest, paidAmount: 0, date: today, dueDate, status: 'PENDING' }, ...prev])
    setWallets(prev => prev.map(w => w.id === selectedWallet ? { ...w, balance: Number(w.balance) + (type === 'BORROW' ? amount : -amount) } : w))
    server.addDebt(person, type, amount, interest, today, dueDate).then(() => loadData(false))
  }

  const handlePayDebt = (debtId: string, amount: number, walletId: string, date: string, note: string) => {
    server.payDebt(debtId, amount, walletId, date, note).then(() => loadData(false)).catch(err => { console.error(err); loadData(false) })
  }

  const handleSetBudget = (categoryId: string, amount: number) => {
    server.setBudget(categoryId, amount, currentMonth).then(() => loadData(false))
  }

  const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0)
  const TABS: { key: ViewMode; label: string; badge?: number }[] = [
    { key: 'transactions', label: 'Giao dịch' },
    { key: 'funds', label: 'Các Quỹ (Jars)' },
    { key: 'debts', label: 'Công nợ' },
    { key: 'budgets', label: 'Ngân sách' },
    { key: 'recurring', label: 'Định kỳ', badge: recurringBadge },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-[400px]">

      {/* Monthly Budget Widget */}
      <MonthlyBudgetWidget formatMoney={formatMoney} onRefreshExpenses={() => loadData(false)} />

      {/* Recurring Reminder Widget */}
      <RecurringReminderWidget
        formatMoney={formatMoney}
        onApplied={() => loadData(false)}
        onNavigateToTab={() => setViewMode('recurring')}
      />

      {/* Budget Alert */}
      {budgetAlert && (
        <div className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm animate-in slide-in-from-right-5 max-w-sm ${budgetAlert.type === 'over' ? 'bg-rose-500' : 'bg-amber-500'}`}>
          <span>{budgetAlert.message}</span>
          <button onClick={() => setBudgetAlert(null)} className="ml-auto p-1 hover:bg-white/20 rounded-lg"><X size={16} /></button>
        </div>
      )}

      {/* Confirm Delete */}
      {deletingTxId && (
        <div className="fixed inset-0 bg-slate-900/70 z-[150] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl max-w-sm w-[90%] border border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-white mb-1">Xóa giao dịch?</h3>
            <p className="text-xs text-slate-500 mb-4">Hành động này sẽ hoàn lại số dư ví tương ứng.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingTxId(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl font-bold">Hủy</button>
              <button onClick={() => handleDeleteTx(deletingTxId)} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <h2 className="text-xl font-black flex items-center gap-2"><ArrowLeftRight size={20} /> Chuyển Tiền Nội Bộ</h2>
              <button onClick={() => setShowTransferModal(false)} className="hover:bg-white/20 p-1.5 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[{ label: 'Từ Ví', val: transferFrom, set: setTransferFrom, opts: wallets }, { label: 'Đến Ví', val: transferTo, set: setTransferTo, opts: wallets.filter(w => w.id !== transferFrom) }].map(({ label, val, set, opts }) => (
                <div key={label}>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{label}</label>
                  <select value={val} onChange={e => set(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-semibold dark:text-white">
                    <option value="">-- Chọn ví --</option>
                    {opts.map(w => <option key={w.id} value={w.id}>{w.name} ({formatMoney(w.balance)})</option>)}
                  </select>
                </div>
              ))}
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số tiền</label><input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0 ₫" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-xl dark:text-white" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ghi chú</label><input type="text" value={transferNote} onChange={e => setTransferNote(e.target.value)} placeholder="VD: Rút ATM" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ngày</label><input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" /></div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button onClick={() => setShowTransferModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
              <button onClick={handleTransfer} disabled={!transferFrom || !transferTo || !transferAmount || transferFrom === transferTo} className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 disabled:opacity-50">Chuyển</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager */}
      {showCategoryManager && <CategoryManager categories={categories} onClose={() => setShowCategoryManager(false)} onRefresh={() => loadData(false)} />}

      {/* Top Row: Net Worth + Quick Entry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <h3 className="text-white/80 font-bold text-sm uppercase tracking-wider">Tổng tài sản</h3>
          {loading && wallets.length === 0 ? <div className="h-10 bg-white/20 rounded-lg animate-pulse w-3/4 mt-2" /> : <p className="text-3xl font-black mt-2 tracking-tight">{formatMoney(totalBalance)}</p>}
          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
            <p className="text-sm text-white/90">{wallets.length} Ví đang hoạt động</p>
            <button onClick={() => { setTransferFrom(wallets[0]?.id || ''); setTransferTo(''); setShowTransferModal(true) }}
              className="flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg">
              <ArrowLeftRight size={14} /> Chuyển tiền
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <QuickEntryForm wallets={wallets} categories={categories} funds={funds}
            amount={amount} note={note} entryDate={entryDate} selectedWallet={selectedWallet} selectedCategory={selectedCategory}
            selectedFund={selectedFund} transactionType={transactionType} syncing={syncing}
            setAmount={setAmount} setNote={setNote} setEntryDate={setEntryDate} setSelectedWallet={setSelectedWallet}
            setSelectedCategory={setSelectedCategory} setSelectedFund={setSelectedFund}
            setTransactionType={setTransactionType} setShowCategoryManager={setShowCategoryManager}
            onSubmit={handleSubmit} formatMoney={formatMoney} />
        </div>
      </div>

      {/* Tab Panel */}
      <div className="bg-white/40 dark:bg-slate-800/40 p-1 rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm">
        <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-t-xl border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 shadow-sm overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setViewMode(tab.key)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-md text-sm font-bold transition-all relative ${viewMode === tab.key ? 'bg-primary-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
                {tab.label}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          {viewMode === 'transactions' && <span className="text-xs font-medium bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm text-slate-500">{transactions.length} giao dịch</span>}
        </div>

        {viewMode === 'transactions' && (
          <TransactionList transactions={transactions} categories={categories} wallets={wallets}
            loading={loading} filterMonth={filterMonth} filterCategoryId={filterCategoryId}
            searchQuery={searchQuery} isPrivacyMode={isPrivacyMode}
            setFilterMonth={setFilterMonth} setFilterCategoryId={setFilterCategoryId}
            setSearchQuery={setSearchQuery} onDeleteRequest={setDeletingTxId}
            onEditRequest={setEditingTx} formatMoney={formatMoney} />
        )}
        {viewMode === 'funds' && (
          <FundsView funds={funds} wallets={wallets} isPrivacyMode={isPrivacyMode}
            onDistribute={handleDistribute} onRefresh={() => loadData(false)} formatMoney={formatMoney} />
        )}
        {viewMode === 'debts' && (
          <DebtsView debts={debts} wallets={wallets} isPrivacyMode={isPrivacyMode}
            onAddDebt={handleAddDebt} onPayDebt={handlePayDebt} formatMoney={formatMoney} />
        )}
        {viewMode === 'budgets' && (
          <BudgetsView categories={categories} transactions={transactions} budgets={budgets}
            currentMonth={currentMonth} isPrivacyMode={isPrivacyMode} onSetBudget={handleSetBudget} formatMoney={formatMoney} />
        )}
        {viewMode === 'recurring' && (
          <RecurringView
            categories={categories}
            wallets={wallets}
            funds={funds}
            formatMoney={formatMoney}
            onTransactionAdded={() => loadData(false)}
            onBadgeCount={setRecurringBadge}
          />
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          categories={categories}
          onConfirm={handleEditTx}
          onClose={() => setEditingTx(null)}
          formatMoney={formatMoney}
        />
      )}
    </div>
  )
}
