import type { StreamingPlatform } from '../data/types'
import { joinClassNames } from '../lib/classNames'

/** Which platform a creator streams on. Twitch carries its own purple. */
export function PlatformTag({ platform }: { platform: StreamingPlatform }) {
  return (
    <span
      className={joinClassNames(
        'border border-hair px-2 py-0.5 text-[12px] font-semibold uppercase tracking-[1px]',
        platform === 'YouTube' ? 'text-ink-bright' : 'text-twitch',
      )}
    >
      {platform}
    </span>
  )
}
