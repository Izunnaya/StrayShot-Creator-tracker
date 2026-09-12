import { useState } from 'react'
import { AppMasthead } from './components/layout/AppMasthead'
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
import { useCreatorFilterSelection } from './features/dashboard/hooks/useCreatorFilterSelection'
import { useCreatorSortSelection } from './features/dashboard/hooks/useCreatorSortSelection'
import { CampaignModal } from './features/campaigns/CampaignModal'
import { CreatorModal } from './features/creators/CreatorModal'
import { RecordPaymentModal } from './features/payments/RecordPaymentModal'
import { ReversePaymentModal } from './features/payments/ReversePaymentModal'

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
 * Which screen is showing is state rather than a router: with two screens and
 * no shareable URLs yet, that is the honest amount of machinery. The detail
 * screen is looked up by id rather than held as an object, so it cannot show
 * a stale copy of a creator who was just paid.
 */
export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(seedCampaigns)
  const [creators, setCreators] = useState<Creator[]>(seedCreators)
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null)
  const [creatorBeingPaidId, setCreatorBeingPaidId] = useState<number | null>(null)
  const [paymentBeingReversed, setPaymentBeingReversed] = useState<Payment | null>(null)
  /** null while closed; a campaign while editing; 'new' while creating. */
  const [campaignBeingEdited, setCampaignBeingEdited] = useState<Campaign | 'new' | null>(null)
  /** null while closed; a creator's id while editing; 'new' while adding. */
  const [creatorBeingEditedId, setCreatorBeingEditedId] = useState<number | 'new' | null>(null)

  const filterState = useCreatorFilterSelection()
  const sortState = useCreatorSortSelection()

  const creatorInDetail = creators.find((creator) => creator.id === selectedCreatorId) ?? null
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
      recordedBy: currentTeamMember.name,
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
        recordedBy: currentTeamMember.name,
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

  function saveCreator(draft: CreatorDraft) {
    const editing = creatorBeingEdited !== 'new' ? creatorBeingEdited : null

    setCreators((current) =>
      editing
        ? current.map((creator) =>
            creator.id === editing.id
              ? applyDraftToCreator(creator, draft, { campaigns })
              : creator,
          )
        : [...current, buildCreator(draft, { id: nextCreatorId(current), campaigns })],
    )
    setCreatorBeingEditedId(null)
  }

  /** Sending is Module 8's work; this records that it went. */
  function sendInvite(creator: Creator) {
    setCreators((current) =>
      current.map((entry) =>
        entry.id === creator.id ? { ...entry, portalInviteState: 'sent' } : entry,
      ),
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
    <div className="grain min-h-screen">
      <AppMasthead activeTab="overview" onAddCreator={() => setCreatorBeingEditedId('new')} />

      {creatorInDetail ? (
        <CreatorDetailScreen
          creator={creatorInDetail}
          campaign={findCampaign(campaigns, creatorInDetail.campaignId)}
          onBack={() => setSelectedCreatorId(null)}
          onEditCreator={(creator) => setCreatorBeingEditedId(creator.id)}
          onRecordPayment={(creator) => setCreatorBeingPaidId(creator.id)}
          onReversePayment={setPaymentBeingReversed}
        />
      ) : (
        <CampaignOverviewScreen
          campaigns={campaigns}
          creators={creators}
          onSelectCreator={(creator) => setSelectedCreatorId(creator.id)}
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
