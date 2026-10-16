import { useEffect, useState } from "react";
import LeaderboardModal, { fieldClass, primaryButton, secondaryButton } from "./LeaderboardModal";
import { leaderboardError, trinidadDateTime, trinidadInputToISO } from "../../lib/leaderboardPresentation";

export default function LeaderboardClassAccessForm({ organisations, games, service, initialOrganisationId, onSaved, onClose }) {
  const [orgId, setOrgId] = useState(initialOrganisationId || organisations[0]?.id || "");
  const [gameKey, setGameKey] = useState(games[0]?.game_key || "multiplication");
  const [loaded, setLoaded] = useState("");
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = orgId + "/" + gameKey;
  useEffect(() => {
    if (!orgId) return;
    let active = true;
    service.getClassEntitlement(orgId, gameKey).then(e => {
      if (!active) return;
      setForm({
        status: e?.status || "active", starts_at: trinidadDateTime(e?.starts_at || new Date()),
        expires_at: e?.expires_at ? trinidadDateTime(e.expires_at) : "",
        access_basis: e?.access_basis || "paid", reason: "", effectiveStatus: e?.effective_status || "Not enabled",
      });
      setLoaded(key); setError("");
    }).catch(e => { if (active) { setError(leaderboardError(e)); setLoaded(""); } });
    return () => { active = false; };
  }, [orgId, gameKey, key, service]);
  const ready = loaded === key && form;
  function change(field, value) { setForm(current => ({ ...current, [field]: value })); }
  async function submit(event) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true); setError("");
    try {
      const starts = trinidadInputToISO(form.starts_at);
      const expires = form.expires_at ? trinidadInputToISO(form.expires_at) : null;
      if (expires && expires <= starts) throw new Error("Expiry must be later than the start.");
      await service.setClassEntitlement({
        organisation_id: orgId, game_key: gameKey, status: form.status,
        starts_at: starts, expires_at: expires, access_basis: form.access_basis, reason: form.reason.trim(),
      });
      await onSaved();
    } catch (e) { setError(leaderboardError(e)); setBusy(false); }
  }
  return <LeaderboardModal title="Class leaderboard access" busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="space-y-5 p-6">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <label className="block text-sm font-bold">Organisation
        <select required className={fieldClass} value={orgId} disabled={busy} onChange={e => setOrgId(e.target.value)}>
          <option value="">Select an active organisation</option>
          {organisations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-bold">Game
        <select className={fieldClass} value={gameKey} disabled={busy} onChange={e => setGameKey(e.target.value)}>
          {games.map(g => <option key={g.game_key} value={g.game_key}>{g.name}</option>)}
        </select>
      </label>
      {ready ? <>
        <p className="rounded-xl bg-slate-50 p-3 text-sm">Current access: <strong className="capitalize">{form.effectiveStatus}</strong></p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Status
            <select className={fieldClass} value={form.status} disabled={busy} onChange={e => change("status", e.target.value)}>
              <option value="active">Active</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="text-sm font-bold">Access basis
            <select className={fieldClass} value={form.access_basis} disabled={busy} onChange={e => change("access_basis", e.target.value)}>
              <option value="paid">Paid</option><option value="complimentary">Complimentary</option>
            </select>
          </label>
          <label className="text-sm font-bold">Start — Trinidad and Tobago
            <input type="datetime-local" className={fieldClass} required value={form.starts_at} disabled={busy} onChange={e => change("starts_at", e.target.value)} />
          </label>
          <label className="text-sm font-bold">Expiry — optional
            <input type="datetime-local" className={fieldClass} value={form.expires_at} disabled={busy} onChange={e => change("expires_at", e.target.value)} />
          </label>
        </div>
        <label className="block text-sm font-bold">Reason for this change
          <textarea className={fieldClass} required maxLength={500} rows={3} value={form.reason} disabled={busy} onChange={e => change("reason", e.target.value)} />
        </label>
        <p className="text-sm text-slate-500">Suspension, cancellation or expiry stops new class participation. Historical recognition is retained.</p>
      </> : orgId && !error ? <p role="status" className="text-sm text-slate-500">Loading access…</p> : null}
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
        <button type="button" className={secondaryButton} disabled={busy} onClick={onClose}>Cancel</button>
        <button type="submit" className={primaryButton} disabled={!ready || busy}>{busy ? "Saving…" : "Save class access"}</button>
      </div>
    </form>
  </LeaderboardModal>;
}
