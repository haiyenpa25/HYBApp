import { useState, useEffect } from 'react'
import { server } from '../utils/gas'
import { Plus, Edit, Trash, Target, Wallet, TrendingUp, Zap } from 'lucide-react'

const ICONS = ['🎯', '🚗', '🏠', '💻', '📱', '🏖️', '💍', '🎓', '🏥', '✈️']
const COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444']

export default function GoalsManager() {
  const [goals, setGoals] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [_syncing, setSyncing] = useState(false) // background sync indicator

  // Modals
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [depositGoal, setDepositGoal] = useState<any>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [sourceWalletId, setSourceWalletId] = useState('')

  const loadData = async (isInitial = false) => {
    if (isInitial) setLoading(true)
    else setSyncing(true)
    const [g, w] = await Promise.all([server.getGoals(), server.getWallets()])
    setGoals(g)
    setWallets(w)
    if (isInitial && w.length > 0) setSourceWalletId(w[0].id)
    if (isInitial) setLoading(false)
    else setSyncing(false)
  }

  useEffect(() => {
    loadData(true)
  }, [])

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    // Optimistic update
    if (editingGoal.id === 'new') {
      const tmp = { ...editingGoal, id: 'tmp-' + Date.now(), savedAmount: 0 }
      setGoals(prev => [tmp, ...prev])
    } else {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...editingGoal } : g))
    }
    setEditingGoal(null)
    // Background sync
    if (editingGoal.id === 'new') {
      await server.addGoal(editingGoal.name, editingGoal.targetAmount, editingGoal.deadline, editingGoal.icon, editingGoal.color)
    } else {
      await server.updateGoal(editingGoal.id, editingGoal.name, editingGoal.targetAmount, editingGoal.deadline, editingGoal.icon, editingGoal.color)
    }
    loadData(false)
  }

  const handleDeleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    await server.deleteGoal(id)
    loadData(false)
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(depositAmount)
    if (amount <= 0 || !sourceWalletId) return
    // Optimistic update
    setGoals(prev => prev.map(g =>
      g.id === depositGoal.id ? { ...g, savedAmount: Number(g.savedAmount) + amount } : g
    ))
    setDepositGoal(null)
    setDepositAmount('')
    // Background sync
    setSyncing(true)
    await server.addMoneyToGoal(depositGoal.id, amount, sourceWalletId)
    loadData(false)
  }

  const formatMoney = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Target className="text-primary-500" />
            Mục Tiêu Tích Lũy
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý và theo dõi tiến độ các mục tiêu lớn của bạn.</p>
        </div>
        
        <button 
          onClick={() => setEditingGoal({ id: 'new', name: '', targetAmount: 1000000, deadline: new Date().toISOString().split('T')[0], icon: '🎯', color: '#f43f5e' })} 
          className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1"
        >
          <Plus size={20} /> Thêm Mục Tiêu
        </button>
      </div>

      {loading && goals.length === 0 ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(g => {
            const percent = Math.min(100, Math.floor((g.savedAmount / g.targetAmount) * 100))
            const isCompleted = percent >= 100
            
            return (
              <div key={g.id} className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group ${isCompleted ? 'ring-2 ring-emerald-500 shadow-emerald-500/20' : ''}`}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" style={{ backgroundColor: g.color }}></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner" style={{ backgroundColor: g.color + '20', color: g.color }}>
                      {g.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{g.name}</h3>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        Hạn chót: {new Date(g.deadline).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingGoal({...g})} className="p-1.5 text-slate-400 hover:text-primary-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteGoal(g.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Trash size={16} /></button>
                  </div>
                </div>

                <div className="mt-6 relative z-10">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã tích lũy</p>
                      <p className="text-xl font-black" style={{ color: g.color }}>{formatMoney(g.savedAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mục tiêu</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatMoney(g.targetAmount)}</p>
                    </div>
                  </div>

                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${percent}%`, backgroundColor: g.color }}>
                      {percent >= 10 && (
                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: g.color + '15', color: g.color }}>{percent}%</span>
                    <span className="text-xs font-medium text-slate-500">Còn lại: {formatMoney(g.targetAmount - g.savedAmount)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 relative z-10">
                  <button 
                    onClick={() => setDepositGoal(g)}
                    disabled={isCompleted}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {isCompleted ? <><Target size={18} /> Đã Hoàn Thành</> : <><TrendingUp size={18} /> Nạp Tiền</>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h2 className="text-xl font-black dark:text-white flex items-center gap-2">
                <Target className="text-primary-500" />
                {editingGoal.id === 'new' ? 'Thêm Mục Tiêu' : 'Sửa Mục Tiêu'}
              </h2>
              <button onClick={() => setEditingGoal(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <Plus size={24} className="rotate-45 dark:text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tên mục tiêu</label>
                <input required type="text" value={editingGoal.name} onChange={e=>setEditingGoal({...editingGoal, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500 transition-shadow" placeholder="VD: Mua iPhone 16" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số tiền cần thiết (VNĐ)</label>
                <input required type="number" min="0" value={editingGoal.targetAmount} onChange={e=>setEditingGoal({...editingGoal, targetAmount: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500 transition-shadow" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Hạn chót</label>
                <input required type="date" value={editingGoal.deadline} onChange={e=>setEditingGoal({...editingGoal, deadline: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500 transition-shadow" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Biểu tượng (Icon)</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(i => (
                    <button key={i} type="button" onClick={()=>setEditingGoal({...editingGoal, icon: i})} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-transform hover:scale-110 ${editingGoal.icon === i ? 'bg-primary-100 dark:bg-primary-900/30 scale-110 ring-2 ring-primary-500' : 'bg-slate-50 dark:bg-slate-800 opacity-50'}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Màu sắc</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={()=>setEditingGoal({...editingGoal, color: c})} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${editingGoal.color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-primary-500' : ''}`} style={{backgroundColor: c}} />
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/50 disabled:opacity-50">
                  {loading ? 'Đang xử lý...' : 'Lưu Mục Tiêu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositGoal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h2 className="text-xl font-black dark:text-white flex items-center gap-2">
                <TrendingUp className="text-emerald-500" />
                Nạp Tiền Mục Tiêu
              </h2>
              <button onClick={() => setDepositGoal(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <Plus size={24} className="rotate-45 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner" style={{ backgroundColor: depositGoal.color + '20', color: depositGoal.color }}>
                  {depositGoal.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg dark:text-white">{depositGoal.name}</h3>
                  <p className="text-sm font-semibold text-slate-500">Đã tích lũy: <span style={{color: depositGoal.color}}>{formatMoney(depositGoal.savedAmount)}</span> / {formatMoney(depositGoal.targetAmount)}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleDeposit} className="p-6 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                <Zap className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Hệ thống sẽ tự động trừ số tiền này khỏi Ví gốc bằng 1 giao dịch "Chi tiêu" để đảm bảo số dư ví chính xác!</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số tiền nạp (VNĐ)</label>
                <input required type="number" min="0" max={depositGoal.targetAmount - depositGoal.savedAmount} value={depositAmount} onChange={e=>setDepositAmount(e.target.value)} className="w-full px-4 py-3 text-lg font-black rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-emerald-500 transition-shadow" placeholder="VD: 500000" />
                <p className="text-[10px] text-slate-400 mt-1 text-right">Tối đa có thể nạp: {formatMoney(depositGoal.targetAmount - depositGoal.savedAmount)}</p>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Trích tiền từ Ví</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Wallet size={16} className="text-slate-400" />
                  </div>
                  <select required value={sourceWalletId} onChange={e=>setSourceWalletId(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none transition-shadow font-semibold">
                    <option value="" disabled>-- Chọn ví --</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({formatMoney(w.balance)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 disabled:opacity-50">
                  {loading ? 'Đang xử lý...' : 'Xác Nhận Nạp Tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
