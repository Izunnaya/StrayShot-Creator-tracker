import { useEffect, useState } from 'react'
import { AppMasthead, type AppTab } from './components/layout/AppMasthead'
import { campaigns as seedCampaigns, creators as seedCreators } from './data/fixtures'
import { currentTeamMember } from './data/session'
import type { Campaign, Creator, Payment } from './data/types'
import {
  buildCampaign,
  findCampaign,
  getCampaignName,
  type CampaignDraft,
} from './domain/campaigns'
import { applyDraftToCreator, buildCreator, type CreatorDraft } from './domain/creatorRecording'
import { buildPayment, buildReversal, type PaymentDraft } from './domain/paymentRecording'
import { CreatorDetailScreen } from './features/creatorDetail/CreatorDetailScreen'
import { CampaignOverviewScreen } from './features/dashboard/CampaignOverviewScreen'
import { PaymentsLedgerScreen } from './features/payments/PaymentsLedgerScreen'
import { usePaymentLedgerSelection } from './features/payments/hooks/usePaymentLedgerSelection'
import { useCreatorFilterSelection } from './features/dashboard/hooks/useCreatorFilterSelection'
import { useCreatorSortSelection } from './features/dashboard/hooks/useCreatorSortSelection'
import { CampaignModal } from './features/campaigns/CampaignModal'
import { CreatorModal } from './features/creators/CreatorModal'
import { RecordPaymentModal } from './features/payments/RecordPaymentModal'
import { ReversePaymentModal } from './features/payments/ReversePaymentModal'
import { navigate, useRoute } from './lib/router'

/**
 * The application shell.
 *
 * It owns the creator list, because recording a payment has to be visible
 * everywhere at once — the outstanding panel, the table's progress bar, the
 * summary figures and the creator's own screen all read the same records.
 * Until the API arrives this is that single source; afterwards it becomes the
 * cache the API fills, and the screens below do not change either way, since
 * they already take what to show as props.
 *
 * Which screen is showing lives in the URL (see lib/router), so a creator or
 * the ledger can be linked, bookmarked and reloaded, and the browser's Back
 * works. A creator's own screen remembers the tab it was opened from and goes
 * back to it, so following a payment to the person it went to does not lose
 * the ledger behind it. Filters are not in the URL: they survive a trip to a
 * creator and back because the shell holds them, not the address.
 *
 * The detail screen is looked up by id rather than held as an object, so it
 * cannot show a stale copy of a creator who was just paid.
 */
export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(seedCampaigns)
  const [creators, setCreators] = useState<Creator[]>(seedCreators)
  const [creatorBeingPaidId, setCreatorBeingPaidId] = useState<number | null>(null)
  const [paymentBeingReversed, setPaymentBeingReversed] = useState<Payment | null>(null)
  /** null while closed; a campaign while editing; 'new' while creating. */
  const [campaignBeingEdited, setCampaignBeingEdited] = useState<Campaign | 'new' | null>(null)
  /** null while closed; a creator's id while editing; 'new' while adding. */
  const [creatorBeingEditedId, setCreatorBeingEditedId] = useState<number | 'new' | null>(null)

  /** Kept here so each screen's filters survive a trip to a creator and back. */
  const ledgerSelectionState = usePaymentLedgerSelection()
  const filterState = useCreatorFilterSelection()
  const sortState = useCreatorSortSelection()

  const { route, from } = useRoute()
  /** The tab in the masthead: the one showing, or the one a creator was opened from. */
  const tab: AppTab =
    route.screen === 'payments'
      ? 'payments'
      : route.screen === 'creator'
        ? (from ?? 'overview')
        : 'overview'
  const selectedCreatorId = route.screen === 'creator' ? route.creatorId : null

  const creatorInDetail = creators.find((creator) => creator.id === selectedCreatorId) ?? null

  /* An address for a creator who does not exist -- mistyped, or a stale
     bookmark -- goes to the overview instead of showing nothing. Replaced
     rather than pushed, so Back does not return to the dead link. */
  const isMissingCreator = route.screen === 'creator' && creatorInDetail === null
  useEffect(() => {
    if (isMissingCreator) navigate({ screen: 'overview' }, { replace: true })
  }, [isMissingCreator])

  function openCreator(creatorId: number) {
    navigate({ screen: 'creator', creatorId }, { from: tab })
  }

  function openTab(next: AppTab) {
    navigate({ screen: next })
  }
  const creatorBeingPaid = creators.find((creator) => creator.id === creatorBeingPaidId) ?? null

  /**
   * Held by id, like every other open record, and looked up on each render.
   * Keeping the object would mean the form showing the creator as they were
   * when it opened — sending an invite from inside it would update the list
   * underneath and leave the form still offering to send it.
   */
  const creatorBeingEdited =
    creatorBeingEditedId === 'new'
      ? 'new'
      : (creators.find((creator) => creator.id === creatorBeingEditedId) ?? null)

  function recordPayment(draft: PaymentDraft) {
    if (!creatorBeingPaid) return

    const payment = buildPayment(draft, {
      id: nextPaymentId(creators),
      recordedByTeamMemberId: currentTeamMember.id,
      today: todayAsIsoDate(),
    })

    addPayment(creatorBeingPaid.id, payment)
    setCreatorBeingPaidId(null)
  }

  function reversePayment() {
    if (!creatorInDetail || !paymentBeingReversed) return

    addPayment(
      creatorInDetail.id,
      buildReversal(paymentBeingReversed, {
        id: nextPaymentId(creators),
        reversedOn: todayAsIsoDate(),
        recordedByTeamMemberId: currentTeamMember.id,
      }),
    )
    setPaymentBeingReversed(null)
  }

  function saveCampaign(draft: CampaignDraft) {
    const editing = campaignBeingEdited !== 'new' ? campaignBeingEdited : null

    setCampaigns((current) =>
      editing
        ? current.map((campaign) =>
            campaign.id === editing.id ? { ...buildCampaign(draft, { id: editing.id }) } : campaign,
          )
        : [...current, buildCampaign(draft, { id: nextCampaignId(current) })],
    )
    setCampaignBeingEdited(null)
  }

  /**
   * Saves the form, and sends the portal invite in the same step when it was
   * the invite button that saved it.
   *
   * One operation rather than two, because the invite has to go to the record
   * as saved. Sending first would address it from the record the form opened
   * with -- the old email, in the one case anyone is editing that field for.
   */
  function saveCreator(draft: CreatorDraft, options: { sendInvite?: boolean } = {}) {
    const editing = creatorBeingEdited !== 'new' ? creatorBeingEdited : null
    // A new creator is invited exactly as an edited one is.
    const withInvite = (saved: Creator) => (options.sendInvite ? asInvited(saved) : saved)

    setCreators((current) =>
      editing
        ? current.map((creator) =>
            creator.id === editing.id
              ? withInvite(applyDraftToCreator(creator, draft, { campaigns }))
              : creator,
          )
        : [...current, withInvite(buildCreator(draft, { id: nextCreatorId(current), campaigns }))],
    )
    setCreatorBeingEditedId(null)
  }

  /** Sending is Module 8's work; this records that it went. */
  function sendInvite(creator: Creator) {
    setCreators((current) =>
      current.map((entry) => (entry.id === creator.id ? asInvited(entry) : entry)),
    )
  }

  function addPayment(creatorId: number, payment: Payment) {
    setCreators((current) =>
      current.map((creator) =>
        creator.id === creatorId
          ? { ...creator, payments: [...creator.payments, payment] }
          : creator,
      ),
    )
  }

  return (
    /* Room at the bottom on a phone for the fixed tab bar, so the last card
       can scroll clear of it. */
    <div className="grain min-h-screen pb-24 md:pb-0">
      <AppMasthead
        phoneTitle={creatorInDetail ? 'Creator' : tab === 'payments' ? 'Ledger' : 'Roster'}
        onBack={creatorInDetail ? () => openTab(tab) : undefined}
        activeTab={tab}
        /* Leaving a creator's screen is what choosing a tab means here --
           otherwise the tab appears selected behind a screen that did not
           change. */
        onSelectTab={openTab}
        onAddCreator={() => setCreatorBeingEditedId('new')}
      />

      {creatorInDetail ? (
        <CreatorDetailScreen
          creator={creatorInDetail}
          campaign={findCampaign(campaigns, creatorInDetail.campaignId)}
          onBack={() => openTab(tab)}
          onEditCreator={(creator) => setCreatorBeingEditedId(creator.id)}
          onRecordPayment={(creator) => setCreatorBeingPaidId(creator.id)}
          onReversePayment={setPaymentBeingReversed}
        />
      ) : tab === 'payments' ? (
        <PaymentsLedgerScreen
          campaigns={campaigns}
          creators={creators}
          selectionState={ledgerSelectionState}
          onSelectCreator={openCreator}
        />
      ) : (
        <CampaignOverviewScreen
          campaigns={campaigns}
          creators={creators}
          onSelectCreator={(creator) => openCreator(creator.id)}
          onRecordPayment={(creator) => setCreatorBeingPaidId(creator.id)}
          onCreateCampaign={() => setCampaignBeingEdited('new')}
          onEditCampaign={setCampaignBeingEdited}
          filterState={filterState}
          sortState={sortState}
        />
      )}

      {creatorBeingPaid && (
        <RecordPaymentModal
          creator={creatorBeingPaid}
          campaignName={getCampaignName(campaigns, creatorBeingPaid.campaignId)}
          /* Read at the moment the modal opens, never cached: a dashboard
             left open overnight would otherwise call today's date a future
             one and refuse to record a payment made this morning. */
          today={todayAsIsoDate()}
          onSave={recordPayment}
          onClose={() => setCreatorBeingPaidId(null)}
        />
      )}

      {creatorBeingEdited && (
        <CreatorModal
          campaigns={campaigns}
          creators={creators}
          editing={creatorBeingEdited === 'new' ? undefined : creatorBeingEdited}
          onSave={saveCreator}
          onSendInvite={sendInvite}
          onClose={() => setCreatorBeingEditedId(null)}
        />
      )}

      {campaignBeingEdited && (
        <CampaignModal
          campaigns={campaigns}
          creators={creators}
          editing={campaignBeingEdited === 'new' ? undefined : campaignBeingEdited}
          onSave={saveCampaign}
          onClose={() => setCampaignBeingEdited(null)}
        />
      )}

      {creatorInDetail && paymentBeingReversed && (
        <ReversePaymentModal
          creator={creatorInDetail}
          campaignName={getCampaignName(campaigns, creatorInDetail.campaignId)}
          payment={paymentBeingReversed}
          onConfirm={reversePayment}
          onClose={() => setPaymentBeingReversed(null)}
        />
      )}
    </div>
  )
}

/**
 * Records that the portal invite went out. Sending it is Module 8's work.
 *
 * Someone who has already claimed the portal is left as they are: a resend is
 * a new email, not a reason to forget that they are already in.
 */
function asInvited(creator: Creator): Creator {
  return creator.portalInviteState === 'claimed'
    ? creator
    : { ...creator, portalInviteState: 'sent' }
}

function nextCreatorId(creators: Creator[]): number {
  return creators.reduce((highest, creator) => Math.max(highest, creator.id), 0) + 1
}

function nextCampaignId(campaigns: Campaign[]): number {
  return campaigns.reduce((highest, campaign) => Math.max(highest, campaign.id), 0) + 1
}

/**
 * Ids are the API's job. Until it exists, one past the highest in play keeps
 * them unique without pretending to be anything cleverer.
 */
function nextPaymentId(creators: Creator[]): number {
  const everyPayment: Payment[] = creators.flatMap((creator) => creator.payments)
  return everyPayment.reduce((highest, payment) => Math.max(highest, payment.id), 0) + 1
}

/**
 * Today in the viewer's own timezone, which is the one they paid in.
 *
 * Called where it is needed rather than held in state or a memo. This screen
 * is the kind that stays open for days, and a date captured at mount goes
 * quietly wrong at midnight.
 */
function todayAsIsoDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
