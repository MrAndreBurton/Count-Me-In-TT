import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { loadPublicLeaderboards } from "../lib/publicLeaderboards";
import { createPublicLeaderboardService } from "../services/publicLeaderboardService";
import LearnerLeaderboardView from "../components/leaderboards/LearnerLeaderboardView";
import GameHeader from "../components/layout/GameHeader";
import SiteFooter from "../components/layout/SiteFooter";
import "../styles/learnerLeaderboards.css";

export default function PublicLeaderboards({ hall = false }) {
  const [params] = useSearchParams();
  if (hall || params.get("view") === "hall-of-fame") return <Navigate replace to="/hall-of-fame" />;
  return <PublicLeaderboardPage />;
}

function PublicLeaderboardPage() {
  const service = useMemo(() => createPublicLeaderboardService(supabase), []);
  const [state, setState] = useState({ status: "loading", boards: [], revision: 0 });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let request = 0;
    const timers = new Set();
    async function load() {
      const current = ++request;
      setState({ status: "loading", boards: [], revision: current });
      try {
        const boards = await loadPublicLeaderboards(service);
        if (active && current === request) setState({ status: "ready", boards, revision: current });
      } catch {
        if (active && current === request) setState({ status: "error", boards: [], revision: current });
      }
    }
    // Viewing never requires sign-in and never loads private boards or profiles.
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (!active || event === "INITIAL_SESSION") return;
      ++request;
      // Immediately remove personalised rows on logout/account changes.
      setState({ status: "loading", boards: [], revision: request });
      const timer = window.setTimeout(() => { timers.delete(timer); if (active) void load(); }, 0);
      timers.add(timer);
    });
    return () => { active = false; ++request; subscription.unsubscribe(); timers.forEach(t => window.clearTimeout(t)); };
  }, [service, retry]);
  useEffect(() => {
    document.title = "Public Leaderboard | CountMeInTT";
  }, []);
  return <div className="learner-leaderboard-page min-h-screen text-gray-950"><GameHeader />
    {state.status === "ready" ? <LearnerLeaderboardView key={state.revision} boards={state.boards} service={service} publicOnly />
      : <main className="mx-auto max-w-2xl px-5 py-16"><section className="rounded-3xl border border-blue-100 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black">{state.status === "loading" ? "Loading public leaderboards…" : "Public results could not be loaded"}</h1>
        {state.status === "error" && <><p role="alert" className="mt-4 text-gray-700">Please check your connection and try again.</p><button type="button" onClick={() => setRetry(n => n + 1)} className="mt-6 min-h-11 rounded-xl bg-blue-600 px-5 py-3 font-black text-white">Try again</button></>}
      </section></main>}
    <SiteFooter />
  </div>;
}
