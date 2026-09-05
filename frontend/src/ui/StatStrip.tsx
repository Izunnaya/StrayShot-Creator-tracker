import type { ReactNode } from 'react'
import { joinClassNames } from '../lib/classNames'
import { Label } from './Label'

/**
 * The row of headline figures at the top of a screen. Strip and tile live in
 * one file because a tile is only ever used inside a strip — the hairline
 * gaps between tiles come from the strip's grid, so they are one component
 * in two parts rather than two independent pieces.
 */

export function StatStrip({
  children,
  hasAmberFrame = true,
  columnCount = 4,
}: {
  children: ReactNode
  hasAmberFrame?: boolean
  columnCount?: 3 | 4
}) {
  return (
    <div
      className={joinClassNames(
        'grid gap-px bg-hair border grid-cols-2',
        columnCount === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3',
        hasAmberFrame ? 'border-amber' : 'border-hair',
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
  tone = 'neutral',
}: {
  label: string
  value: string
  /** The smaller line under the figure, giving it context. */
  supportingText?: string
  tone?: StatTileTone
}) {
  return (
    <div className="bg-panel px-5.5 py-4.5">
      <Label className="mb-1.5">{label}</Label>
      <div className={joinClassNames('font-head font-semibold text-[38px] leading-none', toneClasses[tone])}>
        {value}
      </div>
      {supportingText && <div className="mt-1 text-[12px] text-ink-muted">{supportingText}</div>}
    </div>
  )
}
