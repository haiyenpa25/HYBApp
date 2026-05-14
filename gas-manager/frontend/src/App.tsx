import React, { useState, useEffect } from 'react'
import { server } from './utils/gas'
import ExpenseManager from './components/ExpenseManager'
import KanbanBoard from './components/KanbanBoard'
import Settings from './components/Settings'
import Dashboard from './components/Dashboard'
import LifeOS from './components/LifeOS'
import Vault from './components/Vault'
import Spotlight from './components/Spotlight'
import WealthDashboard from './components/WealthDashboard'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import GoalsManager from './components/GoalsManager'
import { LayoutDashboard, Wallet, CheckSquare, Target, BookHeart, Settings as SettingsIcon, EyeOff, Eye, Search, Plus, Moon, Sun, TrendingUp, PieChart } from 'lucide-react'

export const PrivacyContext = React.createContext(false)

export default function App() {
  const [currentUser, setCurrentUser] = useState<{email: string, name: string} | null>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'expenses' | 'analytics' | 'wealth' | 'lifeos' | 'vault' | 'settings' | 'goals'>('dashboard')
  const [tasks, setTasks] = useState<any[]>([])
  const [taskCategories, setTaskCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isPrivacyMode, setIsPrivacyMode] = useState(false)
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  // Form states
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDate, setTaskDate] = useState('')
  const [taskCalendarId, setTaskCalendarId] = useState('default')
  const [taskPriority, setTaskPriority] = useState('P3')

  const loadData = async () => {
    setLoading(true)
    try {
      if (!currentUser) {
        const [user, stats] = await Promise.all([
          server.getCurrentUser(),
          server.getUserStats()
        ])
        setCurrentUser(user)
        setUserStats(stats)
      } else {
        const stats = await server.getUserStats()
        setUserStats(stats)
      }

      if (activeTab === 'tasks') {
        const [data, categories] = await Promise.all([
          server.getTasks(),
          server.getTaskCategories()
        ])
        setTasks(data)
        setTaskCategories(categories)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSpotlightOpen(true)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Optimistic UI Update
    const tempId = 'temp-' + Date.now()
    const newTask = {
      id: tempId,
      title: taskTitle,
      status: 'TODO',
      date: taskDate,
      calendarId: taskCalendarId,
      priority: taskPriority,
      subtasks: [],
      noteId: null
    }
    
    setTasks(prev => [newTask, ...prev])
    
    // Reset form immediately
    const titleToSave = taskTitle
    const dateToSave = taskDate
    const calendarToSave = taskCalendarId
    const priorityToSave = taskPriority
    
    setTaskTitle('')
    setTaskDate('')
    setTaskPriority('P3')
    
    // Background sync
    server.addTask(titleToSave, dateToSave, calendarToSave, priorityToSave).then(() => {
      // Background refetch to ensure correct Google Sheet Row IDs
      server.getTasks().then(setTasks)
    }).catch(err => {
      console.error(err)
      // Revert if error
      setTasks(prev => prev.filter(t => t.id !== tempId))
    })
  }

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { id: 'expenses', label: 'Chi tiêu', icon: <Wallet size={20} /> },
    { id: 'analytics', label: 'Báo cáo', icon: <PieChart size={20} /> },
    { id: 'wealth', label: 'Tài sản', icon: <TrendingUp size={20} /> },
    { id: 'tasks', label: 'Công việc', icon: <CheckSquare size={20} /> },
    { id: 'lifeos', label: 'Life OS', icon: <Target size={20} /> },
    { id: 'goals', label: 'Mục tiêu', icon: <Target size={20} /> },
    { id: 'vault', label: 'Sổ tay', icon: <BookHeart size={20} /> },
    { id: 'settings', label: 'Cài đặt', icon: <SettingsIcon size={20} /> },
  ]

  return (
    <PrivacyContext.Provider value={isPrivacyMode}>
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-300 md:flex">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl h-screen sticky top-0 p-4 shrink-0">
        <div className="flex items-center gap-3 px-2 py-4 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/30 text-white font-black">
            G
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">GAS Manager</h1>
        </div>

        {/* Gamification Card */}
        {userStats && (
          <div className="mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <Target size={48} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Level {userStats.level}</div>
                  <div className="font-black text-sm">{userStats.title}</div>
                </div>
                <div className="text-xs font-bold text-indigo-100">{userStats.exp} EXP</div>
              </div>
              
              <div className="h-2 bg-indigo-900/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full" 
                  style={{ width: `${userStats.currentLevelExpPercent ?? 0}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-right mt-1 text-indigo-200 font-medium">{userStats.currentLevelExp} / {userStats.expPerLevel} EXP</div>
            </div>
          </div>
        )}

        <button onClick={() => setIsSpotlightOpen(true)} className="flex items-center gap-2 w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors mb-6 group">
          <Search size={16} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
          <span className="flex-1 text-left">Tìm kiếm...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">⌘K</kbd>
        </button>

        <nav className="flex-1 space-y-1.5">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id 
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          {currentUser && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center font-bold shadow-inner relative">
                {currentUser.name.charAt(0).toUpperCase()}
                {userStats && (
                  <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-black px-1 rounded-full border border-white dark:border-slate-800">
                    L{userStats.level}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate dark:text-white">{currentUser.name}</p>
                {userStats && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userStats.title}</p>}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="flex-1 flex justify-center p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors" title="Chế độ riêng tư">
              {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex-1 flex justify-center p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors" title="Đổi giao diện">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative max-w-5xl mx-auto w-full md:p-8 pb-24 md:pb-8">
        
        {/* Mobile Header */}
        <div className="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-sm text-white font-black text-sm">G</div>
            <h1 className="text-lg font-black tracking-tight dark:text-white">{navItems.find(i => i.id === activeTab)?.label}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setIsSpotlightOpen(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Search size={20} />
            </button>
            <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent shadow-lg"></div>
          </div>
        )}

        <div className="p-4 md:p-0 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' ? (
            <Dashboard onNavigate={(tab) => setActiveTab(tab as any)} />
          ) : activeTab === 'tasks' ? (
            <div className="space-y-6">
              <div className="glass-panel p-5 dark:bg-slate-800/60 dark:border-slate-700/50">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Tạo công việc nhanh</h2>
                <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tên công việc</label>
                    <input required type="text" value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 dark:text-white transition-shadow" placeholder="VD: Báo cáo tháng..." />
                  </div>
                  <div className="w-full md:w-40 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Không gian</label>
                    <select value={taskCalendarId} onChange={e=>setTaskCalendarId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 dark:text-white cursor-pointer transition-shadow">
                      {taskCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-32 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Độ ưu tiên</label>
                    <select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 cursor-pointer font-bold transition-shadow" style={{color: taskPriority==='P1'?'#ef4444':taskPriority==='P2'?'#f59e0b':'#3b82f6'}}>
                      <option value="P1" className="text-red-500">🔴 P1 (Cao)</option>
                      <option value="P2" className="text-amber-500">🟡 P2 (Vừa)</option>
                      <option value="P3" className="text-blue-500">🔵 P3 (Thấp)</option>
                    </select>
                  </div>
                  <div className="w-full md:w-40 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Deadline</label>
                    <input required type="date" value={taskDate} onChange={e=>setTaskDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 dark:text-white transition-shadow" />
                  </div>
                  <button type="submit" className="btn-hover bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold h-[44px] w-full md:w-auto shadow-lg shadow-primary-500/20">
                    Tạo ngay
                  </button>
                </form>
              </div>
              <KanbanBoard initialTasks={tasks} taskCategories={taskCategories} onRefreshData={loadData} />
            </div>
          ) : activeTab === 'expenses' ? (
            <ExpenseManager />
          ) : activeTab === 'analytics' ? (
            <AnalyticsDashboard isPrivacyMode={isPrivacyMode} />
          ) : activeTab === 'goals' ? (
            <GoalsManager />
          ) : activeTab === 'wealth' ? (
            <WealthDashboard reloadData={loadData} isPrivacyMode={isPrivacyMode} />
          ) : activeTab === 'lifeos' ? (
            <LifeOS />
          ) : activeTab === 'vault' ? (
            <Vault />
          ) : (
            <Settings reloadData={loadData} />
          )}
        </div>
      </main>

      {/* Global FAB (Mobile Quick Add) */}
      <div className="md:hidden fixed bottom-[88px] right-6 z-50">
        <button 
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className={`w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-xl shadow-primary-600/30 transition-transform duration-300 ${showQuickAdd ? 'rotate-45 bg-slate-800' : 'hover:scale-105 active:scale-95'}`}
        >
          <Plus size={28} />
        </button>
        
        {/* Quick Add Menu */}
        {showQuickAdd && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 items-end">
            <button onClick={() => { setActiveTab('expenses'); setShowQuickAdd(false); }} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap active:scale-95 transition-transform">
              Thêm giao dịch <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center"><Wallet size={16}/></div>
            </button>
            <button onClick={() => { setActiveTab('tasks'); setShowQuickAdd(false); }} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap active:scale-95 transition-transform">
              Thêm công việc <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"><CheckSquare size={16}/></div>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center px-1 py-2 relative">
          {navItems.filter(i => i.id !== 'settings').map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all relative ${activeTab === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <div className={`p-1 rounded-xl transition-transform duration-300 ${activeTab === item.id ? '-translate-y-1' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] transition-all duration-300 absolute bottom-0 ${activeTab === item.id ? 'opacity-100 font-bold translate-y-0' : 'opacity-0 translate-y-2'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Spotlight isOpen={isSpotlightOpen} onClose={() => setIsSpotlightOpen(false)} />
    </div>
    </PrivacyContext.Provider>
  )
}
