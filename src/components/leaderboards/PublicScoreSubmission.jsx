import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { createPublicScoreSubmissionService, publicResultDestination } from "../../services/publicScoreSubmission";

const button = "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-black";
export default function PublicScoreSubmission({ identity, resultId, saveStatus }) {
  const service = useMemo(() => createPublicScoreSubmissionService(supabase), []);
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading" });
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [invalidated, setInvalidated] = useState(false);
  const stale = useRef(false);
  const submitting = useRef(false);
  useEffect(() => {
    stale.current = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (identity && session?.user?.id !== identity.userId) {
        stale.current = true; setInvalidated(true); setName(""); setConsent(false); setState({ status: "loading" });
      }
    });
    return () => { stale.current = true; subscription.unsubscribe(); };
  }, [identity]);
  useEffect(() => {
    if (!identity || !resultId || invalidated) return;
    let active = true;
    let timer;
    setState({ status: "loading" });
    async function load(attempt = 0) {
      try {
        const result = await service.status(resultId);
        if (!active || stale.current) return;
        if (result.status === "processing" && attempt < 3) {
          timer = window.setTimeout(() => void load(attempt + 1), 1200); return;
        }
        setState(result);
        if (result.status === "eligible") setName(result.display_name || "");
      } catch {
        if (active && !stale.current) setState({ status: "error", message: "This result could not be checked. Please try again." });
      }
    }
    void load();
    return () => { active = false; window.clearTimeout(timer); };
  }, [service, identity, resultId, invalidated, retry]);
  async function submit() {
    if (submitting.current || stale.current || !consent || !name.trim() || state.status !== "eligible") return;
    submitting.current = true; setBusy(true);
    try {
      const result = await service.submit(resultId, name.trim());
      if (stale.current) return;
      if (result.status === "submitted") navigate(publicResultDestination(result));
      else setState(result);
    } catch {
      if (!stale.current) setState(current => ({ ...current, error: "Your submission could not be confirmed. You can safely try again; repeated requests do not create duplicate results." }));
    } finally { submitting.current = false; if (!stale.current) setBusy(false); }
  }
  if (!identity || invalidated) return <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4" aria-label="Enter the public leaderboard">
    <h3 className="font-black text-blue-950">Create a free account to submit to the leaderboard</h3>
    <p className="text-sm leading-6 text-blue-900">{invalidated ? "Your account changed after this round started." : "You played this round as a guest."} Create a free account or sign in, then start a fresh round to submit a time. This completed round will not be assigned to an account afterward.</p>
    <div className="flex flex-wrap gap-2"><Link to="/register" className={button + " bg-blue-600 text-white"}>Create a free account</Link><Link to="/login" className={button + " bg-white text-blue-800"}>Sign in</Link></div>
  </section>;
  if (!resultId) return <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-950">{saveStatus === "saving" ? "Save your result to your profile before sharing it publicly…" : "This result must be saved successfully to your profile before it can enter the public competition. Please play a fresh round if saving failed."}</p>;
  if (state.status === "submitted") return <div className="rounded-xl bg-green-50 p-4"><p className="text-sm font-bold text-green-900">Your time is submitted.</p><Link className={button + " mt-3 bg-blue-600 text-white"} to={publicResultDestination(state)}>View public leaderboard →</Link></div>;
  if (state.status !== "eligible") return <div role="status" className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">
    <p>{state.status === "loading" ? "Checking public leaderboard eligibility…" : state.message || "This result is not available for public submission."}</p>
    {["processing", "error"].includes(state.status) && <button type="button" onClick={() => setRetry(n => n + 1)} className="mt-2 min-h-11 font-black underline">Check again</button>}
  </div>;
  return <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4" aria-label="Public leaderboard submission">
    <h3 className="font-black text-blue-950">Share your time on the public leaderboard</h3>
    <p className="text-sm leading-6 text-blue-900">Only your chosen display name, grid, category and time appear publicly. Your school, class, email and account details stay private.</p>
    <label className="block text-sm font-bold text-blue-950">Public display name<input aria-label="Public display name" maxLength={80} disabled={busy} value={name} onChange={e => setName(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-base text-gray-950" /></label>
    <p className="text-sm font-bold text-blue-950">Category: {state.category === "NoSchool" ? "Open" : state.category}</p>
    <label className="flex items-start gap-3 text-sm leading-6 text-blue-950"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" /><span>I want to share this display name and time publicly.</span></label>
    {state.error && <p role="alert" className="text-sm font-bold text-red-800">{state.error}</p>}
    <button type="button" onClick={submit} disabled={busy || !consent || !name.trim()} className={button + " w-full bg-green-700 text-white disabled:cursor-not-allowed disabled:opacity-50"}>{busy ? "Submitting…" : "Submit to public leaderboard →"}</button>
    <p className="text-xs leading-5 text-blue-900">Public submission is optional. Your organisation and class results are handled separately and stay private.</p>
  </section>;
}
