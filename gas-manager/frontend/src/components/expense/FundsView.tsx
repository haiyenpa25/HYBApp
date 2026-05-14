// ─── FundsView.tsx ───────────────────────────────────────
// Tab Quỹ (Jars) + Modal phân bổ + Target amount + Deposit
// ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { X, Target, PlusCircle } from 'lucide-react'
import { server } from '../../utils/gas'

interface Props {
  funds: any[]
  wallets: any[]
  isPrivacyMode: boolean
  onDistribute: (allocation: Record<string, number>) => void
  onRefresh: () => void
  formatMoney: (v: number) => string
}

export default function FundsView({ funds, wallets, isPrivacyMode, onDistribute, onRefresh, formatMoney }: Props) {
  const [showModal, setShowModal]   = useState(false)
  const [allocation, setAllocation] = useState<Record<string, number>>({})
  const [targetFund, setTargetFund] = useState<any>(null)
  const [targetVal, setTargetVal]   = useState('')
  const [depositFund, setDepositFund] = useState<any>(null)
  const [depositAmt, setDepositAmt] = useState('')
  const [depositWallet, setDepositWallet] = useState('')
  const [depositNote, setDepositNote]   = useState('')
  const [depositDate, setDepositDate]   = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const chungFund    = funds.find(f => f.id === 'f_chung')
  const chungBalance = Number(chungFund?.balance || 0)
  const otherFunds   = funds.filter(f => f.id !== 'f_chung')

  useEffect(() => {
    if (!showModal || otherFunds.length === 0) return
    const init: Record<string, number> = {}
    let remaining = chungBalance
    otherFunds.forEach((f, idx) => {
      if (idx === otherFunds.length - 1) {
        init[f.id] = remaining
      } else {
        const val = Math.floor(chungBalance * (Number(f.defaultPercentage) / 100))
        init[f.id] = val
        remaining -= val
      }
    })
    setAllocation(init)
  }, [showModal])

  const totalAllocated = Object.values(allocation).reduce((a, b) => a + b, 0)
  const remaining = chungBalance - totalAllocated
  const canConfirm = remaining === 0

  const handleSetTarget = async () => {
    if (!targetFund || !targetVal) return
    setSaving(true)
    await server.setFundTarget(targetFund.id, Number(targetVal))
    setSaving(false)
    setTargetFund(null)
    onRefresh()
  }

  const handleDeposit = async () => {
    if (!depositFund || !depositAmt || !depositWallet) return
    setSaving(true)
    await server.depositToFund(depositFund.id, Number(depositAmt), depositWallet, depositNote, depositDate)
    setSaving(false)
    setDepositFund(null)
    setDepositAmt('')
    onRefresh()
  }

  return (
    <>
      <div className="p-2 space-y-3">
        {/* Quỹ Chung — special card */}
        {chungFund && (
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-sm text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-xl">{chungFund.icon}</div>
                <div>
                  <p className="font-bold">{chungFund.name}</p>
                  <p className="text-xs text-white/70">Phân bổ tỉ trọng: tự động</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black">{isPrivacyMode ? '***' : formatMoney(chungBalance)}</p>
                {chungBalance > 0 && (
                  <button onClick={() => setShowModal(true)}
                    className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded font-bold mt-1 uppercase tracking-wider">
                    Phân bổ ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other Funds */}
        {otherFunds.map(fund => {
          const target  = Number(fund.targetAmount) || 0
          const balance = Number(fund.balance) || 0
          const pct     = target > 0 ? Math.min(100, (balance / target) * 100) : 0
          const isGoalMet = target > 0 && balance >= target
          return (
            <div key={fund.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-50 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-inner"
                    style={{ backgroundColor: `${fund.color}20`, color: fund.color }}>{fund.icon}</div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{fund.name}</p>
                    <p className="text-xs text-slate-400 font-normal">Tỉ trọng: {fund.defaultPercentage}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-800 dark:text-white">
                    {isPrivacyMode ? '***' : formatMoney(balance)}
                  </p>
                  {target > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">/ {isPrivacyMode ? '***' : formatMoney(target)}</p>
                  )}
                </div>
              </div>

              {/* Target progress bar */}
              {target > 0 && (
                <div className="mt-3">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isGoalMet ? 'bg-emerald-500' : pct > 70 ? 'bg-blue-500' : 'bg-indigo-400'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{pct.toFixed(0)}% mục tiêu</span>
                    {isGoalMet
                      ? <span className="text-emerald-500 font-bold">✅ Đạt mục tiêu!</span>
                      : <span>Còn {isPrivacyMode ? '***' : formatMoney(target - balance)}</span>}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setTargetFund(fund); setTargetVal(String(target || '')) }}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg font-semibold transition-colors">
                  <Target size={12} /> {target > 0 ? 'Sửa mục tiêu' : 'Đặt mục tiêu'}
                </button>
                <button onClick={() => { setDepositFund(fund); setDepositWallet(wallets[0]?.id || '') }}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg font-semibold transition-colors">
                  <PlusCircle size={12} /> Nạp tiền
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Distribution Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-500 text-white">
              <h2 className="text-xl font-bold">Phân bổ dòng tiền từ Quỹ Chung</h2>
              <button onClick={() => setShowModal(false)} className="hover:bg-emerald-600 p-1.5 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl text-center">
                <p className="text-sm text-emerald-600 font-bold uppercase mb-1">Số dư Quỹ Chung</p>
                <p className="text-3xl font-black text-emerald-500">{formatMoney(chungBalance)}</p>
              </div>
              <div className="space-y-4">
                {otherFunds.map(fund => (
                  <div key={fund.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        {fund.icon} {fund.name}
                        <span className="text-xs text-slate-400 font-normal">({fund.defaultPercentage}%)</span>
                      </label>
                      <div className="relative w-32">
                        <input type="number" value={allocation[fund.id] || 0}
                          onChange={e => setAllocation(prev => ({ ...prev, [fund.id]: Number(e.target.value) }))}
                          className="w-full pl-2 pr-6 py-1.5 text-right font-bold text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                        <span className="absolute right-2 top-2 text-xs text-slate-400">đ</span>
                      </div>
                    </div>
                    <input type="range" min="0" max={chungBalance || 100}
                      value={allocation[fund.id] || 0}
                      onChange={e => setAllocation(prev => ({ ...prev, [fund.id]: Number(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center gap-4">
              <div className="text-sm">
                <span className="text-slate-500">Còn lại: </span>
                <span className={`font-bold ${remaining !== 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatMoney(remaining)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold">Hủy</button>
                <button onClick={() => { onDistribute(allocation); setShowModal(false) }}
                  disabled={!canConfirm}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50">
                  Xác nhận Phân bổ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Target Modal */}
      {targetFund && (
        <div className="fixed inset-0 bg-slate-900/80 z-[150] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl max-w-sm w-[90%] border border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <Target size={18} className="text-indigo-500" /> Đặt mục tiêu cho quỹ
            </h3>
            <p className="text-sm text-slate-500 mb-4">{targetFund.icon} {targetFund.name}</p>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Mục tiêu (₫)</label>
            <input autoFocus type="number" value={targetVal} onChange={e => setTargetVal(e.target.value)}
              placeholder="VD: 60000000"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-lg mb-4 dark:text-white" />
            <div className="flex gap-3">
              <button onClick={() => setTargetFund(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl font-bold">Hủy</button>
              <button onClick={handleSetTarget} disabled={saving || !targetVal}
                className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 disabled:opacity-50">
                {saving ? '...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositFund && (
        <div className="fixed inset-0 bg-slate-900/80 z-[150] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl max-w-sm w-[90%] border border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <PlusCircle size={18} className="text-emerald-500" /> Nạp tiền vào quỹ
            </h3>
            <p className="text-sm text-slate-500 mb-4">{depositFund.icon} {depositFund.name}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số tiền</label>
                <input autoFocus type="number" value={depositAmt} onChange={e => setDepositAmt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-lg dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Từ Ví</label>
                <select value={depositWallet} onChange={e => setDepositWallet(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm">
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatMoney(w.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ghi chú</label>
                <input type="text" value={depositNote} onChange={e => setDepositNote(e.target.value)}
                  placeholder="VD: Tiết kiệm tháng 5" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ngày</label>
                <input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDepositFund(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl font-bold">Hủy</button>
              <button onClick={handleDeposit} disabled={saving || !depositAmt || !depositWallet}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50">
                {saving ? '...' : 'Nạp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
