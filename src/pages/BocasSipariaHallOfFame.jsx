import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

const SIPARIA_API_URL =
  "https://script.google.com/macros/s/AKfycbz6sqboMDdJqywYW7Z5NGCbPjU1G1v33KUm3TMvIsfHdYrxDIRee9SAZVWZeibrDrdZ/exec";

const EVENT_ID = "bocas-siparia-2026";
const LIGHTNING_LIMIT_MS = 20000;
const SPEED_LIMIT_MS = 25000;

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeDisplayName(value) {
  const parts = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);

  if (parts.length === 0) return "Player";
  if (parts.length === 1) return parts[0];

  const firstName = parts[0];
  const lastInitial = Array.from(parts[parts.length - 1])[0];

  return `${firstName} ${lastInitial.toUpperCase()}.`;
}

function timeToMilliseconds(value) {
  const match = /^(\d+):([0-5]\d)\.(\d{2})$/.exec(
    String(value || "").trim()
  );

  if (!match) return Number.POSITIVE_INFINITY;

  return (
    Number(match[1]) * 60000 +
    Number(match[2]) * 1000 +
    Number(match[3]) * 10
  );
}

function timestampValue(value) {
  const parsed = Date.parse(String(value || ""));

  return Number.isFinite(parsed)
    ? parsed
    : Number.NaN;
}

function isEarlierCompletion(candidate, current) {
  const candidateTime = timestampValue(candidate.timestamp);
  const currentTime = timestampValue(current.timestamp);

  if (
    Number.isFinite(candidateTime) &&
    Number.isFinite(currentTime)
  ) {
    return candidateTime < currentTime;
  }

  if (Number.isFinite(candidateTime)) return true;
  if (Number.isFinite(currentTime)) return false;

  return candidate.rowNumber < current.rowNumber;
}

function newestFirst(first, second) {
  const firstTime = timestampValue(first.firstFinishedAt);
  const secondTime = timestampValue(second.firstFinishedAt);

  if (
    Number.isFinite(firstTime) &&
    Number.isFinite(secondTime) &&
    firstTime !== secondTime
  ) {
    return secondTime - firstTime;
  }

  if (Number.isFinite(firstTime)) return -1;
  if (Number.isFinite(secondTime)) return 1;

  return second.firstRowNumber - first.firstRowNumber;
}

function achievementFor(durationMs) {
  if (durationMs <= LIGHTNING_LIMIT_MS) {
    return {
      key: "lightning",
      icon: "⚡",
      label: "Lightning Finisher",
      description: "Finished in 20 seconds or faster",
      card: "border-violet-300 bg-violet-50",
      iconStyle: "bg-violet-600 text-white",
      badge: "bg-violet-100 text-violet-800",
    };
  }

  if (durationMs <= SPEED_LIMIT_MS) {
    return {
      key: "speed",
      icon: "🚀",
      label: "Speed Finisher",
      description: "Finished in 25 seconds or faster",
      card: "border-blue-300 bg-blue-50",
      iconStyle: "bg-blue-600 text-white",
      badge: "bg-blue-100 text-blue-800",
    };
  }

  return {
    key: "grid",
    icon: "⭐",
    label: "Grid Finisher",
    description: "Completed the full 5×5 challenge",
    card: "border-emerald-300 bg-emerald-50",
    iconStyle: "bg-emerald-600 text-white",
    badge: "bg-emerald-100 text-emerald-800",
  };
}

function formatJoinedDate(value) {
  const parsed = timestampValue(value);

  if (!Number.isFinite(parsed)) {
    return "Hall of Fame member";
  }

  return `Joined ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(parsed))}`;
}

function MemberCard({ member, index }) {
  const achievement = achievementFor(member.bestDurationMs);

  return (
    <article
      className={[
        "relative overflow-hidden rounded-2xl border-2 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        achievement.card,
      ].join(" ")}
    >
      {index === 0 && (
        <span className="absolute right-3 top-3 rounded-full bg-yellow-300 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-yellow-950">
          Newest
        </span>
      )}

      <div
        className={[
          "flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm",
          achievement.iconStyle,
        ].join(" ")}
        aria-hidden="true"
      >
        {achievement.icon}
      </div>

      <h3 className="mt-4 truncate pr-16 text-xl font-black text-gray-950">
        {member.displayName}
      </h3>

      <span
        className={[
          "mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide",
          achievement.badge,
        ].join(" ")}
      >
        {achievement.label}
      </span>

      <p className="mt-3 text-sm font-semibold text-gray-600">
        {achievement.description}
      </p>

      <p className="mt-4 border-t border-black/10 pt-3 text-xs font-bold uppercase tracking-wide text-gray-500">
        {formatJoinedDate(member.firstFinishedAt)}
      </p>
    </article>
  );
}

export default function BocasSipariaHallOfFame() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    document.title =
      "Bocas Lit Fest Siparia Hall of Fame | CountMeInTT";

    let meta = document.querySelector(
      'meta[name="description"]'
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.content =
      "Celebrate every unique finisher of the CountMeInTT Bocas Lit Fest Siparia 2026 multiplication challenge.";
  }, []);

  const loadHallOfFame = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          `${SIPARIA_API_URL}?t=${Date.now()}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(
            `Hall of Fame returned HTTP ${response.status}.`
          );
        }

        const responseText = await response.text();
        let data;

        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            "The Siparia results service did not return public data."
          );
        }

        if (!data?.ok) {
          throw new Error(
            data?.error ||
              "The Hall of Fame could not be loaded."
          );
        }

        const rows = Array.isArray(data.players)
          ? data.players
          : [];

        const validRows = rows
          .map((player, index) => {
            const durationMs = Number.isFinite(
              Number(player.durationMs)
            )
              ? Number(player.durationMs)
              : timeToMilliseconds(player.time);

            return {
              fullName: String(player.name || "").trim(),
              eventId: String(
                player.eventId || ""
              ).trim(),
              durationMs,
              timestamp: String(
                player.timestamp || ""
              ).trim(),
              rowNumber:
                Number(player.rowNumber) || index + 2,
            };
          })
          .filter(
            (player) =>
              player.fullName &&
              player.eventId === EVENT_ID &&
              Number.isFinite(player.durationMs) &&
              player.durationMs >= 0
          );

        const memberByName = new Map();

        validRows.forEach((result) => {
          const playerKey = normalize(result.fullName);
          const existing = memberByName.get(playerKey);

          if (!existing) {
            memberByName.set(playerKey, {
              key: playerKey,
              displayName: safeDisplayName(
                result.fullName
              ),
              bestDurationMs: result.durationMs,
              firstFinishedAt: result.timestamp,
              firstRowNumber: result.rowNumber,
              firstResult: result,
            });
            return;
          }

          existing.bestDurationMs = Math.min(
            existing.bestDurationMs,
            result.durationMs
          );

          if (
            isEarlierCompletion(
              result,
              existing.firstResult
            )
          ) {
            existing.firstFinishedAt = result.timestamp;
            existing.firstRowNumber = result.rowNumber;
            existing.firstResult = result;
          }
        });

        const hallMembers = Array.from(
          memberByName.values()
        ).sort(newestFirst);

        setMembers(hallMembers);
        setLastUpdated(new Date());
      } catch (error) {
        console.error(
          "Siparia Hall of Fame error:",
          error
        );

        setLoadError(
          error?.message ||
            "The Hall of Fame could not be loaded."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadHallOfFame();

    const refreshInterval = window.setInterval(() => {
      loadHallOfFame({ silent: true });
    }, 10000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [loadHallOfFame]);

  const badgeCounts = useMemo(() => {
    return members.reduce(
      (counts, member) => {
        const key = achievementFor(
          member.bestDurationMs
        ).key;

        counts[key] += 1;
        return counts;
      },
      { lightning: 0, speed: 0, grid: 0 }
    );
  }, [members]);

  return (
    <div
      className="min-h-screen text-gray-950"
      style={{
        backgroundColor: "#fce500",
        backgroundImage: 'url("/math-bg.svg")',
        backgroundRepeat: "repeat",
        backgroundSize: "300px",
        backgroundAttachment: "fixed",
      }}
    >
      <main>
        <section className="border-b border-yellow-300 bg-yellow-200/90 px-5 py-8 sm:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid min-w-0 gap-5 md:grid-cols-[330px_minmax(0,1fr)] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/logo-countmeintt.svg"
                  alt="CountMeInTT"
                  className="h-16 w-auto shrink-0 object-contain sm:h-20"
                />

                <img
                  src="/logo-bocaslitfest2026.svg"
                  alt="Bocas Lit Fest 2026"
                  className="h-16 min-w-0 max-w-[220px] object-contain sm:h-20"
                />
              </div>

              <div className="min-w-0 md:pl-2">
                <p className="text-sm font-black uppercase tracking-wider text-violet-700">
                  Every Finisher Belongs
                </p>

                <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
                  Siparia Hall of Fame
                </h1>

                <p className="mt-3 text-base font-semibold text-gray-700 sm:text-lg">
                  Bocas Lit Fest 2026 · 5×5 Challenge
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/bocas-siparia-challenge"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow transition hover:bg-blue-700"
              >
                Play Challenge
              </Link>

              <Link
                to="/bocas-siparia-leaderboard"
                className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-50"
              >
                Leaderboard
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-8 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl border border-yellow-300 bg-white p-5 shadow-lg sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-violet-700">
                    Achievement Wall
                  </p>

                  <h2 className="mt-1 text-3xl font-black">
                    {members.length} Hall of Fame {members.length === 1 ? "Member" : "Members"}
                  </h2>

                  <p className="mt-2 max-w-2xl font-semibold text-gray-600">
                    Every unique player appears once. Badges reflect each player’s best finish, while the newest first-time finishers appear first.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-gray-500">
                    Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Loading…"}
                  </p>

                  <button
                    type="button"
                    onClick={() => loadHallOfFame()}
                    className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-black text-gray-700 transition hover:bg-gray-100"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-violet-50 p-4 text-center ring-1 ring-violet-200">
                  <p className="text-2xl" aria-hidden="true">⚡</p>
                  <p className="mt-1 text-2xl font-black text-violet-800">{badgeCounts.lightning}</p>
                  <p className="text-xs font-black uppercase tracking-wide text-violet-700">Lightning</p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4 text-center ring-1 ring-blue-200">
                  <p className="text-2xl" aria-hidden="true">🚀</p>
                  <p className="mt-1 text-2xl font-black text-blue-800">{badgeCounts.speed}</p>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">Speed</p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-200">
                  <p className="text-2xl" aria-hidden="true">⭐</p>
                  <p className="mt-1 text-2xl font-black text-emerald-800">{badgeCounts.grid}</p>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Grid Finishers</p>
                </div>
              </div>
            </div>

            {loadError && members.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                The latest refresh failed. The most recently loaded Hall of Fame remains on screen.
              </div>
            )}
          </div>
        </section>

        <section className="px-5 pb-12 sm:pb-16">
          <div className="mx-auto max-w-6xl rounded-2xl border border-yellow-300 bg-yellow-50/95 p-5 shadow-lg sm:p-7">
            {isLoading ? (
              <div className="py-14 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
                <h2 className="mt-5 text-2xl font-black">Loading Hall of Fame…</h2>
              </div>
            ) : loadError && members.length === 0 ? (
              <div className="py-14 text-center">
                <h2 className="text-2xl font-black">Hall of Fame unavailable</h2>
                <p className="mt-3 text-gray-600">{loadError}</p>
                <button
                  type="button"
                  onClick={() => loadHallOfFame()}
                  className="mt-5 rounded-xl bg-violet-600 px-5 py-3 font-black text-white"
                >
                  Try Again
                </button>
              </div>
            ) : members.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-3xl">🏅</div>
                <h2 className="mt-5 text-2xl font-black">The Hall of Fame is waiting</h2>
                <p className="mt-3 text-gray-600">Complete the grid and become the first Siparia Hall of Fame member.</p>
                <Link
                  to="/bocas-siparia-challenge"
                  className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow"
                >
                  Play Challenge
                </Link>
              </div>
            ) : (
              <>
                <div className="border-b border-yellow-200 pb-5">
                  <p className="text-sm font-black uppercase tracking-wider text-violet-700">No rankings · No repeated players</p>
                  <h2 className="mt-1 text-3xl font-black">Our Finishers</h2>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member, index) => (
                    <MemberCard
                      key={member.key}
                      member={member}
                      index={index}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <footer className="border-t border-yellow-300 bg-yellow-200/85 px-5 py-10 text-center">
          <a
            href="/about-us-contact.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-gray-950 underline"
          >
            About Us/Contact
          </a>

          <p className="mt-8 text-[11px] italic text-black">
            © 2025 - 2026 <span className="font-semibold">Count Me In TT</span>. Developed by <span className="font-semibold">Andre Burton</span>. Powered by <span className="font-semibold">A&apos;s Online</span>. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}



