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

/**
 * One payment made to a creator. A creator may be paid in several of these.
 *
 * Every money field in this file is in cents. Dollars only exist in
 * src/lib/format, at the moment a figure is rendered — see DECISIONS.md, Q8.
 */
export interface Payment {
  id: number
  /** ISO date the money actually went out, not the date it was recorded. */
  paidOn: string
  amountInCents: number
  /** "Bank transfer", "Wise", "PayPal", "USDC". */
  method: string
  /** Transaction ID or bank reference, for reconciling against a statement. */
  reference: string
  /**
   * The team member who recorded it, stamped from the session — Q4.
   *
   * The id, not the name. A finance record has to answer "who do I ask about
   * this entry" years later, and a stored name stops answering it the moment
   * one changes or a second person shares it. The name is resolved for
   * display, from a directory that never removes anyone.
   */
  recordedByTeamMemberId: string
  /**
   * Set only on a reversing entry, naming the payment it cancels.
   *
   * Payments are append-only: a mistake is never edited or deleted, it is
   * cancelled by a second record carrying the negative amount. That keeps
   * every figure derivable by summing and leaves the history intact. Only a
   * record with this field set may carry a negative amount. See DECISIONS.md,
   * Q6.
   */
  reversesPaymentId?: number
}

export interface Campaign {
  id: number
  name: string
  startDate: string
  endDate: string
  totalBudgetInCents: number
  /**
   * What the team is willing to pay per install on this campaign. Drives the
   * green/red treatment on the creator table's cost-per-install column.
   */
  targetCostPerInstallInCents: number
}

/** How a deal's money is agreed. Per view is not supported — see DECISIONS Q9. */
export type RateModel = 'per-stream' | 'flat-fee'

export interface Creator {
  id: number
  name: string
  /** Where the portal invite is sent. Required from the first step. */
  email: string
  platform: StreamingPlatform
  /** The code viewers type in to credit this creator. Unique per creator. */
  creatorCode: string
  /**
   * The campaign this creator's deal belongs to. One campaign each — see Q13.
   *
   * Held by id, not by name: a campaign can be renamed, and a name copied
   * across fourteen creator records would have to be found and rewritten
   * every time it was. This is also the shape the API will use.
   */
  campaignId: number | null

  /** How many streams the deal commits them to. */
  streamsCommitted: number
  /** How many have actually been detected and matched so far. */
  streamsDelivered: number

  totalViews: number
  /** Highest concurrent viewer count across their streams. */
  peakConcurrentViewers: number
  /** Installs credited to this creator's code and tracking link. */
  installsAttributed: number

  /**
   * The full agreed value of the deal, before any payment is made.
   *
   * Worked out from the rate model when the deal is saved, rather than
   * recomputed on every read: a creator whose rate changes mid-campaign was
   * not retroactively owed a different amount for work already done.
   */
  contractedAmountInCents: number
  /** What the rate means: per stream delivered, or for the deal as a whole. */
  rateModel?: RateModel
  /** The agreed rate the contracted amount was built from. */
  agreedRateInCents: number

  /** Follower or subscriber count, shown as text such as "412K". */
  audienceSize: string
  channelUrl: string
  portalInviteState: PortalInviteState

  /**
   * The day this creator was archived, or absent while they are in the
   * roster. A date rather than a flag: "when did we stop working with them"
   * is the question asked about an archived record. See DECISIONS.md, Q51.
   */
  archivedOn?: string

  /* Everything below comes from steps 2 and 3 of the add creator form, both
     of which are skippable — a prospect is a creator with none of it. */

  /** Telegram or Discord, whichever they actually answer on. */
  contactHandle?: string
  contentLanguage?: string
  region?: string
  /**
   * What they would rather be paid in. Recorded for whoever makes the
   * transfer; every figure in the application is USD — see DECISIONS Q8.
   */
  payoutCurrency?: string
  /** Hours a stream has to run to count towards the commitment. */
  minimumStreamHours?: number
  deliveryWindowStart?: string
  deliveryWindowEnd?: string
  /** Free text: code on screen, link in the description, and so on. */
  requirements?: string
  paymentMethod?: string
  /** Account details or reference for the transfer. */
  paymentDetails?: string
  /** Team only. Never shown to the creator. */
  notes?: string

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
