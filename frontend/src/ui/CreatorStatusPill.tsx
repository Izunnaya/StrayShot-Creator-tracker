import type { CreatorLifecycleStatus } from '@/data/types'
import { joinClassNames } from '@/lib/classNames'

/**
 * Where a creator sits in the working relationship. Each status gets its own
 * treatment so the column can be read at a glance: dashed and grey for a
 * prospect who is not yet committed, amber for someone actively delivering,
 * green once everything is delivered and paid.
 */
const statusClasses: Record<CreatorLifecycleStatus, string> = {
  prospect: 'text-ink-muted border border-dashed border-hair-6',
  contracted: 'text-amber-mid border border-amber/40',
  active: 'bg-amber text-ground border border-amber',
  completed: 'text-good border border-good/45',
}

export function CreatorStatusPill({
  status,
  size = 'regular',
}: {
  status: CreatorLifecycleStatus
  /** "small" on the phone cards and the phone creator screen. */
  size?: 'regular' | 'small'
}) {
  return (
    <span
      className={joinClassNames(
        'shrink-0 whitespace-nowrap font-semibold uppercase tracking-[1px]',
        size === 'small' ? 'px-2 py-0.75 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        statusClasses[status],
      )}
    >
      {status}
    </span>
  )
}
