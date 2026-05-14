import { useState, useEffect } from 'react'
import { server } from '../utils/gas'
import { FileText, Plus, Trash2, Save, Clock } from 'lucide-react'

export default function Vault() {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState<any[]>([])
  const [activeNote, setActiveNote] = useState<any>(null)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaved, setIsSaved] = useState(true)

  const loadNotes = async () => {
    setLoading(true)
    const data = await server.getNotes()
    const validNotes = data.filter(n => n.title !== '[Đã xóa]')
    setNotes(validNotes)
    if (validNotes.length > 0 && !activeNote) {
      handleSelectNote(validNotes[0])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadNotes()
  }, [])

  const handleSelectNote = (n: any) => {
    setActiveNote(n)
    setTitle(n.title)
    setContent(n.content)
    setIsSaved(true)
  }

  const handleNewNote = () => {
    setActiveNote(null)
    setTitle('')
    setContent('')
    setIsSaved(false)
  }

  const handleSave = async () => {
    if (!title) return alert('Vui lòng nhập tiêu đề')
    setIsSaved(true)
    
    const id = activeNote ? activeNote.id : null
    const dateStr = new Date().toISOString()
    
    // Optimistic Update
    if (id) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, title, content, lastEdited: dateStr } : n))
    } else {
      const tempId = 'temp-' + Date.now()
      const newNote = { id: tempId, title, content, lastEdited: dateStr }
      setNotes(prev => [newNote, ...prev])
      setActiveNote(newNote)
    }
    
    const titleToSave = title
    const contentToSave = content
    
    // Background sync
    server.saveNote(id, titleToSave, contentToSave).then(newId => {
      server.getNotes().then(data => {
        const validNotes = data.filter(n => n.title !== '[Đã xóa]')
        setNotes(validNotes)
        if (!id && newId) {
          const freshNote = validNotes.find(n => n.id === newId)
          if (freshNote) setActiveNote(freshNote)
        }
      })
    }).catch(() => loadNotes())
  }

  const handleDelete = async () => {
    if (!activeNote) return
    if (!confirm('Bạn có chắc muốn xóa ghi chú này?')) return
    
    const noteIdToDelete = activeNote.id
    
    // Optimistic Delete
    setNotes(prev => prev.filter(n => n.id !== noteIdToDelete))
    setActiveNote(null)
    setTitle('')
    setContent('')
    
    // Background sync
    server.deleteNote(noteIdToDelete).then(() => loadNotes()).catch(() => loadNotes())
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
      {/* Sidebar List */}
      <div className="w-full md:w-72 glass-panel flex flex-col overflow-hidden h-[300px] md:h-auto dark:bg-slate-800/80">
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText size={18} className="text-primary-500" /> Sổ tay số
          </h3>
          <button onClick={handleNewNote} className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 p-2 rounded-lg transition-colors">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {notes.map(n => (
            <button
              key={n.id}
              onClick={() => handleSelectNote(n)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all group ${activeNote?.id === n.id ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-500/20' : 'hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent'}`}
            >
              <h4 className={`font-bold text-sm truncate ${activeNote?.id === n.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors'}`}>{n.title}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                <Clock size={10} /> {new Date(n.lastEdited).toLocaleDateString('vi-VN')}
              </p>
            </button>
          ))}
          {notes.length === 0 && !loading && (
            <div className="text-center p-6 text-sm text-slate-400 italic">Chưa có ghi chú nào. Nhấn + để tạo mới.</div>
          )}
        </div>
      </div>

      {/* Editor Pane */}
      <div className="flex-1 glass-panel flex flex-col relative overflow-hidden h-[500px] md:h-auto dark:bg-slate-800/80">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent shadow-lg"></div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 gap-4">
            <input 
              type="text" 
              value={title}
              onChange={e => { setTitle(e.target.value); setIsSaved(false); }}
              placeholder="Tiêu đề ghi chú..."
              className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white bg-transparent border-0 outline-none w-full placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0 px-0 transition-colors"
            />
            <div className="flex gap-2 shrink-0">
              {activeNote && (
                <button onClick={handleDelete} className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors" title="Xóa ghi chú">
                  <Trash2 size={20} />
                </button>
              )}
              <button 
                onClick={handleSave} 
                disabled={isSaved}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${isSaved ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'btn-hover bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700'}`}
              >
                <Save size={18} /> <span className="hidden sm:inline">{isSaved ? 'Đã lưu' : 'Lưu lại'}</span>
              </button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); setIsSaved(false); }}
            placeholder="Viết suy nghĩ của bạn vào đây... (Hỗ trợ Markdown cơ bản)"
            className="flex-1 w-full bg-transparent border-0 outline-none resize-none text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0 px-0 no-scrollbar"
          ></textarea>
        </div>
      </div>
    </div>
  )
}
