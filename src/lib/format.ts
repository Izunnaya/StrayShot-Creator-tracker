export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

export const num = (n: number) => n.toLocaleString('en-US')

export const compactViews = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(2) + 'M' : num(n)

export const cpiLabel = (cpi: number) => (Number.isFinite(cpi) ? '$' + cpi.toFixed(2) : '—')

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
