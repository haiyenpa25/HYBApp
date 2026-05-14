// ─── DebtsView.tsx ───────────────────────────────────────
// Tab Công nợ: danh sách + modal thêm nợ + modal trả nợ
// ──────────────────────────────────────────────────────────
import { useState } from 'react'
import { CheckCircle2, Plus, X } from 'lucide-react'

interface Props {
  debts: any[]
  wallets: any[]
  isPrivacyMode: boolean
  onAddDebt: (person: string, type: 'BORROW' | 'LEND', amount: number, interest: number, dueDate: string) => void
  onPayDebt: (debtId: string, amount: number, walletId: string, date: string, note: string) => void
  formatMoney: (v: number) => string
}

export default function DebtsView({ debts, wallets, isPrivacyMode, onAddDebt, onPayDebt, formatMoney }: Props) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [payingDebt, setPayingDebt] = useState<any>(null)

  // Add form state
  const [person, setPerson] = useState('')
  const [type, setType] = useState<'BORROW' | 'LEND'>('BORROW')
  const [amount, setAmount] = useState('')
  const [interest, setInterest] = useState('0')
  const [dueDate, setDueDate] = useState('')

  // Pay form state
  const [payAmount, setPayAmount] = useState('')
  const [payWallet, setPayWallet] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payNote, setPayNote] = useState('')

  const handleAdd = () => {
    if (!person || !amount) return
    onAddDebt(person, type, Number(amount), Number(interest), dueDate)
    setPerson(''); setAmount(''); setInterest('0'); setDueDate('')
    setShowAddModal(false)
  }

  const handlePay = () => {
    if (!payingDebt || !payAmount || !payWallet) return
    onPayDebt(payingDebt.id, Number(payAmount), payWallet, payDate, payNote)
    setPayingDebt(null); setPayAmount(''); setPayNote('')
  }

  return (
    <>
      <div className="p-2 space-y-4">
        {debts.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-3xl mb-2">🤝</p>
            <p className="text-sm font-medium">Chưa có khoản nợ nào</p>
          </div>
        )}
        {debts.map(debt => {
          const typeText = debt.type === 'BORROW' ? 'Tôi đi vay' : 'Cho mượn'
          const typeColor = debt.type === 'BORROW' ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
          return (
            <div key={debt.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-50 dark:border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-slate-800 dark:text-white mb-1">{debt.personName}</div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${typeColor}`}>{typeText}</span>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg text-slate-800 dark:text-white">{isPrivacyMode ? '***' : formatMoney(debt.principalAmount)}</div>
                  <div className="text-xs text-slate-500">Đã trả: {isPrivacyMode ? '***' : formatMoney(debt.paidAmount)}</div>
                </div>
              </div>
              {debt.interestRate > 0 && <div className="text-xs text-slate-500 mt-2">Lãi suất: {debt.interestRate}%</div>}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                {debt.status !== 'PAID' ? (
                  <button onClick={() => { setPayingDebt(debt); setPayWallet(wallets[0]?.id || ''); setPayAmount(String(Number(debt.principalAmount) * (1 + Number(debt.interestRate) / 100) - Number(debt.paidAmount))); setPayNote('') }}
                    className="px-4 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold text-xs rounded-lg hover:bg-primary-100">
                    Ghi nhận Thanh toán
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 font-bold text-xs rounded-lg flex items-center gap-1">
                    <CheckCircle2 size={14} /> Đã tất toán
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <button onClick={() => setShowAddModal(true)}
          className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <Plus size={18} /> Thêm khoản nợ mới
        </button>
      </div>

      {/* Add Debt Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h2 className="text-xl font-bold">Quản lý Công nợ</h2>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <button onClick={() => setType('BORROW')} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${type === 'BORROW' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow' : 'text-slate-500'}`}>Tôi đi vay</button>
                <button onClick={() => setType('LEND')} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${type === 'LEND' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow' : 'text-slate-500'}`}>Cho mượn</button>
              </div>
              <input type="text" value={person} onChange={e => setPerson(e.target.value)} placeholder="Tên người mượn / người cho vay" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
              <div className="flex gap-3">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Số tiền" className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold dark:text-white" />
                <input type="number" value={interest} onChange={e => setInterest(e.target.value)} placeholder="Lãi %" className="w-24 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-center dark:text-white" />
              </div>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-500 dark:text-slate-400" />
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold">Hủy</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600">Lưu lại</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {payingDebt && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-primary-50 dark:bg-primary-500/10">
              <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">Ghi nhận Thanh toán</h2>
              <p className="text-xs font-semibold text-primary-600/80 mt-1">{payingDebt.personName}</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500">Cần thanh toán:</span>
                <span className="font-black text-slate-800 dark:text-slate-200">{formatMoney(Number(payingDebt.principalAmount) * (1 + Number(payingDebt.interestRate) / 100) - Number(payingDebt.paidAmount))}</span>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số tiền</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Từ Ví</label>
                <select value={payWallet} onChange={e => setPayWallet(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-semibold dark:text-white">
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatMoney(w.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ngày</label>
                <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ghi chú</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="VD: Chuyển khoản Vietcombank" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button onClick={() => setPayingDebt(null)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
              <button onClick={handlePay} className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600">Thanh toán</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
