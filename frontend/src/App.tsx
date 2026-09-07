import { useState } from 'react'
import { useCreatorFilterSelection } from './features/dashboard/hooks/useCreatorFilterSelection'
import { useCreatorSortSelection } from './features/dashboard/hooks/useCreatorSortSelection'
import { AppMasthead } from './components/layout/AppMasthead'
import type { Creator } from './data/types'
import { CreatorDetailScreen } from './features/creatorDetail/CreatorDetailScreen'
import { CampaignOverviewScreen } from './features/dashboard/CampaignOverviewScreen'

/**
 * The application shell.
 *
 * Which screen is showing is held here as state rather than in a router: with
 * two screens and no shareable URLs yet, state is the honest amount of
 * machinery. The moment the payments ledger and the creator-facing screens
 * arrive — each of which a team member will want to link someone to — this is
 * where a router goes, and the screens below do not have to change, since
 * they already take what to show as props.
 */
export default function App() {
  const [creatorInDetail, setCreatorInDetail] = useState<Creator | null>(null)

  const filterState = useCreatorFilterSelection()
  const sortState = useCreatorSortSelection()

  return (
    <div className="grain min-h-screen">
      <AppMasthead activeTab="overview" />

      {creatorInDetail ? (
        <CreatorDetailScreen creator={creatorInDetail} onBack={() => setCreatorInDetail(null)} />
      ) : (
        <CampaignOverviewScreen
          onSelectCreator={setCreatorInDetail}
          filterState={filterState}
          sortState={sortState}
        />
      )}
    </div>
  )
}
