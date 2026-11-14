import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SymbolBankShell from "../components/symbolBank/SymbolBankShell";
import SymbolRenderer from "../components/symbolBank/SymbolRenderer";
import LockedSymbolPreview from "../components/symbolBank/LockedSymbolPreview";
import { getSymbolBankSymbol } from "../lib/symbolBank";
import { getPlayableProfileMembership } from "../lib/membership";
import {
  discoverSymbolForPlayableProfile,
  hasActiveSymbolEvidenceMembership,
} from "../lib/symbolVault";

const levelNames = { 1: "Primary / SEA", 2: "Forms 1–3", 3: "CSEC" };

function Detail({ label, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</h2>
      <div className="mt-3 break-words text-base font-semibold leading-7 text-slate-800">{children || "—"}</div>
    </section>
  );
}

export default function SymbolBankSymbol() {
  const { symbolId } = useParams();
  const [record, setRecord] = useState(null);
  const [memberAccess, setMemberAccess] = useState(false);
  const [accessResolved, setAccessResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const discoveryAttemptedRef = useRef(new Set());

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    setRecord(null);
    setAccessResolved(false);

    Promise.all([getSymbolBankSymbol(symbolId), getPlayableProfileMembership()])
      .then(([result, access]) => {
        if (!live) return;
        setRecord(result.record);
        setMemberAccess(hasActiveSymbolEvidenceMembership(access.membership));
        setAccessResolved(true);
        setLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setError(err?.message || "Could not load symbol.");
        setAccessResolved(true);
        setLoading(false);
      });
    return () => { live = false; };
  }, [symbolId]);

  // Preserve paid-member discovery evidence behaviour; never persist guest browsing.
  useEffect(() => {
    if (!record || !accessResolved || !memberAccess) return;
    const locked = record.access_tier === "member" && !memberAccess;
    if (locked || discoveryAttemptedRef.current.has(record.symbol_id)) return;
    discoveryAttemptedRef.current.add(record.symbol_id);
    discoverSymbolForPlayableProfile(record.symbol_id).catch((err) => {
      console.warn("Symbol discovery could not be recorded:", err);
    });
  }, [record, memberAccess, accessResolved]);

  if (loading) return (
    <SymbolBankShell>
      <div role="status" className="rounded-3xl border border-blue-100 bg-white p-10 text-center font-bold text-slate-600 shadow-sm">
        Opening your knowledge deposit box…
      </div>
    </SymbolBankShell>
  );

  if (error || !record) return (
    <SymbolBankShell>
      <div className={`rounded-3xl border p-8 shadow-sm ${error ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
        <h1 className="text-2xl font-black text-slate-900">{error ? "Unable to open this deposit box" : "Symbol not found"}</h1>
        {error && <p role="alert" className="mt-3 text-red-800">{error}</p>}
        <Link to="/symbol-bank/vault" className="mt-5 inline-flex font-black text-blue-700 hover:underline">← Back to the Vault</Link>
      </div>
    </SymbolBankShell>
  );

  // Restricted records always use the existing locked preview. No detail fields are rendered.
  if (record.access_tier === "member" && !memberAccess) return (
    <SymbolBankShell><LockedSymbolPreview record={record} /></SymbolBankShell>
  );

  const readings = Array.isArray(record.read_as) ? record.read_as.join(", ") : "—";
  const context = Array.isArray(record.context_constraints)
    ? record.context_constraints.join(", ") : "—";
  const tier = record.access_tier === "member" ? "Member collection" : "Free collection";

  return (
    <SymbolBankShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/symbol-bank/vault" className="inline-flex items-center gap-2 text-sm font-black text-blue-800 hover:underline">← Return to the Vault</Link>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-900">Knowledge deposit box</span>
      </div>

      <article className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-blue-950/5">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-8 text-white sm:px-9 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[38px] border-white/5" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full border-[28px] border-amber-300/10" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
            <div
              className="
                flex min-h-60 items-center justify-center
                rounded-[1.75rem] border-2 border-amber-300/50
                bg-white p-8 text-[#101B3D]
                shadow-[0_16px_55px_rgba(0,0,0,0.2)]
                sm:min-h-72
                [&_.katex]:!text-[#101B3D]
                [&_.katex]:!text-[clamp(4rem,7vw,6.5rem)]
              "
            >
              <div className="flex w-full items-center justify-center text-center text-[clamp(4rem,7vw,6.5rem)] leading-none text-[#101B3D]">
                <SymbolRenderer record={record} large />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white">Level {record.level} · {levelNames[record.level] || "Mathematics"}</span>
                <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-amber-100">{tier}</span>
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-amber-200">Discover the meaning</p>
              <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{record.canonical_name}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">{record.short_meaning}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-amber-50/70 to-white px-5 py-8 sm:px-9 sm:py-10">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Inside the deposit box</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Get to know this symbol</h2>
            <p className="mt-2 text-slate-600">Explore how the symbol is read, displayed and used in mathematics.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Detail label="Read it as">{readings}</Detail>
            <Detail label="Canonical display"><span className="text-xl">{record.display || "—"}</span></Detail>
            <Detail label="Symbol type">{record.symbol_class?.replaceAll("_", " ") || "—"}</Detail>
            <Detail label="Mathematical context">{context}</Detail>
          </div>
          <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            <summary className="cursor-pointer font-black text-slate-800">Technical symbol information</summary>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><dt className="font-black text-slate-500">Rendering method</dt><dd className="mt-1 break-words">{record.render_mode || "—"}</dd></div>
              <div><dt className="font-black text-slate-500">Symbol ID</dt><dd className="mt-1 break-all">{record.symbol_id}</dd></div>
            </dl>
          </details>
          <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
            <Link to="/symbol-bank/vault" className="inline-flex items-center justify-center rounded-xl bg-blue-800 px-6 py-3 font-black text-white transition hover:bg-blue-900">Explore more symbols →</Link>
            <Link to="/symbol-bank/my-vault" className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-6 py-3 font-black text-blue-900 transition hover:bg-blue-50">Visit My Vault</Link>
          </div>
        </div>
      </article>
    </SymbolBankShell>
  );
}
