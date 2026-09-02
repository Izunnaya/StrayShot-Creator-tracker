import { AppMasthead } from './components/layout/AppMasthead'
import { CampaignOverviewScreen } from './features/dashboard/CampaignOverviewScreen'

/**
 * The application shell. Only the campaign overview exists so far; the
 * Payments ledger and the creator detail screen arrive with their own
 * modules, at which point this is where routing goes.
 */
export default function App() {
  return (
    <div className="grain min-h-screen">
      <AppMasthead activeTab="overview" />
      <CampaignOverviewScreen />
    </div>
  )
}
