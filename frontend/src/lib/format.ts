/**
 * Display formatting. Every figure shown to a user passes through here, so
 * that currency, thousands separators and dates read the same on every screen.
 *
 * Money arrives here in cents and leaves as dollars. Cents are the only money
 * unit the rest of the application handles: summing floating-point dollars
 * drifts, and payment records are reconciled against a bank statement to the
 * penny. This module is the one place division by 100 happens.
 *
 * These functions format values for reading. They never calculate anything —
 * calculations live in src/domain.
 */

const CENTS_PER_DOLLAR = 100

/** 480000 -> "$4,800". Whole dollars; the design never shows cents on totals. */
export function formatMoney(amountInCents: number): string {
  return (amountInCents / CENTS_PER_DOLLAR).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * 10049 -> "$100.49", 160000 -> "$1,600". Exact amounts, for records read
 * against a statement.
 *
 * Cents appear only when there are some. The design writes payments in whole
 * dollars, and a whole-dollar payment loses nothing by it; a payment that
 * carries cents keeps every one, which is the part that has to reconcile.
 */
export function formatPaymentAmount(amountInCents: number): string {
  const hasCents = amountInCents % CENTS_PER_DOLLAR !== 0
  return (amountInCents / CENTS_PER_DOLLAR).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
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
 * 2275000 -> "2.28M", 412000 -> "412K", 96000 -> "96,000". The phone cards'
 * shortening: a six-digit figure is the first that stops fitting beside two
 * others on a 430px card, so that is where it starts.
 */
export function formatCountCompact(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M'
  if (value >= 100_000) return (value / 1000).toFixed(0) + 'K'
  return formatNumber(value)
}

/**
 * 183.99 cents per install -> "$1.84". An em dash when not measurable,
 * which is what getCostPerInstall returns for a creator who has been paid
 * nothing yet.
 */
export function formatCostPerInstall(costPerInstallInCents: number): string {
  return Number.isFinite(costPerInstallInCents)
    ? '$' + (costPerInstallInCents / CENTS_PER_DOLLAR).toFixed(2)
    : '—'
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
