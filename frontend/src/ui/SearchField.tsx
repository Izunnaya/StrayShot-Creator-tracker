import type { InputHTMLAttributes } from 'react'
import { joinClassNames } from '@/lib/classNames'

/**
 * The search box that leads a filter row.
 *
 * Full width and a thumb's height on a phone, where it sits on a row of its
 * own; a fixed 230px from md up, where it shares the row with the chips.
 * Sixteen pixels of text below md is not a style choice: anything smaller
 * makes iOS zoom the page when the field is focused.
 *
 * The placeholder says what is searched but disappears as soon as anything is
 * typed, so the accessible name is passed separately and is required.
 */
export function SearchField({
  label,
  onValueChange,
  className,
  ...inputProps
}: {
  /** The accessible name, e.g. "Search creators by name or code". */
  label: string
  onValueChange: (value: string) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'>) {
  return (
    <input
      type="search"
      aria-label={label}
      autoComplete="off"
      spellCheck={false}
      onChange={(event) => onValueChange(event.target.value)}
      className={joinClassNames(
        'min-h-12 w-full border border-hair bg-sunk px-3.5 py-3 text-[16px] text-ink placeholder:text-ink-dim',
        'md:mr-2 md:min-h-0 md:w-57.5 md:px-2.75 md:py-1.75 md:text-[14px]',
        className,
      )}
      {...inputProps}
    />
  )
}
