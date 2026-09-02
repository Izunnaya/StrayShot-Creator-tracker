import type { ReactNode } from 'react'
import { joinClassNames } from '../lib/classNames'

/**
 * The small uppercase caption that sits above a figure or a form field.
 * Used for "Paid to date", "Campaign", "Status" and every field label.
 */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={joinClassNames('text-[11px] uppercase tracking-[2px] text-ink-muted', className)}>
      {children}
    </div>
  )
}
