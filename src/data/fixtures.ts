import type { Campaign, Creator, CreatorStatus, Payment } from './types'

/* Static fixture data, carried over from the design prototype so the static
   screens show the same figures the design was reviewed against. Phase 3
   replaces this module with the API; nothing else should need to change. */

/** Named-argument constructor, so each payment reads clearly at the call site. */
const createPayment = (payment: Payment): Payment => payment

export const campaigns: Campaign[] = [
  {
    id: 1,
    name: 'Season 2 Launch',
    start: '2026-07-15',
    end: '2026-09-15',
    budget: 30000,
    targetCpi: 3.5,
  },
  {
    id: 2,
    name: 'Clan Wars Update',
    start: '2026-07-28',
    end: '2026-09-30',
    budget: 22000,
    targetCpi: 3.0,
  },
]

/** Fallback target when no single campaign is selected. Open question Q21. */
export const defaultTargetCpi = 3.5

export const creators: Creator[] = [
  {
    id: 1, name: 'NovaKess', platform: 'Twitch', code: 'NOVA', campaign: 'Season 2 Launch',
    agreed: 3, streams: 3, views: 298000, peak: 6400, installs: 4210, contract: 4800, rate: 1600,
    audience: '412K', channel: 'twitch.tv/novakess', invite: 'claimed',
    payments: [
      createPayment({
        id: 101,
        date: '2026-07-24',
        amount: 1600,
        method: 'Bank transfer',
        ref: 'TRF-2291-04',
        by: 'A. Raouf',
      }),
      createPayment({
        id: 102,
        date: '2026-08-14',
        amount: 1600,
        method: 'Bank transfer',
        ref: 'TRF-2413-11',
        by: 'A. Raouf',
      }),
    ],
  },
  {
    id: 2, name: 'RazeHavoc', platform: 'YouTube', code: 'RAZE', campaign: 'Season 2 Launch',
    agreed: 4, streams: 4, views: 412000, peak: 8900, installs: 6120, contract: 9000, rate: 2250,
    audience: '640K', channel: 'youtube.com/@razehavoc', invite: 'claimed',
    payments: [
      createPayment({
        id: 103,
        date: '2026-07-18',
        amount: 4500,
        method: 'Wise',
        ref: 'WISE-7710-A',
        by: 'M. Devlin',
      }),
      createPayment({
        id: 104,
        date: '2026-08-20',
        amount: 4500,
        method: 'Wise',
        ref: 'WISE-8842-B',
        by: 'M. Devlin',
      }),
    ],
  },
  {
    id: 3, name: 'PixelMara', platform: 'Twitch', code: 'MARA', campaign: 'Clan Wars Update',
    agreed: 3, streams: 2, views: 151000, peak: 3900, installs: 2140, contract: 3200, rate: 1067,
    audience: '188K', channel: 'twitch.tv/pixelmara', invite: 'claimed',
    payments: [
      createPayment({
        id: 105,
        date: '2026-07-30',
        amount: 3200,
        method: 'PayPal',
        ref: 'PP-5521-K',
        by: 'M. Devlin',
      }),
    ],
  },
  {
    id: 4, name: 'GrimTactix', platform: 'YouTube', code: 'GRIM', campaign: 'Season 2 Launch',
    agreed: 3, streams: 3, views: 265000, peak: 5100, installs: 3980, contract: 6000, rate: 2000,
    audience: '520K', channel: 'youtube.com/@grimtactix', invite: 'claimed',
    payments: [
      createPayment({
        id: 106,
        date: '2026-07-21',
        amount: 3000,
        method: 'Bank transfer',
        ref: 'TRF-2280-09',
        by: 'A. Raouf',
      }),
      createPayment({
        id: 107,
        date: '2026-08-18',
        amount: 1500,
        method: 'Bank transfer',
        ref: 'TRF-2451-02',
        by: 'A. Raouf',
      }),
    ],
  },
  {
    id: 5, name: 'DeadeyeDee', platform: 'YouTube', code: 'DEE', campaign: 'Clan Wars Update',
    agreed: 5, streams: 5, views: 340000, peak: 7200, installs: 3010, contract: 7500, rate: 1500,
    audience: '710K', channel: 'youtube.com/@deadeyedee', invite: 'claimed',
    payments: [
      createPayment({
        id: 108,
        date: '2026-07-16',
        amount: 3750,
        method: 'Wise',
        ref: 'WISE-7702-C',
        by: 'M. Devlin',
      }),
      createPayment({
        id: 109,
        date: '2026-08-22',
        amount: 3750,
        method: 'Wise',
        ref: 'WISE-8901-D',
        by: 'M. Devlin',
      }),
    ],
  },
  {
    id: 6, name: 'SableFPS', platform: 'Twitch', code: 'SABLE', campaign: 'Clan Wars Update',
    agreed: 2, streams: 2, views: 96000, peak: 2600, installs: 860, contract: 2400, rate: 1200,
    audience: '145K', channel: 'twitch.tv/sablefps', invite: 'claimed',
    payments: [
      createPayment({
        id: 110,
        date: '2026-08-06',
        amount: 2400,
        method: 'PayPal',
        ref: 'PP-5610-M',
        by: 'A. Raouf',
      }),
    ],
  },
  {
    id: 7, name: 'TorqueOG', platform: 'YouTube', code: 'TORQ', campaign: 'Season 2 Launch',
    agreed: 2, streams: 2, views: 188000, peak: 4400, installs: 1620, contract: 5000, rate: 2500,
    audience: '480K', channel: 'youtube.com/@torqueog', invite: 'claimed',
    payments: [
      createPayment({
        id: 111,
        date: '2026-07-27',
        amount: 2500,
        method: 'Bank transfer',
        ref: 'TRF-2334-06',
        by: 'A. Raouf',
      }),
    ],
  },
  {
    id: 8, name: 'MiraPlays', platform: 'Twitch', code: 'MIRA', campaign: 'Clan Wars Update',
    agreed: 3, streams: 2, views: 74000, peak: 1900, installs: 540, contract: 1800, rate: 600,
    audience: '92K', channel: 'twitch.tv/miraplays', invite: 'claimed',
    payments: [
      createPayment({
        id: 112,
        date: '2026-08-02',
        amount: 1800,
        method: 'USDC',
        ref: '0x4f9c...8b21',
        by: 'K. Osei',
      }),
    ],
  },
  {
    id: 9, name: 'IronLotus', platform: 'YouTube', code: 'LOTUS', campaign: 'Season 2 Launch',
    agreed: 2, streams: 2, views: 132000, peak: 3100, installs: 1180, contract: 4400, rate: 2200,
    audience: '365K', channel: 'youtube.com/@ironlotus', invite: 'claimed',
    payments: [
      createPayment({
        id: 113,
        date: '2026-07-29',
        amount: 2200,
        method: 'Wise',
        ref: 'WISE-7788-E',
        by: 'M. Devlin',
      }),
      createPayment({
        id: 114,
        date: '2026-08-25',
        amount: 2200,
        method: 'Wise',
        ref: 'WISE-8955-F',
        by: 'M. Devlin',
      }),
    ],
  },
  {
    id: 10, name: 'CrashKoda', platform: 'Twitch', code: 'KODA', campaign: 'Clan Wars Update',
    agreed: 4, streams: 2, views: 58000, peak: 1500, installs: 470, contract: 2000, rate: 500,
    audience: '76K', channel: 'twitch.tv/crashkoda', invite: 'claimed',
    payments: [
      createPayment({
        id: 115,
        date: '2026-08-04',
        amount: 2000,
        method: 'USDC',
        ref: '0x91ad...3c07',
        by: 'K. Osei',
      }),
    ],
  },
  {
    id: 11, name: 'VexaRun', platform: 'YouTube', code: 'VEXA', campaign: 'Season 2 Launch',
    agreed: 2, streams: 2, views: 110000, peak: 2400, installs: 700, contract: 3600, rate: 1800,
    audience: '295K', channel: 'youtube.com/@vexarun', invite: 'claimed',
    payments: [
      createPayment({
        id: 116,
        date: '2026-08-11',
        amount: 3600,
        method: 'Bank transfer',
        ref: 'TRF-2402-08',
        by: 'A. Raouf',
      }),
    ],
  },
  {
    id: 12, name: 'HollowPoint', platform: 'YouTube', code: 'HOLO', campaign: 'Clan Wars Update',
    agreed: 2, streams: 2, views: 88000, peak: 2000, installs: 380, contract: 2800, rate: 1400,
    audience: '240K', channel: 'youtube.com/@hollowpoint', invite: 'claimed',
    payments: [
      createPayment({
        id: 117,
        date: '2026-08-08',
        amount: 1400,
        method: 'PayPal',
        ref: 'PP-5702-R',
        by: 'K. Osei',
      }),
    ],
  },
  {
    id: 13, name: 'BluntForce', platform: 'Twitch', code: 'BLUNT', campaign: 'Season 2 Launch',
    agreed: 1, streams: 1, views: 41000, peak: 1100, installs: 240, contract: 1500, rate: 1500,
    audience: '118K', channel: 'twitch.tv/bluntforce', invite: 'claimed',
    payments: [
      createPayment({
        id: 118,
        date: '2026-07-31',
        amount: 1500,
        method: 'PayPal',
        ref: 'PP-5588-T',
        by: 'A. Raouf',
      }),
    ],
  },
  {
    id: 14, name: 'QuietStorm', platform: 'Twitch', code: 'STORM', campaign: 'Clan Wars Update',
    agreed: 1, streams: 1, views: 22000, peak: 640, installs: 95, contract: 1200, rate: 1200,
    audience: '54K', channel: 'twitch.tv/quietstorm', invite: 'claimed',
    payments: [],
  },
]

export const paidOf = (c: Creator) => c.payments.reduce((a, p) => a + p.amount, 0)

export const remainingOf = (c: Creator) => Math.max(0, c.contract - paidOf(c))

/** Cost per install on money actually paid. Infinite until something is paid. */
export const cpiOf = (c: Creator) => {
  const paid = paidOf(c)
  return c.installs > 0 && paid > 0 ? paid / c.installs : Infinity
}

/* Derived here only so the static screen is self-consistent. Whether status is
   derived, stored or overridable is open question Q24 — see task 5.2. */
export const statusOf = (c: Creator): CreatorStatus => {
  if (c.streams >= c.agreed && paidOf(c) >= c.contract) return 'completed'
  return c.streams > 0 ? 'active' : 'contracted'
}

/** Daily installs across the last six weeks, for the overview chart. */
export const dailyInstalls = [
  142, 155, 138, 610, 340, 220, 190, 170, 720, 410, 260, 230, 205, 188, 540, 300, 650, 380, 255,
  240, 210, 880, 520, 330, 290, 260, 244, 231, 760, 430, 310, 590, 340, 280, 255, 700, 460, 320,
  296, 270, 410, 905,
]

/** [index into dailyInstalls, creator code] — a stream went live that day. */
export const streamDays: [number, string][] = [
  [3, 'RAZE'],
  [8, 'NOVA'],
  [14, 'GRIM'],
  [16, 'DEE'],
  [21, 'RAZE'],
  [28, 'MARA'],
  [31, 'NOVA'],
  [35, 'SABLE'],
  [41, 'KODA'],
]

export const weekLabels = ['Jul 19', 'Jul 26', 'Aug 2', 'Aug 9', 'Aug 16', 'Aug 23', 'Aug 30']
