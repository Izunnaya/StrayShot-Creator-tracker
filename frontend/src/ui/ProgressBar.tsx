import { joinClassNames } from '../lib/classNames'

/**
 * Progress against an agreed amount.
 *
 * The fill carries the meaning: angled amber stripes while a balance is only
 * part paid, solid green once it closes. That rule lives here rather than at
 * the call sites so every bar in the app agrees on what "settled" looks like.
 */
export function ProgressBar({
  percentComplete,
  heightInPixels = 4,
}: {
  percentComplete: number
  heightInPixels?: number
}) {
  const isFullySettled = percentComplete >= 100

  return (
    <div className="bg-hair-2" style={{ height: heightInPixels }}>
      <div
        className={joinClassNames(
          'h-full transition-[width] duration-450',
          isFullySettled ? 'bg-good' : 'bar-partial',
        )}
        style={{ width: Math.min(100, percentComplete) + '%' }}
      />
    </div>
  )
}
