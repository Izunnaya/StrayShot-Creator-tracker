import type { ReactNode } from 'react'
import { joinClassNames } from '../lib/classNames'

/**
 * A bordered box on the dark ground. The amber frame is reserved for panels
 * the design gives extra weight to, such as the summary strip and the
 * creator portal's code panel.
 */
export function Panel({
  children,
  className,
  hasAmberFrame = false,
}: {
  children: ReactNode
  className?: string
  hasAmberFrame?: boolean
}) {
  return (
    <div
      className={joinClassNames(
        'bg-panel border',
        hasAmberFrame ? 'border-amber' : 'border-hair',
        className,
      )}
    >
      {children}
    </div>
  )
}
