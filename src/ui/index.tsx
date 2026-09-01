import type { ReactNode } from 'react'
import type { CreatorStatus, Platform } from '../data/types'

/* Shared primitives for every screen — task 0.9 / 0.13.
   Static only: no state, no data fetching. Presentation and variants. */

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ labels */

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('text-[11px] uppercase tracking-[2px] text-ink-muted', className)}>
      {children}
    </div>
  )
}

/** Section heading in the house style: white words with the last part in amber. */
export function SectionTitle({
  children,
  size = 'md',
  className,
}: {
  children: ReactNode
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      className={cx(
        'font-head font-semibold uppercase tracking-[2px] text-ink',
        size === 'sm' ? 'text-[14px]' : 'text-[16px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ----------------------------------------------------------------- buttons */

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'quiet' | 'dashed'

const buttonBase =
  'font-head uppercase whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-2'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-amber text-ground border-none font-semibold text-[13px] tracking-[1.5px] px-[18px] py-[9px] hover:bg-ink',
  outline:
    'bg-transparent border border-amber text-amber text-[11px] tracking-[1.5px] px-[11px] py-[6px] transition-colors duration-150 hover:bg-amber hover:text-ground',
  ghost:
    'bg-transparent border border-hair text-ink text-[13px] tracking-[1.5px] px-[18px] py-[11px] hover:border-amber hover:text-amber',
  quiet:
    'bg-transparent border-none text-ink-muted text-[13px] tracking-[1px] px-[4px] py-[6px] hover:text-amber',
  dashed:
    'bg-transparent border border-dashed border-hair-6 text-ink-muted font-body font-semibold text-[13px] tracking-[0.5px] px-[14px] py-[6px] hover:text-amber hover:border-amber',
}

export function Button({
  variant = 'primary',
  children,
  className,
  ...rest
}: { variant?: ButtonVariant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx(buttonBase, buttonVariants[variant], className)} {...rest}>
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------- chips */

export function Chip({
  label,
  count,
  selected = false,
  ...rest
}: {
  label: string
  count?: number
  selected?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-pressed={selected}
      className={cx(
        'flex items-baseline border px-[14px] py-[6px] text-[13px] font-semibold tracking-[0.5px] cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-2',
        selected
          ? 'bg-amber border-amber text-ground'
          : 'bg-transparent border-hair text-ink-muted hover:text-ink',
      )}
      {...rest}
    >
      {label}
      {count !== undefined && (
        <span
          className={cx(
            'ml-[8px] font-mono text-[11px]',
            selected ? 'text-ground/60' : 'text-ink-faint',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/* ------------------------------------------------------------- stat tiles */

export function StatStrip({ children, framed = true }: { children: ReactNode; framed?: boolean }) {
  return (
    <div
      className={cx(
        'grid gap-px bg-hair border',
        framed ? 'border-amber' : 'border-hair',
        'grid-cols-2 md:grid-cols-4',
      )}
    >
      {children}
    </div>
  )
}

export function StatTile({
  label,
  value,
  note,
  tone = 'ink',
}: {
  label: string
  value: string
  note?: string
  tone?: 'ink' | 'amber' | 'bad' | 'good'
}) {
  const toneClass = {
    ink: 'text-ink',
    amber: 'text-amber',
    bad: 'text-bad',
    good: 'text-good',
  }[tone]
  return (
    <div className="bg-panel px-[22px] py-[18px]">
      <Label className="mb-[6px]">{label}</Label>
      <div className={cx('font-head font-semibold text-[38px] leading-none', toneClass)}>
        {value}
      </div>
      {note && <div className="mt-[4px] text-[12px] text-ink-muted">{note}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ panels */

export function Panel({
  children,
  className,
  framed = false,
}: {
  children: ReactNode
  className?: string
  framed?: boolean
}) {
  return (
    <div
      className={cx('bg-panel border', framed ? 'border-amber' : 'border-hair', className)}
    >
      {children}
    </div>
  )
}

/* --------------------------------------------------------------status pills */

const statusStyles: Record<CreatorStatus, string> = {
  prospect: 'text-ink-muted border border-dashed border-hair-6',
  contracted: 'text-amber-mid border border-amber/40',
  active: 'bg-amber text-ground border border-amber',
  completed: 'text-good border border-good/45',
}

export function StatusPill({ status }: { status: CreatorStatus }) {
  return (
    <span
      className={cx(
        'px-[8px] py-[2px] text-[11px] font-semibold uppercase tracking-[1px] whitespace-nowrap',
        statusStyles[status],
      )}
    >
      {status}
    </span>
  )
}

export function PlatformTag({ platform }: { platform: Platform }) {
  return (
    <span
      className={cx(
        'border border-hair px-[8px] py-[2px] text-[12px] font-semibold uppercase tracking-[1px]',
        platform === 'YouTube' ? 'text-ink-bright' : 'text-twitch',
      )}
    >
      {platform}
    </span>
  )
}

/* ------------------------------------------------------------ progress bar */

/** Angled amber while part-paid, solid green once the balance closes. */
export function ProgressBar({ pct, height = 4 }: { pct: number; height?: number }) {
  const settled = pct >= 100
  return (
    <div className="bg-hair-2" style={{ height }}>
      <div
        className={cx('h-full transition-[width] duration-450', settled ? 'bg-good' : 'bar-partial')}
        style={{ width: Math.min(100, pct) + '%' }}
      />
    </div>
  )
}
