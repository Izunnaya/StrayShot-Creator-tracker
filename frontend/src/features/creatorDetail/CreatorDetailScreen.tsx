import { useMemo } from 'react'
import { campaigns, streams as allStreams } from '@/data/fixtures'
import { findCampaign } from '@/domain/campaigns'
import type { Creator, Payment } from '@/data/types'
import { DEFAULT_TARGET_COST_PER_INSTALL_IN_CENTS } from '@/domain/costPerInstallRating'
import { getStreamHistoryForCreator } from '@/domain/streamHistory'
import { Button, SectionTitle } from '@/ui'
import { CreatorDetailHeader } from './components/CreatorDetailHeader'
import { CreatorDetailStatStrip } from './components/CreatorDetailStatStrip'
import { PaymentHistoryTable } from './components/PaymentHistoryTable'
import { PaymentProgressPanel } from './components/PaymentProgressPanel'
import { StreamHistoryTable } from './components/StreamHistoryTable'

/**
 * Everything about one creator: who they are, what they delivered, and what
 * they have been paid.
 *
 * The screen holds no state. It is given the creator to show and a way back,
 * which keeps it usable from anywhere that can name a creator — the dashboard
 * table today, the payments ledger once Module 7 exists.
 *
 * Data still comes from the fixture module; swapping those imports for API
 * calls is this screen's Phase 5 work.
 */
export function CreatorDetailScreen({
  creator,
  campaignName,
  onBack,
  onEditCreator,
  onRecordPayment,
  onReversePayment,
}: {
  creator: Creator
  campaignName: string
  onBack: () => void
  /** Module 4's add/edit modal. Disabled until it exists — task 3.13. */
  onEditCreator?: (creator: Creator) => void
  onRecordPayment?: (creator: Creator) => void
  /** Offers to undo one of this creator's payments. */
  onReversePayment?: (payment: Payment) => void
}) {
  const streamHistory = useMemo(
    () => getStreamHistoryForCreator(allStreams, creator.id),
    [creator.id],
  )

  /**
   * The cost-per-install verdict is measured against this creator's own
   * campaign, not whatever the dashboard was filtered to when they were
   * opened. A creator only belongs to one campaign today — open question Q13.
   */
  const campaign = findCampaign(campaigns, creator.campaignId)
  const targetCostPerInstallInCents =
    campaign?.targetCostPerInstallInCents ?? DEFAULT_TARGET_COST_PER_INSTALL_IN_CENTS

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-10 pt-5 sm:px-6 md:gap-7 md:px-8 md:pb-12 md:pt-7">
      <CreatorDetailHeader
        creator={creator}
        campaignName={campaignName}
        onBack={onBack}
        onEditCreator={onEditCreator}
      />

      <CreatorDetailStatStrip
        creator={creator}
        targetCostPerInstallInCents={targetCostPerInstallInCents}
      />

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Stream history</SectionTitle>
        <StreamHistoryTable streams={streamHistory} />
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>Payment history</SectionTitle>

          <Button
            variant="primary"
            disabled={onRecordPayment === undefined}
            onClick={onRecordPayment ? () => onRecordPayment(creator) : undefined}
          >
            + Record payment
          </Button>
        </div>

        <div>
          <PaymentProgressPanel creator={creator} />
          <PaymentHistoryTable creator={creator} onReversePayment={onReversePayment} />
        </div>
      </section>
    </div>
  )
}
