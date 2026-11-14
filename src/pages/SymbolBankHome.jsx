import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SymbolBankShell from "../components/symbolBank/SymbolBankShell";
import { getActiveSymbolBankRecords } from "../lib/symbolBank";

const VAULTS = [
  { level: 1, title: "Primary / SEA", subtitle: "Build your foundations", symbol: "+", accent: "from-sky-50 to-blue-100", border: "border-blue-200", badge: "bg-blue-600" },
  { level: 2, title: "Forms 1–3", subtitle: "Expand your mathematical language", symbol: "π", accent: "from-amber-50 to-yellow-100", border: "border-amber-200", badge: "bg-amber-500" },
  { level: 3, title: "CSEC", subtitle: "Explore advanced notation", symbol: "∑", accent: "from-violet-50 to-indigo-100", border: "border-indigo-200", badge: "bg-indigo-600" },
];

export default function SymbolBankHome() {
  const [release, setRelease] = useState(null);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    getActiveSymbolBankRecords()
      .then(({ release: activeRelease, records: activeRecords }) => {
        if (!live) return;
        setRelease(activeRelease);
        setRecords(activeRecords);
      })
      .catch((e) => {
        if (live) setError(e?.message || "Could not load Symbol Bank.");
      });
    return () => { live = false; };
  }, []);

  const counts = useMemo(() => ({
    total: records.length,
    free: records.filter((record) => record.access_tier === "free").length,
    member: records.filter((record) => record.access_tier === "member").length,
  }), [records]);

  if (error) {
    return <SymbolBankShell><div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800">{error}</div></SymbolBankShell>;
  }

  return (
    <SymbolBankShell>
      <div className="space-y-7 pb-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-[#f4f9ff] via-white to-[#fff8e4] shadow-sm">
          <div className="grid items-center gap-2 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="relative z-10 px-6 pb-4 pt-9 sm:px-10 sm:pt-12 lg:py-14 lg:pl-12 lg:pr-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700 shadow-sm">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-yellow-400" />
                CountMeInTT Mathematics
              </span>
              <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">
                Welcome to the <span className="text-blue-700">Symbol Bank</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg font-semibold leading-relaxed text-slate-700">
                Every symbol has meaning. Discover them, understand them, and build your mathematical knowledge.
              </p>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
                Explore mathematical symbols and notation from Primary / SEA through CSEC, all in one place.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/symbol-bank/vault" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  Explore the Vaults <span className="ml-2" aria-hidden="true">→</span>
                </Link>
                <Link to="/symbol-bank/challenge" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-900 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  Try a Symbol Challenge
                </Link>
              </div>
            </div>
            <div className="relative flex items-end justify-center overflow-hidden px-2 pt-0 sm:px-5 lg:self-stretch lg:px-0">
              <img
                src="/images/symbol-bank/symbol-bank-hero.webp"
                alt="Colourful CountMeInTT Mathematics Symbol Bank with a large blue-and-gold vault door"
                className="block h-auto w-full max-w-[780px] object-contain lg:h-full lg:max-w-none lg:object-contain"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="vaults-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Three levels of discovery</p>
              <h2 id="vaults-heading" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Choose a Vault to Explore</h2>
              <p className="mt-2 max-w-2xl text-slate-600">Each vault organises symbols by educational level. All three lead to the searchable Symbol Vault.</p>
            </div>
            {release && <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">{counts.total} published symbols</span>}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {VAULTS.map((vault) => {
              const levelRecords = records.filter((record) => Number(record.level) === vault.level);
              const freeCount = levelRecords.filter((record) => record.access_tier === "free").length;
              return (
                <article key={vault.level} className={`group overflow-hidden rounded-3xl border ${vault.border} bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg`}>
                  <div className={`relative flex h-36 items-center justify-between overflow-hidden bg-gradient-to-br ${vault.accent} px-6`}>
                    <div>
                      <span className={`inline-flex rounded-full ${vault.badge} px-3 py-1 text-xs font-black uppercase tracking-widest text-white`}>Vault {vault.level}</span>
                      <div className="mt-3 text-sm font-semibold text-slate-600">Mathematics collection</div>
                    </div>
                    <span aria-hidden="true" className="flex h-24 w-24 items-center justify-center rounded-full border-[7px] border-yellow-400 bg-blue-900 text-5xl font-black text-yellow-300 shadow-lg ring-4 ring-white/70">{vault.symbol}</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-black text-slate-950">{vault.title}</h3>
                    <p className="mt-1 min-h-10 text-sm text-slate-600">{vault.subtitle}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{release ? `${levelRecords.length} symbols` : "Loading symbols…"}</span>
                      {release && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">{freeCount} free</span>}
                    </div>
                    <Link to={`/symbol-bank/vault?level=${vault.level}`} className="mt-6 inline-flex min-h-10 items-center font-black text-blue-700 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                      Enter the Vault <span className="ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">Discover more with membership</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Start exploring for free.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              The catalogue includes free and member-only symbols. Browse the collection, discover free learning content, and explore membership for access to additional symbol details and My Vault.
            </p>
            {release && <p className="mt-3 text-sm font-semibold text-slate-200">Currently {counts.free} free symbols and {counts.member} member-only symbols.</p>}
          </div>
          <Link to="/membership" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-black text-slate-950 transition hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400">
            Explore Membership
          </Link>
        </section>
      </div>
    </SymbolBankShell>
  );
}
