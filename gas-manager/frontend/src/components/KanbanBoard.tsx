import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { server } from '../utils/gas'
import { Timer, X, BookHeart, Calendar, ExternalLink, AlertTriangle } from 'lucide-react'

type Subtask = { title: string; done: boolean }
type Task = { id: string; title: string; status: string; date: string; calendarId?: string; priority?: string; subtasks?: Subtask[]; noteId?: string | null }

const COLUMNS = [
  { id: 'TODO', title: 'Cần làm', color: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-inner' },
  { id: 'IN_PROGRESS', title: 'Đang làm', color: 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 shadow-inner' },
  { id: 'DONE', title: 'Hoàn thành', color: 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 shadow-inner' }
]

function SortableTaskItem({ task, taskCategories, onStartFocus }: { task: Task, taskCategories: any[], onStartFocus: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const category = taskCategories.find(c => c.id === (task.calendarId || 'default'))

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-lg dark:hover:shadow-black/40 transition-all hover:-translate-y-0.5 group relative overflow-hidden flex flex-col">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.status === 'DONE' ? 'bg-emerald-500' : task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
      <div className="flex justify-between items-start mb-2 pl-2">
        <div className="flex flex-col">
          {category && (
            <span className="text-[10px] font-bold tracking-wide mb-1 flex items-center gap-1" style={{ color: category.color }}>
              <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: category.color }}></div>
              {category.name}
            </span>
          )}
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight pr-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{task.title}</h4>
        </div>
        {task.priority && (
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm border ${task.priority === 'P1' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50' : task.priority === 'P2' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'}`}>
            {task.priority}
          </span>
        )}
      </div>
      <div className="flex justify-between items-center mt-3 pl-2">
        <div className="flex flex-col gap-1">
          <p className={`text-[11px] flex items-center gap-1 font-medium ${task.date && task.date < new Date().toISOString().split('T')[0] && task.status !== 'DONE' ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
              {task.date && task.date < new Date().toISOString().split('T')[0] && task.status !== 'DONE'
                ? <AlertTriangle size={11} />
                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              }
              {task.date}
           </p>
          {task.subtasks && task.subtasks.length > 0 && (
            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
            </p>
          )}
          {task.noteId && (
            <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
              <BookHeart size={12} /> Đính kèm
            </p>
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onStartFocus(task); }}
          className="w-7 h-7 bg-slate-100 dark:bg-slate-700 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-slate-400 dark:text-slate-500 hover:text-orange-500 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Tập trung"
        >
          <Timer size={14} />
        </button>
      </div>
    </div>
  )
}

export default function KanbanBoard({ initialTasks, taskCategories = [], onRefreshData }: { initialTasks: Task[], taskCategories?: any[], onRefreshData?: () => void }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeCalendarFilter, setActiveCalendarFilter] = useState<string>('all')
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [editTaskData, setEditTaskData] = useState({ title: '', date: '', calendarId: 'default' })
  
  // Pomodoro states
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [notes, setNotes] = useState<any[]>([])

  useEffect(() => {
    server.getNotes().then(setNotes)
  }, [])

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  useEffect(() => {
    let interval: any = null
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false)
      alert('Hết giờ! Chúc mừng bạn đã hoàn thành phiên tập trung.')
    }
    return () => clearInterval(interval)
  }, [isTimerActive, timeLeft])

  const startFocus = (task: Task) => {
    setFocusTask(task)
    setTimeLeft(25 * 60)
    setIsTimerActive(false)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveTask(tasks.find(t => t.id === active.id) || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const task = tasks.find(t => t.id === activeId)
    if (!task) return

    let newStatus = task.status
    if (COLUMNS.find(c => c.id === overId)) {
      newStatus = overId
    } else {
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) newStatus = overTask.status
    }

    if (task.status !== newStatus) {
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: newStatus } : t))
      const success = await server.updateTaskStatus(activeId, newStatus)
      if (!success) {
        // Revert on failure
        setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: task.status } : t))
      }
    }
  }

  const handleUpdateSubtask = async (task: Task, subtaskIndex: number, done: boolean) => {
    const updatedSubtasks = [...(task.subtasks || [])]
    updatedSubtasks[subtaskIndex].done = done
    
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subtasks: updatedSubtasks } : t))
    if (detailTask && detailTask.id === task.id) {
      setDetailTask({ ...detailTask, subtasks: updatedSubtasks })
    }
    await server.updateTaskDetails(task.id, task.priority || 'P3', JSON.stringify(updatedSubtasks), task.noteId)
  }

  const handleAddSubtask = async (task: Task, title: string) => {
    if (!title.trim()) return
    const updatedSubtasks = [...(task.subtasks || []), { title, done: false }]
    
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subtasks: updatedSubtasks } : t))
    if (detailTask && detailTask.id === task.id) {
      setDetailTask({ ...detailTask, subtasks: updatedSubtasks })
    }
    await server.updateTaskDetails(task.id, task.priority || 'P3', JSON.stringify(updatedSubtasks), task.noteId)
  }

  const handleLinkNote = async (task: Task, noteId: string) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, noteId } : t))
    if (detailTask && detailTask.id === task.id) {
      setDetailTask({ ...detailTask, noteId })
    }
    await server.updateTaskDetails(task.id, task.priority || 'P3', JSON.stringify(task.subtasks || []), noteId, task.calendarId)
  }

  const handleChangeCategory = async (task: Task, newCalendarId: string) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, calendarId: newCalendarId } : t))
    if (detailTask && detailTask.id === task.id) {
      setDetailTask({ ...detailTask, calendarId: newCalendarId })
    }
    await server.updateTaskCore(task.id, task.title, task.date, newCalendarId)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này? Hành động này sẽ xóa luôn sự kiện trên Google Calendar.')) return
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setDetailTask(null)
    await server.deleteTask(taskId)
    if (onRefreshData) onRefreshData()
  }

  const handleSaveEditTask = async () => {
    if (!detailTask || !editTaskData.title.trim() || !editTaskData.date) return
    
    setTasks(prev => prev.map(t => t.id === detailTask.id ? { ...t, title: editTaskData.title, date: editTaskData.date, calendarId: editTaskData.calendarId } : t))
    setDetailTask({ ...detailTask, title: editTaskData.title, date: editTaskData.date, calendarId: editTaskData.calendarId })
    setIsEditingTask(false)
    
    await server.updateTaskCore(detailTask.id, editTaskData.title, editTaskData.date, editTaskData.calendarId)
    if (onRefreshData) onRefreshData()
  }

  const filteredTasks = activeCalendarFilter === 'all' 
    ? tasks 
    : tasks.filter(t => (t.calendarId || 'default') === activeCalendarFilter)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      
      {/* Workspace Filter */}
      {taskCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveCalendarFilter('all')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeCalendarFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200/50 text-slate-600 hover:bg-slate-200'}`}
          >
            Tất cả
          </button>
          {taskCategories.map(c => (
            <div key={c.id} className="relative group">
              <button 
                onClick={() => setActiveCalendarFilter(c.id)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeCalendarFilter === c.id ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'bg-white/40 text-slate-600 hover:bg-white/80'}`}
              >
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: c.color}}></div>
                {c.name}
              </button>
              {c.id !== 'default' && (
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${c.name}"?`)) {
                      await server.deleteTaskCategory(c.id);
                      if (activeCalendarFilter === c.id) setActiveCalendarFilter('all');
                      if (onRefreshData) onRefreshData();
                    }
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="Xóa danh mục"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={async () => {
              const name = prompt('Nhập tên danh mục (Lịch) mới:');
              if (name && name.trim()) {
                await server.addTaskCategory(name.trim());
                if (onRefreshData) onRefreshData();
              }
            }}
            className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors border border-primary-200 border-dashed"
          >
            + Thêm danh mục
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start w-full overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id)
          return (
            <div key={col.id} className={`flex-1 min-w-[280px] md:min-w-0 rounded-2xl p-4 flex flex-col border ${col.color}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide uppercase flex items-center gap-2">
                  {col.title}
                  <span className="bg-white/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-700/50">{colTasks.length}</span>
                </h3>
              </div>
              
              <SortableContext id={col.id} items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-3 min-h-[150px]">
                  {colTasks.map(t => (
                    <div key={t.id} onDoubleClick={() => setDetailTask(t)}>
                      <SortableTaskItem task={t} taskCategories={taskCategories} onStartFocus={startFocus} />
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-black/10 rounded-xl flex items-center justify-center text-black/30 text-sm font-semibold uppercase tracking-wider">
                      Kéo thả vào đây
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl shadow-primary-500/20 border-2 border-primary-400 cursor-grabbing rotate-3 opacity-95 scale-105">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{activeTask.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{activeTask.date}</p>
          </div>
        ) : null}
      </DragOverlay>

      {focusTask && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full mx-4 shadow-2xl relative border-4 border-orange-500 overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <button onClick={() => setFocusTask(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center animate-bounce">
                <Timer size={32} />
              </div>
            </div>
            <h3 className="font-bold text-slate-800 text-xl mb-2">Đang tập trung</h3>
            <p className="text-orange-600 font-semibold mb-8 px-4 py-2 bg-orange-50 rounded-lg">{focusTask.title}</p>
            
            <div className="text-7xl font-black text-slate-800 tracking-tighter mb-8 font-mono tabular-nums">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setIsTimerActive(!isTimerActive)} className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${isTimerActive ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 shadow-lg' : 'bg-slate-800 hover:bg-slate-900 shadow-lg'}`}>
                {isTimerActive ? 'Tạm dừng' : 'Bắt đầu'}
              </button>
              <button onClick={() => setTimeLeft(25 * 60)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {detailTask && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex-1">
                {isEditingTask ? (
                  <input type="text" value={editTaskData.title} onChange={e => setEditTaskData({...editTaskData, title: e.target.value})} className="w-full text-xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-primary-500 mb-2" />
                ) : (
                  <h2 className="text-xl font-bold text-slate-800">{detailTask.title}</h2>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-black px-2 py-1 rounded-md ${detailTask.priority === 'P1' ? 'bg-red-100 text-red-600' : detailTask.priority === 'P2' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    {detailTask.priority || 'P3'}
                  </span>
                  
                  {isEditingTask ? (
                    <input type="date" value={editTaskData.date} onChange={e => setEditTaskData({...editTaskData, date: e.target.value})} className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary-500" />
                  ) : (
                    <span className="text-xs text-slate-500 font-medium px-2 border-r border-slate-200">Hạn chót: {detailTask.date}</span>
                  )}
                  
                  {isEditingTask ? (
                    <select 
                      value={editTaskData.calendarId} 
                      onChange={e => setEditTaskData({...editTaskData, calendarId: e.target.value})}
                      className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-slate-300"
                    >
                      {taskCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <select 
                      value={detailTask.calendarId || 'default'} 
                      onChange={e => handleChangeCategory(detailTask, e.target.value)}
                      className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-slate-300"
                    >
                      {taskCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isEditingTask ? (
                  <button onClick={handleSaveEditTask} className="text-emerald-500 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-lg transition-colors font-semibold text-xs ml-2">Lưu</button>
                ) : (
                  <>
                    <button onClick={() => { setEditTaskData({title: detailTask.title, date: detailTask.date, calendarId: detailTask.calendarId || 'default'}); setIsEditingTask(true); }} className="text-slate-400 hover:text-primary-500 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="Sửa công việc">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => handleDeleteTask(detailTask.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Xóa công việc">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </>
                )}
                <button onClick={() => { setDetailTask(null); setIsEditingTask(false); }} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition-colors ml-1">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                Danh sách công việc nhỏ (Subtasks)
              </h3>
              
              <div className="space-y-2 mb-4">
                {detailTask.subtasks && detailTask.subtasks.map((st, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={st.done} 
                      onChange={(e) => handleUpdateSubtask(detailTask, idx, e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className={`text-sm ${st.done ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>{st.title}</span>
                  </label>
                ))}
                {(!detailTask.subtasks || detailTask.subtasks.length === 0) && (
                  <p className="text-sm text-slate-400 italic px-2">Chưa có việc nhỏ nào.</p>
                )}
              </div>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.target as HTMLFormElement).elements.namedItem('subtaskTitle') as HTMLInputElement;
                  handleAddSubtask(detailTask, input.value);
                  input.value = '';
                }}
                className="flex gap-2"
              >
                <input 
                  name="subtaskTitle"
                  type="text" 
                  placeholder="Thêm việc nhỏ mới..." 
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button type="submit" className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
                  Thêm
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <BookHeart size={16} className="text-amber-500" /> Liên kết Sổ Tay
                </h3>
                {detailTask.noteId ? (
                  <div className="flex justify-between items-center bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <span className="font-medium text-amber-800">{notes.find(n => n.id === detailTask.noteId)?.title || 'Ghi chú đã bị xóa'}</span>
                    <button onClick={() => handleLinkNote(detailTask, '')} className="text-amber-600 hover:text-amber-800 bg-amber-100 p-1 rounded-md"><X size={16} /></button>
                  </div>
                ) : (
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    onChange={e => handleLinkNote(detailTask, e.target.value)}
                    value=""
                  >
                    <option value="" disabled>-- Chọn ghi chú để đính kèm --</option>
                    {notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                  </select>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <a 
                href={`https://calendar.google.com/calendar/r/search?q=${encodeURIComponent('[Task] ' + detailTask.title)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                <Calendar size={14} />
                Xem trên Google Calendar
                <ExternalLink size={11} />
              </a>
              <button onClick={() => { setDetailTask(null); setIsEditingTask(false); }} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  )
}
