import { useMemo, useState } from 'react'
import { AppMasthead } from './components/layout/AppMasthead'
import { creators as seedCreators } from './data/fixtures'
import { currentTeamMember } from './data/session'
import type { Creator, Payment } from './data/types'
import { buildPayment, buildReversal, type PaymentDraft } from './domain/paymentRecording'
import { CreatorDetailScreen } from './features/creatorDetail/CreatorDetailScreen'
import { CampaignOverviewScreen } from './features/dashboard/CampaignOverviewScreen'
import { useCreatorFilterSelection } from './features/dashboard/hooks/useCreatorFilterSelection'
import { useCreatorSortSelection } from './features/dashboard/hooks/useCreatorSortSelection'
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
  const [creators, setCreators] = useState<Creator[]>(seedCreators)
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null)
  const [creatorBeingPaidId, setCreatorBeingPaidId] = useState<number | null>(null)
  const [paymentBeingReversed, setPaymentBeingReversed] = useState<Payment | null>(null)

  const filterState = useCreatorFilterSelection()
  const sortState = useCreatorSortSelection()
  const today = useMemo(() => todayAsIsoDate(), [])

  const creatorInDetail = creators.find((creator) => creator.id === selectedCreatorId) ?? null
  const creatorBeingPaid = creators.find((creator) => creator.id === creatorBeingPaidId) ?? null

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
        reversedOn: today,
        recordedBy: currentTeamMember.name,
      }),
    )
    setPaymentBeingReversed(null)
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
      <AppMasthead activeTab="overview" />

      {creatorInDetail ? (
        <CreatorDetailScreen
          creator={creatorInDetail}
          onBack={() => setSelectedCreatorId(null)}
          onRecordPayment={(creator) => setCreatorBeingPaidId(creator.id)}
          onReversePayment={setPaymentBeingReversed}
        />
      ) : (
        <CampaignOverviewScreen
          creators={creators}
          onSelectCreator={(creator) => setSelectedCreatorId(creator.id)}
          onRecordPayment={(creator) => setCreatorBeingPaidId(creator.id)}
          filterState={filterState}
          sortState={sortState}
        />
      )}

      {creatorBeingPaid && (
        <RecordPaymentModal
          creator={creatorBeingPaid}
          today={today}
          onSave={recordPayment}
          onClose={() => setCreatorBeingPaidId(null)}
        />
      )}

      {creatorInDetail && paymentBeingReversed && (
        <ReversePaymentModal
          creator={creatorInDetail}
          payment={paymentBeingReversed}
          onConfirm={reversePayment}
          onClose={() => setPaymentBeingReversed(null)}
        />
      )}
    </div>
  )
}

/**
 * Ids are the API's job. Until it exists, one past the highest in play keeps
 * them unique without pretending to be anything cleverer.
 */
function nextPaymentId(creators: Creator[]): number {
  const everyPayment: Payment[] = creators.flatMap((creator) => creator.payments)
  return everyPayment.reduce((highest, payment) => Math.max(highest, payment.id), 0) + 1
}

/** Today in the viewer's own timezone, which is the one they paid in. */
function todayAsIsoDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
