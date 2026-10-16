import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trophy } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { monthLabel } from "../../lib/leaderboardPresentation";
import { organisationLeaderboardBranding } from "../../lib/leaderboardBranding";
import { loadChampionAccess, championCollectionSelection, championCollectionPath, loadCollectionCatalogue, loadCollectionMonth } from "../../lib/hallOfFameCollections";
import useLeaderboardMonth from "../../lib/useLeaderboardMonth";
import { createLeaderboardService } from "../../services/leaderboardService";
import { createPublicLeaderboardService } from "../../services/publicLeaderboardService";
import { createHallOfFameArchiveService } from "../../services/hallOfFameArchiveService";
import MonthlyChampions, { ChampionMonthPicker } from "./MonthlyChampions";
import GameHeader from "../layout/GameHeader";
import SiteFooter from "../layout/SiteFooter";
import "../../styles/learnerLeaderboards.css";

const field = "mt-2 min-h-12 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-base font-bold text-blue-950";
const button = "inline-flex min-h-12 items-center rounded-xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700";
function OrganisationCrest({ branding }) {
  const [failed, setFailed] = useState(false);
  return <div className="leaderboard-logo-tile">{branding.logo && !failed
    ? <img src={branding.logo} alt={branding.name} onError={() => setFailed(true)} />
    : <p className="text-center text-sm font-black leading-tight text-blue-950">{branding.name}</p>}</div>;
}
const boardLabel = b => (b.organisation_name || b.name) + (b.scope === "class" ? " · " + (b.group_name || b.name) : " · Whole organisation");

export default function HallOfFameCollection({ archive = false }) {
  const [params, setParams] = useSearchParams();
  const services = useMemo(() => ({ publicService: createPublicLeaderboardService(supabase),
    privateService: createLeaderboardService(supabase), archiveService: createHallOfFameArchiveService(supabase) }), []);
  const currentMonth = useLeaderboardMonth();
  const [access, setAccess] = useState({ status: "loading", privateBoards: [] });
  const [revision, setRevision] = useState(0);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState({ key: "", status: "loading", rows: [] });
  const [orgFilter, setOrgFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const generation = useRef(0);
  const selection = championCollectionSelection(access, params);
  const key = JSON.stringify([revision, retry, currentMonth, archive, selection.audience, selection.board?.id, params.get("month")]);
  const ready = access.status === "ready";
  const shown = ready && data.key === key ? data : { status: "loading", rows: [] };
  const branding = ready && selection.board ? organisationLeaderboardBranding(selection.board) : null;
  const privateBoards = ready ? access.privateBoards : [];
  const organisations = [...new Map(privateBoards.map(b => [b.organisation_id, b.organisation_name])).entries()];
  const filtered = privateBoards.filter(b => (!orgFilter || b.organisation_id === orgFilter) && (typeFilter === "all" || b.scope === typeFilter));
  const options = selection.board && !filtered.some(b => b.id === selection.board.id) ? [selection.board, ...filtered] : filtered;
  function filterCollections(org, type) {
    setOrgFilter(org); setTypeFilter(type);
    if (selection.audience !== "organisation") return;
    const matching = privateBoards.filter(b => (!org || b.organisation_id === org) && (type === "all" || b.scope === type));
    if (!matching.some(b => b.id === selection.board?.id)) select(matching[0]?.id || "public");
  }
  function select(value) {
    setParams(value === "public" ? {} : { audience: "organisation", board: value });
  }
  useEffect(() => {
    let active = true;
    const version = ++generation.current;
    setAccess({ status: "loading", privateBoards: [] }); setData({ key: "", status: "loading", rows: [] });
    loadChampionAccess(supabase, services.publicService, services.privateService).then(result => {
      if (active && version === generation.current) setAccess({ status: "ready", ...result });
    });
    return () => { active = false; };
  }, [services, revision, retry]);
  useEffect(() => {
    let active = true;
    const timers = new Set();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (!active || event === "INITIAL_SESSION") return;
      ++generation.current;
      // Clear private names, rows and branding before any new-account request.
      setAccess({ status: "loading", privateBoards: [] }); setData({ key: "", status: "loading", rows: [] });
      setOrgFilter(""); setTypeFilter("all");
      const timer = window.setTimeout(() => { timers.delete(timer); if (active) setRevision(n => n + 1); }, 0);
      timers.add(timer);
    });
    return () => { active = false; subscription.unsubscribe(); timers.forEach(t => window.clearTimeout(t)); };
  }, []);
  useEffect(() => {
    if (!ready || !selection.permitted) return;
    let active = true;
    const version = generation.current;
    setData({ key, status: "loading", rows: [] });
    async function load() {
      try {
        const catalogue = await loadCollectionCatalogue(services, access, selection);
        const month = archive ? catalogue.archiveMonths.includes(params.get("month")) ? params.get("month") : catalogue.archiveMonths[0] : catalogue.featured;
        const result = month ? await loadCollectionMonth(services, selection, catalogue, month) : { rows: [], legacy: false, pending: false };
        if (active && version === generation.current) setData({ key, status: "ready", catalogue, month, ...result });
      } catch (error) {
        if (active && version === generation.current) setData({ key, status: error.code === "42501" ? "forbidden" : "error", rows: [] });
      }
    }
    void load();
    return () => { active = false; };
  }, [ready, access, key, services]);
  useEffect(() => {
    if (archive || shown.status !== "ready" || !shown.pending) return;
    const timer = window.setTimeout(() => setRetry(n => n + 1), 30000);
    return () => window.clearTimeout(timer);
  }, [archive, shown.status, shown.pending, retry]);
  useEffect(() => { document.title = (archive ? "Past Champions" : "Hall of Fame") + " | CountMeInTT"; }, [archive]);
  const isPrivate = selection.audience === "organisation";
  const title = archive ? "Past Champions" : "Hall of Fame";
  return <div className="learner-leaderboard-page min-h-screen text-gray-950"><GameHeader />
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="overflow-hidden rounded-3xl border border-blue-100 shadow-sm">
        <div className="leaderboard-banner">
          <Link to="/games" className="leaderboard-logo-tile leaderboard-banner-left"><img src="/CountmeIn Logo No bg.png" alt="CountMeInTT" /></Link>
          <div className="leaderboard-banner-copy"><p className="text-xs font-black uppercase tracking-widest text-yellow-300">Multiplication Challenge</p>
            <h1 className="leaderboard-banner-title mt-2 font-black">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100">{branding ? selection.board.name : "Celebrate our monthly champions, across every grid and category."}</p>
            {branding && <span className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{selection.board.scope === "class" ? "Private class collection" : "Private organisation collection"}</span>}</div>
          <div className="leaderboard-banner-right">{branding ? <OrganisationCrest key={selection.board.organisation_id} branding={branding} /> : <Trophy aria-hidden="true" className="h-12 w-12 text-yellow-300" />}</div>
        </div>
        <div className="p-5 sm:p-8">
          {ready && privateBoards.length > 0 && <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {organisations.length > 1 && <label className="text-sm font-bold text-blue-950">Filter organisation<select aria-label="Filter organisation" className={field} value={orgFilter} onChange={e => filterCollections(e.target.value, typeFilter)}><option value="">All accessible organisations</option>{organisations.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>}
            {privateBoards.some(b => b.scope === "class") && <label className="text-sm font-bold text-blue-950">Filter board type<select aria-label="Filter board type" className={field} value={typeFilter} onChange={e => filterCollections(orgFilter, e.target.value)}><option value="all">Organisation and class</option><option value="organisation">Whole organisation</option><option value="class">Class</option></select></label>}
            <label className="text-sm font-bold text-blue-950 sm:col-span-2">Hall of Fame collection<select aria-label="Hall of Fame collection" className={field} value={isPrivate ? selection.board?.id || "" : "public"} onChange={e => select(e.target.value)}>
              <option value="public">Public champions</option>{isPrivate && !selection.board && <option value="" disabled>Collection unavailable</option>}
              {options.map(b => <option key={b.id} value={b.id}>{boardLabel(b)}</option>)}
            </select></label>
          </div>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {(!isPrivate || selection.permitted) && <Link to={championCollectionPath(!archive, selection)} className={button}>{archive ? "← Current Hall of Fame" : "Past Champions →"}</Link>}
            <button type="button" onClick={() => setRetry(n => n + 1)} className="min-h-11 px-3 font-bold text-blue-800">Refresh champions</button>
          </div>
          {ready && access.privateStatus === "error" && <p role="alert" className="mt-5 text-sm text-red-800">Your private collections could not be checked. Refresh to try again. Public champions remain separate.</p>}
          {!ready ? <p role="status" className="py-12 text-center">Loading collections…</p>
            : !selection.permitted ? <div className="py-12 text-center"><h2 className="text-xl font-black">{isPrivate ? "This private collection is unavailable" : "Public champions could not be loaded"}</h2>
              <p className="mt-3 text-sm leading-7">{isPrivate ? "Sign in with an account authorised to view this organisation or class." : "Please refresh to try again."}</p>
              {isPrivate && access.privateStatus === "signed_out" && <Link to="/login" className={button + " mt-4"}>Sign in</Link>}
              {isPrivate && <Link to={archive ? "/hall-of-fame/archive" : "/hall-of-fame"} className="mt-4 block min-h-11 font-bold text-blue-800">View public champions →</Link>}</div>
            : <>
              <p className="mt-5 text-sm leading-7 text-blue-950">{archive ? "Explore earlier confirmed monthly champions. Each collection preserves its own achievements." : "Each month we honour the previous month’s confirmed champions. Earlier collections remain in Past Champions."}</p>
              {isPrivate && selection.board.scope === "class" && !selection.board.class_access_active && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-950">The class add-on is inactive. Confirmed past champions remain available to authorised members.</p>}
              {shown.status === "loading" ? <p role="status" className="py-12 text-center">Loading champions…</p>
                : shown.status === "forbidden" || shown.status === "error" ? <p role="alert" className="py-12 text-center">{shown.status === "forbidden" ? "Access to this collection has changed. Refresh to check your permissions." : "Champions could not be loaded. Please refresh to try again."}</p>
                : <>
                  {archive && shown.catalogue.archiveMonths.length > 0 && <div className="mt-6"><ChampionMonthPicker months={shown.catalogue.archiveMonths} value={shown.month} fieldClass={field} onChange={month => setParams({ ...(isPrivate ? { audience: "organisation", board: selection.board.id } : {}), month })} /></div>}
                  {shown.rows.length > 0 ? <MonthlyChampions rows={shown.rows} month={shown.month} legacy={shown.legacy} featured={!archive} />
                    : <div className="py-12 text-center"><h2 className="text-xl font-black text-blue-950">{archive ? "No earlier confirmed champions yet" : monthLabel(shown.month)}</h2>
                      <p className="mt-3 text-sm leading-7">{shown.pending ? "This month’s champions are being confirmed. Check back shortly." : isPrivate ? "Champions appear after an eligible competition month ends and its results are confirmed. Public achievements are kept in their own collection." : "There are no confirmed champions for this selection yet."}</p></div>}
                </>}
              <p className="mt-6 text-center text-xs leading-6 text-blue-950">{isPrivate ? "Only authorised members can view these organisation and class achievements. " : "Public achievements include only results entered in the public competition. "}Equal winning times share the honour. Months follow Trinidad and Tobago time.</p>
            </>}
        </div>
      </section>
    </main><SiteFooter />
  </div>;
}
