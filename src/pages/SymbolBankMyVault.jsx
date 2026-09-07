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

  const records = data?.records || [];

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

  const displayName =
    data.profile?.public_display_name ||
    data.profile?.first_name ||
    "Student";

  return (
    <SymbolBankShell>
      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">
          My Vault
        </p>

        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          {displayName}&apos;s Mathematics Vault
        </h1>

        <p className="mt-3 text-slate-600">
          {data.release
            ? `${data.summary.total} symbols · active release ${data.release.symbol_bank_version}`
            : "No active Symbol Bank release."}
        </p>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Symbol Balance counts only symbols that
          have reached SECURE through verified
          learning evidence. Browsing a symbol can
          mark it DISCOVERED, but it does not create
          mastery.
        </p>
      </section>

      <MyVaultSummary summary={data.summary} />

      <section className="my-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4">
          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search symbol, name, meaning or read-as..."
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

      <p className="mb-4 text-sm font-bold text-slate-600">
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


