import type { ButtonHTMLAttributes } from 'react'
import { joinClassNames } from '../lib/classNames'

/**
 * A toggle in a filter row. Selected chips fill amber; the optional count
 * shows how many records the chip would reveal if it were selected.
 *
 * Named FilterChip rather than Chip because every chip in this application is
 * a filter control, not a tag or a removable token.
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
      aria-pressed={isSelected}
      className={joinClassNames(
        'flex items-baseline border px-3.5 py-1.5 text-[13px] font-semibold tracking-[0.5px] cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-2',
        isSelected
          ? 'bg-amber border-amber text-ground'
          : 'bg-transparent border-hair text-ink-muted hover:text-ink',
      )}
      {...buttonProps}
    >
      {label}
      {count !== undefined && (
        <span
          className={joinClassNames(
            'ml-2 font-mono text-[11px]',
            isSelected ? 'text-ground/60' : 'text-ink-faint',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
