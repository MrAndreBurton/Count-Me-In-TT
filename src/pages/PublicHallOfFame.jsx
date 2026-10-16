import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { supabase } from "../lib/supabase";
import { monthLabel } from "../lib/leaderboardPresentation";
import { loadChampionCatalogue, loadPublicChampionMonth } from "../lib/publicChampions";
import useLeaderboardMonth from "../lib/useLeaderboardMonth";
import { createPublicLeaderboardService } from "../services/publicLeaderboardService";
import { createHallOfFameArchiveService } from "../services/hallOfFameArchiveService";
import MonthlyChampions from "../components/leaderboards/MonthlyChampions";
import GameHeader from "../components/layout/GameHeader";
import SiteFooter from "../components/layout/SiteFooter";
import "../styles/learnerLeaderboards.css";

export default function PublicHallOfFame() {
  const publicService = useMemo(() => createPublicLeaderboardService(supabase), []);
  const archiveService = useMemo(() => createHallOfFameArchiveService(supabase), []);
  const current = useLeaderboardMonth();
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({ status: "loading", rows: [] });
  useEffect(() => {
    let active = true;
    setState({ status: "loading", rows: [] });
    async function load() {
      try {
        const catalogue = await loadChampionCatalogue(publicService, archiveService);
        const result = await loadPublicChampionMonth(publicService, archiveService, catalogue, catalogue.featured);
        if (active) setState({ status: "ready", month: catalogue.featured, ...result });
      } catch { if (active) setState({ status: "error", rows: [] }); }
    }
    void load();
    return () => { active = false; };
  }, [publicService, archiveService, current, retry]);
  useEffect(() => {
    if (state.status !== "ready" || !state.pending) return;
    const timer = window.setTimeout(() => setRetry(n => n + 1), 30000);
    return () => window.clearTimeout(timer);
  }, [state]);
  useEffect(() => { document.title = "Hall of Fame | CountMeInTT"; }, []);
  return <div className="learner-leaderboard-page min-h-screen text-gray-950"><GameHeader />
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="overflow-hidden rounded-3xl border border-blue-100 shadow-sm">
        <div className="leaderboard-banner">
          <Link to="/games" className="leaderboard-logo-tile leaderboard-banner-left"><img src="/CountmeIn Logo No bg.png" alt="CountMeInTT" /></Link>
          <div className="leaderboard-banner-copy"><p className="text-xs font-black uppercase tracking-widest text-yellow-300">Multiplication Challenge</p>
            <h1 className="leaderboard-banner-title mt-2 font-black">Hall of Fame</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100">An exclusive celebration of our monthly champions, across every grid and category.</p></div>
          <div className="leaderboard-banner-right"><Trophy aria-hidden="true" className="h-12 w-12 text-yellow-300" /></div>
        </div>
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/hall-of-fame/archive" className="inline-flex min-h-12 items-center rounded-xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700">Past Champions →</Link>
            <button type="button" onClick={() => setRetry(n => n + 1)} className="min-h-11 px-3 font-bold text-blue-800">Refresh champions</button>
          </div>
          <p className="mt-5 text-sm leading-7 text-blue-950">Each month we honour the previous month’s confirmed champions. Their achievements remain in Past Champions as the next collection arrives.</p>
          {state.status === "loading" ? <p role="status" className="py-12 text-center">Loading champions…</p>
            : state.status === "error" ? <p role="alert" className="py-12 text-center">Champions could not be loaded. Please try Refresh champions.</p>
            : state.rows.length ? <MonthlyChampions rows={state.rows} month={state.month} featured />
            : <div className="py-12 text-center"><h2 className="text-2xl font-black text-blue-950">{monthLabel(state.month)}</h2>
              <p className="mt-3 text-sm leading-7">{state.pending ? "This month’s champions are being confirmed. Check back shortly." : "There are no confirmed public champions for this month."}</p></div>}
          <p className="mt-6 text-center text-xs leading-6 text-blue-950">Equal winning times share the honour. Monthly changes follow Trinidad and Tobago time.</p>
        </div>
      </section>
    </main><SiteFooter />
  </div>;
}
