import { useState, useEffect } from 'react'
import { server } from '../utils/gas'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart3, Zap, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

export default function AnalyticsDashboard({ isPrivacyMode }: { isPrivacyMode: boolean }) {
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7))

  const loadData = async () => {
    setLoading(true)
    const [t, c] = await Promise.all([
      server.getTransactions(),
      server.getCategories()
    ])
    setTransactions(t)
    setCategories(c)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatMoney = (val: number) => {
    if (isPrivacyMode) return '***,*** ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }



  // Current month data
  const monthlyTx = transactions.filter(t => t.date.startsWith(currentMonth))
  const totalIncome = monthlyTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpense = monthlyTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const netFlow = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0

  // Previous month data
  const prevDate = new Date(currentMonth + '-01')
  prevDate.setMonth(prevDate.getMonth() - 1)
  const prevMonth = prevDate.toISOString().substring(0, 7)
  const prevTx = transactions.filter(t => t.date.startsWith(prevMonth))
  const prevIncome = prevTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0)
  const prevExpense = prevTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0)

  const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0
  const expenseChange = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0

  // Expense by category for Pie
  const expenseByCategory = monthlyTx
    .filter(t => t.type === 'Expense')
    .reduce((acc: any, t) => {
      const cat = categories.find(c => c.id === t.categoryId)
      const catName = cat ? cat.name : 'Khác'
      const color = cat ? cat.color : '#cbd5e1'
      if (!acc[catName]) acc[catName] = { name: catName, value: 0, color }
      acc[catName].value += Number(t.amount)
      return acc
    }, {})
  const pieData = Object.values(expenseByCategory).sort((a: any, b: any) => b.value - a.value)

  // Top 5 largest expense transactions
  const top5Expenses = [...monthlyTx]
    .filter(t => t.type === 'Expense')
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5)
    .map(t => ({
      ...t,
      cat: categories.find(c => c.id === t.categoryId)
    }))

  // Daily bar chart
  const daysInMonth = new Date(Number(currentMonth.split('-')[0]), Number(currentMonth.split('-')[1]), 0).getDate()
  const barData = []
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = `${currentMonth}-${i.toString().padStart(2, '0')}`
    const dayTx = monthlyTx.filter(t => t.date === dayStr)
    const inc = dayTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0)
    const exp = dayTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0)
    if (inc > 0 || exp > 0) {
      barData.push({ date: `${i}/${currentMonth.split('-')[1]}`, 'Thu nhập': inc, 'Chi tiêu': exp })
    }
  }

  const savingsRadialData = [{ name: 'Tỉ lệ tiết kiệm', value: savingsRate, fill: savingsRate >= 20 ? '#10b981' : savingsRate >= 10 ? '#f59e0b' : '#f43f5e' }]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      )}

      {/* Header & Month Selector */}
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
            <PieChartIcon size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Báo Cáo Phân Tích</h2>
            <p className="text-blue-100 font-medium text-sm">Toàn cảnh Dòng tiền & Chi tiêu</p>
          </div>
        </div>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white outline-none font-bold backdrop-blur-md transition-colors cursor-pointer"
        />
      </div>

      {/* Summary Cards with Month-over-Month comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-500/20 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={64} className="text-emerald-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tổng Thu Nhập</h3>
          <p className="text-2xl font-black text-emerald-500">{formatMoney(totalIncome)}</p>
          {prevIncome > 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${incomeChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {incomeChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(incomeChange).toFixed(1)}% so với tháng trước
            </div>
          )}
        </div>
        <div className="glass-panel p-5 bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-500/20 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingDown size={64} className="text-rose-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tổng Chi Tiêu</h3>
          <p className="text-2xl font-black text-rose-500">{formatMoney(totalExpense)}</p>
          {prevExpense > 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${expenseChange <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {expenseChange > 0 ? <ArrowUpRight size={14} /> : expenseChange < 0 ? <ArrowDownRight size={14} /> : <Minus size={14} />}
              {Math.abs(expenseChange).toFixed(1)}% so với tháng trước {expenseChange > 0 ? '(nhiều hơn)' : expenseChange < 0 ? '(ít hơn)' : ''}
            </div>
          )}
        </div>
        <div className="glass-panel p-5 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-500/20 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <BarChart3 size={64} className="text-blue-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Dòng Tiền Thuần (Net Flow)</h3>
          <p className={`text-2xl font-black ${netFlow >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
            {netFlow > 0 ? '+' : ''}{formatMoney(netFlow)}
          </p>
        </div>
      </div>

      {/* Savings Rate + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Savings Rate Radial */}
        <div className="glass-panel p-6 bg-white dark:bg-slate-800 shadow-sm flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-2 w-full">
            <Zap size={20} className="text-amber-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Tỉ Lệ Tiết Kiệm</h3>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={14} data={savingsRadialData} startAngle={180} endAngle={0}>
                <RadialBar background dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-8">
            <p className={`text-4xl font-black ${savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 10 ? 'text-amber-500' : 'text-rose-500'}`}>{savingsRate}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              {savingsRate >= 20 ? '🎉 Tuyệt vời! Đang tích lũy tốt' : savingsRate >= 10 ? '👍 Khá ổn, cố gắng tiết kiệm hơn' : '⚠️ Cần cắt giảm chi tiêu'}
            </p>
          </div>
          <div className="mt-4 text-center text-xs text-slate-400">Mục tiêu lý tưởng: ≥ 20%</div>
        </div>

        {/* Pie Chart */}
        <div className="glass-panel p-6 bg-white dark:bg-slate-800 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-primary-500" /> Cấu trúc Chi Tiêu
          </h3>
          {pieData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatMoney(Number(value))} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 font-medium border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
              Chưa có dữ liệu chi tiêu trong tháng này
            </div>
          )}
        </div>
      </div>

      {/* Top 5 + Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Expenses */}
        <div className="glass-panel p-6 bg-white dark:bg-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingDown size={20} className="text-rose-500" /> Top 5 Chi Tiêu Lớn Nhất
          </h3>
          {top5Expenses.length > 0 ? (
            <div className="space-y-3">
              {top5Expenses.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
                    i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-orange-400' : i === 2 ? 'bg-amber-400' : 'bg-slate-300'
                  }`}>#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{t.note || t.cat?.name || 'Giao dịch'}</p>
                    <p className="text-xs text-slate-400">{t.date} · {t.cat?.icon} {t.cat?.name}</p>
                  </div>
                  <span className="font-black text-rose-500 text-sm whitespace-nowrap">{formatMoney(Number(t.amount))}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Bar Chart: Cash Flow Trend */}
        <div className="glass-panel p-6 bg-white dark:bg-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary-500" /> Biểu đồ Dòng Tiền (Theo Ngày)
          </h3>
          {barData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `${value / 1000000}M`} width={50} />
                  <RechartsTooltip formatter={(value: any) => formatMoney(Number(value))} cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Chi tiêu" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-400 font-medium border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
              Chưa có dữ liệu dòng tiền trong tháng này
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
