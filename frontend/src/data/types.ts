/**
 * The shapes the whole application reads. When the API arrives in Phase 4
 * these are the contract it has to satisfy, so field names here are written
 * to be unambiguous on their own rather than short.
 */

export type StreamingPlatform = 'YouTube' | 'Twitch'

/**
 * Where a creator sits in the working relationship.
 *
 * prospect   — we have their contact details but no agreed deal
 * contracted — a deal exists, nothing has been streamed yet
 * active     — at least one stream delivered, deal not fully closed out
 * completed  — every committed stream delivered and the balance fully paid
 */
export type CreatorLifecycleStatus = 'prospect' | 'contracted' | 'active' | 'completed'

/** Whether the creator has been invited to the portal, and how far they got. */
export type PortalInviteState = 'not sent' | 'sent' | 'claimed'

/** One payment made to a creator. A creator may be paid in several of these. */
export interface Payment {
  id: number
  /** ISO date the money actually went out, not the date it was recorded. */
  paidOn: string
  amount: number
  /** "Bank transfer", "Wise", "PayPal", "USDC". */
  method: string
  /** Transaction ID or bank reference, for reconciling against a statement. */
  reference: string
  /** Name of the team member who recorded the payment. Open question Q4. */
  recordedBy: string
}

export interface Campaign {
  id: number
  name: string
  startDate: string
  endDate: string
  totalBudget: number
  /**
   * What the team is willing to pay per install on this campaign. Drives the
   * green/red treatment on the creator table's cost-per-install column.
   */
  targetCostPerInstall: number
}

export interface Creator {
  id: number
  name: string
  platform: StreamingPlatform
  /** The code viewers type in to credit this creator. Unique per creator. */
  creatorCode: string
  /** Campaign this creator's deal belongs to. One campaign each — see Q13. */
  campaignName: string

  /** How many streams the deal commits them to. */
  streamsCommitted: number
  /** How many have actually been detected and matched so far. */
  streamsDelivered: number

  totalViews: number
  /** Highest concurrent viewer count across their streams. */
  peakConcurrentViewers: number
  /** Installs credited to this creator's code and tracking link. */
  installsAttributed: number

  /** The full agreed value of the deal, before any payment is made. */
  contractedAmount: number
  /** The per-stream rate the contracted amount was built from. */
  agreedRatePerStream: number

  /** Follower or subscriber count, shown as text such as "412K". */
  audienceSize: string
  channelUrl: string
  portalInviteState: PortalInviteState

  /** Every payment made so far. Amounts paid and owed derive from this list. */
  payments: Payment[]
}

/**
 * One stream a creator went live with, as detected on their platform.
 *
 * These are never typed in by a person. Modules 14 and 15 poll YouTube and
 * Twitch, Module 16 decides which campaign a stream belongs to, and Module 19
 * credits it with installs. Until those exist the fixtures stand in, which is
 * why every field here is something a platform API can actually answer.
 */
export interface Stream {
  id: number
  creatorId: number
  /** ISO date the stream went live. */
  streamedOn: string
  title: string
  platform: StreamingPlatform
  views: number
  /**
   * Highest concurrent viewers during the stream. Only obtainable by polling
   * while the stream is live — see open questions Q33 and Q34.
   */
  peakConcurrentViewers: number
  /** Installs credited to this individual stream. */
  installsAttributed: number
}

/** Daily install attribution supplied by the reporting API. */
export interface DailyInstall {
  creatorId: number
  installedOn: string
  installs: number
}

/** A stream day positioned in a chart's reporting window. */
export interface StreamDayMarker {
  dayIndex: number
  creatorCode: string
}

export interface InstallChartData {
  dailyInstallCounts: number[]
  streamDayMarkers: StreamDayMarker[]
  weekLabels: string[]
}
