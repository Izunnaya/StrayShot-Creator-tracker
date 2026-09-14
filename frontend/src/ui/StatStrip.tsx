import type { ReactNode } from 'react'
import { joinClassNames } from '@/lib/classNames'

/**
 * The row of headline figures at the top of a screen. Strip and tile live in
 * one file because a tile is only ever used inside a strip — the hairline
 * gaps between tiles come from the strip's layout, so they are one component
 * in two parts rather than two independent pieces.
 *
 * From md up the strip is the design's single row of framed tiles. Below md
 * it breaks into two columns bleeding to the screen edges, finished one of
 * two ways, chosen by the caller: "banner" with an amber rule beneath it, as
 * the overview heads the screen with it, or "inset" between hairlines, as the
 * creator screen sets it under the creator's header.
 */

export function StatStrip({
  children,
  hasAmberFrame = true,
  columnCount = 4,
  mobileLayout = 'inset',
}: {
  children: ReactNode
  hasAmberFrame?: boolean
  columnCount?: 3 | 4
  mobileLayout?: 'banner' | 'inset'
}) {
  return (
    <div
      className={joinClassNames(
        'grid grid-cols-2 gap-px bg-hair md:border',
        columnCount === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3',
        hasAmberFrame ? 'md:border-amber' : 'md:border-hair',
        mobileLayout === 'banner' ? 'border-b border-amber' : 'border-y border-hair',
        /* Bleeds to the screen edge below md, through the page's side padding. */
        '-mx-4 sm:-mx-6 md:mx-0',
      )}
    >
      {children}
    </div>
  )
}

/** How much visual weight the figure carries, by meaning rather than colour. */
export type StatTileTone = 'neutral' | 'accent' | 'needsAttention' | 'settled'

const toneClasses: Record<StatTileTone, string> = {
  neutral: 'text-ink',
  accent: 'text-amber',
  needsAttention: 'text-bad',
  settled: 'text-good',
}

export function StatTile({
  label,
  value,
  supportingText,
  phoneLabel,
  phoneSupportingText,
  tone = 'neutral',
  size = 'large',
}: {
  label: string
  value: string
  /** The smaller line under the figure, giving it context. */
  supportingText?: string
  /** The shorter caption the phone design uses, where it differs. */
  phoneLabel?: string
  /** The shorter supporting line the phone design uses, where it differs. */
  phoneSupportingText?: string
  tone?: StatTileTone
  /**
   * "large" for a screen's headline figures, "compact" where the strip is
   * supporting detail rather than the point of the screen — as on the
   * creator detail screen, which leads with the creator, not the numbers.
   */
  size?: 'large' | 'compact'
}) {
  return (
    <div
      className={joinClassNames(
        /* min-w-0 and truncation keep a long figure inside its half of a
           phone screen rather than pushing the grid wider than the page. */
        'min-w-0 bg-panel px-4 py-3.25',
        size === 'large' ? 'md:px-5.5 md:py-4.5' : 'md:px-4.5 md:py-3.5',
      )}
    >
      <div
        className={joinClassNames(
          'truncate text-[10px] uppercase tracking-[1.5px] text-ink-muted md:text-[11px] md:tracking-[2px]',
          size === 'large' ? 'mb-1.25 md:mb-1.5' : 'mb-1',
        )}
      >
        <ResponsiveText wide={label} phone={phoneLabel} />
      </div>
      <div
        className={joinClassNames(
          'truncate font-head font-semibold',
          size === 'large'
            ? 'text-[26px] leading-[1.25] md:text-[38px] md:leading-none'
            : 'text-[24px] leading-none md:text-[28px]',
          toneClasses[tone],
        )}
      >
        {value}
      </div>
      {supportingText && (
        <div className="mt-1 truncate text-[11px] text-ink-dim md:text-[12px] md:text-ink-muted">
          <ResponsiveText wide={supportingText} phone={phoneSupportingText} />
        </div>
      )}
    </div>
  )
}

/**
 * Text that reads differently on a phone. Only one of the two is ever
 * displayed, so assistive technology meets one of them.
 */
function ResponsiveText({ wide, phone }: { wide: string; phone?: string }) {
  if (phone === undefined || phone === wide) return <>{wide}</>
  return (
    <>
      <span className="md:hidden">{phone}</span>
      <span className="hidden md:inline">{wide}</span>
    </>
  )
}
