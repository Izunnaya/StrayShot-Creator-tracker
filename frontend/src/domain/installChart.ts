import type { Creator, DailyInstall, InstallChartData, Stream } from '@/data/types'

const DAY_MS = 86400000

/** Aggregates only selected creators within the explicit reporting window. */
export function buildInstallChart(
  dailyInstalls: DailyInstall[],
  streams: Stream[],
  creators: Creator[],
  startDate: string,
  dayCount: number,
): InstallChartData {
  const start = Date.parse(startDate)
  const dailyInstallCounts = Array.from({ length: dayCount }, () => 0)
  const creatorCodes = new Map(creators.map((creator) => [creator.id, creator.creatorCode]))
  const dayIndexFor = (date: string) => (Date.parse(date) - start) / DAY_MS
  const inWindow = (index: number) => Number.isInteger(index) && index >= 0 && index < dayCount

  for (const record of dailyInstalls) {
    const index = dayIndexFor(record.installedOn)
    if (creatorCodes.has(record.creatorId) && inWindow(index)) {
      dailyInstallCounts[index] += record.installs
    }
  }

  const seen = new Set<string>()
  const streamDayMarkers = streams
    .flatMap((stream) => {
      const dayIndex = dayIndexFor(stream.streamedOn)
      const creatorCode = creatorCodes.get(stream.creatorId)
      const key = stream.creatorId + ':' + dayIndex
      if (creatorCode === undefined || !inWindow(dayIndex) || seen.has(key)) return []
      seen.add(key)
      return [{ dayIndex, creatorCode }]
    })
    .sort((a, b) => a.dayIndex - b.dayIndex)

  const weekLabels = Array.from({ length: dayCount }, (_, index) => index)
    .filter((index) => index % 7 === 0 || index === dayCount - 1)
    .map((index) =>
      new Date(start + index * DAY_MS).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }),
    )

  return { dailyInstallCounts, streamDayMarkers, weekLabels }
}
