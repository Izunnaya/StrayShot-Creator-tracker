
import type { Campaign, Creator, CreatorLifecycleStatus, Payment } from './types'


/* Static fixture data, carried over from the design prototype so the static
   screens show the same figures the design was reviewed against. Phase 3
   replaces this module with the API; nothing else should need to change. */

const  createPayment = (payment: Payment): Payment => payment

export const campaigns: Campaign[] = [
  {
    id: 1,
    name: 'Season 2 Launch',
    startDate: '2026-07-15',
    endDate: '2026-09-15',
    totalBudget: 30000,
   targetCostPerInstall: 3.5,
  },
  {
    id: 2,
    name: 'Clan Wars Update',
    startDate: '2026-07-28',
    endDate: '2026-09-30',
    totalBudget: 22000,
  targetCostPerInstall: 3.0,
  },
]

/** Fallback target when no single campaign is selected. Open question Q21. */
export const defaultTargetCpi = 3.5

export const creators: Creator[] = [
  {
    id: 1, name: 'NovaKess', platform: 'Twitch', creatorCode: 'NOVA', campaignName: 'Season 2 Launch',
    streamsCommitted: 3, streamsDelivered: 3, totalViews: 298000, peakConcurrentViewers: 6400,
    installsAttributed: 4210, contractedAmount: 4800, agreedRatePerStream: 1600,
    audienceSize: '412K', channelUrl: 'twitch.tv/novakess', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 101, paidOn: '2026-07-24', amount: 1600, method: 'Bank transfer', reference: 'TRF-2291-04', recordedBy: 'A. Raouf' }),
      createPayment({ id: 102, paidOn: '2026-08-14', amount: 1600, method: 'Bank transfer', reference: 'TRF-2413-11', recordedBy: 'A. Raouf' }),
    ],
  },
  {
    id: 2, name: 'RazeHavoc', platform: 'YouTube', creatorCode: 'RAZE', campaignName: 'Season 2 Launch',
    streamsCommitted: 4, streamsDelivered: 4, totalViews: 412000, peakConcurrentViewers: 8900,
    installsAttributed: 6120, contractedAmount: 9000, agreedRatePerStream: 2250,
    audienceSize: '640K', channelUrl: 'youtube.com/@razehavoc', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 103, paidOn: '2026-07-18', amount: 4500, method: 'Wise', reference: 'WISE-7710-A', recordedBy: 'M. Devlin' }),
      createPayment({ id: 104, paidOn: '2026-08-20', amount: 4500, method: 'Wise', reference: 'WISE-8842-B', recordedBy: 'M. Devlin' }),
    ],
  },
  {
    id: 3, name: 'PixelMara', platform: 'Twitch', creatorCode: 'MARA', campaignName: 'Clan Wars Update',
    streamsCommitted: 3, streamsDelivered: 2, totalViews: 151000, peakConcurrentViewers: 3900,
    installsAttributed: 2140, contractedAmount: 3200, agreedRatePerStream: 1067,
    audienceSize: '188K', channelUrl: 'twitch.tv/pixelmara', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 105, paidOn: '2026-07-30', amount: 3200, method: 'PayPal', reference: 'PP-5521-K', recordedBy: 'M. Devlin' }),
    ],
  },
  {
    id: 4, name: 'GrimTactix', platform: 'YouTube', creatorCode: 'GRIM', campaignName: 'Season 2 Launch',
    streamsCommitted: 3, streamsDelivered: 3, totalViews: 265000, peakConcurrentViewers: 5100,
    installsAttributed: 3980, contractedAmount: 6000, agreedRatePerStream: 2000,
    audienceSize: '520K', channelUrl: 'youtube.com/@grimtactix', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 106, paidOn: '2026-07-21', amount: 3000, method: 'Bank transfer', reference: 'TRF-2280-09', recordedBy: 'A. Raouf' }),
      createPayment({ id: 107, paidOn: '2026-08-18', amount: 1500, method: 'Bank transfer', reference: 'TRF-2451-02', recordedBy: 'A. Raouf' }),
    ],
  },
  {
    id: 5, name: 'DeadeyeDee', platform: 'YouTube', creatorCode: 'DEE', campaignName: 'Clan Wars Update',
    streamsCommitted: 5, streamsDelivered: 5, totalViews: 340000, peakConcurrentViewers: 7200,
    installsAttributed: 3010, contractedAmount: 7500, agreedRatePerStream: 1500,
    audienceSize: '710K', channelUrl: 'youtube.com/@deadeyedee', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 108, paidOn: '2026-07-16', amount: 3750, method: 'Wise', reference: 'WISE-7702-C', recordedBy: 'M. Devlin' }),
      createPayment({ id: 109, paidOn: '2026-08-22', amount: 3750, method: 'Wise', reference: 'WISE-8901-D', recordedBy: 'M. Devlin' }),
    ],
  },
  {
    id: 6, name: 'SableFPS', platform: 'Twitch', creatorCode: 'SABLE', campaignName: 'Clan Wars Update',
    streamsCommitted: 2, streamsDelivered: 2, totalViews: 96000, peakConcurrentViewers: 2600,
    installsAttributed: 860, contractedAmount: 2400, agreedRatePerStream: 1200,
    audienceSize: '145K', channelUrl: 'twitch.tv/sablefps', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 110, paidOn: '2026-08-06', amount: 2400, method: 'PayPal', reference: 'PP-5610-M', recordedBy: 'A. Raouf' }),
    ],
  },
  {
    id: 7, name: 'TorqueOG', platform: 'YouTube', creatorCode: 'TORQ', campaignName: 'Season 2 Launch',
    streamsCommitted: 2, streamsDelivered: 2, totalViews: 188000, peakConcurrentViewers: 4400,
    installsAttributed: 1620, contractedAmount: 5000, agreedRatePerStream: 2500,
    audienceSize: '480K', channelUrl: 'youtube.com/@torqueog', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 111, paidOn: '2026-07-27', amount: 2500, method: 'Bank transfer', reference: 'TRF-2334-06', recordedBy: 'A. Raouf' }),
    ],
  },
  {
    id: 8, name: 'MiraPlays', platform: 'Twitch', creatorCode: 'MIRA', campaignName: 'Clan Wars Update',
    streamsCommitted: 3, streamsDelivered: 2, totalViews: 74000, peakConcurrentViewers: 1900,
    installsAttributed: 540, contractedAmount: 1800, agreedRatePerStream: 600,
    audienceSize: '92K', channelUrl: 'twitch.tv/miraplays', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 112, paidOn: '2026-08-02', amount: 1800, method: 'USDC', reference: '0x4f9c...8b21', recordedBy: 'K. Osei' }),
    ],
  },
  {
    id: 9, name: 'IronLotus', platform: 'YouTube', creatorCode: 'LOTUS', campaignName: 'Season 2 Launch',
    streamsCommitted: 2, streamsDelivered: 2, totalViews: 132000, peakConcurrentViewers: 3100,
    installsAttributed: 1180, contractedAmount: 4400, agreedRatePerStream: 2200,
    audienceSize: '365K', channelUrl: 'youtube.com/@ironlotus', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 113, paidOn: '2026-07-29', amount: 2200, method: 'Wise', reference: 'WISE-7788-E', recordedBy: 'M. Devlin' }),
      createPayment({ id: 114, paidOn: '2026-08-25', amount: 2200, method: 'Wise', reference: 'WISE-8955-F', recordedBy: 'M. Devlin' }),
    ],
  },
  {
    id: 10, name: 'CrashKoda', platform: 'Twitch', creatorCode: 'KODA', campaignName: 'Clan Wars Update',
    streamsCommitted: 4, streamsDelivered: 2, totalViews: 58000, peakConcurrentViewers: 1500,
    installsAttributed: 470, contractedAmount: 2000, agreedRatePerStream: 500,
    audienceSize: '76K', channelUrl: 'twitch.tv/crashkoda', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 115, paidOn: '2026-08-04', amount: 2000, method: 'USDC', reference: '0x91ad...3c07', recordedBy: 'K. Osei' }),
    ],
  },
  {
    id: 11, name: 'VexaRun', platform: 'YouTube', creatorCode: 'VEXA', campaignName: 'Season 2 Launch',
    streamsCommitted: 2, streamsDelivered: 2, totalViews: 110000, peakConcurrentViewers: 2400,
    installsAttributed: 700, contractedAmount: 3600, agreedRatePerStream: 1800,
    audienceSize: '295K', channelUrl: 'youtube.com/@vexarun', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 116, paidOn: '2026-08-11', amount: 3600, method: 'Bank transfer', reference: 'TRF-2402-08', recordedBy: 'A. Raouf' }),
    ],
  },
  {
    id: 12, name: 'HollowPoint', platform: 'YouTube', creatorCode: 'HOLO', campaignName: 'Clan Wars Update',
    streamsCommitted: 2, streamsDelivered: 2, totalViews: 88000, peakConcurrentViewers: 2000,
    installsAttributed: 380, contractedAmount: 2800, agreedRatePerStream: 1400,
    audienceSize: '240K', channelUrl: 'youtube.com/@hollowpoint', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 117, paidOn: '2026-08-08', amount: 1400, method: 'PayPal', reference: 'PP-5702-R', recordedBy: 'K. Osei' }),
    ],
  },
  {
    id: 13, name: 'BluntForce', platform: 'Twitch', creatorCode: 'BLUNT', campaignName: 'Season 2 Launch',
    streamsCommitted: 1, streamsDelivered: 1, totalViews: 41000, peakConcurrentViewers: 1100,
    installsAttributed: 240, contractedAmount: 1500, agreedRatePerStream: 1500,
    audienceSize: '118K', channelUrl: 'twitch.tv/bluntforce', portalInviteState: 'claimed',
    payments: [
      createPayment({ id: 118, paidOn: '2026-07-31', amount: 1500, method: 'PayPal', reference: 'PP-5588-T', recordedBy: 'A. Raouf' }),
    ],
  },
  {
    id: 14, name: 'QuietStorm', platform: 'Twitch', creatorCode: 'STORM', campaignName: 'Clan Wars Update',
    streamsCommitted: 1, streamsDelivered: 1, totalViews: 22000, peakConcurrentViewers: 640,
    installsAttributed: 95, contractedAmount: 1200, agreedRatePerStream: 1200,
    audienceSize: '54K', channelUrl: 'twitch.tv/quietstorm', portalInviteState: 'claimed',
    payments: [],
  },
]

export const paidOf = (creator: Creator) =>
  creator.payments.reduce((total, payment) => total + payment.amount, 0)

export const remainingOf = (creator: Creator) =>
  Math.max(0, creator.contractedAmount - paidOf(creator))

export const cpiOf = (creator: Creator) => {
  const paid = paidOf(creator)
  return creator.installsAttributed > 0 && paid > 0
    ? paid / creator.installsAttributed
    : Infinity
}

/* Derived here only so the static screen is self-consistent. Whether status is
   derived, stored or overridable is open question Q24 — see task 5.2. */
export const statusOf = (creator: Creator): CreatorLifecycleStatus => {
  if (
    creator.streamsDelivered >= creator.streamsCommitted &&
    paidOf(creator) >= creator.contractedAmount
  ) {
    return 'completed'
  }
  return creator.streamsDelivered > 0 ? 'active' : 'contracted'
}

/** Daily installs across the last six weeks, for the overview chart. */
export const dailyInstallCounts = [
  142, 155, 138, 610, 340, 220, 190, 170, 720, 410, 260, 230, 205, 188, 540, 300, 650, 380, 255,
  240, 210, 880, 520, 330, 290, 260, 244, 231, 760, 430, 310, 590, 340, 280, 255, 700, 460, 320,
  296, 270, 410, 905,
]

/** A stream went live on this day. Drawn as a dashed marker on the chart. */
export interface StreamDayMarker {
  /** Index into dailyInstallCounts. */
  dayIndex: number
  creatorCode: string
}

export const streamDayMarkers: StreamDayMarker[] = [
  { dayIndex: 3, creatorCode: 'RAZE' },
  { dayIndex: 8, creatorCode: 'NOVA' },
  { dayIndex: 14, creatorCode: 'GRIM' },
  { dayIndex: 16, creatorCode: 'DEE' },
  { dayIndex: 21, creatorCode: 'RAZE' },
  { dayIndex: 28, creatorCode: 'MARA' },
  { dayIndex: 31, creatorCode: 'NOVA' },
  { dayIndex: 35, creatorCode: 'SABLE' },
  { dayIndex: 41, creatorCode: 'KODA' },
]

export const chartWeekLabels = ['Jul 19', 'Jul 26', 'Aug 2', 'Aug 9', 'Aug 16', 'Aug 23', 'Aug 30']
