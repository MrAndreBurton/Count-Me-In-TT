import { useSearchParams } from "react-router-dom";
import PublicHallOfFame from "./pages/PublicHallOfFame";
import LearnerLeaderboards from "./pages/LearnerLeaderboards";

export default function HallOfFame() {
  const [params] = useSearchParams();
  return params.get("audience") === "organisation" ? <LearnerLeaderboards hallOnly /> : <PublicHallOfFame />;
}
