export type Platform = 'YouTube' | 'Twitch'

export type CreatorStatus = 'prospect' | 'contracted' | 'active' | 'completed'

export type InviteState = 'not sent' | 'sent' | 'claimed'

export interface Payment {
  id: number
  date: string
  amount: number
  method: string
  ref: string
  by: string
}

export interface Campaign {
  id: number
  name: string
  start: string
  end: string
  budget: number
  targetCpi: number
}

export interface Creator {
  id: number
  name: string
  platform: Platform
  code: string
  campaign: string
  /** streams committed under the deal */
  agreed: number
  /** streams detected and matched so far */
  streams: number
  views: number
  peak: number
  installs: number
  /** agreed contract total */
  contract: number
  rate: number
  audience: string
  channel: string
  invite: InviteState
  payments: Payment[]
}
