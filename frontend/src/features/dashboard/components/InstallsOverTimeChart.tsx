import type { StreamDayMarker } from '@/data/types'
import { formatNumber } from '@/lib/format'

const WIDTH = 1000
const HEIGHT = 220
const LEFT = 62
const RIGHT = 984
const TOP = 16
const BOTTOM = 190

export function InstallsOverTimeChart({
  dailyInstallCounts,
  streamDayMarkers,
  weekLabels,
}: {
  dailyInstallCounts: number[]
  streamDayMarkers: StreamDayMarker[]
  weekLabels: string[]
}) {
  if (dailyInstallCounts.length === 0 || dailyInstallCounts.every((count) => count === 0)) {
    return (
      <p className="py-8 text-[14px] text-ink-muted" role="status">
        No installs in this reporting period for the selected creators.
      </p>
    )
  }

  const peak = dailyInstallCounts.reduce((max, count) => Math.max(max, count), 0)
  // Round upward to four readable intervals.
  const intervalMagnitude = 10 ** Math.floor(Math.log10(peak / 4))
  const interval = Math.ceil(peak / 4 / intervalMagnitude) * intervalMagnitude
  const maximum = interval * 4
  const x = (index: number) =>
    dailyInstallCounts.length === 1
      ? (LEFT + RIGHT) / 2
      : LEFT + (index / (dailyInstallCounts.length - 1)) * (RIGHT - LEFT)
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
    x(dailyInstallCounts.length - 1) +
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

  return (
    <div>
      <svg
        width="100%"
        height={HEIGHT}
        viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT}
        className="block"
        role="img"
        aria-label={
          'Daily installs for selected creators. Peak ' +
          formatNumber(peak) +
          ' installs; vertical scale zero to ' +
          formatNumber(maximum) +
          '.'
        }
      >
        <title>Installs per day; dashed lines mark stream days</title>
        {[0, 1, 2, 3, 4].map((step) => {
          const value = step * interval
          return (
            <g key={step}>
              <line
                x1={LEFT}
                x2={RIGHT}
                y1={y(value)}
                y2={y(value)}
                stroke="var(--color-hair-2)"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={LEFT - 8}
                y={y(value) + 4}
                textAnchor="end"
                fontSize="12"
                fill="var(--color-ink-muted)"
              >
                {formatNumber(value)}
              </text>
            </g>
          )
        })}
        {[...codesByDay].map(([dayIndex, codes]) => (
          <line
            key={dayIndex}
            x1={x(dayIndex)}
            x2={x(dayIndex)}
            y1={TOP}
            y2={BOTTOM}
            stroke="var(--color-amber-dim)"
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
      <div className="flex justify-between gap-1 text-[11px] text-ink-muted">
        {weekLabels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
      <details className="mt-3 text-[12px] text-ink-muted">
        <summary className="cursor-pointer focus-visible:outline-2 focus-visible:outline-amber">
          Daily values and stream markers
        </summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">
            Daily installs and creators who streamed, by day of the reporting period
          </caption>
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
      </details>
    </div>
  )
}
