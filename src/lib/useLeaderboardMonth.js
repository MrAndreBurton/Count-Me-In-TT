import { useEffect, useState } from "react";
import { currentLeaderboardMonth } from "./leaderboardPresentation";

export default function useLeaderboardMonth() {
  const [month, setMonth] = useState(() => currentLeaderboardMonth());
  useEffect(() => {
    const refresh = () => setMonth(currentLeaderboardMonth());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  return month;
}
