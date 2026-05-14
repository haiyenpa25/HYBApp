// =============================================================
// TOAST — Global notification system (thay thế alert())
// Sử dụng Context + Reducer pattern (tính đóng gói)
// =============================================================

import { createContext, useContext, useReducer, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

// --- Types ---
export type ToastType = 'success' | 'error' | 'warn' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastState { toasts: Toast[] }
type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string }

// --- Config mapping (tính đa hình qua data) ---
const TOAST_CONFIG: Record<ToastType, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    className: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400',
  },
  error: {
    icon: <XCircle size={18} />,
    className: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400',
  },
  warn: {
    icon: <AlertTriangle size={18} />,
    className: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400',
  },
  info: {
    icon: <Info size={18} />,
    className: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400',
  },
}

// --- Reducer ---
function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD': return { toasts: [...state.toasts, action.toast] }
    case 'REMOVE': return { toasts: state.toasts.filter(t => t.id !== action.id) }
    default: return state
  }
}

// --- Context ---
const ToastContext = createContext<{
  toast: (message: string, type?: ToastType, duration?: number) => void
}>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

// --- Provider ---
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] })

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Date.now().toString()
    dispatch({ type: 'ADD', toast: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE', id }), duration)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[200] space-y-2 pointer-events-none">
        {state.toasts.map(t => {
          const config = TOAST_CONFIG[t.type]
          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg text-sm font-semibold pointer-events-auto max-w-sm animate-in slide-in-from-right-5 fade-in duration-300 ${config.className}`}
            >
              <span className="shrink-0 mt-0.5">{config.icon}</span>
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dispatch({ type: 'REMOVE', id: t.id })}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
