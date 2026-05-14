// =============================================================
// COMMON UI COMPONENTS — Badge, ProgressBar, EmptyState, Spinner
// Tính kế thừa qua composition + variant props
// =============================================================

import type { TaskPriority } from '../../types'
import { PRIORITY_CONFIG } from '../../utils/constants'

// ─── Badge (tính đa hình qua variant prop) ───────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

const BADGE_VARIANTS = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
}

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full ${sizeClass} ${BADGE_VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ─── Priority Badge (kế thừa Badge, chuyên biệt cho Priority) ──
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <span className={`inline-block text-[10px] font-black px-1.5 py-0.5 rounded-md border ${config.color} ${config.bg} ${config.border}`}>
      {priority}
    </span>
  )
}

// ─── ProgressBar ─────────────────────────────────────────────
interface ProgressBarProps {
  value: number       // 0–100
  color?: string      // CSS color
  height?: number     // px
  showLabel?: boolean
  className?: string
  animated?: boolean
}

export function ProgressBar({
  value,
  color = '#6366f1',
  height = 8,
  showLabel = false,
  className = '',
  animated = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-end mb-1">
          <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
        </div>
      )}
      <div
        className="w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${animated ? 'relative overflow-hidden' : ''}`}
          style={{ width: `${pct}%`, backgroundColor: color }}
        >
          {animated && pct > 10 && (
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── EmptyState ──────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-5xl mb-3 opacity-40">{icon}</span>
      <h3 className="font-bold text-slate-600 dark:text-slate-400">{title}</h3>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── LoadingSpinner ───────────────────────────────────────────
interface SpinnerProps {
  size?: number
  className?: string
  overlay?: boolean
}

export function LoadingSpinner({ size = 48, className = '', overlay = false }: SpinnerProps) {
  const spinner = (
    <div
      className={`animate-spin rounded-full border-4 border-primary-500 border-t-transparent shadow-lg ${className}`}
      style={{ width: size, height: size }}
    />
  )

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
        {spinner}
      </div>
    )
  }
  return spinner
}

// ─── ConfirmDialog ────────────────────────────────────────────
interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy',
  onConfirm, onCancel, danger = false
}: ConfirmDialogProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[150] flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{message}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-primary-500 hover:bg-primary-600'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ColorPicker ──────────────────────────────────────────────
import { PALETTE } from '../../utils/constants'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${value === c ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : ''}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

// ─── IconPicker ───────────────────────────────────────────────
interface IconPickerProps {
  icons: string[]
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ icons, value, onChange }: IconPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {icons.map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${value === i ? 'bg-primary-100 dark:bg-primary-500/20 ring-2 ring-primary-500 scale-110' : 'bg-slate-100 dark:bg-slate-800 hover:scale-110'}`}
        >
          {i}
        </button>
      ))}
    </div>
  )
}
