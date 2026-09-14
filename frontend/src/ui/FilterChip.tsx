import type { ButtonHTMLAttributes } from 'react'
import { joinClassNames } from '@/lib/classNames'

/**
 * A toggle in a filter row. Selected chips fill amber; the optional count
 * shows how many records the chip would reveal if it were selected.
 *
 * Named FilterChip rather than Chip because every chip in this application is
 * a filter control, not a tag or a removable token.
 *
 * Chips never shrink: a row that runs out of room wraps to the next line
 * instead. On a phone they are tall enough to tap, and a label too long for
 * the screen breaks across lines rather than pushing past the edge.
 */
export function FilterChip({
  label,
  count,
  isSelected = false,
  ...buttonProps
}: {
  label: string
  count?: number
  isSelected?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={joinClassNames(
        'flex min-h-10 max-w-full shrink-0 cursor-pointer items-center border px-3.5 py-2.25 text-left text-[14px] font-semibold',
        'md:min-h-0 md:items-baseline md:whitespace-nowrap md:py-1.5 md:text-[13px] md:tracking-[0.5px]',
        count !== undefined && 'md:px-3',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber',
        isSelected
          ? 'border-amber bg-amber text-ground'
          : 'border-hair bg-transparent text-ink-muted hover:text-ink',
      )}
      {...buttonProps}
    >
      {label}
      {count !== undefined && (
        <span
          className={joinClassNames(
            'ml-1.75 font-mono text-[12px] md:ml-2 md:text-[11px]',
            isSelected ? 'text-ground/60' : 'text-ink-faint',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
