import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SymbolBankShell from "../components/symbolBank/SymbolBankShell";
import MyVaultGrid from "../components/symbolBank/MyVaultGrid";
import MyVaultSummary from "../components/symbolBank/MyVaultSummary";
import {
  getMyVaultData,
  VAULT_STATES,
} from "../lib/symbolVault";

export default function SymbolBankMyVault() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const [accessFilter, setAccessFilter] =
    useState("all");
  const [state, setState] = useState("all");
  const [sortOrder, setSortOrder] =
    useState("alphabetical");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;

    getMyVaultData()
      .then((result) => {
        if (live) {
          setData(result);
        }
      })
      .catch((err) => {
        if (live) {
          setError(
            err?.message ||
              "Could not load My Vault."
          );
        }
      });

    return () => {
      live = false;
    };
  }, []);

  const records = useMemo(
    () => data?.records ?? [],
    [data?.records]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    const result = records.filter((record) => {
      if (
        level !== "all" &&
        record.level !== Number(level)
      ) {
        return false;
      }

      if (
        accessFilter !== "all" &&
        record.access_tier !== accessFilter
      ) {
        return false;
      }

      if (
        state !== "all" &&
        record.vaultState !== state
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      return [
        record.display,
        record.canonical_name,
        record.short_meaning,
        record.symbol_class,
        ...(Array.isArray(record.read_as)
          ? record.read_as
          : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    return result.sort((a, b) => {
      if (sortOrder === "level") {
        const levelDifference =
          Number(a.level) - Number(b.level);

        if (levelDifference !== 0) {
          return levelDifference;
        }
      }

      return (a.canonical_name || "").localeCompare(
        b.canonical_name || "",
        undefined,
        {
          sensitivity: "base",
        }
      );
    });
  }, [
    records,
    query,
    level,
    accessFilter,
    state,
    sortOrder,
  ]);

  if (error) {
    return (
      <SymbolBankShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-800">
          {error}
        </div>
      </SymbolBankShell>
    );
  }

  if (!data) {
    return (
      <SymbolBankShell>
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          Opening My Vault…
        </div>
      </SymbolBankShell>
    );
  }

  if (data.guest) {
    return (
      <SymbolBankShell>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">
            My Vault
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Your mathematics knowledge account
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Sign in to track the symbols you
            discover and, later, the symbols you
            secure through the Mathematics Symbol
            Challenge.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-blue-600 px-5 py-3 font-black text-white"
            >
              Sign in
            </Link>

            <Link
              to="/symbol-bank/vault"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-black text-slate-800"
            >
              Browse the Vault
            </Link>
          </div>
        </section>
      </SymbolBankShell>
    );
  }

   if (!data.memberAccess) {
    const isExpired =
      data.membership?.status === "expired" ||
      (data.membership?.expiresAt &&
        new Date(data.membership.expiresAt) <= new Date());

    return (
      <SymbolBankShell>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">
            My Vault
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {isExpired
              ? "Renew access to My Vault"
              : "Unlock your Mathematics Vault"}
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            {isExpired
              ? "Your membership access has ended. Your previously recorded discoveries and learning evidence are preserved. Renew your membership to access My Vault again."
              : "My Vault is available with a paid membership. Unlock your personal symbol discoveries, learning history, and progress tracking."}
          </p>

          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            You can continue browsing the public Mathematics Symbol Bank
            without a paid membership.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/membership"
              className="rounded-xl bg-blue-600 px-5 py-3 font-black text-white"
            >
              {isExpired
                ? "View renewal options"
                : "Explore membership"}
            </Link>

            <Link
              to="/symbol-bank/vault"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-black text-slate-800"
            >
              Browse the Symbol Bank
            </Link>
          </div>
        </section>
      </SymbolBankShell>
    );
  }

  const displayName =
    data.profile?.public_display_name ||
    data.profile?.first_name ||
    "Student";

  return (
    <SymbolBankShell>
      <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-amber-300/30 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-lg sm:p-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[30px] border-amber-300/10" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">CountMeInTT · Personal Knowledge Vault</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{displayName}&apos;s Mathematics Vault</h1>
          <p className="mt-3 text-blue-100">
            {data.release
              ? `${data.summary.total} symbols · active release ${data.release.symbol_bank_version}`
              : "No active Symbol Bank release."}
          </p>
          <div className="mt-6 max-w-3xl rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-blue-50">
            <strong className="text-amber-200">Your knowledge has value.</strong>{" "}
            Symbol Balance counts only symbols that reach SECURE through verified learning evidence.
            Browsing can mark a symbol DISCOVERED, but does not demonstrate mastery.
          </div>
          <Link to="/symbol-bank/vault" className="mt-5 inline-flex rounded-xl border border-amber-200 bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-200">
            Explore the public Vault →
          </Link>
        </div>
      </section>

      <MyVaultSummary summary={data.summary} />

      <section aria-label="Find symbols in My Vault" className="my-6 rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Explore your collection</p><h2 className="mt-1 text-xl font-black text-slate-950">Find a knowledge deposit</h2></div>
          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search your symbols, names and meanings..."
            aria-label="Search My Vault symbols"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2 overflow-x-auto">
              {[
                ["all", "All Levels"],
                ["1", "L1"],
                ["2", "L2"],
                ["3", "L3"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLevel(key)}
                  className={
                    level === key
                      ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white"
                      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {[
                ["all", "All Access"],
                ["free", "Free"],
                ["member", "Member"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setAccessFilter(key)
                  }
                  className={
                    accessFilter === key
                      ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-black text-white"
                      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={state}
              onChange={(event) =>
                setState(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700"
              aria-label="Filter by My Vault state"
            >
              <option value="all">
                All states
              </option>

              {VAULT_STATES.map((vaultState) => (
                <option
                  key={vaultState}
                  value={vaultState}
                >
                  {vaultState}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700"
              aria-label="Sort My Vault"
            >
              <option value="alphabetical">
                A–Z
              </option>

              <option value="level">
                Level → A–Z
              </option>
            </select>
          </div>
        </div>
      </section>

      <p aria-live="polite" className="mb-4 text-sm font-bold text-slate-600">
        Showing {filtered.length} of{" "}
        {records.length}
        {data.memberAccess
          ? " · Member Vault open"
          : " · Free access"}
      </p>

      <MyVaultGrid records={filtered} />
    </SymbolBankShell>
  );
}


