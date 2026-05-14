// =============================================================
// TASK API — Domain API cho công việc & Google Calendar
// =============================================================

import { gasRun } from '../utils/gasRunner'
import type { Task, TaskCategory } from '../types'

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Hoàn thành báo cáo', status: 'TODO', date: '2026-05-15', calendarId: 'default', priority: 'P1', subtasks: [], noteId: null },
  { id: '2', title: 'Họp nhóm', status: 'IN_PROGRESS', date: '2026-05-11', calendarId: 'default', priority: 'P2', subtasks: [{ title: 'Chuẩn bị slides', done: true }], noteId: null },
]

const MOCK_CATEGORIES: TaskCategory[] = [
  { id: 'default', name: 'Lịch mặc định', color: '#3b82f6' },
  { id: 'c_work', name: 'Công việc', color: '#8b5cf6' },
]

export const taskApi = {
  getAll: () =>
    gasRun<Task[]>('getTasks', [], MOCK_TASKS),

  add: (title: string, date: string, calendarId = 'default', priority = 'P3') =>
    gasRun<boolean>('addTask', [title, date, calendarId, priority]),

  updateStatus: (id: string, status: string) =>
    gasRun<boolean>('updateTaskStatus', [id, status]),

  updateDetails: (id: string, priority: string, subtasksJson: string, noteId?: string | null, calendarId?: string) =>
    gasRun<boolean>('updateTaskDetails', [id, priority, subtasksJson, noteId, calendarId]),

  updateCore: (id: string, title: string, date: string, calendarId: string) =>
    gasRun<boolean>('updateTaskCore', [id, title, date, calendarId]),

  delete: (id: string) =>
    gasRun<boolean>('deleteTask', [id]),
}

export const taskCategoryApi = {
  getAll: () =>
    gasRun<TaskCategory[]>('getTaskCategories', [], MOCK_CATEGORIES),

  add: (name: string) =>
    gasRun<TaskCategory>('addTaskCategory', [name], { id: 'new', name, color: '#10b981' }),

  delete: (id: string) =>
    gasRun<boolean>('deleteTaskCategory', [id]),
}
