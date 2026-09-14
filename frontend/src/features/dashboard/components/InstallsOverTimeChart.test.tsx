// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { InstallsOverTimeChart } from './InstallsOverTimeChart'

/**
 * A campaign whose creators have streamed but whose installs have not landed
 * yet is a real state, not an empty one — the stream days are exactly what
 * the team is looking at while they wait. These tests hold the chart to that.
 */

afterEach(cleanup)

const weekLabels = ['Jul 19', 'Jul 26']

describe('when no installs have landed yet', () => {
  const zeroCounts = [0, 0, 0, 0]
  const markers = [
    { dayIndex: 1, creatorCode: 'RAZE' },
    { dayIndex: 3, creatorCode: 'NOVA' },
  ]

  it('still draws the chart rather than replacing it with a sentence', () => {
    render(
      <InstallsOverTimeChart
        dailyInstallCounts={zeroCounts}
        streamDayMarkers={markers}
        weekLabels={weekLabels}
      />,
    )

    expect(screen.getByRole('img')).toBeTruthy()
  })

  it('keeps the stream days visible in the chart and in the daily table', () => {
    const { container } = render(
      <InstallsOverTimeChart
        dailyInstallCounts={zeroCounts}
        streamDayMarkers={markers}
        weekLabels={weekLabels}
      />,
    )

    expect(container.querySelectorAll('line[stroke-dasharray]')).toHaveLength(2)

    const dailyTable = within(screen.getByRole('table'))
    expect(dailyTable.getByText('RAZE')).toBeTruthy()
    expect(dailyTable.getByText('NOVA')).toBeTruthy()
  })

  it('describes the empty series to screen readers instead of a peak of zero', () => {
    render(
      <InstallsOverTimeChart
        dailyInstallCounts={zeroCounts}
        streamDayMarkers={markers}
        weekLabels={weekLabels}
      />,
    )

    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'No installs for selected creators in this period. 2 stream days marked.',
    )
    expect(screen.getByRole('status').textContent).toContain('dashed lines still mark')
  })

  it('falls back to a whole-number axis rather than deriving one from zero', () => {
    render(
      <InstallsOverTimeChart
        dailyInstallCounts={zeroCounts}
        streamDayMarkers={markers}
        weekLabels={weekLabels}
      />,
    )

    // Deriving the scale from a peak of zero would leave every coordinate NaN.
    const svg = screen.getByRole('img')
    const coordinates = [
      ...[...svg.querySelectorAll('line')].flatMap((line) => [
        line.getAttribute('y1'),
        line.getAttribute('y2'),
      ]),
      svg.querySelector('polyline')?.getAttribute('points'),
    ]
    expect(coordinates.join(' ')).not.toContain('NaN')
  })

  it('says so plainly when nobody streamed either', () => {
    render(
      <InstallsOverTimeChart
        dailyInstallCounts={zeroCounts}
        streamDayMarkers={[]}
        weekLabels={weekLabels}
      />,
    )

    expect(screen.getByRole('status').textContent).toContain('No installs or streams')
    expect(screen.getByRole('img')).toBeTruthy()
  })
})

describe('when there is no reporting period at all', () => {
  it('has nothing to plot markers against, and says so', () => {
    render(
      <InstallsOverTimeChart
        dailyInstallCounts={[]}
        streamDayMarkers={[{ dayIndex: 0, creatorCode: 'RAZE' }]}
        weekLabels={[]}
      />,
    )

    expect(screen.getByRole('status').textContent).toContain('No reporting period')
    expect(screen.queryByRole('img')).toBeNull()
  })
})

describe('when installs have landed', () => {
  it('scales the axis to the peak and keeps ticks whole', () => {
    render(
      <InstallsOverTimeChart
        dailyInstallCounts={[100, 905, 300]}
        streamDayMarkers={[]}
        weekLabels={weekLabels}
      />,
    )

    // 905 rounds up to four intervals of 300, so the scale tops out at 1,200.
    const svg = screen.getByRole('img')
    expect(svg.getAttribute('aria-label')).toBe(
      'Daily installs for selected creators. Peak 905 installs; vertical scale zero to 1,200.',
    )
    // The peak day reaches 905/1200 of the plot's 175-unit height above the baseline at 190.
    const points = svg.querySelector('polyline')?.getAttribute('points')?.split(' ')
    expect(Number(points?.[1]?.split(',')[1])).toBeCloseTo(190 - (905 / 1200) * 175)
    expect(screen.queryByRole('status')).toBeNull()
  })
})
