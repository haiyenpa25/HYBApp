import { useState, useEffect } from 'react'
import { server } from '../utils/gas'
import { Moon, Sun, X, Edit, Plus, Wallet, Tags, Archive, Target, Trash, Save } from 'lucide-react'

const ICONS = ['🍔', '🚗', '🛒', '💡', '💊', '🎓', '🎬', '🎁', '💰', '💸', '📈', '🏢', '🏠', '🐷', '📚', '🏖️', '❤️']
const COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444']

export default function Settings({ reloadData }: { reloadData: () => void }) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [funds, setFunds] = useState<any[]>([])

  // Modal States
  const [activeTab, setActiveTab] = useState<'wallets'|'categories'|'funds'|'gamification'>('wallets')
  const [editingItem, setEditingItem] = useState<any>(null) // null means closed, { id: 'new', ... } means add new, { id: 'w1', ... } means edit
  const [reconcilingWallet, setReconcilingWallet] = useState<any>(null) // null means closed, { id: 'w1', ... }
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(false)
  const [gamificationConfig, setGamificationConfig] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [w, c, _tc, f, reportStatus, gami] = await Promise.all([
        server.getWallets(),
        server.getCategories(),
        server.getTaskCategories().catch(() => []), // Ignore calendar errors if any
        server.getFunds(),
        server.getWeeklyReportStatus().catch(() => false),
        server.getGamificationConfig().catch(() => null)
      ])
      setWallets(w || [])
      setCategories(c || [])
      setFunds(f || [])
      setWeeklyReportEnabled(reportStatus || false)
      if (gami) setGamificationConfig(gami)
    } catch (error) {
      console.error("Error loading settings data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (activeTab === 'wallets') {
        if (editingItem.id === 'new') {
          await server.addWallet(editingItem.name, editingItem.type, Number(editingItem.balance))
        } else {
          await server.updateWallet(editingItem.id, editingItem.name, editingItem.type)
        }
      } else if (activeTab === 'categories') {
        if (editingItem.id === 'new') {
          await server.addCategory(editingItem.name, editingItem.type, editingItem.icon, editingItem.color, '')
        } else {
          await server.updateCategory(editingItem.id, editingItem.name, editingItem.type, editingItem.icon, editingItem.color, editingItem.parentId)
        }
      } else if (activeTab === 'funds') {
        if (editingItem.id === 'new') {
          await server.addFund(editingItem.name, Number(editingItem.defaultPercentage), editingItem.icon, editingItem.color)
        } else {
          await server.updateFund(editingItem.id, editingItem.name, Number(editingItem.defaultPercentage), Number(editingItem.balance), editingItem.icon, editingItem.color)
        }
      }
      setEditingItem(null)
      await loadData()
      reloadData()
    } catch(err) {
      alert("Có lỗi xảy ra khi lưu")
      setLoading(false)
    }
  }

  const handleReconcileWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await server.reconcileWallet(reconcilingWallet.id, Number(reconcilingWallet.actualBalance), reconcilingWallet.note || '')
      setReconcilingWallet(null)
      await loadData()
      reloadData()
    } catch(err) {
      alert("Có lỗi xảy ra khi kiểm kê")
      setLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mục này? (Lưu ý: Các giao dịch liên quan sẽ bị mồ côi)")) return
    setLoading(true)
    try {
      if (activeTab === 'wallets') await server.deleteWallet(id)
      else if (activeTab === 'categories') await server.deleteCategory(id)
      else if (activeTab === 'funds') await server.deleteFund(id)
      
      setEditingItem(null)
      await loadData()
      reloadData()
    } catch(err) {
      alert("Có lỗi xảy ra khi xóa")
      setLoading(false)
    }
  }

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }

  const formatMoney = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      )}

      {/* Global Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-6 flex justify-between items-center bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0">
          <h3 className="font-bold flex items-center gap-2">
            Giao diện Ứng dụng
          </h3>
          <button onClick={toggleDarkMode} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all">
            {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-200" />}
            <span className="font-medium text-sm">{isDark ? 'Chế độ Sáng' : 'Chế độ Tối'}</span>
          </button>
        </div>

        <div className="glass-panel p-6 flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Báo cáo Telegram
            </h3>
            <p className="text-xs text-slate-500 mt-1">Gửi lúc 20:00 Chủ Nhật</p>
          </div>
          <button 
            onClick={() => {
              const newVal = !weeklyReportEnabled;
              setWeeklyReportEnabled(newVal);
              server.toggleWeeklyReport(newVal).then(() => {
                alert(newVal ? "Đã BẬT báo cáo hàng tuần!" : "Đã TẮT báo cáo hàng tuần!");
              });
            }}
            className={`w-14 h-8 rounded-full transition-colors relative ${weeklyReportEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow-sm ${weeklyReportEnabled ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-x-auto whitespace-nowrap">
          <button onClick={() => setActiveTab('wallets')} className={`flex-1 py-4 px-4 flex flex-col items-center gap-2 font-bold transition-all ${activeTab === 'wallets' ? 'text-primary-500 border-b-2 border-primary-500 bg-white dark:bg-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            <Wallet size={20} /> Các Ví
          </button>
          <button onClick={() => setActiveTab('funds')} className={`flex-1 py-4 px-4 flex flex-col items-center gap-2 font-bold transition-all ${activeTab === 'funds' ? 'text-rose-500 border-b-2 border-rose-500 bg-white dark:bg-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            <Archive size={20} /> Các Quỹ (Jars)
          </button>
          <button onClick={() => setActiveTab('categories')} className={`flex-1 py-4 px-4 flex flex-col items-center gap-2 font-bold transition-all ${activeTab === 'categories' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-white dark:bg-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            <Tags size={20} /> Danh mục
          </button>
          <button onClick={() => setActiveTab('gamification')} className={`flex-1 py-4 px-4 flex flex-col items-center gap-2 font-bold transition-all ${activeTab === 'gamification' ? 'text-indigo-500 border-b-2 border-indigo-500 bg-white dark:bg-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            <Target size={20} /> Game hóa
          </button>
        </div>

        <div className="p-6">
          {activeTab !== 'gamification' && (
            <div className="flex justify-end mb-6">
              <button onClick={() => setEditingItem({ id: 'new', name: '', type: activeTab === 'wallets' ? 'Cash' : 'Expense', balance: 0, defaultPercentage: 0, icon: '🍔', color: '#f43f5e' })} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                <Plus size={18} /> Thêm Mới
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === 'wallets' && wallets.map(w => (
              <div key={w.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{w.name}</h4>
                  <p className="text-xs text-slate-500">{w.type}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="font-black text-slate-900 dark:text-white">{formatMoney(w.balance)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setReconcilingWallet({...w, actualBalance: w.balance, note: ''})} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">Kiểm kê</button>
                    <button onClick={() => setEditingItem({...w})} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Sửa</button>
                    <button onClick={() => handleDeleteItem(w.id)} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">Xóa</button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'funds' && funds.map(f => (
              <div key={f.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{backgroundColor: f.color + '20', color: f.color}}>{f.icon}</div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{f.name}</h4>
                    <p className="text-xs text-slate-500">Tỉ trọng: {f.defaultPercentage}%</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="font-black text-slate-900 dark:text-white">{formatMoney(f.balance)}</span>
                  <button onClick={() => setEditingItem({...f})} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary-500 transition-opacity"><Edit size={16} /></button>
                </div>
              </div>
            ))}

            {activeTab === 'categories' && categories.map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{backgroundColor: c.color + '20', color: c.color}}>{c.icon}</div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{c.name}</h4>
                    <p className="text-xs font-semibold uppercase" style={{color: c.type === 'Income' ? '#22c55e' : '#f43f5e'}}>{c.type === 'Income' ? 'Thu' : 'Chi'}</p>
                  </div>
                </div>
                <button onClick={() => setEditingItem({...c})} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary-500 transition-opacity"><Edit size={16} /></button>
              </div>
            ))}

            {activeTab === 'gamification' && gamificationConfig && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-6 max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-lg dark:text-white mb-4">Cài đặt Điểm Kinh Nghiệm (EXP)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">EXP để lên 1 Cấp (Mặc định: 100)</label>
                    <input type="number" value={gamificationConfig.expPerLevel} onChange={e => setGamificationConfig({...gamificationConfig, expPerLevel: parseInt(e.target.value) || 100})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">EXP nhận mỗi lần Check-in Habit (Mặc định: 20)</label>
                    <input type="number" value={gamificationConfig.expPerAction} onChange={e => setGamificationConfig({...gamificationConfig, expPerAction: parseInt(e.target.value) || 20})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white">Danh hiệu theo Cấp độ</h3>
                    <button onClick={() => {
                      const newTitles = [...(gamificationConfig.titles || []), { level: 1, name: 'Danh hiệu mới' }];
                      setGamificationConfig({...gamificationConfig, titles: newTitles.sort((a,b)=>a.level-b.level)});
                    }} className="text-sm font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1">
                      <Plus size={16} /> Thêm Danh hiệu
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {(gamificationConfig.titles || []).map((t: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="w-24">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Từ Level</label>
                          <input type="number" value={t.level} onChange={e => {
                            const newTitles = [...gamificationConfig.titles];
                            newTitles[idx].level = parseInt(e.target.value) || 1;
                            setGamificationConfig({...gamificationConfig, titles: newTitles.sort((a,b)=>a.level-b.level)});
                          }} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tên Danh hiệu</label>
                          <input type="text" value={t.name} onChange={e => {
                            const newTitles = [...gamificationConfig.titles];
                            newTitles[idx].name = e.target.value;
                            setGamificationConfig({...gamificationConfig, titles: newTitles});
                          }} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm" />
                        </div>
                        <button onClick={() => {
                          const newTitles = gamificationConfig.titles.filter((_:any, i:number) => i !== idx);
                          setGamificationConfig({...gamificationConfig, titles: newTitles});
                        }} className="mt-4 text-rose-400 hover:text-rose-600 p-2">
                          <Trash size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                  <button onClick={async () => {
                    setLoading(true);
                    await server.updateGamificationConfig(gamificationConfig);
                    setLoading(false);
                    alert("Đã lưu cấu hình Gamification thành công! F5 để áp dụng thay đổi.");
                  }} className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform flex items-center gap-2">
                    <Save size={18} /> Lưu Cấu Hình
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h2 className="text-xl font-bold dark:text-white">{editingItem.id === 'new' ? 'Thêm Mới' : 'Chỉnh Sửa'}</h2>
              <button onClick={() => setEditingItem(null)} className="hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-xl transition-colors dark:text-slate-400"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tên</label>
                <input required type="text" value={editingItem.name} onChange={e=>setEditingItem({...editingItem, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-primary-500 dark:text-white" />
              </div>

              {activeTab === 'wallets' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Loại Ví</label>
                    <select value={editingItem.type} onChange={e=>setEditingItem({...editingItem, type: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white">
                      <option value="Cash">Tiền mặt</option>
                      <option value="Bank">Ngân hàng</option>
                      <option value="E-Wallet">Ví điện tử</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'categories' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Loại danh mục</label>
                  <select value={editingItem.type} onChange={e=>setEditingItem({...editingItem, type: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white">
                    <option value="Expense">Khoản Chi</option>
                    <option value="Income">Khoản Thu</option>
                  </select>
                </div>
              )}

              {activeTab === 'funds' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tỉ trọng phân bổ mặc định (%)</label>
                    <input required type="number" min="0" max="100" value={editingItem.defaultPercentage} onChange={e=>setEditingItem({...editingItem, defaultPercentage: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
                  </div>
                  {editingItem.id !== 'new' && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số dư hiện tại</label>
                      <input required type="number" value={editingItem.balance} onChange={e=>setEditingItem({...editingItem, balance: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
                    </div>
                  )}
                </>
              )}

              {editingItem.id === 'new' && activeTab === 'wallets' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số dư ban đầu (Chỉ nhập 1 lần)</label>
                  <input required type="number" value={editingItem.balance} onChange={e=>setEditingItem({...editingItem, balance: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
                </div>
              )}

              {(activeTab === 'categories' || activeTab === 'funds') && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Biểu tượng (Icon)</label>
                    <div className="flex flex-wrap gap-2">
                      {ICONS.map(i => (
                        <button key={i} type="button" onClick={() => setEditingItem({...editingItem, icon: i})} className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${editingItem.icon === i ? 'bg-primary-100 dark:bg-primary-500/20 border-2 border-primary-500 scale-110' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>{i}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Màu sắc</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setEditingItem({...editingItem, color: c})} className={`w-8 h-8 rounded-full shadow-sm transition-all ${editingItem.color === c ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: c }}></button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl font-bold">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {reconcilingWallet && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-500/10">
              <h2 className="text-xl font-black text-emerald-600 dark:text-emerald-400">Kiểm kê số dư</h2>
              <p className="text-xs font-semibold text-emerald-600/80 mt-1">{reconcilingWallet.name}</p>
            </div>
            <form onSubmit={handleReconcileWallet} className="p-5 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Số dư ghi nhận hiện tại</p>
                <p className="text-lg font-black text-slate-800 dark:text-slate-200">{formatMoney(reconcilingWallet.balance)}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số dư thực tế</label>
                <input required type="number" value={reconcilingWallet.actualBalance} onChange={e=>setReconcilingWallet({...reconcilingWallet, actualBalance: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white font-black text-lg text-primary-500 focus:border-primary-500 transition-colors" />
              </div>
              
              {Number(reconcilingWallet.actualBalance) - reconcilingWallet.balance !== 0 && (
                <div className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-between ${Number(reconcilingWallet.actualBalance) > reconcilingWallet.balance ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'}`}>
                  <span>Chênh lệch:</span>
                  <span className="font-black">{formatMoney(Number(reconcilingWallet.actualBalance) - reconcilingWallet.balance)}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Lý do điều chỉnh (Tùy chọn)</label>
                <input type="text" value={reconcilingWallet.note} onChange={e=>setReconcilingWallet({...reconcilingWallet, note: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" placeholder="VD: Lãi nhập gốc, Sai sót nhập liệu..." />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setReconcilingWallet(null)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors">Cập nhật Số dư</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
