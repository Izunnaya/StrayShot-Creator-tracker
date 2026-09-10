import type { Campaign, Creator, DailyInstall, Payment, Stream } from './types'

/* Static fixture data, carried over from the design prototype so the static
   screens show the same figures the design was reviewed against. Phase 3
   replaces this module with the API; nothing else should need to change. */

const createPayment = (payment: Payment): Payment => payment

export const campaigns: Campaign[] = [
  {
    id: 1,
    name: 'Season 2 Launch',
    startDate: '2026-07-15',
    endDate: '2026-09-15',
    totalBudgetInCents: 3000000,
    targetCostPerInstallInCents: 350,
  },
  {
    id: 2,
    name: 'Clan Wars Update',
    startDate: '2026-07-28',
    endDate: '2026-09-30',
    totalBudgetInCents: 2200000,
    targetCostPerInstallInCents: 300,
  },
]

export const creators: Creator[] = [
  {
    id: 1,
    name: 'NovaKess',
    platform: 'Twitch',
    creatorCode: 'NOVA',
    campaignName: 'Season 2 Launch',
    streamsCommitted: 3,
    streamsDelivered: 3,
    totalViews: 298000,
    peakConcurrentViewers: 6400,
    installsAttributed: 4210,
    contractedAmountInCents: 480000,
    agreedRatePerStreamInCents: 160000,
    audienceSize: '412K',
    channelUrl: 'twitch.tv/novakess',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 101,
        paidOn: '2026-07-24',
        amountInCents: 160000,
        method: 'Bank transfer',
        reference: 'TRF-2291-04',
        recordedBy: 'A. Raouf',
      }),
      createPayment({
        id: 102,
        paidOn: '2026-08-14',
        amountInCents: 160000,
        method: 'Bank transfer',
        reference: 'TRF-2413-11',
        recordedBy: 'A. Raouf',
      }),
    ],
  },
  {
    id: 2,
    name: 'RazeHavoc',
    platform: 'YouTube',
    creatorCode: 'RAZE',
    campaignName: 'Season 2 Launch',
    streamsCommitted: 4,
    streamsDelivered: 4,
    totalViews: 412000,
    peakConcurrentViewers: 8900,
    installsAttributed: 6120,
    contractedAmountInCents: 900000,
    agreedRatePerStreamInCents: 225000,
    audienceSize: '640K',
    channelUrl: 'youtube.com/@razehavoc',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 103,
        paidOn: '2026-07-18',
        amountInCents: 450000,
        method: 'Wise',
        reference: 'WISE-7710-A',
        recordedBy: 'M. Devlin',
      }),
      createPayment({
        id: 104,
        paidOn: '2026-08-20',
        amountInCents: 450000,
        method: 'Wise',
        reference: 'WISE-8842-B',
        recordedBy: 'M. Devlin',
      }),
    ],
  },
  {
    id: 3,
    name: 'PixelMara',
    platform: 'Twitch',
    creatorCode: 'MARA',
    campaignName: 'Clan Wars Update',
    streamsCommitted: 3,
    streamsDelivered: 2,
    totalViews: 151000,
    peakConcurrentViewers: 3900,
    installsAttributed: 2140,
    contractedAmountInCents: 320000,
    agreedRatePerStreamInCents: 106700,
    audienceSize: '188K',
    channelUrl: 'twitch.tv/pixelmara',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 105,
        paidOn: '2026-07-30',
        amountInCents: 320000,
        method: 'PayPal',
        reference: 'PP-5521-K',
        recordedBy: 'M. Devlin',
      }),
    ],
  },
  {
    id: 4,
    name: 'GrimTactix',
    platform: 'YouTube',
    creatorCode: 'GRIM',
    campaignName: 'Season 2 Launch',
    streamsCommitted: 3,
    streamsDelivered: 3,
    totalViews: 265000,
    peakConcurrentViewers: 5100,
    installsAttributed: 3980,
    contractedAmountInCents: 600000,
    agreedRatePerStreamInCents: 200000,
    audienceSize: '520K',
    channelUrl: 'youtube.com/@grimtactix',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 106,
        paidOn: '2026-07-21',
        amountInCents: 300000,
        method: 'Bank transfer',
        reference: 'TRF-2280-09',
        recordedBy: 'A. Raouf',
      }),
      createPayment({
        id: 107,
        paidOn: '2026-08-18',
        amountInCents: 150000,
        method: 'Bank transfer',
        reference: 'TRF-2451-02',
        recordedBy: 'A. Raouf',
      }),
    ],
  },
  {
    id: 5,
    name: 'DeadeyeDee',
    platform: 'YouTube',
    creatorCode: 'DEE',
    campaignName: 'Clan Wars Update',
    streamsCommitted: 5,
    streamsDelivered: 5,
    totalViews: 340000,
    peakConcurrentViewers: 7200,
    installsAttributed: 3010,
    contractedAmountInCents: 750000,
    agreedRatePerStreamInCents: 150000,
    audienceSize: '710K',
    channelUrl: 'youtube.com/@deadeyedee',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 108,
        paidOn: '2026-07-16',
        amountInCents: 375000,
        method: 'Wise',
        reference: 'WISE-7702-C',
        recordedBy: 'M. Devlin',
      }),
      createPayment({
        id: 109,
        paidOn: '2026-08-22',
        amountInCents: 375000,
        method: 'Wise',
        reference: 'WISE-8901-D',
        recordedBy: 'M. Devlin',
      }),
    ],
  },
  {
    id: 6,
    name: 'SableFPS',
    platform: 'Twitch',
    creatorCode: 'SABLE',
    campaignName: 'Clan Wars Update',
    streamsCommitted: 2,
    streamsDelivered: 2,
    totalViews: 96000,
    peakConcurrentViewers: 2600,
    installsAttributed: 860,
    contractedAmountInCents: 240000,
    agreedRatePerStreamInCents: 120000,
    audienceSize: '145K',
    channelUrl: 'twitch.tv/sablefps',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 110,
        paidOn: '2026-08-06',
        amountInCents: 240000,
        method: 'PayPal',
        reference: 'PP-5610-M',
        recordedBy: 'A. Raouf',
      }),
    ],
  },
  {
    id: 7,
    name: 'TorqueOG',
    platform: 'YouTube',
    creatorCode: 'TORQ',
    campaignName: 'Season 2 Launch',
    streamsCommitted: 2,
    streamsDelivered: 2,
    totalViews: 188000,
    peakConcurrentViewers: 4400,
    installsAttributed: 1620,
    contractedAmountInCents: 500000,
    agreedRatePerStreamInCents: 250000,
    audienceSize: '480K',
    channelUrl: 'youtube.com/@torqueog',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 111,
        paidOn: '2026-07-27',
        amountInCents: 250000,
        method: 'Bank transfer',
        reference: 'TRF-2334-06',
        recordedBy: 'A. Raouf',
      }),
    ],
  },
  {
    id: 8,
    name: 'MiraPlays',
    platform: 'Twitch',
    creatorCode: 'MIRA',
    campaignName: 'Clan Wars Update',
    streamsCommitted: 3,
    streamsDelivered: 2,
    totalViews: 74000,
    peakConcurrentViewers: 1900,
    installsAttributed: 540,
    contractedAmountInCents: 180000,
    agreedRatePerStreamInCents: 60000,
    audienceSize: '92K',
    channelUrl: 'twitch.tv/miraplays',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 112,
        paidOn: '2026-08-02',
        amountInCents: 180000,
        method: 'USDC',
        reference: '0x4f9c...8b21',
        recordedBy: 'K. Osei',
      }),
    ],
  },
  {
    id: 9,
    name: 'IronLotus',
    platform: 'YouTube',
    creatorCode: 'LOTUS',
    campaignName: 'Season 2 Launch',
    streamsCommitted: 2,
    streamsDelivered: 2,
    totalViews: 132000,
    peakConcurrentViewers: 3100,
    installsAttributed: 1180,
    contractedAmountInCents: 440000,
    agreedRatePerStreamInCents: 220000,
    audienceSize: '365K',
    channelUrl: 'youtube.com/@ironlotus',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 113,
        paidOn: '2026-07-29',
        amountInCents: 220000,
        method: 'Wise',
        reference: 'WISE-7788-E',
        recordedBy: 'M. Devlin',
      }),
      createPayment({
        id: 114,
        paidOn: '2026-08-25',
        amountInCents: 220000,
        method: 'Wise',
        reference: 'WISE-8955-F',
        recordedBy: 'M. Devlin',
      }),
    ],
  },
  {
    id: 10,
    name: 'CrashKoda',
    platform: 'Twitch',
    creatorCode: 'KODA',
    campaignName: 'Clan Wars Update',
    streamsCommitted: 4,
    streamsDelivered: 2,
    totalViews: 58000,
    peakConcurrentViewers: 1500,
    installsAttributed: 470,
    contractedAmountInCents: 200000,
    agreedRatePerStreamInCents: 50000,
    audienceSize: '76K',
    channelUrl: 'twitch.tv/crashkoda',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 115,
        paidOn: '2026-08-04',
        amountInCents: 200000,
        method: 'USDC',
        reference: '0x91ad...3c07',
        recordedBy: 'K. Osei',
      }),
    ],
  },
  {
    id: 11,
    name: 'VexaRun',
    platform: 'YouTube',
    creatorCode: 'VEXA',
    campaignName: 'Season 2 Launch',
    streamsCommitted: 2,
    streamsDelivered: 2,
    totalViews: 110000,
    peakConcurrentViewers: 2400,
    installsAttributed: 700,
    contractedAmountInCents: 360000,
    agreedRatePerStreamInCents: 180000,
    audienceSize: '295K',
    channelUrl: 'youtube.com/@vexarun',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 116,
        paidOn: '2026-08-11',
        amountInCents: 360000,
        method: 'Bank transfer',
        reference: 'TRF-2402-08',
        recordedBy: 'A. Raouf',
      }),
    ],
  },
  {
    id: 12,
    name: 'HollowPoint',
    platform: 'YouTube',
    creatorCode: 'HOLO',
    campaignName: 'Clan Wars Update',
    streamsCommitted: 2,
    streamsDelivered: 2,
    totalViews: 88000,
    peakConcurrentViewers: 2000,
    installsAttributed: 380,
    contractedAmountInCents: 280000,
    agreedRatePerStreamInCents: 140000,
    audienceSize: '240K',
    channelUrl: 'youtube.com/@hollowpoint',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 117,
        paidOn: '2026-08-08',
        amountInCents: 140000,
        method: 'PayPal',
        reference: 'PP-5702-R',
        recordedBy: 'K. Osei',
      }),
    ],
  },
  {
    id: 13,
    name: 'BluntForce',
    platform: 'Twitch',
    creatorCode: 'BLUNT',
    campaignName: 'Season 2 Launch',
    streamsCommitted: 1,
    streamsDelivered: 1,
    totalViews: 41000,
    peakConcurrentViewers: 1100,
    installsAttributed: 240,
    contractedAmountInCents: 150000,
    agreedRatePerStreamInCents: 150000,
    audienceSize: '118K',
    channelUrl: 'twitch.tv/bluntforce',
    portalInviteState: 'claimed',
    payments: [
      createPayment({
        id: 118,
        paidOn: '2026-07-31',
        amountInCents: 150000,
        method: 'PayPal',
        reference: 'PP-5588-T',
        recordedBy: 'A. Raouf',
      }),
    ],
  },
  {
    id: 14,
    name: 'QuietStorm',
    platform: 'Twitch',
    creatorCode: 'STORM',
    campaignName: 'Clan Wars Update',
    streamsCommitted: 1,
    streamsDelivered: 1,
    totalViews: 22000,
    peakConcurrentViewers: 640,
    installsAttributed: 95,
    contractedAmountInCents: 120000,
    agreedRatePerStreamInCents: 120000,
    audienceSize: '54K',
    channelUrl: 'twitch.tv/quietstorm',
    portalInviteState: 'claimed',
    payments: [],
  },
]

/** Daily installs across the last six weeks, for the overview chart. */
const dailyInstallWeights = [
  142, 155, 138, 610, 340, 220, 190, 170, 720, 410, 260, 230, 205, 188, 540, 300, 650, 380, 255,
  240, 210, 880, 520, 330, 290, 260, 244, 231, 760, 430, 310, 590, 340, 280, 255, 700, 460, 320,
  296, 270, 410, 905,
]

export const chartStartDate = '2026-07-19'
export const chartDayCount = dailyInstallWeights.length

/**
 * Synthetic attribution for the demo, not observed daily measurements.
 * Cumulative rounding preserves each creator's exact install total.
 * A campaign's days before its start receive no installs.
 */
export const dailyInstalls: DailyInstall[] = creators.flatMap((creator) => {
  const campaign = campaigns.find((item) => item.name === creator.campaignName)!
  const dates = dailyInstallWeights.map((_, index) =>
    new Date(Date.parse(chartStartDate) + index * 86400000).toISOString().slice(0, 10),
  )
  const weights = dailyInstallWeights.map((weight, index) =>
    dates[index] >= campaign.startDate && dates[index] <= campaign.endDate ? weight : 0,
  )
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  let cumulativeWeight = 0
  let allocated = 0
  return weights.map((weight, index) => {
    cumulativeWeight += weight
    const cumulativeInstalls =
      totalWeight === 0
        ? 0
        : Math.round((creator.installsAttributed * cumulativeWeight) / totalWeight)
    const installs = cumulativeInstalls - allocated
    allocated = cumulativeInstalls
    return { creatorId: creator.id, installedOn: dates[index], installs }
  })
})

/* ---------------------------------------------------------------------------
   Detected streams

   Real streams arrive from the YouTube and Twitch integrations, and a
   creator's totals are then the sum of them. The fixtures work the other way
   round: they split each creator's known totals back into individual streams,
   so the detail screen and the dashboard can never disagree with each other
   while the integrations do not exist yet.
--------------------------------------------------------------------------- */

/** The six titles the design prototype cycled through, kept so the detail
    screen reads the way it was reviewed. */
const FIXTURE_STREAM_TITLES = [
  'Season 2 drop day grind',
  'Clan Wars first look',
  'Ranked to Legend, no deaths',
  'Viewer squads all night',
  'New map deep dive',
  'Loadout lab: meta builds',
]

/** The most recent fixture stream. Earlier ones step back from here. */
const MOST_RECENT_FIXTURE_STREAM_DATE = '2026-08-26'
const DAYS_BETWEEN_FIXTURE_STREAMS = 9

function isoDateDaysBefore(isoDate: string, daysEarlier: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const shifted = new Date(year, month - 1, day - daysEarlier)
  const shiftedMonth = String(shifted.getMonth() + 1).padStart(2, '0')
  const shiftedDay = String(shifted.getDate()).padStart(2, '0')
  return `${shifted.getFullYear()}-${shiftedMonth}-${shiftedDay}`
}

/**
 * Splits one creator's totals across the streams they have delivered.
 *
 * The weights are (n, n-1, … 1) over their triangular sum, so they add up to
 * exactly one: the most recent stream carries the largest share and the
 * rows always total the creator's views and installs. Peak viewers taper
 * instead of splitting, since a peak is a high-water mark rather than
 * something that divides.
 */
function buildStreamHistory(creator: Creator): Stream[] {
  const streamCount = creator.streamsDelivered
  const weightTotal = (streamCount * (streamCount + 1)) / 2

  return Array.from({ length: streamCount }, (_, index) => {
    const shareOfTotals = (streamCount - index) / weightTotal

    return {
      id: creator.id * 100 + index,
      creatorId: creator.id,
      streamedOn: isoDateDaysBefore(
        MOST_RECENT_FIXTURE_STREAM_DATE,
        index * DAYS_BETWEEN_FIXTURE_STREAMS,
      ),
      title: FIXTURE_STREAM_TITLES[(creator.id + index) % FIXTURE_STREAM_TITLES.length],
      platform: creator.platform,
      views: Math.round(creator.totalViews * shareOfTotals),
      peakConcurrentViewers: Math.round(creator.peakConcurrentViewers * (1 - index * 0.12)),
      installsAttributed: Math.round(creator.installsAttributed * shareOfTotals),
    }
  })
}

/** Every detected stream across every creator, newest first per creator. */
export const streams: Stream[] = creators.flatMap(buildStreamHistory)
