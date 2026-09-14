import type { ReactNode } from 'react'
import { joinClassNames } from '@/lib/classNames'

/**
 * The phone design's way of filtering: one button that says what is applied
 * and opens a sheet of choices, rather than rows of chips that run past the
 * edge of a 390px screen.
 *
 * The button reads the current filter on its left and names what it filters
 * on its right, and turns amber while anything is applied, so a narrowed list
 * never passes for the whole one.
 */
export function FilterSheetButton({
  label,
  summary,
  isFiltered,
  onClick,
}: {
  /** What it filters, e.g. "Filter creators". */
  label: string
  /** What is applied now, e.g. "All creators" or "Clan Wars Update". */
  summary: string
  isFiltered: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={`${label}. ${summary}`}
      className={joinClassNames(
        'flex min-h-12 w-full min-w-0 cursor-pointer items-center justify-between gap-2.5 border bg-transparent px-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber',
        isFiltered ? 'border-amber text-amber' : 'border-hair text-ink-quiet',
      )}
    >
      <span
        className={joinClassNames(
          'min-w-0 truncate text-left text-[13px]',
          isFiltered ? 'text-amber' : 'text-ink-dim',
        )}
      >
        {summary}
      </span>
      <span className="flex shrink-0 items-center gap-2.25">
        <span className="whitespace-nowrap font-head text-[13px] uppercase tracking-[1.5px]">
          {label}
        </span>
        {/* Three bars narrowing downward: the design's filter mark. */}
        <span aria-hidden="true" className="inline-flex shrink-0 flex-col gap-0.75">
          <span className="block h-0.5 w-3.75 bg-current" />
          <span className="block h-0.5 w-2.75 bg-current" />
          <span className="block h-0.5 w-1.75 bg-current" />
        </span>
      </span>
    </button>
  )
}

/** A group of choices in a filter sheet, under its caption. */
export function FilterSheetSection({
  title,
  action,
  children,
  className,
}: {
  title: string
  /** A control opposite the caption. */
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h3 className="text-[11px] font-normal uppercase tracking-[2px] text-ink-muted">{title}</h3>
        {action}
      </div>
      <div className="grid gap-2">{children}</div>
    </section>
  )
}

/** One choice: full width, ticked and framed in amber while it is the one applied. */
export function FilterSheetOption({
  label,
  count,
  isSelected,
  onClick,
}: {
  label: string
  /** How many records choosing it would show. */
  count?: number
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={joinClassNames(
        'flex min-h-12.5 w-full cursor-pointer items-center justify-between border px-3.75 py-3.25 text-left text-[15px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber',
        isSelected
          ? 'border-amber bg-row-hover font-semibold text-ink'
          : 'border-hair bg-sunk-2 font-normal text-ink-quiet',
      )}
    >
      <span>
        {label}
        {count !== undefined && (
          <span className="ml-2 font-mono text-[13px] font-normal text-ink-dim">{count}</span>
        )}
      </span>
      <span aria-hidden="true" className="w-4 shrink-0 text-right text-[15px] font-bold text-amber">
        {isSelected ? '✓' : ''}
      </span>
    </button>
  )
}
