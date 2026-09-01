import { Masthead } from "./components/Masthead";
import { CampaignOverview } from "./screens/CampaignOverview";

export default function App() {
  return (
    <div className="grain min-h-screen">
      <Masthead active="overview" />
      <CampaignOverview />
    </div>
  );
}
