import { useEffect, useState } from "react";
import LeaderboardModal, { fieldClass, primaryButton, secondaryButton } from "./LeaderboardModal";
import { boardTypeLabel, leaderboardError, trinidadDateTime, trinidadInputToISO } from "../../lib/leaderboardPresentation";

export default function LeaderboardBoardForm({ board, context, games, organisations, service, onSaved, onClose }) {
  const editing = Boolean(board);
  const [form, setForm] = useState(() => ({
    game_key: board?.game_key || games[0]?.game_key || "multiplication",
    scope: board?.scope || (context.isSuperadmin ? "organisation" : "class"),
    organisation_id: board?.organisation_id || context.organisation?.id || "",
    group_id: board?.group_id || "",
    name: board?.name || "",
    status: editing && !context.isSuperadmin && board.status === "draft" ? "active" : board?.status || "active",
    variants: board?.variants || games[0]?.variants || [],
    scheduled: false, active_from: trinidadDateTime(),
  }));
  const [lookup, setLookup] = useState({ key: "", groups: [], entitlement: null, error: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const game = games.find(g => g.game_key === form.game_key);
  const lookupKey = form.scope === "public" ? "" : form.organisation_id + "/" + form.game_key;
  useEffect(() => {
    if (!form.organisation_id || form.scope === "public" || editing) return;
    let active = true;
    Promise.all([service.listGroups(form.organisation_id), service.getClassEntitlement(form.organisation_id, form.game_key)])
      .then(([groups, entitlement]) => { if (active) setLookup({ key: lookupKey, groups, entitlement, error: "" }); })
      .catch(e => { if (active) setLookup({ key: lookupKey, groups: [], entitlement: null, error: leaderboardError(e) }); });
    return () => { active = false; };
  }, [form.organisation_id, form.scope, form.game_key, lookupKey, service, editing]);
  const groups = lookup.key === lookupKey ? lookup.groups : [];
  const classEnabled = lookup.key === lookupKey && lookup.entitlement?.effective_status === "active";
  const loadingLookup = !editing && form.scope !== "public" && form.organisation_id && lookup.key !== lookupKey;
  const selectedOrg = organisations.find(o => o.id === form.organisation_id);
  const selectedGroup = groups.find(g => g.id === form.group_id);
  const suggestion = ((form.scope === "public" ? "CountMeInTT"
    : form.scope === "class" ? selectedGroup?.name || board?.group_name || "Class"
      : selectedOrg?.name || board?.organisation_name || "Organisation") +
    " — " + (game?.name || "Multiplication Challenge")).slice(0, 120);
  function change(key, value) {
    setError("");
    setForm(current => ({ ...current, [key]: value,
      ...(key === "organisation_id" || key === "scope" ? { group_id: "" } : {}),
      ...(key === "game_key" ? { variants: games.find(g => g.game_key === value)?.variants || [] } : {}),
    }));
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!form.variants.length) { setError("Select at least one grid."); return; }
    if (editing && !form.name.trim()) { setError("Enter a leaderboard name."); return; }
    if (!editing && form.scope === "class" && (!classEnabled || !form.group_id)) {
      setError("Select a class with active class leaderboard access."); return;
    }
    if (!editing && form.scope !== "public" && !form.organisation_id) {
      setError("Select an active organisation."); return;
    }
    setBusy(true); setError("");
    try {
      const config = { name: form.name.trim() || suggestion, variants: form.variants, status: form.status };
      const saved = editing ? await service.updateBoard(board.id, config) : await service.createBoard({
        ...config, game_key: form.game_key, scope: form.scope,
        organisation_id: form.scope === "public" ? null : form.organisation_id,
        group_id: form.scope === "class" ? form.group_id : null,
        ...(form.scheduled ? { active_from: trinidadInputToISO(form.active_from) } : {}),
      });
      await onSaved(saved);
    } catch (e) { setError(leaderboardError(e)); setBusy(false); }
  }
  return (
    <LeaderboardModal title={editing ? "Manage leaderboard" : "Add leaderboard"} onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="space-y-5 p-6">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Game
            <select className={fieldClass} value={form.game_key} disabled={editing || busy} onChange={e => change("game_key", e.target.value)}>
              {games.map(g => <option key={g.game_key} value={g.game_key}>{g.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">Board type
            <select className={fieldClass} value={form.scope} disabled={editing || !context.isSuperadmin || busy} onChange={e => change("scope", e.target.value)}>
              {(context.isSuperadmin ? ["organisation", "class", "public"] : ["class"]).map(scope =>
                <option key={scope} value={scope}>{boardTypeLabel(scope)}</option>)}
            </select>
          </label>
        </div>
        {form.scope !== "public" && <label className="block text-sm font-bold">Organisation
          <select required className={fieldClass} value={form.organisation_id} disabled={editing || Boolean(context.organisation) || busy}
            onChange={e => change("organisation_id", e.target.value)}>
            <option value="">Select an active organisation</option>
            {organisations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>}
        {form.scope === "class" && (editing ? <p className="rounded-xl bg-slate-50 p-3 text-sm font-bold">{board.group_name || board.name}</p> :
          <div className="space-y-2">
            <label className="block text-sm font-bold">Class / group
              <select required className={fieldClass} value={form.group_id} disabled={busy || loadingLookup || !classEnabled}
                onChange={e => change("group_id", e.target.value)}>
                <option value="">{loadingLookup ? "Loading classes…" : "Select an active class"}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
            {lookup.key === lookupKey && lookup.error && <p role="alert" className="text-sm text-red-700">{lookup.error}</p>}
            {form.organisation_id && !loadingLookup && !classEnabled && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              An active class leaderboard add-on is required. {context.isSuperadmin ? "Manage it using Class access." : "Contact CountMeInTT to enable class leaderboards."}
            </p>}
          </div>)}
        <label className="block text-sm font-bold">Leaderboard name
          <input className={fieldClass} required={editing} maxLength={120} value={form.name} disabled={busy}
            aria-describedby={!editing ? "leaderboard-name-help" : undefined}
            placeholder={suggestion}
            onChange={e => change("name", e.target.value)} />
        </label>
        {!editing && <p id="leaderboard-name-help" className="!mt-1 text-xs font-normal text-slate-500">Leave blank to use the suggested name.</p>}
        <fieldset disabled={busy}>
          <legend className="text-sm font-bold">Available grids</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(game?.variants || []).map(variant => <label key={variant} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-bold">
              <input type="checkbox" checked={form.variants.includes(variant)} onChange={e =>
                change("variants", e.target.checked ? [...form.variants, variant] : form.variants.filter(v => v !== variant))} />
              {variant.replace("x", " × ")}
            </label>)}
          </div>
          {editing && <p className="mt-2 text-xs text-slate-500">Grid changes apply to new entries. Historical results remain available.</p>}
        </fieldset>
        <label className="block text-sm font-bold">Status
          <select className={fieldClass} disabled={busy} value={form.status} onChange={e => change("status", e.target.value)}>
            {(!editing || context.isSuperadmin) && <option value="draft">Draft</option>}
            <option value="active">Active</option><option value="paused">Paused</option>
          </select>
        </label>
        {!editing && <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.scheduled}
            disabled={busy} onChange={e => change("scheduled", e.target.checked)} /> Schedule a future start</label>
          {form.scheduled && <label className="block text-sm font-bold">Start — Trinidad and Tobago time
            <input type="datetime-local" required className={fieldClass} value={form.active_from} disabled={busy}
              min={trinidadDateTime()} onChange={e => change("active_from", e.target.value)} />
          </label>}
        </div>}
        <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">Monthly competition with a Hall of Fame for confirmed champions.</p>
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button type="button" className={secondaryButton} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className={primaryButton} disabled={busy || Boolean(loadingLookup) || (!editing && form.scope === "class" && !classEnabled)}>
            {busy ? "Saving…" : editing ? "Save changes" : "Create leaderboard"}
          </button>
        </div>
      </form>
    </LeaderboardModal>
  );
}
