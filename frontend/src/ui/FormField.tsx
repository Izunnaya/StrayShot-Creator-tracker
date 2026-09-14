import type { ReactNode } from 'react'
import { joinClassNames } from '@/lib/classNames'

/**
 * The pieces every form in the application is built from, so the payment,
 * campaign and creator forms agree on how a field looks.
 *
 * Sizes follow the design at each width: 14px text in a 10px-by-12px field
 * from md up, and on a phone 16px text in a field at least 48px tall. The
 * 16px is not a style choice — anything smaller makes iOS zoom the page when
 * the field is focused.
 */

const fieldBoxClasses =
  'w-full min-h-12 border bg-sunk px-3.5 py-3 text-[16px] md:min-h-0 md:px-3 md:py-2.5 md:text-[14px] [color-scheme:dark]'

export const fieldInputClasses = `${fieldBoxClasses} border-hair text-ink`

/**
 * An input the design draws in amber, for the one value a form is about.
 * A complete class list rather than additions to the plain one: two border
 * colours on one element resolve by stylesheet order, not by which came last.
 */
export const emphasisedFieldInputClasses = `${fieldBoxClasses} border-amber font-semibold text-amber`

/** For references and account details, compared character by character. */
export const monoFieldInputClasses =
  'w-full min-h-12 border border-hair bg-sunk px-3.5 py-3 font-mono text-[16px] text-ink md:min-h-0 md:px-3 md:py-2.5 md:text-[13px] md:tracking-[0.5px]'

/** Cancel and the main action: side by side on a phone, right-aligned from md up. */
export const dialogActionsClasses =
  'grid grid-cols-[1fr_1.4fr] gap-2.5 md:flex md:justify-end md:gap-3'

export function FormField({
  label,
  className,
  children,
}: {
  label: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 text-[11px] uppercase tracking-[1.5px] text-ink-muted">{label}</div>
      {children}
    </div>
  )
}

/** A field's label with a quieter qualifier after it, as in "Notes · team only". */
export function LabelNote({
  children,
  tone = 'quiet',
}: {
  children: ReactNode
  tone?: 'quiet' | 'accent'
}) {
  return (
    <span className={joinClassNames(tone === 'accent' ? 'text-amber' : 'text-ink-faint')}>
      {' · '}
      {children}
    </span>
  )
}
