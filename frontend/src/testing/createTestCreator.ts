import type { Campaign, Creator, Payment } from '@/data/types'

/**
 * Builders for tests.
 *
 * Every field has a neutral default, so a test can specify only what it is
 * actually about — a test for outstanding balance says the contracted amount
 * and the payments, and stays silent about platform or channel URL.
 */

export function createTestPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 1,
    paidOn: '2026-08-01',
    amount: 1000,
    method: 'Bank transfer',
    reference: 'TEST-0001',
    recordedBy: 'Test User',
    ...overrides,
  }
}

export function createTestCreator(overrides: Partial<Creator> = {}): Creator {
  return {
    id: 1,
    name: 'Test Creator',
    platform: 'YouTube',
    creatorCode: 'TEST',
    campaignName: 'Test Campaign',
    streamsCommitted: 2,
    streamsDelivered: 0,
    totalViews: 0,
    peakConcurrentViewers: 0,
    installsAttributed: 0,
    contractedAmount: 1000,
    agreedRatePerStream: 500,
    audienceSize: '10K',
    channelUrl: 'youtube.com/@test',
    portalInviteState: 'not sent',
    payments: [],
    ...overrides,
  }
}

export function createTestCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 1,
    name: 'Test Campaign',
    startDate: '2026-07-01',
    endDate: '2026-09-01',
    totalBudget: 10000,
    targetCostPerInstall: 3,
    ...overrides,
  }
}
