// ─── CategoryManager.tsx ─────────────────────────────────
// Modal quản lý danh mục Thu/Chi
// ──────────────────────────────────────────────────────────
import { useState } from 'react'
import { X, Plus, Sparkles } from 'lucide-react'
import { server } from '../../utils/gas'

interface Props {
  categories: any[]
  onClose: () => void
  onRefresh: () => void
}

export default function CategoryManager({ categories, onClose, onRefresh }: Props) {
  const [activeType, setActiveType] = useState<'Expense' | 'Income'>('Expense')
  const [loading, setLoading]       = useState(false)
  const [seeding, setSeeding]       = useState(false)
  const [seedMsg, setSeedMsg]       = useState('')

  const addParent = async () => {
    const name = prompt(`Nhập tên danh mục ${activeType === 'Expense' ? 'Chi tiêu' : 'Thu nhập'} mới:`)
    if (!name) return
    const icon  = prompt('Nhập icon (Emoji):', '🏷️') || '🏷️'
    const color = activeType === 'Expense' ? '#f43f5e' : '#22c55e'
    setLoading(true)
    await server.addCategory(name, activeType, icon, color, '')
    onRefresh()
    setLoading(false)
  }

  const addChild = async (parent: any) => {
    const subName = prompt(`Thêm danh mục con cho "${parent.name}":\nNhập tên:`)
    if (!subName) return
    const icon = prompt('Nhập icon (Emoji):', '📝') || '📝'
    setLoading(true)
    await server.addCategory(subName, 'Expense', icon, parent.color, parent.id)
    onRefresh()
    setLoading(false)
  }

  const deleteCategory = async (id: string, name: string, hasChildren: boolean) => {
    const msg = hasChildren ? `Xóa danh mục "${name}"? Các danh mục con cũng sẽ bị xóa.` : `Xóa danh mục con "${name}"?`
    if (!confirm(msg)) return
    setLoading(true)
    await server.deleteCategory(id)
    onRefresh()
    setLoading(false)
  }

  const handleSeed = async () => {
    const confirmed = confirm(
      '🌱 Tạo đầy đủ 116 danh mục mặc định?\n\n⚠️ Toàn bộ danh mục hiện tại sẽ bị XÓA và thay bằng danh sách mới.\n\nTiếp tục?'
    )
    if (!confirmed) return
    setSeeding(true)
    setSeedMsg('')
    const result = await server.seedCategories('reset')
    setSeeding(false)
    setSeedMsg(result || 'Hoàn thành!')
    onRefresh()
  }

  const filtered = categories.filter(c => c.type === activeType && !c.parentId)

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-[90%] max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quản lý danh mục</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button onClick={() => setActiveType('Expense')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeType === 'Expense' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            Chi tiêu
          </button>
          <button onClick={() => setActiveType('Income')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeType === 'Income' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            Thu nhập
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/30 dark:bg-slate-900 relative">
          {loading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>}

          {filtered.map(parent => (
            <div key={parent.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 flex justify-between items-center group">
                <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-700 shadow-sm text-lg">{parent.icon}</span>
                  {parent.name}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {activeType === 'Expense' && (
                    <button onClick={() => addChild(parent)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg" title="Thêm danh mục con">
                      <Plus size={16} />
                    </button>
                  )}
                  <button onClick={() => deleteCategory(parent.id, parent.name, categories.some(c => c.parentId === parent.id))}
                    className="text-xs bg-rose-100 text-rose-600 px-2 py-1 rounded hover:bg-rose-200">Xóa</button>
                </div>
              </div>
              {activeType === 'Expense' && (
                <div className="p-2 space-y-1">
                  {categories.filter(c => c.parentId === parent.id).map(sub => (
                    <div key={sub.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg group/sub">
                      <div className="text-sm font-medium text-slate-600 flex items-center gap-2 ml-4">
                        <span>{sub.icon}</span> {sub.name}
                      </div>
                      <button onClick={() => deleteCategory(sub.id, sub.name, false)}
                        className="text-xs text-rose-500 opacity-100 md:opacity-0 md:group-hover/sub:opacity-100 hover:underline">Xóa</button>
                    </div>
                  ))}
                  {categories.filter(c => c.parentId === parent.id).length === 0 && (
                    <p className="text-xs text-slate-400 italic ml-6">Chưa có danh mục con</p>
                  )}
                </div>
              )}
            </div>
          ))}

          <button onClick={addParent}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-colors">
            + Thêm danh mục {activeType === 'Expense' ? 'Chi' : 'Thu'}
          </button>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
          {/* Seed button */}
          <div className="flex-1">
            {seedMsg && <p className="text-xs text-emerald-600 font-semibold">✅ {seedMsg}</p>}
            <button onClick={handleSeed} disabled={seeding}
              className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 px-3 py-2 rounded-xl disabled:opacity-50 transition-colors">
              {seeding
                ? <><span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> Đang tạo 116 danh mục...</>
                : <><Sparkles size={13} /> Tạo đầy đủ danh mục mặc định (116 mục)</>}
            </button>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-900">Đóng</button>
        </div>
      </div>
    </div>
  )
}
