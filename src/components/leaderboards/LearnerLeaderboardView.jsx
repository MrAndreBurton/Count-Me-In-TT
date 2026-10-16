import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trophy, Medal } from "lucide-react";
import { currentLeaderboardMonth, formatLeaderboardTime, monthLabel } from "../../lib/leaderboardPresentation";
import { learnerBoardSelection, learnerMonths } from "../../lib/learnerLeaderboards";
import { organisationLeaderboardBranding } from "../../lib/leaderboardBranding";
import { ordinalRank } from "../../lib/leaderboardRanks";

const selectStyle = "mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-bold text-gray-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";
const buttonStyle = "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-black transition";

function RankMarker({ rank }) {
  const podium = Number(rank) >= 1 && Number(rank) <= 3;
  const Icon = Number(rank) === 1 ? Trophy : Medal;
  return podium ? <span className={"learner-rank learner-rank--" + rank}>
    <Icon aria-hidden="true" className="h-4 w-4" />
    <span>{ordinalRank(rank)}</span>
  </span> : <span>{ordinalRank(rank)}</span>;
}

function OrganisationBrand({ branding }) {
  const [failed, setFailed] = useState(false);
  return <div className="leaderboard-logo-tile">
    {branding.logo && !failed && <img src={branding.logo} alt={branding.name} onError={() => setFailed(true)} />}
    {(!branding.logo || failed) && <p className="text-center text-sm font-black leading-tight text-blue-950 sm:text-base">{branding.name}</p>}
  </div>;
}

export default function LearnerLeaderboardView({ boards, service }) {
  const [params, setParams] = useSearchParams();
  const { audience, available, board, grid, category, hall } = learnerBoardSelection(boards, params);
  const [seasonState, setSeasonState] = useState({ key: "", status: "loading", rows: [] });
  const [resultState, setResultState] = useState({ key: "", status: "loading", rows: [] });
  const [retry, setRetry] = useState(0);
  const currentMonth = currentLeaderboardMonth();
  const months = learnerMonths(seasonState.key === board?.id ? seasonState.rows : [], currentMonth);
  const month = months.includes(params.get("month")) ? params.get("month") : currentMonth;
  const selectedSeason = seasonState.key === board?.id ? seasonState.rows.find(s => s.month === month) : null;
  const branding = organisationLeaderboardBranding(board);
  const key = JSON.stringify([board?.id, grid, month, category, hall]);
  const seasonsReady = seasonState.key === board?.id && seasonState.status === "ready";
  const rows = resultState.key === key && seasonsReady ? resultState.rows : [];
  const resultStatus = seasonsReady && resultState.key === key ? resultState.status : "loading";
  const seasonError = seasonState.key === board?.id && seasonState.status === "error";
  const classInactive = board?.scope === "class" && !board.class_access_active;
  const resultBlocked = classInactive && !selectedSeason?.finalised_at;
  function change(values, remove = []) {
    const next = new URLSearchParams(params);
    remove.forEach(k => next.delete(k));
    Object.entries(values).forEach(([k, v]) => next.set(k, v));
    setParams(next);
  }
  useEffect(() => {
    if (!board) return;
    let active = true;
    setSeasonState({ key: board.id, status: "loading", rows: [] });
    service.listSeasons(board.id).then(rows => {
      if (active) setSeasonState({ key: board.id, status: "ready", rows });
    }).catch(() => { if (active) setSeasonState({ key: board.id, status: "error", rows: [] }); });
    return () => { active = false; };
  }, [board, service, retry]);
  useEffect(() => {
    if (!board || !grid || !seasonsReady || resultBlocked) return;
    let active = true;
    setResultState({ key, status: "loading", rows: [] });
    const method = hall ? "getHallOfFame" : "getStandings";
    service[method](board.id, { month, variant: grid, category }).then(rows => {
      if (active) setResultState({ key, status: "ready", rows });
    }).catch(() => { if (active) setResultState({ key, status: "error", rows: [] }); });
    return () => { active = false; };
  }, [board, grid, month, category, hall, key, service, seasonsReady, resultBlocked, retry]);
  const title = board ? board.name : audience === "public" ? "Public leaderboard" : "My organisation leaderboards";

  return <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
      <Link to="/dashboard" className="text-blue-700 hover:underline">← My dashboard</Link>
      <Link to="/games/multiplication" className="text-blue-700 hover:underline">Play Multiplication Challenge →</Link>
    </div>
    <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <div className="leaderboard-banner">
        <Link to="/games" aria-label="CountMeInTT games" className="leaderboard-logo-tile leaderboard-banner-left">
          <img src="/CountmeIn Logo No bg.png" alt="CountMeInTT" />
        </Link>
        <div className="leaderboard-banner-copy">
          <p className="text-xs font-black uppercase tracking-widest text-yellow-300">Multiplication Challenge</p>
          <h1 className="leaderboard-banner-title mt-2 font-black leading-tight">{title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">{audience === "public"
            ? "Explore the public competition, one grid and one month at a time."
            : "Celebrate your progress. Cheer on your community. Aim for your next personal best."}</p>
          {board && <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{board.scope === "public" ? "Public competition" : board.scope === "class" ? "Private class leaderboard" : "Private organisation leaderboard"}</span>}
        </div>
        <div className="leaderboard-banner-right">
          {branding ? <OrganisationBrand key={board.organisation_id} branding={branding} /> : <p className="text-center text-sm font-black leading-snug text-yellow-300">Maths? Count me in.</p>}
        </div>
      </div>
      <div className="p-5 sm:p-8">
        <nav className="flex flex-wrap gap-2" aria-label="Leaderboard audience">
          {[['organisation', 'My organisation'], ['public', 'Public leaderboard']].map(([value, label]) => <button key={value} type="button" aria-pressed={audience === value}
            onClick={() => change({ audience: value }, ["board", "grid", "month", "category"])}
            className={buttonStyle + (audience === value ? " bg-blue-600 text-white" : " bg-blue-50 text-blue-800 hover:bg-blue-100")}>{label}</button>)}
        </nav>
        {!board ? <div className="py-12 text-center">
          <h2 className="text-xl font-black">{audience === "public" ? "Public leaderboard coming soon" : "No organisation leaderboard available yet"}</h2>
          <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-gray-600">{audience === "public"
            ? "The public competition is being prepared. Your organisation and class results stay private here."
            : "When your organisation activates a leaderboard for your account, you can view it here."}</p>
          <Link to="/games/multiplication" className={buttonStyle + " mt-6 bg-yellow-400 text-gray-950 hover:bg-yellow-300"}>Keep practising</Link>
        </div> : <>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-bold text-gray-700">{audience === "public" ? "Leaderboard" : "Organisation / class"}
              <select className={selectStyle} value={board.id} onChange={e => change({ board: e.target.value }, ["grid", "month"])}>
                {available.map(b => <option key={b.id} value={b.id}>{b.scope === "class" ? (b.organisation_name + " · " + (b.group_name || b.name)) : b.scope === "public" ? b.name : b.organisation_name + " · Whole organisation"}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-gray-700">Grid
              <select className={selectStyle} value={grid} onChange={e => change({ grid: e.target.value })}>
                {board.variants.map(g => <option key={g} value={g}>{g.replace("x", " × ")}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-gray-700">Month
              <select className={selectStyle} value={month} disabled={!seasonsReady} onChange={e => change({ month: e.target.value })}>
                {months.map(m => <option key={m} value={m}>{monthLabel(m)}{m === currentMonth ? " · This month" : ""}</option>)}
              </select>
            </label>
            {audience === "public" && <label className="text-sm font-bold text-gray-700">Category
              <select className={selectStyle} value={category} onChange={e => change({ category: e.target.value })}>
                <option value="Primary">Primary</option><option value="Secondary">Secondary</option><option value="NoSchool">Open / not in school</option>
              </select>
            </label>}
          </div>
          {board.status === "paused" && <p role="status" className="mt-5 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-900">This leaderboard is paused. Saved results remain available; new rounds are not being added.</p>}
          {classInactive && <p role="status" className="mt-5 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-900">Class leaderboard access is inactive. You can still select a past month with confirmed champions.</p>}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
            <nav className="flex flex-wrap gap-2" aria-label="Leaderboard results view">
              <button type="button" aria-pressed={!hall} onClick={() => change({ view: "leaderboard" })} className={buttonStyle + (!hall ? " bg-yellow-400 text-gray-950" : " bg-gray-100 text-gray-700 hover:bg-gray-200")}>Leaderboard</button>
              <button type="button" aria-pressed={hall} onClick={() => change({ view: "hall-of-fame" })} className={buttonStyle + (hall ? " bg-yellow-400 text-gray-950" : " bg-gray-100 text-gray-700 hover:bg-gray-200")}><Medal aria-hidden="true" className="mr-2 h-4 w-4" />Hall of Fame</button>
            </nav>
            <button type="button" onClick={() => setRetry(n => n + 1)} className="min-h-11 rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50">Refresh results</button>
          </div>
          <h2 className="mt-6 text-2xl font-black text-blue-950">{hall ? "Monthly champions" : "Monthly leaderboard"}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">{grid.replace("x", " × ")} · {monthLabel(month)} · {hall ? "Joint winners are celebrated together." : "Fastest time per learner. Equal times share a rank."}</p>
          <div aria-live="polite" aria-busy={!seasonError && resultStatus === "loading" && !resultBlocked} className="mt-5">
            {seasonError || (!resultBlocked && resultStatus === "error") ? <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">Results could not be loaded. Please try again.<button type="button" onClick={() => setRetry(n => n + 1)} className="ml-2 min-h-11 font-black underline">Try again</button></div>
              : resultBlocked ? <p className="rounded-2xl bg-blue-50 p-6 text-blue-950">Select a month with confirmed champions to view this class’s history.</p>
              : resultStatus === "loading" ? <p role="status" className="rounded-2xl bg-gray-50 p-6 text-gray-600">Loading {hall ? "monthly champions" : "results"}…</p>
              : !rows.length ? <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-5 py-10 text-center">
                <h3 className="text-lg font-black text-blue-950">{hall ? "No confirmed champions yet" : "No results for this grid and month yet"}</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-gray-600">{hall
                  ? "Monthly champions appear after the month ends and the results are confirmed. Choose an earlier month to explore past winners."
                  : audience === "public" ? "Only results deliberately submitted to the public competition appear here."
                    : month === currentMonth ? "Complete an eligible grid while signed in to your learner account. Your result is added automatically."
                      : "Try another grid or month to explore your community’s results."}</p>
              </div> : <div className="overflow-hidden rounded-2xl border border-gray-200">
                <table className="w-full table-fixed text-left">
                  <caption className="sr-only">{title}, {grid}, {monthLabel(month)}, {hall ? "Hall of Fame" : "leaderboard"}</caption>
                  <thead className="bg-blue-50 text-xs font-black uppercase tracking-wide text-blue-900"><tr>
                    <th scope="col" className="w-16 px-3 py-4 sm:w-24 sm:px-5">{hall ? "Award" : "Rank"}</th>
                    <th scope="col" className="px-3 py-4 sm:px-5">Learner</th>
                    <th scope="col" className="w-28 px-3 py-4 text-right sm:w-36 sm:px-5">Time</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">{rows.map((row, i) => <tr key={i} className={row.is_me ? "bg-yellow-50" : !hall && Number(row.rank) <= 3 ? "learner-podium-row--" + row.rank : "bg-white"}>
                    <td className="px-2 py-5 text-base font-black text-blue-800 sm:px-5">{hall ? <Trophy aria-label="Monthly champion" className="h-5 w-5 text-yellow-600" /> : <RankMarker rank={row.rank} />}</td>
                    <th scope="row" className="break-words px-3 py-5 text-base font-bold text-gray-950 sm:px-5">{row.display_name}{row.is_me && <span className="ml-2 inline-block rounded-full bg-yellow-200 px-2 py-1 text-xs font-black">You</span>}</th>
                    <td className="whitespace-nowrap px-3 py-5 text-right font-black tabular-nums text-blue-950 sm:px-5">{formatLeaderboardTime(row.metric)}</td>
                  </tr>)}</tbody>
                </table>
              </div>}
          </div>
          <div className="mt-5 space-y-2 text-sm leading-6 text-gray-500">
            {!hall && <p>Top 10 ranks are shown, plus your own result when you are further down the board.</p>}
            <p>{audience === "public" ? "Public submissions are separate from your private organisation and class results." : "Only authorised members can view this board. Your school and class results are not automatically published publicly."}</p>
            <p>Each month starts a fresh competition. Past results and confirmed champions remain available. Months follow Trinidad and Tobago time.</p>
          </div>
        </>}
      </div>
    </section>
  </main>;
}
