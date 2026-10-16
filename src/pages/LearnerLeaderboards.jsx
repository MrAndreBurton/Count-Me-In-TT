import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { loadLearnerLeaderboards } from "../lib/learnerLeaderboards";
import { createLeaderboardService } from "../services/leaderboardService";
import { createPublicLeaderboardService } from "../services/publicLeaderboardService";
import LearnerLeaderboardView from "../components/leaderboards/LearnerLeaderboardView";
import GameHeader from "../components/layout/GameHeader";
import SiteFooter from "../components/layout/SiteFooter";
import "../styles/learnerLeaderboards.css";

export default function LearnerLeaderboards() {
  const [state, setState] = useState({ status: "loading", boards: [] });
  const [retry, setRetry] = useState(0);
  const service = useMemo(() => createLeaderboardService(supabase), []);
  const publicService = useMemo(() => createPublicLeaderboardService(supabase), []);
  useEffect(() => {
    let active = true;
    let request = 0;
    const timers = new Set();
    const load = async () => {
      const current = ++request;
      setState({ status: "loading", boards: [] });
      try {
        const result = await loadLearnerLeaderboards(supabase);
        if (active && request === current) setState(result);
      } catch { if (active && request === current) setState({ status: "error", boards: [] }); }
    };
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (!active || event === "INITIAL_SESSION") return;
      ++request;
      setState({ status: event === "SIGNED_OUT" ? "signed_out" : "loading", boards: [] });
      if (event !== "SIGNED_OUT") {
        const timer = window.setTimeout(() => { timers.delete(timer); if (active) void load(); }, 0);
        timers.add(timer);
      }
    });
    return () => { active = false; ++request; subscription.unsubscribe(); timers.forEach(t => window.clearTimeout(t)); };
  }, [retry]);
  useEffect(() => { document.title = "My Leaderboards | CountMeInTT"; }, []);
  return <div className="learner-leaderboard-page min-h-screen text-gray-950"><GameHeader />
    {state.status === "ready" ? <LearnerLeaderboardView key={state.userId} boards={state.boards} service={service} publicService={publicService} />
      : <main className="mx-auto max-w-2xl px-5 py-16"><section className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black">{state.status === "loading" ? "Loading your leaderboards…" : state.status === "signed_out" ? "Sign in to view your leaderboards" : "Leaderboards could not be loaded"}</h1>
        {state.status === "signed_out" && <><p className="mt-4 leading-7 text-gray-600">Your organisation and class leaderboards are private. Use your learner account to open them.</p><Link to="/login" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 py-3 font-black text-white">Sign in</Link></>}
        {state.status === "error" && <><p role="alert" className="mt-4 text-gray-600">Please check your connection and try again.</p><button type="button" onClick={() => setRetry(n => n + 1)} className="mt-6 min-h-11 rounded-xl bg-blue-600 px-5 py-3 font-black text-white">Try again</button></>}
      </section></main>}
    <SiteFooter />
  </div>;
}
