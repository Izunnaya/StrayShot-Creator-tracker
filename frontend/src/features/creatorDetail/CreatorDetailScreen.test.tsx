// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createTestCampaign,
  createTestCreator,
  createTestPayment,
} from '@/testing/createTestCreator'
import { CreatorDetailScreen } from './CreatorDetailScreen'

/**
 * A creator whose campaign has gone: the screen says so, and the figures it
 * shows have to say so too.
 */

afterEach(cleanup)

/** $1,000 paid for 2,000 installs, which is 50c each. */
const creator = createTestCreator({
  name: 'AshFall',
  installsAttributed: 2000,
  payments: [createTestPayment({ amountInCents: 100_000 })],
})

const costPerInstall = () => screen.getByText('$0.50')

describe('a creator with no campaign', () => {
  it('shows the cost per install without calling it good or bad', () => {
    render(<CreatorDetailScreen creator={creator} onBack={() => {}} />)

    expect(screen.getByText('No campaign')).toBeTruthy()
    expect(costPerInstall().className).not.toMatch(/text-good|text-bad/)
  })

  it('is judged once a campaign target applies to them', () => {
    // The same 50c, now against a campaign willing to pay $3.00.
    render(
      <CreatorDetailScreen
        creator={creator}
        campaign={createTestCampaign({ targetCostPerInstallInCents: 300 })}
        onBack={() => {}}
      />,
    )

    expect(costPerInstall().className).toMatch(/text-good/)
  })
})
