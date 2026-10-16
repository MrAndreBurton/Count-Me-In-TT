import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { loadLeaderboardContext } from "../lib/leaderboardContext";
import { leaderboardError } from "../lib/leaderboardPresentation";
import { createLeaderboardService } from "../services/leaderboardService";
import AdminLayout from "../components/admin/layout/AdminLayout";
import OrganisationLayout from "../components/organisation/layout/OrganisationLayout";
import LeaderboardManager from "../components/leaderboards/LeaderboardManager";

export default function LeaderboardsControlCentre() {
  const { organisationId } = useParams();
  const location = useLocation();
  const [state, setState] = useState({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const service = useMemo(() => createLeaderboardService(supabase), []);
  useEffect(() => {
    let active = true;
    let request = 0;
    const timers = new Set();
    async function load() {
      const current = ++request;
      setState({ status: "loading" });
      try {
        const next = await loadLeaderboardContext(supabase, organisationId);
        if (active && current === request) setState({ ...next, scopeKey: organisationId || "superadmin" });
      } catch (e) { if (active && current === request) setState({ status: "error", error: leaderboardError(e) }); }
    }
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (!active || event === "INITIAL_SESSION") return;
      ++request;
      if (event === "SIGNED_OUT") { setState({ status: "signed_out" }); return; }
      setState({ status: "loading" });
      const timer = window.setTimeout(() => { timers.delete(timer); if (active) void load(); }, 0);
      timers.add(timer);
    });
    return () => { active = false; ++request; subscription.unsubscribe(); timers.forEach(t => window.clearTimeout(t)); };
  }, [organisationId, retry]);
  async function signOut() {
    setSigningOut(true); setSignOutError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setState({ status: "signed_out" });
    } catch (e) { setSignOutError(leaderboardError(e)); setSigningOut(false); }
  }
  const status = state.status === "ready" && state.scopeKey !== (organisationId || "superadmin") ? "loading" : state.status;
  if (status === "signed_out") return <Navigate to="/login" replace state={{ from: location }} />;
  if (status !== "ready") return <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-xl font-black">{status === "loading" ? "Checking leaderboard access…" : status === "forbidden" ? "Leaderboard access unavailable" : "Unable to load leaderboards"}</h1>
      {status === "error" && <><p role="alert" className="mt-3 text-sm text-red-700">{state.error}</p><button onClick={() => setRetry(n => n + 1)} className="mt-5 rounded-xl bg-blue-700 px-4 py-2 font-bold text-white">Try again</button></>}
      {status === "forbidden" && <p className="mt-3 text-sm text-slate-500">Open this section through an authorised workspace.</p>}
      {status !== "loading" && <Link to="/workspace" className="mt-5 block text-sm font-bold text-blue-700">Back to workspaces</Link>}
    </section>
  </main>;
  const content = <>{signOutError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-800">{signOutError}</p>}
    <LeaderboardManager key={organisationId || "superadmin"} context={state} service={service} /></>;
  return organisationId ? <OrganisationLayout organisation={state.organisation} profile={state.profile} roles={state.roles}
    onSignOut={signOut} isSigningOut={signingOut}>{content}</OrganisationLayout> : <AdminLayout>{content}</AdminLayout>;
}
