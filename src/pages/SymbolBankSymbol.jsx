import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SymbolBankShell from "../components/symbolBank/SymbolBankShell";
import SymbolRenderer from "../components/symbolBank/SymbolRenderer";
import LockedSymbolPreview from "../components/symbolBank/LockedSymbolPreview";
import { getSymbolBankSymbol } from "../lib/symbolBank";
import { getPlayableProfileMembership } from "../lib/membership";
import { isPaidMembership } from "../lib/membershipAccess";
import { discoverSymbolForPlayableProfile } from "../lib/symbolVault";

export default function SymbolBankSymbol() {
  const { symbolId } = useParams();

  const [record, setRecord] = useState(null);
  const [memberAccess, setMemberAccess] = useState(false);
  const [accessResolved, setAccessResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
    Prevent duplicate discovery calls for the same symbol
    during the current component lifecycle.

    This is especially useful in React development mode,
    where effects may run more than once.
  */
  const discoveryAttemptedRef = useRef(new Set());

  useEffect(() => {
    let live = true;

    setLoading(true);
    setError("");
    setRecord(null);
    setAccessResolved(false);

    Promise.all([
      getSymbolBankSymbol(symbolId),
      getPlayableProfileMembership(),
    ])
      .then(([result, access]) => {
        if (!live) return;

        setRecord(result.record);

        setMemberAccess(
          isPaidMembership(access.membership)
        );

        setAccessResolved(true);
        setLoading(false);
      })
      .catch((err) => {
        if (!live) return;

        setError(
          err?.message || "Could not load symbol."
        );

        setAccessResolved(true);
        setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [symbolId]);

  /*
    Gate 1C-D2 — Discovery behaviour

    Discovery occurs only when:

    1. The symbol exists.
    2. Membership/access has been resolved.
    3. The learner is actually allowed to open
       the full symbol detail.

    Guests are safely handled by
    discoverSymbolForPlayableProfile().
    They browse normally but no state is persisted.

    Locked member previews never reach the RPC.
  */
  useEffect(() => {
    if (!record || !accessResolved) return;

    const locked =
      record.access_tier === "member" &&
      !memberAccess;

    if (locked) return;

    if (
      discoveryAttemptedRef.current.has(
        record.symbol_id
      )
    ) {
      return;
    }

    discoveryAttemptedRef.current.add(
      record.symbol_id
    );

    discoverSymbolForPlayableProfile(
      record.symbol_id
    ).catch((err) => {
      /*
        Discovery tracking must never prevent
        legitimate browsing of the Symbol Bank.
      */
      console.warn(
        "Symbol discovery could not be recorded:",
        err
      );
    });
  }, [record, memberAccess, accessResolved]);

  if (loading) {
    return (
      <SymbolBankShell>
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          Opening deposit box…
        </div>
      </SymbolBankShell>
    );
  }

  if (error) {
    return (
      <SymbolBankShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-800">
          {error}
        </div>
      </SymbolBankShell>
    );
  }

  if (!record) {
    return (
      <SymbolBankShell>
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-black">
            Symbol not found
          </h1>

          <Link
            to="/symbol-bank/vault"
            className="mt-4 inline-flex font-black text-blue-700"
          >
            ← Back to Vault
          </Link>
        </div>
      </SymbolBankShell>
    );
  }

  const locked =
    record.access_tier === "member" &&
    !memberAccess;

  /*
    Locked preview:
    no discovery call has occurred.
  */
  if (locked) {
    return (
      <SymbolBankShell>
        <LockedSymbolPreview record={record} />
      </SymbolBankShell>
    );
  }

  /*
    Accessible full detail:
    discovery is recorded asynchronously for
    an eligible signed-in learner.
  */
  return (
    <SymbolBankShell>
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <div className="grid gap-8 border-b border-slate-100 bg-slate-50 p-6 sm:p-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
            <SymbolRenderer
              record={record}
              large
            />
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600">
              Level {record.level} ·{" "}
              {record.access_tier}
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              {record.canonical_name}
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-700">
              {record.short_meaning}
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-2">
          {[
            [
              "Read it as",
              Array.isArray(record.read_as)
                ? record.read_as.join(", ")
                : "—",
            ],
            [
              "Canonical display",
              record.display,
            ],
            [
              "Type",
              record.symbol_class?.replaceAll(
                "_",
                " "
              ) || "—",
            ],
            [
              "Rendering",
              record.render_mode,
            ],
            [
              "Context",
              Array.isArray(
                record.context_constraints
              )
                ? record.context_constraints.join(
                    ", "
                  )
                : "—",
            ],
            [
              "Symbol ID",
              record.symbol_id,
            ],
          ].map(([label, value]) => (
            <section
              key={label}
              className="rounded-2xl border border-slate-200 p-5"
            >
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {label}
              </p>

              <p className="mt-2 font-semibold leading-7">
                {value}
              </p>
            </section>
          ))}
        </div>
      </article>
    </SymbolBankShell>
  );
}


