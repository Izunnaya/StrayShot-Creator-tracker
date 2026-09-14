import type { StreamDayMarker } from '@/data/types'
import { formatNumber } from '@/lib/format'

/* The design's drawing box: 1000 wide by 200 tall, stretched to the panel's
   width, with the plot running from 15 to 190 and the dashed stream lines
   rising a little above it. */
const WIDTH = 1000
const HEIGHT = 200
const TOP = 15
const BOTTOM = 190
const MARKER_TOP = 8

export function InstallsOverTimeChart({
  dailyInstallCounts,
  streamDayMarkers,
  weekLabels,
}: {
  dailyInstallCounts: number[]
  streamDayMarkers: StreamDayMarker[]
  weekLabels: string[]
}) {
  // Only a missing reporting window leaves nothing to draw. A window with no
  // installs still has something to say — which days creators streamed — so
  // it renders as a chart rather than a sentence.
  if (dailyInstallCounts.length === 0) {
    return (
      <p className="py-8 text-[14px] text-ink-muted" role="status">
        No reporting period for the selected creators.
      </p>
    )
  }

  const peak = dailyInstallCounts.reduce((max, count) => Math.max(max, count), 0)
  const hasInstalls = peak > 0
  /**
   * Round upward to four readable intervals, never finer than one install
   * since installs are whole. An all-zero series takes a 0-4 scale instead:
   * deriving the scale from a peak of zero would put log10(0) into the
   * magnitude and leave every coordinate NaN.
   *
   * The design draws no figures up the side; the scale is given to screen
   * readers in the chart's label instead.
   */
  const intervalMagnitude = hasInstalls ? 10 ** Math.floor(Math.log10(peak / 4)) : 1
  const interval = hasInstalls
    ? Math.max(1, Math.ceil(peak / 4 / intervalMagnitude) * intervalMagnitude)
    : 1
  const maximum = interval * 4
  const lastIndex = dailyInstallCounts.length - 1
  const x = (index: number) => (lastIndex === 0 ? WIDTH / 2 : (index / lastIndex) * WIDTH)
  const y = (count: number) => BOTTOM - (count / maximum) * (BOTTOM - TOP)
  const points = dailyInstallCounts.map((count, index) => x(index) + ',' + y(count)).join(' ')
  const areaPath =
    'M' +
    x(0) +
    ',' +
    BOTTOM +
    ' L' +
    points.split(' ').join(' L') +
    ' L' +
    x(lastIndex) +
    ',' +
    BOTTOM +
    ' Z'

  const markers = streamDayMarkers.filter(
    (marker) => marker.dayIndex >= 0 && marker.dayIndex < dailyInstallCounts.length,
  )
  const codesByDay = new Map<number, string[]>()
  for (const marker of markers) {
    codesByDay.set(marker.dayIndex, [
      ...(codesByDay.get(marker.dayIndex) ?? []),
      marker.creatorCode,
    ])
  }
  const percentAcross = (dayIndex: number) => (x(dayIndex) / WIDTH) * 100

  /* A label per stream day, under its line. A day several creators streamed
     names the first and counts the rest, and a label that would land on top
     of the one before it is left off: the dashed line still marks the day,
     and the table below still names everyone. */
  const MIN_LABEL_GAP_PERCENT = 7
  const streamDayLabels: { dayIndex: number; text: string }[] = []
  for (const [dayIndex, codes] of [...codesByDay].sort(([a], [b]) => a - b)) {
    const previous = streamDayLabels[streamDayLabels.length - 1]
    if (
      previous &&
      percentAcross(dayIndex) - percentAcross(previous.dayIndex) < MIN_LABEL_GAP_PERCENT
    ) {
      continue
    }
    streamDayLabels.push({
      dayIndex,
      text: codes.length > 1 ? `${codes[0]} +${codes.length - 1}` : codes[0]!,
    })
  }

  return (
    <div>
      {!hasInstalls && (
        <p className="pb-2 text-[13px] text-ink-muted" role="status">
          {markers.length > 0
            ? 'No installs in this reporting period. The dashed lines still mark the days creators streamed.'
            : 'No installs or streams in this reporting period for the selected creators.'}
        </p>
      )}
      <svg
        width="100%"
        height={HEIGHT}
        viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT}
        preserveAspectRatio="none"
        className="block"
        role="img"
        aria-label={
          hasInstalls
            ? 'Daily installs for selected creators. Peak ' +
              formatNumber(peak) +
              ' installs; vertical scale zero to ' +
              formatNumber(maximum) +
              '.'
            : 'No installs for selected creators in this period. ' +
              codesByDay.size +
              (codesByDay.size === 1 ? ' stream day marked.' : ' stream days marked.')
        }
      >
        <title>Installs per day; dashed lines mark stream days</title>
        {/* Guides at the top of the plot and a third of the way down twice,
            as the design rules it. They give the eye a level to read against
            rather than marking values. */}
        {[0, 1, 2].map((step) => {
          const guideY = TOP + (step * (BOTTOM - TOP)) / 3
          return (
            <line
              key={step}
              x1={0}
              x2={WIDTH}
              y1={guideY}
              y2={guideY}
              stroke="var(--color-hair-2)"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
        <line
          x1={0}
          x2={WIDTH}
          y1={BOTTOM}
          y2={BOTTOM}
          stroke="var(--color-hair)"
          vectorEffect="non-scaling-stroke"
        />
        {[...codesByDay].map(([dayIndex, codes]) => (
          <line
            key={dayIndex}
            x1={x(dayIndex)}
            x2={x(dayIndex)}
            y1={MARKER_TOP}
            y2={BOTTOM}
            stroke="rgba(255, 194, 10, 0.35)"
            strokeDasharray="3 5"
            vectorEffect="non-scaling-stroke"
          >
            <title>{codes.join(', ')}</title>
          </line>
        ))}
        <path d={areaPath} fill="var(--color-amber)" fillOpacity="0.07" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-amber)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {dailyInstallCounts.length === 1 && (
          <circle cx={x(0)} cy={y(dailyInstallCounts[0])} r="4" fill="var(--color-amber)" />
        )}
      </svg>

      {/* The codes of whoever streamed, under their dashed lines. Decorative
          here: the same information is in the table below for screen
          readers, where it can be read in order. */}
      <div aria-hidden="true" className="relative mt-1.5 h-4 overflow-hidden">
        {streamDayLabels.map(({ dayIndex, text }) => (
          <span
            key={dayIndex}
            className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] tracking-[1px] text-amber-dim"
            style={{ left: `${percentAcross(dayIndex)}%` }}
          >
            {text}
          </span>
        ))}
      </div>

      <div className="mt-2 flex justify-between gap-1 text-[11px] text-ink-muted">
        {weekLabels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Daily installs and creators who streamed, by day of the reporting period</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Installs</th>
            <th scope="col">Creators streamed</th>
          </tr>
        </thead>
        <tbody>
          {dailyInstallCounts.map((count, index) => (
            <tr key={index}>
              <th scope="row">{index + 1}</th>
              <td>{formatNumber(count)}</td>
              <td>{codesByDay.get(index)?.join(', ') ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
