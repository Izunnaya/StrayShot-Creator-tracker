import type { ReactNode } from 'react'
import { joinClassNames } from '../lib/classNames'

/**
 * A panel or section heading in the house style: condensed uppercase, where
 * part of the phrase is usually wrapped in an accent colour by the caller,
 * as in "Installs <span className="text-amber">over time</span>".
 */
export function SectionTitle({
  children,
  size = 'medium',
  className,
}: {
  children: ReactNode
  /** "small" for panel headings, "medium" for the main section headings. */
  size?: 'small' | 'medium'
  className?: string
}) {
  return (
    <div
      className={joinClassNames(
        'font-head font-semibold uppercase tracking-[2px] text-ink',
        size === 'small' ? 'text-[14px]' : 'text-[16px]',
        className,
      )}
    >
      {children}
    </div>
  )
}
