import type { StreamDayMarker } from '../../../data/fixtures'

/**
 * Installs per day over the campaign, with a dashed marker on every day a
 * creator streamed — the whole point of the chart is to show whether the
 * spikes line up with the streams.
 *
 * Drawn as a plain SVG rather than with a charting library: it is one line,
 * one area fill and a handful of markers, and a library would fight the
 * design over grid lines and label placement for no benefit.
 */

/** The chart is drawn in this coordinate space and stretched to fit its box. */
const VIEWBOX_WIDTH = 1000
const VIEWBOX_HEIGHT = 200

/** Vertical space the line is allowed to use, leaving room for the axis. */
const PLOT_TOP = 16
const PLOT_BOTTOM = 188
const BASELINE_Y = 190

/** Installs at the top of the chart. Fixed so the shape stays comparable. */
const INSTALLS_AT_FULL_HEIGHT = 1000

const HORIZONTAL_GRID_LINE_HEIGHTS = [15, 73, 131]

export function InstallsOverTimeChart({
  dailyInstallCounts,
  streamDayMarkers,
  weekLabels,
}: {
  dailyInstallCounts: number[]
  streamDayMarkers: StreamDayMarker[]
  weekLabels: string[]
}) {
  const lastDayIndex = dailyInstallCounts.length - 1

  /** Where a given day sits across the chart, in viewBox units. */
  const horizontalPositionForDay = (dayIndex: number) =>
    (dayIndex / lastDayIndex) * VIEWBOX_WIDTH

  /** Where a given install count sits vertically, in viewBox units. */
  const verticalPositionForInstalls = (installCount: number) =>
    PLOT_BOTTOM - (installCount / INSTALLS_AT_FULL_HEIGHT) * (PLOT_BOTTOM - PLOT_TOP)

  const linePoints = dailyInstallCounts
    .map(
      (installCount, dayIndex) =>
        `${horizontalPositionForDay(dayIndex).toFixed(1)},${verticalPositionForInstalls(installCount).toFixed(1)}`,
    )
    .join(' ')

  /** The line, closed down to the baseline at both ends to make a fillable shape. */
  const areaPath = `M0,${BASELINE_Y} L${linePoints.split(' ').join(' L')} L${VIEWBOX_WIDTH},${BASELINE_Y} Z`

  return (
    <>
      <svg
        width="100%"
        height={VIEWBOX_HEIGHT}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        className="block"
        role="img"
        aria-label="Installs per day over the last six weeks, with stream days marked"
      >
        {HORIZONTAL_GRID_LINE_HEIGHTS.map((gridLineY) => (
          <line
            key={gridLineY}
            x1="0"
            y1={gridLineY}
            x2={VIEWBOX_WIDTH}
            y2={gridLineY}
            stroke="#242424"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <line
          x1="0"
          y1={BASELINE_Y}
          x2={VIEWBOX_WIDTH}
          y2={BASELINE_Y}
          stroke="#2A2A2A"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {streamDayMarkers.map((marker, markerIndex) => {
          const x = horizontalPositionForDay(marker.dayIndex).toFixed(1)
          return (
            <line
              key={`${marker.creatorCode}-${markerIndex}`}
              x1={x}
              x2={x}
              y1="8"
              y2={BASELINE_Y}
              stroke="rgba(255,194,10,0.35)"
              strokeWidth="1"
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}

        <path d={areaPath} fill="rgba(255,194,10,0.07)" />

        <polyline
          points={linePoints}
          fill="none"
          stroke="#FFC20A"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Creator codes under each stream-day marker, positioned as percentages
          so they track the markers when the chart stretches. */}
      <div className="relative mt-1.5 h-4">
        {streamDayMarkers.map((marker, markerIndex) => (
          <span
            key={`${marker.creatorCode}-label-${markerIndex}`}
            className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] tracking-[1px] text-amber-dim"
            style={{ left: (marker.dayIndex / lastDayIndex) * 100 + '%' }}
          >
            {marker.creatorCode}
          </span>
        ))}
      </div>

      <div className="mt-2 flex justify-between">
        {weekLabels.map((weekLabel) => (
          <span key={weekLabel} className="text-[11px] text-ink-muted">
            {weekLabel}
          </span>
        ))}
      </div>
    </>
  )
}
