import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw, Settings2, ShieldCheck, Trophy } from "lucide-react";
import LeaderboardBoardForm from "./LeaderboardBoardForm";
import LeaderboardClassAccessForm from "./LeaderboardClassAccessForm";
import LeaderboardModal, { fieldClass, primaryButton, secondaryButton } from "./LeaderboardModal";
import {
  boardTypeLabel, canManageLeaderboard, currentLeaderboardMonth, filterLeaderboardBoards,
  formatLeaderboardTime, leaderboardError, monthLabel,
} from "../../lib/leaderboardPresentation";

function StatusBadge({ children }) {
  return <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">{children}</span>;
}

export default function LeaderboardManager({ context, service }) {
  const orgId = context.organisation?.id;
  const orgAdmin = context.roles?.includes("organisation_admin");
  const [revision, setRevision] = useState(0);
  const [boot, setBoot] = useState({ loading: true, games: [], boards: [], organisations: [], entitlement: null, error: "" });
  const [filters, setFilters] = useState({
    gameKey: "multiplication", audience: orgId ? "organisation" : "all", organisationId: "",
    boardType: "all", boardId: "", variant: "5x5", month: currentLeaderboardMonth(), category: "Primary", view: "standings",
  });
  const [seasons, setSeasons] = useState({ boardId: "", data: [], error: "" });
  const [results, setResults] = useState({ key: "", rows: [], error: "" });
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [entitlement, setEntitlement] = useState({ gameKey: "", data: null, error: "" });
  const game = boot.games.find(g => g.game_key === filters.gameKey) || boot.games[0];
  const gameKey = game?.game_key || filters.gameKey;
  const scopedFilters = { ...filters, gameKey };
  const visibleBoards = filterLeaderboardBoards(boot.boards, scopedFilters, orgId);
  const board = visibleBoards.find(b => b.id === filters.boardId) || visibleBoards[0] || null;
  const variant = game?.variants.includes(filters.variant) ? filters.variant : game?.variants[0] || "";
  const currentMonth = currentLeaderboardMonth();
  const boardSeasons = seasons.boardId === board?.id ? seasons.data : [];
  const months = [...new Set([currentMonth, ...boardSeasons.map(s => s.month)])].sort().reverse();
  const month = months.includes(filters.month) ? filters.month : currentMonth;
  const category = board?.scope === "public" ? filters.category : "all";
  const resultKey = [board?.id || "", month, variant, category, filters.view].join("/");
  const season = boardSeasons.find(s => s.month === month);
  const ownEntitlement = entitlement.gameKey === gameKey ? entitlement.data : null;
  const canAddClass = orgAdmin && ownEntitlement?.effective_status === "active" &&
    boot.boards.some(b => b.game_key === gameKey && b.organisation_id === orgId && b.scope === "organisation" && b.status !== "draft");

  useEffect(() => {
    let active = true;
    setBoot(previous => ({ ...previous, loading: true, error: "" }));
    const load = async () => {
      try {
        const [games, boards, organisations] = await Promise.all([
          service.listGames(), service.listBoards(orgId ? { organisation_id: orgId } : {}),
          orgId ? Promise.resolve([context.organisation]) : service.listOrganisations(),
        ]);
        if (active) setBoot({ loading: false, games, boards, organisations, error: "" });
      } catch (e) {
        if (active) setBoot({ loading: false, games: [], boards: [], organisations: [], error: leaderboardError(e) });
      }
    };
    void load();
    return () => { active = false; };
  }, [service, orgId, context.organisation, revision]);

  useEffect(() => {
    if (!orgId || !orgAdmin || !gameKey) return;
    let active = true;
    service.getClassEntitlement(orgId, gameKey).then(data => {
      if (active) setEntitlement({ gameKey, data, error: "" });
    }).catch(e => { if (active) setEntitlement({ gameKey, data: null, error: leaderboardError(e) }); });
    return () => { active = false; };
  }, [service, orgId, orgAdmin, gameKey, revision]);

  useEffect(() => {
    if (!board?.id || boot.loading) return;
    let active = true;
    service.listSeasons(board.id).then(data => {
      if (active) setSeasons({ boardId: board.id, data, error: "" });
    }).catch(e => { if (active) setSeasons({ boardId: board.id, data: [], error: leaderboardError(e) }); });
    return () => { active = false; };
  }, [board?.id, service, revision, boot.loading]);

  useEffect(() => {
    if (!board?.id || !variant || boot.loading) return;
    let active = true;
    const method = filters.view === "hall_of_fame" ? service.getHallOfFame : service.getStandings;
    method(board.id, { month, variant, category }).then(rows => {
      if (active) setResults({ key: resultKey, rows, error: "" });
    }).catch(e => { if (active) setResults({ key: resultKey, rows: [], error: leaderboardError(e) }); });
    return () => { active = false; };
  }, [board?.id, month, variant, category, filters.view, resultKey, service, revision, boot.loading]);

  function change(key, value) {
    setFilters(current => ({ ...current, [key]: value,
      ...(["gameKey", "audience", "organisationId", "boardType"].includes(key) ? { boardId: "" } : {}),
      ...(key === "audience" ? { organisationId: "", boardType: "all" } : {}),
    }));
    setMessage(""); setActionError("");
  }
  function refresh() { setRevision(n => n + 1); }
  function savedBoard(saved) {
    setModal(null);
    setFilters(current => ({
      ...current, gameKey: saved.game_key, audience: saved.scope === "public" ? "public" : "organisation",
      organisationId: orgId ? "" : saved.organisation_id || "", boardType: "all", boardId: saved.id,
    }));
    setMessage("Leaderboard saved."); refresh();
  }
  async function ensureMonth() {
    if (!board || busy) return;
    setBusy(true); setActionError("");
    try { await service.ensureSeason(board.id, currentMonth); setMessage("Current month is ready."); refresh(); }
    catch (e) { setActionError(leaderboardError(e)); }
    finally { setBusy(false); }
  }
  async function finaliseMonth() {
    if (!board || busy) return;
    setBusy(true); setActionError("");
    try {
      await service.finaliseSeason(board.id, month);
      setModal(null); setMessage("Monthly champions have been confirmed."); refresh();
    } catch (e) { setActionError(leaderboardError(e)); setModal(null); }
    finally { setBusy(false); }
  }
  const organisationOptions = [...new Map([
    ...boot.organisations.map(o => [o.id, o]),
    ...boot.boards.filter(b => b.organisation_id).map(b => [b.organisation_id, { id: b.organisation_id, name: b.organisation_name }]),
  ]).values()].sort((a, b) => a.name.localeCompare(b.name));
  const readyResults = !boot.loading && results.key === resultKey;
  const rows = readyResults ? results.rows : [];
  const manageable = board && canManageLeaderboard(context, board, ownEntitlement);
  const finalisable = context.isSuperadmin && season && !season.finalised_at &&
    Date.now() >= new Date(season.ends_at).getTime() + 3600000;

  return <div className="space-y-6">
    <header className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">{context.organisation?.name || "Platform competitions"}</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Leaderboards</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Manage competitions, follow progress and celebrate monthly champions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {context.isSuperadmin && <Link className={secondaryButton} to="/admin/leaderboards/archive">Historical Hall of Fame</Link>}
          {context.isSuperadmin && <button className={secondaryButton} disabled={boot.loading || !boot.games.length || !boot.organisations.length}
            onClick={() => setModal({ type: "access" })}><ShieldCheck size={16} className="mr-2 inline" />Class access</button>}
          {(context.isSuperadmin || orgAdmin) && <button className="rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={boot.loading || !boot.games.length || (!context.isSuperadmin && !canAddClass)}
            onClick={() => setModal({ type: "create" })}><Plus size={16} className="mr-1 inline" />Add leaderboard</button>}
        </div>
      </div>
    </header>
    {message && <p role="status" className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">{message}</p>}
    {actionError && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{actionError}</p>}
    {orgAdmin && !context.isSuperadmin && <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div><h2 className="text-sm font-black">Class leaderboards</h2>
        <p className="mt-1 text-sm text-slate-500">
          {entitlement.error ? entitlement.error : ownEntitlement?.effective_status === "active"
            ? "Activate leaderboards for your active classes."
            : "Whole-organisation rankings are included. Contact CountMeInTT to enable the class add-on."}
        </p>
      </div>
      <StatusBadge>{ownEntitlement?.effective_status || "Not enabled"}</StatusBadge>
    </section>}
    {boot.error ? <section className="rounded-2xl border border-red-200 bg-white p-6">
      <p role="alert" className="text-sm text-red-800">{boot.error}</p>
      <button className={secondaryButton + " mt-4"} onClick={refresh}>Try again</button>
    </section> : <>
      <section aria-label="Leaderboard filters" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-bold">Game
            <select className={fieldClass} value={gameKey} disabled={boot.loading} onChange={e => change("gameKey", e.target.value)}>
              {!boot.games.length && <option value="multiplication">Multiplication Challenge</option>}
              {boot.games.map(g => <option key={g.game_key} value={g.game_key}>{g.name}</option>)}
            </select>
          </label>
          {!orgId && <>
            <label className="text-sm font-bold">Audience
              <select className={fieldClass} value={filters.audience} disabled={boot.loading} onChange={e => change("audience", e.target.value)}>
                <option value="all">All leaderboards</option><option value="public">Public</option><option value="organisation">Organisation</option>
              </select>
            </label>
            {filters.audience !== "public" && <label className="text-sm font-bold">Organisation
              <select className={fieldClass} value={filters.organisationId} disabled={boot.loading} onChange={e => change("organisationId", e.target.value)}>
                <option value="">All organisations</option>
                {organisationOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>}
          </>}
          {filters.audience !== "public" && <label className="text-sm font-bold">Board type
            <select className={fieldClass} value={filters.boardType} disabled={boot.loading} onChange={e => change("boardType", e.target.value)}>
              <option value="all">All types</option><option value="organisation">Whole organisation</option><option value="class">Class</option>
            </select>
          </label>}
          <label className="text-sm font-bold">Leaderboard
            <select className={fieldClass} value={board?.id || ""} disabled={boot.loading || !visibleBoards.length} onChange={e => change("boardId", e.target.value)}>
              {!visibleBoards.length && <option value="">No leaderboards available</option>}
              {visibleBoards.map(b => <option key={b.id} value={b.id}>{b.name} · {boardTypeLabel(b.scope)}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">{game?.variant_label || "Grid"}
            <select className={fieldClass} value={variant} disabled={boot.loading || !board} onChange={e => change("variant", e.target.value)}>
              {(game?.variants || []).map(v => <option key={v} value={v}>{v.replace("x", " × ")}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">Month
            <select className={fieldClass} value={month} disabled={boot.loading || !board} onChange={e => change("month", e.target.value)}>
              {months.map(m => <option key={m} value={m}>{monthLabel(m)}{m === currentMonth ? " · Current" : ""}</option>)}
            </select>
          </label>
          {board?.scope === "public" && <label className="text-sm font-bold">Category
            <select className={fieldClass} value={filters.category} disabled={boot.loading} onChange={e => change("category", e.target.value)}>
              <option value="Primary">Primary</option><option value="Secondary">Secondary</option><option value="NoSchool">No School</option>
            </select>
          </label>}
        </div>
      </section>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-black">{board?.name || "Your competitions"}</h2>
            {board && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <StatusBadge>{board.status}</StatusBadge>
              <span>{boardTypeLabel(board.scope)} · {monthLabel(month)} · {variant.replace("x", " × ")}</span>
            </div>}
          </div>
          <div className="flex gap-2">
            {manageable && <button className={secondaryButton} onClick={() => setModal({ type: "edit", board })} disabled={boot.loading}>
              <Settings2 size={16} className="mr-1 inline" />Manage</button>}
            <button className={secondaryButton} aria-label="Refresh leaderboards" disabled={boot.loading || busy} onClick={refresh}>
              <RefreshCw size={16} className="inline" /><span className="ml-2">Refresh</span></button>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Ranking view">
            {[["standings", "Leaderboard"], ["hall_of_fame", "Hall of Fame"]].map(([value, label]) =>
              <button key={value} type="button" aria-pressed={filters.view === value}
                className={filters.view === value ? primaryButton : secondaryButton} onClick={() => change("view", value)}>{label}</button>)}
          </div>
          {seasons.boardId === board?.id && seasons.error && <p role="alert" className="mb-4 text-sm text-red-700">{seasons.error}</p>}
          {boot.loading ? <p role="status" className="py-10 text-center text-slate-500">Loading leaderboards…</p> :
            !board ? <div className="rounded-2xl bg-slate-50 px-5 py-12 text-center">
              <Trophy className="mx-auto text-yellow-600" size={36} />
              <h3 className="mt-4 text-lg font-black">No leaderboards available</h3>
              <p className="mt-2 text-sm text-slate-500">{boot.boards.length
                ? "Try another organisation or board type."
                : context.isSuperadmin ? "Add your first organisation or public leaderboard to get started."
                  : "CountMeInTT can activate your organisation-wide leaderboard."}</p>
            </div> : !readyResults ? <p role="status" className="py-10 text-center text-slate-500">Loading results…</p> :
              results.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{results.error}</p> :
                !rows.length ? <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">
                  <h3 className="font-black">{filters.view === "hall_of_fame" ? "No confirmed champions for this selection" : "No results for this selection yet"}</h3>
                  <p className="mt-2 text-sm text-slate-500">{filters.view === "hall_of_fame" && !season?.finalised_at
                    ? "Champions are confirmed after the month closes. Follow the current leaders on the leaderboard."
                    : "Choose another grid or month to explore available results."}</p>
                </div> : <div className="space-y-3">
                  {rows.map((row, index) => <article key={index} className={"grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border p-4 " +
                    (row.is_me ? "border-blue-300 bg-blue-50" : index < 3 ? "border-yellow-300 bg-yellow-50/50" : "border-slate-200 bg-white")}>
                    <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black " +
                      ((row.rank || 1) === 1 ? "bg-yellow-300 text-yellow-950" : row.rank === 2 ? "bg-slate-200 text-slate-800" : "bg-blue-100 text-blue-800")}>
                      {filters.view === "hall_of_fame" ? <Trophy size={18} /> : row.rank}
                    </div>
                    <div className="min-w-0"><p className="break-words text-sm font-black sm:text-base">{row.display_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.is_me ? "Your season best" : filters.view === "hall_of_fame" ? "Monthly champion" : "Season best"}</p></div>
                    <p className="font-mono text-base font-black text-blue-800 sm:text-lg">{formatLeaderboardTime(row.metric)}</p>
                  </article>)}
                </div>}
          {board && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs leading-5 text-slate-500">Monthly best per learner · Equal times share rank · Trinidad and Tobago time</p>
            {context.isSuperadmin && !season && !boot.loading && new Date(board.active_from) <= new Date() &&
              <button className={secondaryButton} disabled={busy} onClick={ensureMonth}>Create current season</button>}
            {finalisable && <button className={secondaryButton} disabled={busy} onClick={() => setModal({ type: "finalise" })}>Confirm monthly champions</button>}
          </div>}
        </div>
      </section>
    </>}
    {modal?.type === "create" && <LeaderboardBoardForm context={context} games={boot.games}
      organisations={boot.organisations} service={service} onSaved={savedBoard} onClose={() => setModal(null)} />}
    {modal?.type === "edit" && <LeaderboardBoardForm board={modal.board} context={context} games={boot.games}
      organisations={organisationOptions} service={service} onSaved={savedBoard} onClose={() => setModal(null)} />}
    {modal?.type === "access" && <LeaderboardClassAccessForm organisations={boot.organisations} games={boot.games}
      initialOrganisationId={orgId || filters.organisationId || board?.organisation_id} service={service}
      onSaved={() => { setModal(null); setMessage("Class leaderboard access saved."); refresh(); }} onClose={() => setModal(null)} />}
    {modal?.type === "finalise" && <LeaderboardModal title="Confirm monthly champions" busy={busy} onClose={() => setModal(null)}>
      <div className="space-y-5 p-6"><p className="text-sm leading-6 text-slate-600">Confirm the final champions for <strong>{board?.name}</strong> in <strong>{monthLabel(month)}</strong>? All grids and applicable categories for this month will be included. Tied champions receive equal recognition.</p>
        <div className="flex justify-end gap-3"><button className={secondaryButton} disabled={busy} onClick={() => setModal(null)}>Cancel</button>
          <button className={primaryButton} disabled={busy} onClick={finaliseMonth}>{busy ? "Confirming…" : "Confirm champions"}</button></div>
      </div>
    </LeaderboardModal>}
  </div>;
}
