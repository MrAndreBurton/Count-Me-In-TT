import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SymbolBankShell from "../components/symbolBank/SymbolBankShell";
import SymbolGrid from "../components/symbolBank/SymbolGrid";
import { getActiveSymbolBankRecords } from "../lib/symbolBank";
import { getPlayableProfileMembership } from "../lib/membership";
import { isPaidMembership } from "../lib/membershipAccess";

const LEVELS = [
  { value: "all", label: "All vaults", short: "All", symbol: "✦" },
  { value: "1", label: "Primary / SEA", short: "Vault 1", symbol: "+" },
  { value: "2", label: "Forms 1–3", short: "Vault 2", symbol: "π" },
  { value: "3", label: "CSEC", short: "Vault 3", symbol: "∑" },
];
const ACCESS = [
  { value: "all", label: "All symbols" },
  { value: "free", label: "Free" },
  { value: "member", label: "Member" },
];

export default function SymbolBankVault() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLevel = searchParams.get("level");
  const level = ["1", "2", "3"].includes(requestedLevel) ? requestedLevel : "all";
  const [release, setRelease] = useState(null);
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("alphabetical");
  const [memberAccess, setMemberAccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    Promise.all([getActiveSymbolBankRecords(), getPlayableProfileMembership()])
      .then(([bank, access]) => {
        if (!live) return;
        setRelease(bank.release);
        setRecords(bank.records);
        setMemberAccess(isPaidMembership(access.membership));
      })
      .catch((err) => {
        if (live) setError(err?.message || "Could not load vault.");
      });
    return () => { live = false; };
  }, []);

  function selectLevel(value) {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("level");
    else next.set("level", value);
    setSearchParams(next);
  }

  const counts = useMemo(() => ({
    free: records.filter((record) => record.access_tier === "free").length,
    member: records.filter((record) => record.access_tier === "member").length,
  }), [records]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return records.filter((record) => {
      if (level !== "all" && Number(record.level) !== Number(level)) return false;
      if (accessFilter !== "all" && record.access_tier !== accessFilter) return false;
      if (!q) return true;
      return [
        record.display, record.canonical_name, record.short_meaning,
        record.symbol_class,
        ...(Array.isArray(record.read_as) ? record.read_as : []),
      ].filter(Boolean).join(" ").toLowerCase().includes(q);
    }).sort((a, b) => {
      if (sortOrder === "level") {
        const difference = Number(a.level) - Number(b.level);
        if (difference !== 0) return difference;
      }
      return (a.canonical_name || "").localeCompare(b.canonical_name || "", undefined, { sensitivity: "base" });
    });
  }, [records, query, level, accessFilter, sortOrder]);

  const selectedLevel = LEVELS.find((item) => item.value === level) || LEVELS[0];
  const hasFilters = query.trim() || level !== "all" || accessFilter !== "all" || sortOrder !== "alphabetical";

  return (
    <SymbolBankShell>
      <div className="space-y-6 pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-br from-[#0d2452] via-[#123b83] to-[#1267ad] text-white shadow-xl">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border-[35px] border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-20 h-72 w-72 rounded-full border-[30px] border-yellow-300/15" />
          <div className="relative grid items-center gap-5 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_auto]">
            <div>
              <Link to="/symbol-bank" className="text-sm font-bold text-blue-100 underline-offset-4 hover:underline">← Symbol Bank</Link>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-yellow-300">The knowledge collection</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Inside the <span className="text-yellow-300">Vault</span></h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
                Explore the symbols that help us read, understand and communicate mathematics. Every symbol has a story to tell.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
                <span className="rounded-full border border-white/20 bg-white/15 px-4 py-2">{release ? `${records.length} published symbols` : "Loading collection…"}</span>
                {release && <span className="rounded-full border border-white/20 bg-white/15 px-4 py-2">{counts.free} free to explore</span>}
                <span className="rounded-full border border-yellow-300/30 bg-yellow-300/15 px-4 py-2 text-yellow-100">{memberAccess ? "Member access active" : "Free + member collection"}</span>
              </div>
            </div>
            <div aria-hidden="true" className="hidden h-44 w-44 shrink-0 items-center justify-center rounded-[2.5rem] border-[10px] border-yellow-300 bg-[#071b40] text-8xl font-black text-yellow-300 shadow-2xl ring-8 ring-white/10 lg:flex">∑</div>
          </div>
        </section>

        <section aria-labelledby="vault-filter-title" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Choose your collection</p>
              <h2 id="vault-filter-title" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Explore the Vaults</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">{selectedLevel.label}</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" role="group" aria-label="Filter by educational level">
            {LEVELS.map((item) => {
              const active = level === item.value;
              const total = item.value === "all" ? records.length : records.filter((record) => Number(record.level) === Number(item.value)).length;
              return (
                <button key={item.value} type="button" onClick={() => selectLevel(item.value)} aria-pressed={active}
                  className={`group flex min-h-28 items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:p-4 ${active ? "border-blue-700 bg-blue-50 shadow-md ring-2 ring-blue-600/20" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50"}`}>
                  <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl font-black shadow-sm ${active ? "bg-blue-700 text-yellow-300" : "bg-slate-900 text-yellow-300"}`}>{item.symbol}</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black uppercase tracking-wide text-blue-700">{item.short}</span>
                    <span className="mt-1 block text-sm font-bold leading-5 text-slate-900">{item.label}</span>
                    {release && <span className="mt-1 block text-xs font-semibold text-slate-500">{total} symbols</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-800">Find a symbol</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                placeholder="Search symbols, names, meanings or how to read them…"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-800">Sort collection</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort Symbol Bank"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:w-44">
                <option value="alphabetical">Name: A–Z</option>
                <option value="level">Level, then A–Z</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by symbol access">
            <span className="mr-1 text-sm font-bold text-slate-600">Access:</span>
            {ACCESS.map((item) => (
              <button key={item.value} type="button" onClick={() => setAccessFilter(item.value)} aria-pressed={accessFilter === item.value}
                className={`min-h-10 rounded-full px-4 py-2 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${accessFilter === item.value ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}>{item.label}</button>
            ))}
            {hasFilters && <button type="button" onClick={() => { selectLevel("all"); setQuery(""); setAccessFilter("all"); setSortOrder("alphabetical"); }} className="ml-auto min-h-10 px-2 text-sm font-bold text-blue-700 underline-offset-4 hover:underline">Clear filters</button>}
          </div>
        </section>

        {error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-800">{error}</div>
        ) : (
          <section aria-label="Symbol collection">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-sm font-bold text-slate-700">Showing <strong className="text-slate-950">{filtered.length}</strong> of {records.length} symbols</p>
              <span className="text-sm font-semibold text-slate-600">{memberAccess ? "Member symbol details available" : "Member symbols are marked in the collection"}</span>
            </div>
            {filtered.length === 0 && release ? (
              <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/50 px-6 py-12 text-center">
                <div aria-hidden="true" className="text-5xl">⌕</div>
                <h3 className="mt-3 text-xl font-black text-slate-950">No symbols found in this collection</h3>
                <p className="mt-2 text-slate-600">Try a different search, vault or access filter.</p>
                <button type="button" onClick={() => { selectLevel("all"); setQuery(""); setAccessFilter("all"); setSortOrder("alphabetical"); }} className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">Show all symbols</button>
              </div>
            ) : <SymbolGrid records={filtered} memberAccess={memberAccess} />}
          </section>
        )}
      </div>
    </SymbolBankShell>
  );
}
