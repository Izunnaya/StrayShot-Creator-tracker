/**
 * Display formatting. Every figure shown to a user passes through here, so
 * that currency, thousands separators and dates read the same on every screen.
 *
 * These functions format values for reading. They never calculate anything —
 * calculations live in src/domain.
 */

/** 4800 -> "$4,800". Whole dollars; the design never shows cents on totals. */
export function formatMoney(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('en-US')
}

/** Exact USD amounts for payment records and reconciliation. */
export function formatPaymentAmount(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** 25545 -> "25,545" */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/** 2275000 -> "2.28M", 412000 -> "412,000". Used in the summary strip only. */
export function formatViewsCompact(views: number): string {
  return views >= 1_000_000 ? (views / 1_000_000).toFixed(2) + 'M' : formatNumber(views)
}

/**
 * 1.8399 -> "$1.84". Renders an em dash when the value is not measurable,
 * which is what getCostPerInstall returns for a creator who has been paid
 * nothing yet.
 */
export function formatCostPerInstall(costPerInstall: number): string {
  return Number.isFinite(costPerInstall) ? '$' + costPerInstall.toFixed(2) : '—'
}

/** "2026-07-24" -> "Jul 24, 2026" */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** "2026-07-24" -> "Jul 24". For dense tables where the year is implied. */
export function formatDateWithoutYear(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
