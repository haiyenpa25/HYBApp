import { useState, useEffect, useContext } from 'react'
import { server } from '../utils/gas'
import { BarChart, Bar, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { PrivacyContext } from '../App'
import { Activity, Zap, Target, TrendingUp, Flame, AlertCircle } from 'lucide-react'

export default function Dashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const isPrivacyMode = useContext(PrivacyContext)

  useEffect(() => {
    async function loadData() {
      try {
        // Try unified API first (1 call instead of 6)
        const summary = await server.getDashboardSummary()
        if (summary) {
          setTransactions(summary.transactions || [])
          setCategories(summary.categories || [])
          setTasks(summary.tasks || [])
          setHabits(summary.habits || [])
          setUserStats(summary.userStats || null)
          setGoals(summary.goals || [])
          setWallets(summary.wallets || [])
        } else {
          // Fallback for local dev
          const [t, c, ts, hs, us, gs, ws] = await Promise.all([
            server.getTransactions(), server.getCategories(), server.getTasks(),
            server.getHabits(), server.getUserStats(), server.getGoals(), server.getWallets()
          ])
          setTransactions(t); setCategories(c); setTasks(ts)
          setHabits(hs); setUserStats(us); setGoals(gs); setWallets(ws)
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    loadData()
  }, [])

  const fmt = (v: number) => isPrivacyMode ? '***,*** ₫' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
  const todayStr = new Date().toISOString().split('T')[0]
  const currentMonth = new Date().toISOString().substring(0, 7)

  // --- Financial Calculations ---
  const monthlyTx = transactions.filter(t => t.date?.startsWith(currentMonth))
  const totalIncome = monthlyTx.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = monthlyTx.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0)
  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0)
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0

  // PocketGuard: safe to spend today
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const dayOfMonth = new Date().getDate()
  const daysLeft = daysInMonth - dayOfMonth + 1
  const safeToSpend = Math.max(0, (totalIncome - totalExpense)) / daysLeft

  // Financial Health Score (Neontra-style 0–100)
  const scoreFactors = [
    savingsRate >= 20 ? 30 : savingsRate >= 10 ? 20 : savingsRate > 0 ? 10 : 0,
    habits.filter(h => h.lastCheckedDate === todayStr).length > 0 ? 20 : 0,
    tasks.filter(t => t.date === todayStr && t.status === 'DONE').length > 0 ? 20 : 0,
    goals.length > 0 ? 15 : 0,
    totalBalance > 0 ? 15 : 0,
  ]
  const healthScore = scoreFactors.reduce((a, b) => a + b, 0)
  const healthColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#f43f5e'
  const healthLabel = healthScore >= 70 ? 'Xuất sắc' : healthScore >= 40 ? 'Ổn' : 'Cần cải thiện'

  // Today's focus
  const todayTasks = tasks.filter(t => t.date === todayStr && t.status !== 'DONE')
  const pendingHabits = habits.filter(h => h.lastCheckedDate !== todayStr)
  const urgentAlerts = goals.filter(g => new Date(g.deadline) <= new Date(Date.now() + 7 * 86400000) && g.savedAmount < g.targetAmount)

  // Charts
  const expensesByCategory = monthlyTx.filter(t => t.type === 'Expense').reduce((acc: any, t) => {
    const cat = categories.find(c => c.id === t.categoryId)
    const name = cat?.name || 'Khác'; const color = cat?.color || '#cbd5e1'
    if (!acc[name]) acc[name] = { name, value: 0, color }
    acc[name].value += Number(t.amount); return acc
  }, {})
  const pieData = Object.values(expensesByCategory)
  const barData = [
    { name: 'Thu', amount: totalIncome, fill: '#10b981' },
    { name: 'Chi', amount: totalExpense, fill: '#f43f5e' },
    { name: 'Tiết kiệm', amount: Math.max(0, totalIncome - totalExpense), fill: '#6366f1' }
  ]

  const recentTx = [...monthlyTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '☀️ Chào buổi sáng' : hour < 18 ? '🌤️ Chào buổi chiều' : '🌙 Buổi tối'

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/60" />)}
    </div>
  )

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Greeting + Health Score */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">{greeting}, Boss!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl px-5 py-3 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg text-white shadow-lg" style={{ backgroundColor: healthColor }}>
            {healthScore}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Financial Health</p>
            <p className="font-black text-slate-800 dark:text-white" style={{ color: healthColor }}>{healthLabel}</p>
          </div>
        </div>
      </div>

      {/* DAILY BRIEFING — PocketGuard + Neontra style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Safe to Spend */}
        <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-500/25 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <p className="text-indigo-200 font-bold text-xs uppercase tracking-wider">💎 Có thể chi hôm nay</p>
          <p className="text-4xl font-black mt-1 tracking-tight">{fmt(safeToSpend)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-indigo-200">Thu tháng</p>
              <p className="font-bold text-emerald-300">{fmt(totalIncome)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-indigo-200">Chi tháng</p>
              <p className="font-bold text-rose-300">{fmt(totalExpense)}</p>
            </div>
          </div>
        </div>

        {/* Net Worth */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">🏦 Tổng tài sản</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">{fmt(totalBalance)}</p>
          <p className="text-xs font-semibold text-emerald-500 mt-1 flex items-center gap-1">
            <TrendingUp size={12} /> {wallets.length} ví
          </p>
        </div>

        {/* Savings Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">📈 Tỉ lệ tiết kiệm</p>
          <p className="text-2xl font-black mt-2" style={{ color: savingsRate >= 20 ? '#10b981' : savingsRate >= 10 ? '#f59e0b' : '#f43f5e' }}>
            {savingsRate}%
          </p>
          <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, savingsRate)}%`, backgroundColor: savingsRate >= 20 ? '#10b981' : '#f59e0b' }} />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(urgentAlerts.length > 0 || pendingHabits.length > 0) && (
        <div className="flex gap-3 flex-wrap">
          {urgentAlerts.map(g => (
            <div key={g.id} className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl px-4 py-2 text-sm font-semibold">
              <AlertCircle size={16} /> Mục tiêu "{g.name}" sắp hết hạn!
            </div>
          ))}
          {pendingHabits.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => onNavigate?.('lifeos')}>
              <Flame size={16} /> {pendingHabits.length} thói quen chờ check-in hôm nay
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-5">

          {/* Bar Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-primary-500" /> Dòng tiền tháng {currentMonth}
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <Tooltip formatter={(v) => fmt(v as number)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={44}>
                    {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie + Recent Transactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm">🍕 Cơ cấu chi tiêu</h3>
              <div className="h-44">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip formatter={(v) => fmt(v as number)} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={4}>
                        {pieData.map((e: any, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-slate-300 text-4xl">📭</div>}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm flex items-center gap-2">
                <Zap size={14} className="text-amber-500" /> Giao dịch gần đây
              </h3>
              <div className="space-y-2.5">
                {recentTx.length > 0 ? recentTx.map(t => {
                  const cat = categories.find(c => c.id === t.categoryId)
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: (cat?.color || '#cbd5e1') + '20' }}>
                          {cat?.icon || (t.type === 'Income' ? '💰' : '💸')}
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{t.note || cat?.name || 'Giao dịch'}</p>
                      </div>
                      <span className={`text-xs font-black shrink-0 ${t.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.type === 'Income' ? '+' : '-'}{fmt(t.amount)}
                      </span>
                    </div>
                  )
                }) : <p className="text-xs text-slate-400 italic">Chưa có giao dịch tháng này</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">

          {/* Gamification */}
          {userStats && (
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-xl -mr-6 -mt-6" />
              <p className="text-orange-100 text-xs font-bold uppercase tracking-wider">⚔️ Cấp độ</p>
              <div className="flex items-end gap-3 mt-1 mb-3">
                <span className="text-5xl font-black">{userStats.level}</span>
                <div>
                  <p className="font-bold">{userStats.title}</p>
                  <p className="text-xs text-orange-100">{userStats.exp} EXP</p>
                </div>
              </div>
              <div className="h-2 bg-orange-900/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-700" style={{ width: `${userStats.currentLevelExpPercent ?? 0}%` }} />
              </div>
              <p className="text-right text-[10px] text-orange-100 mt-1">{userStats.currentLevelExp} / {userStats.expPerLevel}</p>
            </div>
          )}

          {/* Today Focus */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl -mr-8 -mt-8" />
            <h3 className="font-black text-lg mb-4 flex items-center gap-2">🔥 Tiêu Điểm</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Tasks hôm nay ({todayTasks.length})</p>
                <div className="space-y-1.5">
                  {todayTasks.length > 0 ? todayTasks.slice(0, 3).map(t => (
                    <div key={t.id} className="bg-white/8 hover:bg-white/15 rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${t.priority === 'P1' ? 'bg-rose-500' : t.priority === 'P2' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <span className="truncate">{t.title}</span>
                    </div>
                  )) : <p className="text-sm text-slate-500 italic">✨ Rảnh rang hôm nay!</p>}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Habits ({habits.filter(h => h.lastCheckedDate === todayStr).length}/{habits.length})</p>
                <div className="flex flex-wrap gap-2">
                  {habits.map(h => {
                    const done = h.lastCheckedDate === todayStr
                    return (
                      <div key={h.id} className={`flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs font-semibold transition-all ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/8 text-slate-400'}`}>
                        <span>{h.icon}</span> {done ? '✓' : '○'}
                      </div>
                    )
                  })}
                  {habits.length === 0 && <p className="text-sm text-slate-500 italic">Chưa có habit</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Top Goal */}
          {goals.length > 0 && (() => {
            const g = goals.find(g => g.savedAmount < g.targetAmount) || goals[0]
            const pct = Math.min(100, Math.floor((g.savedAmount / g.targetAmount) * 100))
            return (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700" style={{ borderLeft: `4px solid ${g.color}` }}>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Target size={12} /> Mục tiêu ưu tiên</p>
                <p className="font-bold text-slate-800 dark:text-white">{g.icon} {g.name}</p>
                <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                </div>
                <div className="flex justify-between mt-1.5 text-xs font-semibold text-slate-500">
                  <span>{fmt(g.savedAmount)}</span>
                  <span style={{ color: g.color }}>{pct}%</span>
                  <span>{fmt(g.targetAmount)}</span>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
