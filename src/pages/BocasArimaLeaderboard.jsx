import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import GameHeader from "../components/layout/GameHeader";

const ARIMA_API_URL =
  "https://script.google.com/macros/s/AKfycbxUr3wn5kRh74o-SMmGX6VkncbLaAH5d4ui6IpvdMh38xVu1Q1IoqHdbL9Fl_7E9TAhXQ/exec";

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function timeToMilliseconds(value) {
  const match =
    /^(\d+):([0-5]\d)\.(\d{2})$/.exec(
      String(value || "").trim()
    );

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  return (
    Number(match[1]) * 60000 +
    Number(match[2]) * 1000 +
    Number(match[3]) * 10
  );
}

function ordinal(number) {
  const value = number % 100;
  const suffixes = ["th", "st", "nd", "rd"];

  return (
    number +
    (suffixes[(value - 20) % 10] ||
      suffixes[value] ||
      suffixes[0])
  );
}

function PodiumCard({ place, player }) {
  const styles = {
    1: {
      label: "1st Place",
      medal: "🥇",
      container:
        "border-yellow-400 bg-yellow-100",
      badge: "bg-yellow-300 text-yellow-950",
    },
    2: {
      label: "2nd Place",
      medal: "🥈",
      container: "border-gray-300 bg-gray-50",
      badge: "bg-gray-200 text-gray-800",
    },
    3: {
      label: "3rd Place",
      medal: "🥉",
      container: "border-amber-300 bg-amber-50",
      badge: "bg-amber-200 text-amber-900",
    },
  };

  const style = styles[place];

  return (
    <article
      className={[
        "rounded-2xl border-2 p-6 text-center shadow-md",
        style.container,
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl",
          style.badge,
        ].join(" ")}
      >
        {style.medal}
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-wider text-gray-500">
        {style.label}
      </p>

      {player ? (
        <>
          <h3 className="mt-2 truncate text-2xl font-black text-gray-950">
            {player.name}
          </h3>

          <p className="mt-1 truncate text-sm font-semibold text-gray-600">
            {player.school}
          </p>

          <p className="mt-5 font-mono text-3xl font-black text-blue-700">
            {player.time}
          </p>
        </>
      ) : (
        <>
          <h3 className="mt-3 text-lg font-black text-gray-500">
            Waiting for a player
          </h3>

          <p className="mt-5 font-mono text-2xl font-black text-gray-400">
            --:--.--
          </p>
        </>
      )}
    </article>
  );
}

function LeaderRow({ player, rank }) {
  return (
    <article className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
        {rank}
      </div>

      <div className="min-w-0 text-left">
        <h3 className="truncate text-base font-black text-gray-950 sm:text-lg">
          {player.name}
        </h3>

        <p className="mt-1 truncate text-sm font-semibold text-gray-500">
          {player.school}
        </p>
      </div>

      <div className="text-left sm:text-right">
        <p className="font-mono text-lg font-black text-blue-700">
          {player.time}
        </p>

        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-400">
          {ordinal(rank)} place
        </p>
      </div>
    </article>
  );
}

export default function BocasArimaLeaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  useEffect(() => {
    document.title =
      "Bocas Lit Fest Arima Leaderboard | CountMeInTT";

    let meta = document.querySelector(
      'meta[name="description"]'
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.content =
      "View the live CountMeInTT Bocas Lit Fest Arima 2026 multiplication challenge leaderboard.";
  }, []);

  const loadLeaderboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setIsLoading(true);
      }

      setLoadError("");

      try {
        const response = await fetch(
          `ARIMAAPIURL?t={Date.now()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Leaderboard returned HTTP ${response.status}.`
          );
        }

        const responseText =
  await response.text();

let data;

try {
  data = JSON.parse(responseText);
} catch {
  throw new Error(
    "The leaderboard service returned a Google sign-in page instead of public data. Check the Apps Script deployment access."
  );
}


        if (!data?.ok) {
          throw new Error(
            data?.error ||
              "The leaderboard could not be loaded."
          );
        }

        const rows = Array.isArray(data.players)
          ? data.players
          : [];

        const normalizedRows = rows
          .map((player, index) => {
            const durationMs = Number.isFinite(
              Number(player.durationMs)
            )
              ? Number(player.durationMs)
              : timeToMilliseconds(player.time);

            return {
              name: String(
                player.name || ""
              ).trim(),

              school:
                String(
                  player.school || ""
                ).trim() || "No School",

              time: String(
                player.time || ""
              ).trim(),

              durationMs,

              timestamp: String(
                player.timestamp || ""
              ).trim(),

              rowNumber:
                Number(player.rowNumber) ||
                index + 2,
            };
          })
          .filter(
            (player) =>
              player.name &&
              player.time &&
              Number.isFinite(
                player.durationMs
              )
          )
          .sort((first, second) => {
            if (
              first.durationMs !==
              second.durationMs
            ) {
              return (
                first.durationMs -
                second.durationMs
              );
            }

            const firstTimestamp =
              Date.parse(first.timestamp);

            const secondTimestamp =
              Date.parse(second.timestamp);

            return (
              (Number.isFinite(firstTimestamp)
                ? firstTimestamp
                : Number.POSITIVE_INFINITY) -
                (Number.isFinite(secondTimestamp)
                  ? secondTimestamp
                  : Number.POSITIVE_INFINITY) ||
              first.rowNumber -
                second.rowNumber
            );
          });

        // Keep each player’s fastest result.
        const bestByPlayer = new Map();

        normalizedRows.forEach((player) => {
          const playerKey = `${normalize(
            player.name
          )}|${normalize(player.school)}`;

          const existing =
            bestByPlayer.get(playerKey);

          if (
            !existing ||
            player.durationMs <
              existing.durationMs
          ) {
            bestByPlayer.set(
              playerKey,
              player
            );
          }
        });

        const rankedPlayers = Array.from(
          bestByPlayer.values()
        ).sort(
          (first, second) =>
            first.durationMs -
            second.durationMs
        );

        setLeaders(rankedPlayers);
        setLastUpdated(new Date());
      } catch (error) {
        console.error(
          "Arima leaderboard error:",
          error
        );

        setLoadError(
          error?.message ||
            "The leaderboard could not be loaded."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadLeaderboard();

    const refreshInterval =
      window.setInterval(() => {
        loadLeaderboard({ silent: true });
      }, 10000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [loadLeaderboard]);

  const podium = useMemo(
    () => leaders.slice(0, 3),
    [leaders]
  );

  const remainingPlayers = useMemo(
    () => leaders.slice(3),
    [leaders]
  );

  return (
    <div
      className="min-h-screen text-gray-950"
      style={{
        backgroundColor: "#fce500",
        backgroundImage:
          'url("/math-bg.svg")',
        backgroundRepeat: "repeat",
        backgroundSize: "300px",
        backgroundAttachment: "fixed",
      }}
    >
      <GameHeader />

      <main>
        <section className="border-b border-yellow-300 bg-yellow-200/90 px-5 py-8 sm:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-countmeintt.svg"
                  alt="CountMeInTT"
                  className="h-20 w-auto object-contain sm:h-24"
                />

                <img
                  src="/logo-bocaslitfest2026.svg"
                  alt="Bocas Lit Fest 2026"
                  className="h-20 w-auto object-contain sm:h-24"
                />
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                  Live Event Rankings
                </p>

                <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
                  Bocas Lit Fest Arima
                </h1>

                <p className="mt-3 text-base font-semibold text-gray-700 sm:text-lg">
                  5×5 Multiplication Challenge
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/bocas-arima-challenge"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow transition hover:bg-blue-700"
              >
                Play Challenge
              </Link>

              <Link
                to="/leaderboard"
                className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-50"
              >
                Global Leaderboard
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-8 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 rounded-2xl border border-yellow-300 bg-white p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-gray-950">
                  Bocas Lit Fest Arima 2026
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-500">
                  5×5 Grid · Fastest time per
                  player
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-sm font-semibold text-gray-500">
                  <p>
                    {leaders.length}{" "}
                    {leaders.length === 1
                      ? "player"
                      : "players"}
                  </p>

                  <p className="mt-1">
                    Updated:{" "}
                    {lastUpdated
                      ? lastUpdated.toLocaleTimeString()
                      : "Loading…"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    loadLeaderboard()
                  }
                  className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-black text-gray-700 transition hover:bg-gray-100"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-12 sm:pb-16">
          <div className="mx-auto max-w-6xl rounded-2xl border border-yellow-300 bg-yellow-50/95 p-5 shadow-lg sm:p-7">
            {isLoading ? (
              <div className="py-14 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                <h2 className="mt-5 text-2xl font-black">
                  Loading leaderboard…
                </h2>
              </div>
            ) : loadError &&
              leaders.length === 0 ? (
              <div className="py-14 text-center">
                <h2 className="text-2xl font-black">
                  Leaderboard unavailable
                </h2>

                <p className="mt-3 text-gray-600">
                  {loadError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadLeaderboard()
                  }
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-black text-white"
                >
                  Try Again
                </button>
              </div>
            ) : leaders.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-2xl">
                  ⏱️
                </div>

                <h2 className="mt-5 text-2xl font-black">
                  No times submitted yet
                </h2>

                <p className="mt-3 text-gray-600">
                  Be the first player on the Bocas
                  Arima leaderboard.
                </p>

                <Link
                  to="/bocas-arima-challenge"
                  className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow"
                >
                  Play Challenge
                </Link>
              </div>
            ) : (
              <>
                <div className="border-b border-yellow-200 pb-5">
                  <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                    Top Three
                  </p>

                  <h2 className="mt-1 text-3xl font-black">
                    Fastest Players
                  </h2>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((place) => (
                    <PodiumCard
                      key={place}
                      place={place}
                      player={
                        podium[place - 1] ||
                        null
                      }
                    />
                  ))}
                </div>

                {remainingPlayers.length >
                  0 && (
                  <div className="mt-10">
                    <div className="mb-5 border-b border-yellow-200 pb-4">
                      <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                        Full Rankings
                      </p>

                      <h2 className="mt-1 text-3xl font-black">
                        All Other Players
                      </h2>
                    </div>

                    <div className="grid gap-3">
                      {remainingPlayers.map(
                        (player, index) => (
                          <LeaderRow
                            key={`player.name-{player.school}-player.time-{index}`}
                            player={player}
                            rank={index + 4}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}
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
            © 2025 - 2026{" "}
            <span className="font-semibold">
              Count Me In TT
            </span>
            . Developed by{" "}
            <span className="font-semibold">
              Andre Burton
            </span>
            . Powered by{" "}
            <span className="font-semibold">
              A&apos;s Online
            </span>
            . All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}

