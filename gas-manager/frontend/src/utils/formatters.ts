// =============================================================
// FORMATTERS — DRY: Tập trung tất cả hàm format ở 1 nơi
// Thay thế 8 bản sao formatMoney() rải rác trong toàn dự án
// =============================================================

/**
 * Format số tiền VNĐ. Hỗ trợ Privacy Mode.
 * @polymorphism - overloads: có hoặc không có privacyMode
 */
export function formatMoney(value: number, privacyMode?: boolean): string {
  if (privacyMode) return '***,*** ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}

/**
 * Format ngày sang locale Việt Nam
 */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', options)
  } catch {
    return dateStr
  }
}

/**
 * Format ngày hiển thị tương đối: "Hôm nay", "Hôm qua", hoặc ngày cụ thể
 */
export function formatRelativeDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Hôm nay'
  if (dateStr === yesterday) return 'Hôm qua'
  return formatDate(dateStr)
}

/**
 * Format số compact: 1,500,000 → 1.5M
 */
export function formatMoneyCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}T`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString('vi-VN')
}

/**
 * Format phần trăm: 0.856 → "85.6%"
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format thời gian từ seconds: 1500 → "25:00"
 */
export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Lấy tháng hiện tại dạng YYYY-MM
 */
export function getCurrentMonth(): string {
  return new Date().toISOString().substring(0, 7)
}

/**
 * Lấy ngày hiện tại dạng YYYY-MM-DD
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Tính số ngày còn lại đến deadline
 */
export function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

/**
 * Kiểm tra có quá hạn không
 */
export function isOverdue(dateStr: string): boolean {
  return dateStr < getToday()
}
