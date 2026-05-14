import { useState, useEffect } from 'react'
import { server } from '../utils/gas'
import { Target, Flame, Plus, CheckCircle2, Edit, Trash, Snowflake, X, Save } from 'lucide-react'

const ICONS = ['🔥','💪','📚','🏃','🧘','💊','🥗','💧','😴','✍️','🎯','🌱','🎵','🏊','🚴']
const COLORS = ['#f43f5e','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#06b6d4','#84cc16','#f97316','#6366f1']

export default function LifeOS() {
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])
  const [editingHabit, setEditingHabit] = useState<any>(null)
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [habitForm, setHabitForm] = useState({ title: '', icon: '🔥', color: '#f59e0b' })

  const today = new Date().toISOString().split('T')[0]

  const loadData = async () => {
    setLoading(true)
    const [g, h] = await Promise.all([server.getGoals(), server.getHabits()])
    setGoals(g); setHabits(h); setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    const tmp = { id: 'tmp-' + Date.now(), ...habitForm, streak: 0, lastCheckedDate: '', history: [] }
    setHabits(prev => [tmp, ...prev])
    setShowHabitForm(false); setHabitForm({ title: '', icon: '🔥', color: '#f59e0b' })
    await server.addHabit(tmp.title, tmp.icon, tmp.color)
    loadData()
  }

  const handleSaveEditHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...editingHabit } : h))
    setEditingHabit(null)
    await server.updateHabit(editingHabit.id, editingHabit.title, editingHabit.icon, editingHabit.color)
    loadData()
  }

  const handleDeleteHabit = async (id: string) => {
    if (!confirm('Xóa thói quen này?')) return
    setHabits(prev => prev.filter(h => h.id !== id))
    await server.deleteHabit(id)
  }

  const handleFreezeStreak = async (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, lastCheckedDate: today } : h))
    await server.freezeHabitStreak(id)
  }

  const handleCheckHabit = async (id: string, lastChecked: string) => {
    if (lastChecked === today) return
    setHabits(prev => prev.map(h => h.id === id ? { ...h, streak: Number(h.streak) + 1, lastCheckedDate: today } : h))
    await server.checkHabit(id, today)
    loadData()
  }

  const formatMoney = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px] relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
        </div>
      )}

      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h2 className="font-bold text-slate-800 dark:text-white">Sửa Thói Quen</h2>
              <button onClick={() => setEditingHabit(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEditHabit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tên</label>
                <input required value={editingHabit.title} onChange={e => setEditingHabit({ ...editingHabit, title: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(i => <button key={i} type="button" onClick={() => setEditingHabit({ ...editingHabit, icon: i })} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${editingHabit.icon === i ? 'bg-primary-100 dark:bg-primary-500/20 ring-2 ring-primary-500 scale-110' : 'bg-slate-100 dark:bg-slate-800'}`}>{i}</button>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Màu</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => <button key={c} type="button" onClick={() => setEditingHabit({ ...editingHabit, color: c })} className={`w-8 h-8 rounded-full transition-all ${editingHabit.color === c ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />)}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingHabit(null)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Save size={16} /> Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Habits Section */}
      <div className="glass-panel p-6 dark:bg-slate-800/80">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
            <Flame className="text-orange-500" /> Kỷ luật & Thói quen
          </h3>
          <button onClick={() => setShowHabitForm(!showHabitForm)} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-primary-500/20">
            <Plus size={16} /> Thêm
          </button>
        </div>

        {showHabitForm && (
          <form onSubmit={handleAddHabit} className="mb-5 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2">
            <input required autoFocus value={habitForm.title} onChange={e => setHabitForm({ ...habitForm, title: e.target.value })} placeholder="Tên thói quen..." className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Icon</p>
              <div className="flex flex-wrap gap-1.5">{ICONS.map(i => <button key={i} type="button" onClick={() => setHabitForm({ ...habitForm, icon: i })} className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${habitForm.icon === i ? 'bg-primary-100 dark:bg-primary-500/20 ring-2 ring-primary-500' : 'bg-white dark:bg-slate-800'}`}>{i}</button>)}</div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Màu</p>
              <div className="flex flex-wrap gap-1.5">{COLORS.map(c => <button key={c} type="button" onClick={() => setHabitForm({ ...habitForm, color: c })} className={`w-7 h-7 rounded-full transition-all hover:scale-110 ${habitForm.color === c ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : ''}`} style={{ backgroundColor: c }} />)}</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowHabitForm(false)} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm">Hủy</button>
              <button type="submit" className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/20">Tạo</button>
            </div>
          </form>
        )}

        {habits.length === 0 && !showHabitForm && (
          <div className="text-center py-10 text-slate-400">
            <Flame size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">Chưa có thói quen nào</p>
            <p className="text-sm mt-1">Bắt đầu xây dựng kỷ luật của bạn!</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {habits.map(h => {
            const isDone = h.lastCheckedDate === today
            const isFrozen = h.lastCheckedDate === today && h.history?.includes(today + '_frozen')
            return (
              <div key={h.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg dark:hover:shadow-black/30 transition-all hover:-translate-y-0.5 group flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleCheckHabit(h.id, h.lastCheckedDate)} disabled={isDone}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all text-xl ${isDone ? 'scale-100' : 'hover:scale-110'}`}
                      style={{ backgroundColor: isDone ? h.color + '20' : '#f1f5f9', color: isDone ? h.color : '#94a3b8' }}>
                      {isDone ? h.icon : <CheckCircle2 size={24} className="opacity-40" />}
                    </button>
                    <div>
                      <h4 className={`font-bold ${isDone ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>{h.title}</h4>
                      <p className="text-xs font-bold text-orange-500 flex items-center gap-1 mt-0.5">
                        <Flame size={12} /> {h.streak} ngày streak
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isDone && (
                      <button onClick={() => handleFreezeStreak(h.id)} title="Streak Freeze — bỏ qua hôm nay không mất streak"
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Snowflake size={15} />
                      </button>
                    )}
                    <button onClick={() => setEditingHabit({ ...h })} className="p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDeleteHabit(h.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                      <Trash size={15} />
                    </button>
                  </div>
                </div>

                {/* Streak Freeze indicator */}
                {isFrozen && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg">
                    <Snowflake size={13} /> Đã Freeze hôm nay — streak được bảo vệ!
                  </div>
                )}

                {/* Heatmap */}
                <div className="flex flex-wrap gap-1 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="w-full text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">60 ngày qua</p>
                  {[...Array(60)].map((_, i) => {
                    const d = new Date(); d.setDate(d.getDate() - (59 - i))
                    const ds = d.toISOString().split('T')[0]
                    const frozen = h.history?.includes(ds + '_frozen')
                    const checked = h.history?.includes(ds)
                    return (
                      <div key={i} title={ds}
                        className={`w-[12px] h-[12px] rounded-sm transition-all hover:scale-125 cursor-help ${frozen ? 'bg-blue-300 dark:bg-blue-500/60' : checked ? 'shadow-sm' : 'bg-slate-100 dark:bg-slate-800'}`}
                        style={{ backgroundColor: checked && !frozen ? h.color : undefined }}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Goals Preview */}
      <div className="glass-panel p-6 dark:bg-slate-800/80">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
            <Target className="text-primary-500" /> Mục tiêu & Tầm nhìn
          </h3>
        </div>
        <div className="space-y-3">
          {goals.map(g => {
            const pct = Math.min(100, Math.floor((g.savedAmount / g.targetAmount) * 100))
            const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000))
            const weeklyNeeded = daysLeft > 0 ? (g.targetAmount - g.savedAmount) / (daysLeft / 7) : 0
            return (
              <div key={g.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner" style={{ backgroundColor: g.color + '20' }}>{g.icon}</div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{g.name}</p>
                      <p className="text-xs text-slate-500">Hạn: {new Date(g.deadline).toLocaleDateString('vi-VN')} ({daysLeft} ngày)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm" style={{ color: g.color }}>{pct}%</p>
                    {weeklyNeeded > 0 && <p className="text-[10px] text-slate-400">~{formatMoney(weeklyNeeded)}/tuần</p>}
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-semibold">
                  <span>{formatMoney(g.savedAmount)} đã có</span>
                  <span>Còn {formatMoney(g.targetAmount - g.savedAmount)}</span>
                </div>
              </div>
            )
          })}
          {goals.length === 0 && <p className="text-sm text-slate-400 italic text-center py-6">Chưa có mục tiêu nào. Vào tab "Mục tiêu" để tạo!</p>}
        </div>
      </div>
    </div>
  )
}
