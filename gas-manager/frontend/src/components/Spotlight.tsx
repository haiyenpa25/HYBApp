import { useState, useEffect } from 'react'
import { Search, Wallet, CheckSquare, BookHeart, X } from 'lucide-react'
import { server } from '../utils/gas'

export default function Spotlight({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{type: string, title: string, subtitle: string, icon: any}[]>([])

  // Data cache
  const [cache, setCache] = useState<{tasks: any[], txs: any[], notes: any[]}>({tasks: [], txs: [], notes: []})

  useEffect(() => {
    if (isOpen && cache.tasks.length === 0) {
      // Preload data
      Promise.all([
        server.getTasks(),
        server.getTransactions(),
        server.getNotes()
      ]).then(([ts, txs, ns]) => {
        setCache({ tasks: ts, txs: txs, notes: ns })
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const q = query.toLowerCase()
    const found: any[] = []

    // Search Tasks
    cache.tasks.forEach(t => {
      if (t.title.toLowerCase().includes(q)) {
        found.push({ type: 'task', title: t.title, subtitle: `Hạn chót: ${t.date} • Trạng thái: ${t.status}`, icon: <CheckSquare size={18} className="text-blue-500" /> })
      }
    })

    // Search Transactions
    cache.txs.forEach(t => {
      if (t.note.toLowerCase().includes(q)) {
        found.push({ type: 'tx', title: t.note, subtitle: `${new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(t.amount)} • Ngày: ${t.date}`, icon: <Wallet size={18} className={t.type === 'Expense' ? 'text-rose-500' : 'text-emerald-500'} /> })
      }
    })

    // Search Notes
    cache.notes.forEach(n => {
      if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        found.push({ type: 'note', title: n.title, subtitle: `Chỉnh sửa lần cuối: ${new Date(n.lastEdited).toLocaleDateString('vi-VN')}`, icon: <BookHeart size={18} className="text-amber-500" /> })
      }
    })

    setResults(found.slice(0, 10)) // Limit to 10 results
  }, [query, cache])

  // Handle Cmd+K / Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // Open spotlight is handled by parent, we can't trigger it from inside if it's unmounted.
          // Wait, this effect should be in App.tsx or Spotlight must always be mounted but hidden.
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] px-4 animate-in fade-in">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-2xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden flex flex-col">
        <div className="flex items-center px-4 border-b border-slate-200">
          <Search size={24} className="text-slate-400" />
          <input 
            autoFocus
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border-0 px-4 py-5 outline-none text-xl font-medium text-slate-800 placeholder-slate-400"
            placeholder="Tìm kiếm mọi thứ (Công việc, Chi tiêu, Ghi chú)..."
          />
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    {r.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{r.title}</h4>
                    <p className="text-xs text-slate-500">{r.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() !== '' ? (
            <div className="text-center py-12 text-slate-400">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p>Không tìm thấy kết quả nào cho "{query}"</p>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Gõ từ khóa để tìm kiếm nhanh trên toàn hệ thống.</p>
              <div className="mt-4 flex gap-2 justify-center">
                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">cmd</span>
                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">k</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
