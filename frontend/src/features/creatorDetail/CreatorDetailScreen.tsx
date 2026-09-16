import { useMemo, useState } from 'react'
import { streams as allStreams } from '@/data/fixtures'
import type { Campaign, Creator, Payment } from '@/data/types'
import { getLifecycleStatus } from '@/domain/creatorCalculations'
import { getStreamHistoryForCreator } from '@/domain/streamHistory'
import { usePhoneLayout } from '@/lib/usePhoneLayout'
import { Button, CreatorStatusPill, SectionTitle } from '@/ui'
import { DiscardCreatorModal } from '@/features/creators/DiscardCreatorModal'
import { CreatorDetailHeader } from './components/CreatorDetailHeader'
import { CreatorDetailStatStrip } from './components/CreatorDetailStatStrip'
import { PaymentHistoryCards, PaymentHistoryTable } from './components/PaymentHistoryTable'
import { PaymentProgressPanel } from './components/PaymentProgressPanel'
import { StreamHistoryCards, StreamHistoryTable } from './components/StreamHistoryTable'

/**
 * Everything about one creator: who they are, what they delivered, and what
 * they have been paid.
 *
 * The screen holds no state. It is given the creator to show and a way back,
 * which keeps it usable from anywhere that can name a creator — the dashboard
 * table, and the payments ledger.
 *
 * Two layouts. From md up, the design's: the header, the figures, the stream
 * history, then the payment history. On a phone the design reorders it around
 * what is done there — the code to read out, the figures, the balance with
 * the button to settle it, the payments, and the streams last — and draws
 * each list as cards.
 *
 * Data still comes from the fixture module; swapping those imports for API
 * calls is this screen's Phase 5 work.
 */
export function CreatorDetailScreen({
  creator,
  campaign,
  onBack,
  onEditCreator,
  onRecordPayment,
  onReversePayment,
  onDiscardCreator,
}: {
  creator: Creator
  /**
   * The creator's campaign as it stands now, or undefined if it has gone.
   *
   * Passed in rather than looked up here: the shell holds the campaign list,
   * and reading a static copy would show this creator's campaign name from
   * one source and its cost-per-install target from another — so editing a
   * target would rename the campaign on screen while judging the creator
   * against the old figure.
   */
  campaign?: Campaign
  onBack: () => void
  onEditCreator?: (creator: Creator) => void
  onRecordPayment?: (creator: Creator) => void
  /** Offers to undo one of this creator's payments. */
  onReversePayment?: (payment: Payment) => void
  /** Removes the record. Only a creator nothing has happened to may go — Q51. */
  onDiscardCreator?: (creator: Creator) => void
}) {
  const isPhone = usePhoneLayout()
  const [isDiscarding, setIsDiscarding] = useState(false)
  const streamHistory = useMemo(
    () => getStreamHistoryForCreator(allStreams, creator.id),
    [creator.id],
  )

  /**
   * The cost-per-install verdict is measured against this creator's own
   * campaign, not whatever the dashboard was filtered to when they were
   * opened. A creator only belongs to one campaign today — open question Q13.
   *
   * With no campaign there is no target, and no default stands in for one:
   * the dashboard may fall back to one when it is deliberately showing every
   * campaign at once (Q21), but a creator showing "No campaign" would be
   * called good or bad against a figure that is not theirs.
   */
  const targetCostPerInstallInCents = campaign?.targetCostPerInstallInCents ?? null
  const campaignName = campaign?.name ?? 'No campaign'

  const recordPayment = onRecordPayment ? () => onRecordPayment(creator) : undefined

  /* Rendered by both layouts, so the rule and its explanation live in one
     place rather than in each of them. */
  const discardModal = isDiscarding && onDiscardCreator && (
    <DiscardCreatorModal
      creator={creator}
      streamCount={streamHistory.length}
      onConfirm={() => {
        setIsDiscarding(false)
        onDiscardCreator(creator)
      }}
      onClose={() => setIsDiscarding(false)}
    />
  )

  if (isPhone) {
    return (
      <div className="px-4 pb-6 pt-5 sm:px-6">
        <h1 className="font-display text-[32px] uppercase leading-none tracking-[1px] text-ink text-shadow-stencil">
          {creator.name}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[13px] text-ink-muted">
          <CreatorStatusPill status={getLifecycleStatus(creator)} size="small" />
          <span>{creator.platform}</span>
          <span>{campaignName}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border border-amber px-3.75 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-[2px] text-ink-muted">Code</div>
            <div className="font-display text-[26px] leading-[1.15] tracking-[4px] text-amber">
              {creator.creatorCode}
            </div>
          </div>
          <Button
            variant="secondary"
            disabled={onEditCreator === undefined}
            onClick={onEditCreator ? () => onEditCreator(creator) : undefined}
            className="min-h-11"
          >
            Edit
          </Button>
        </div>

        <div className="mt-4.5">
          <CreatorDetailStatStrip
            creator={creator}
            targetCostPerInstallInCents={targetCostPerInstallInCents}
          />
        </div>

        <div className="mt-5">
          <PaymentProgressPanel
            creator={creator}
            layout="phone"
            action={
              <Button
                variant="primary"
                size="block"
                disabled={recordPayment === undefined}
                onClick={recordPayment}
              >
                + Record payment
              </Button>
            }
          />
        </div>

        <SectionTitle size="small" className="mb-2.5 mt-6">
          Payments
        </SectionTitle>
        <PaymentHistoryCards creator={creator} onReversePayment={onReversePayment} />

        <SectionTitle size="small" className="mb-2.5 mt-6">
          Streams
        </SectionTitle>
        <StreamHistoryCards streams={streamHistory} />

        <div className="mt-6 flex flex-col gap-2.5">
          {onDiscardCreator && (
            <Button variant="dangerOutline" size="block" onClick={() => setIsDiscarding(true)}>
              Discard creator
            </Button>
          )}
        </div>

        {discardModal}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-240 px-8 pb-12 pt-7">
      <CreatorDetailHeader
        creator={creator}
        campaignName={campaignName}
        onBack={onBack}
        onEditCreator={onEditCreator}
        onDiscardCreator={onDiscardCreator ? () => setIsDiscarding(true) : undefined}
      />

      <div className="mb-7 mt-5.5">
        <CreatorDetailStatStrip
          creator={creator}
          targetCostPerInstallInCents={targetCostPerInstallInCents}
        />
      </div>

      <SectionTitle className="mb-2.5">Stream history</SectionTitle>
      <StreamHistoryTable streams={streamHistory} />

      <div className="mb-2.5 mt-8 flex items-center justify-between gap-3">
        <SectionTitle>Payment history</SectionTitle>
        <Button
          variant="primary"
          size="compact"
          disabled={recordPayment === undefined}
          onClick={recordPayment}
        >
          + Record payment
        </Button>
      </div>

      <PaymentProgressPanel creator={creator} />
      <PaymentHistoryTable creator={creator} onReversePayment={onReversePayment} />

      {discardModal}
    </div>
  )
}
