import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { supabase } from "../lib/supabase";
import { createHallOfFameArchiveService } from "../services/hallOfFameArchiveService";
import { formatLeaderboardTime, monthLabel } from "../lib/leaderboardPresentation";
import GameHeader from "../components/layout/GameHeader";
import SiteFooter from "../components/layout/SiteFooter";
import "../styles/learnerLeaderboards.css";
import { loadChampionCatalogue, loadPublicChampionMonth } from "../lib/publicChampions";
import useLeaderboardMonth from "../lib/useLeaderboardMonth";
import { createPublicLeaderboardService } from "../services/publicLeaderboardService";
import MonthlyChampions, { ChampionMonthPicker } from "../components/leaderboards/MonthlyChampions";

const field = "mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 font-bold text-gray-950";
const button = "inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 py-3 font-black text-white disabled:opacity-50";
const grids = ["5x5", "5x12", "12x12", "15x15"];
const categoryLabel = value => value === "NoSchool" ? "Open" : value;

export default function HallOfFameArchive({ admin = false }) {
  const service = useMemo(() => createHallOfFameArchiveService(supabase), []);
  const publicService = useMemo(() => createPublicLeaderboardService(supabase), []);
  const currentMonth = useLeaderboardMonth();
  const [catalogue, setCatalogue] = useState(null);
  const [state, setState] = useState({ status: "loading", months: [], candidates: [], batches: [] });
  const [month, setMonth] = useState("");
  const [grid, setGrid] = useState("5x5");
  const [category, setCategory] = useState("Primary");
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [result, setResult] = useState({ key: "", status: "loading", rows: [] });
  const [retry, setRetry] = useState(0);
  const [revision, setRevision] = useState(0);
  const request = useRef(0);
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selectedMonth = state.months.includes(month) ? month : state.months[0] || "";
  const resultKey = JSON.stringify([selectedMonth]);
  useEffect(() => {
    let active = true;
    const current = ++request.current;
    setState({ status: "loading", months: [], candidates: [], batches: [] });
    setReview(null);
    async function load() {
      try {
        if (admin) {
          const data = await service.listReview();
          if (active && current === request.current) setState({ status: "ready", candidates: data.candidates, batches: data.batches,
            months: [...new Set(data.candidates.map(c => c.month))].sort().reverse() });
        } else {
          const data = await loadChampionCatalogue(publicService, service);
          if (active && current === request.current) {
            setCatalogue(data);
            setState({ status: "ready", months: data.archiveMonths, candidates: [], batches: [] });
          }
        }
      } catch (error) { if (active && current === request.current) setState({ status: error.code === "42501" ? "forbidden" : "error", months: [], candidates: [], batches: [] }); }
    }
    void load();
    return () => { active = false; ++request.current; };
  }, [service, publicService, admin, retry, revision, currentMonth]);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === "INITIAL_SESSION") return;
      ++request.current;
      // Remove private review data synchronously when the account changes.
      setState({ status: "loading", months: [], candidates: [], batches: [] });
      setReview(null); setRevision(n => n + 1);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (admin || !catalogue || !selectedMonth || state.status !== "ready") return;
    let active = true;
    setResult({ key: resultKey, status: "loading", rows: [] });
    loadPublicChampionMonth(publicService, service, catalogue, selectedMonth).then(data => {
      if (active) setResult({ key: resultKey, status: "ready", ...data });
    }).catch(() => { if (active) setResult({ key: resultKey, status: "error", rows: [] }); });
    return () => { active = false; };
  }, [service, publicService, catalogue, admin, state.status, selectedMonth, resultKey, retry, revision]);
  useEffect(() => { document.title = (admin ? "Review Hall of Fame Archive" : "Past Champions") + " | CountMeInTT"; }, [admin]);
  const rows = admin ? state.candidates.filter(c => c.month === selectedMonth && c.variant === grid && c.category === category &&
    (reviewStatus === "all" || c.review_status === reviewStatus)) : result.key === resultKey ? result.rows : [];
  async function saveReview(event) {
    event.preventDefault(); if (busy || !review) return;
    setBusy(true); setMessage("");
    try {
      await service.review({ candidateId: review.id, status: review.status, displayName: review.name, reason: review.reason });
      setMessage("Review saved."); setReview(null); setRetry(n => n + 1);
    } catch { setMessage("Review could not be saved. Check your access, display name and reason, then try again."); }
    finally { setBusy(false); }
  }
  return <div className="learner-leaderboard-page min-h-screen text-gray-950"><GameHeader />
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link className="mb-5 inline-flex min-h-11 items-center font-bold text-blue-700 hover:underline" to={admin ? "/admin/leaderboards" : "/hall-of-fame"}>← {admin ? "Leaderboard control centre" : "Current Hall of Fame"}</Link>
      <section className="overflow-hidden rounded-3xl border border-blue-100 shadow-sm">
        <div className="leaderboard-banner">
          <Link to="/games" className="leaderboard-logo-tile leaderboard-banner-left"><img src="/CountmeIn Logo No bg.png" alt="CountMeInTT" /></Link>
          <div className="leaderboard-banner-copy"><p className="text-xs font-black uppercase tracking-widest text-yellow-300">Multiplication Challenge</p>
            <h1 className="leaderboard-banner-title mt-2 font-black">{admin ? "Review historical champions" : "Past champions"}</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100">{admin ? "Review recovered historical achievements." : "A lasting home for our champions, month after month."}</p></div>
          <div className="leaderboard-banner-right"><Trophy aria-hidden="true" className="h-12 w-12 text-yellow-300" /></div>
        </div>
        <div className="p-5 sm:p-8">
          <p className="text-sm leading-7 text-blue-950">{admin
            ? "These records reconstruct the old Hall of Fame rules; they are not saved, confirmed award snapshots. Review the public display name before approving. Approval publishes this record to Past champions. School records and complete source backups stay private."
            : "Explore earlier monthly champions across every grid and category. Recovered legacy achievements and confirmed competition winners are preserved here as each new collection takes its place in the Hall of Fame."}</p>
          {state.status === "loading" ? <p role="status" className="py-10">Loading archive…</p>
            : state.status === "forbidden" ? <p role="alert" className="py-10 font-bold">Only the active superadmin can review historical records.</p>
            : state.status === "error" ? <p role="alert" className="py-10">The archive could not be loaded. <button className="min-h-11 font-bold underline" onClick={() => setRetry(n => n + 1)}>Try again</button></p>
            : <>
              {admin && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-bold">{state.candidates.length} recovered records · {state.candidates.filter(c => c.review_status === "pending").length} awaiting review · {state.batches.length} preserved snapshot batch</p>}
              {!state.months.length ? <div className="py-12 text-center"><h2 className="text-xl font-black">Historical champions are being reviewed</h2><p className="mt-3 leading-7">Earlier records are preserved. Reviewed records will appear here as they are approved.</p></div>
                : <>
                  {admin ? <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <label className="text-sm font-bold">Month<select className={field} value={selectedMonth} onChange={e => { setMonth(e.target.value); setReview(null); }}>{state.months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}</select></label>
                    <label className="text-sm font-bold">Grid<select className={field} value={grid} onChange={e => { setGrid(e.target.value); setReview(null); }}>{grids.map(g => <option key={g} value={g}>{g.replace("x", " × ")}</option>)}</select></label>
                    <label className="text-sm font-bold">Category<select className={field} value={category} onChange={e => { setCategory(e.target.value); setReview(null); }}>{["Primary", "Secondary", "NoSchool"].map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}</select></label>
                    {admin && <label className="text-sm font-bold">Review status<select className={field} value={reviewStatus} onChange={e => { setReviewStatus(e.target.value); setReview(null); }}>{["pending", "approved", "rejected", "all"].map(s => <option key={s} value={s}>{s}</option>)}</select></label>}
                  </div> : <div className="mt-6"><ChampionMonthPicker months={state.months} value={selectedMonth} onChange={setMonth} fieldClass={field} /></div>}
                  {admin && <h2 className="mt-8 text-xl font-black">{monthLabel(selectedMonth)} · {grid.replace("x", " × ")} · {categoryLabel(category)}</h2>}
                  {!admin && (result.key !== resultKey || result.status === "loading") ? <p role="status" className="py-8">Loading historical records…</p>
                    : !admin && result.status === "error" ? <p role="alert" className="py-8">Results could not be loaded. <button className="min-h-11 underline" onClick={() => setRetry(n => n + 1)}>Try again</button></p>
                    : !rows.length ? <p className="py-8">No {admin ? "matching" : "reviewed"} historical record for this selection.</p>
                    : !admin ? <MonthlyChampions rows={rows} month={selectedMonth} legacy={result.legacy} /> : <ul className="mt-5 space-y-4">{rows.map((row, i) => <li key={row.id || i} className="rounded-2xl border border-yellow-300 bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-lg font-black text-blue-950">{row.public_display_name || row.display_name}</p><p className="mt-1 text-sm text-gray-600">Historical champion · legacy record{admin ? " · " + row.review_status : ""}</p></div><p className="text-xl font-black tabular-nums text-blue-950">{formatLeaderboardTime(row.metric)}</p>
                        {admin && <button className={button} onClick={() => setReview({ id: row.id, name: row.public_display_name || row.display_name, status: row.review_status === "approved" ? "approved" : "pending", reason: "" })}>Review record</button>}</div>
                      {admin && <p className="mt-3 text-xs leading-6 text-gray-600">Source: {row.source_key}, row {row.source_row} · {row.evidence?.legacy_rule} · Archived flag: {row.evidence?.archived_flag || "not recorded"}</p>}
                    </li>)}</ul>}
                </>}
              {review && <form onSubmit={saveReview} className="mt-6 space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <h2 className="text-lg font-black">Review historical record</h2>
                <label className="block text-sm font-bold">Public display name<input required maxLength={80} className={field} value={review.name} disabled={busy} onChange={e => setReview({ ...review, name: e.target.value })} /></label>
                <label className="block text-sm font-bold">Decision<select className={field} value={review.status} disabled={busy} onChange={e => setReview({ ...review, status: e.target.value })}><option value="pending">Keep private / needs review</option><option value="approved">Approve for public archive</option><option value="rejected">Exclude from public archive</option></select></label>
                <label className="block text-sm font-bold">Review reason<textarea required maxLength={500} className={field} value={review.reason} disabled={busy} onChange={e => setReview({ ...review, reason: e.target.value })} /></label>
                <div className="flex gap-3"><button disabled={busy} className={button}>{busy ? "Saving…" : "Save review"}</button><button type="button" disabled={busy} className="min-h-11 px-4 font-bold" onClick={() => setReview(null)}>Cancel</button></div>
              </form>}
              {message && <p role="status" className="mt-4 font-bold">{message}</p>}
            </>}
        </div>
      </section>
    </main><SiteFooter />
  </div>;
}
