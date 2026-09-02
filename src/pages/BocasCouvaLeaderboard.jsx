import React, {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

const BOCAS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmch7DIGBKuuLjFUKt_fUFjd56sIqpYNFblmDFik2An4CXTVPlMhsWANyP7J15IJEr6i7hBkErGh5I/pubhtml";

const CHALLENGE_ID = "bocas-couva-2026";

const LEADERBOARD_TIME_LIMIT_MS = 20000;

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toMillis(value) {
  const text = String(value || "").trim();

  const match =
    /^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(
      text
    );

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fractionText = match[3] || "";

  let milliseconds = 0;

  if (fractionText.length === 1) {
    milliseconds = Number(fractionText) * 100;
  } else if (fractionText.length === 2) {
    milliseconds = Number(fractionText) * 10;
  } else if (fractionText.length === 3) {
    milliseconds = Number(fractionText);
  }

  return (
    minutes * 60000 +
    seconds * 1000 +
    milliseconds
  );
}

function parseCSV(text) {
  if (
    !text ||
    typeof text !== "string" ||
    text.trim() === ""
  ) {
    return [];
  }

  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (
      character === '"' &&
      insideQuotes &&
      nextCharacter === '"'
    ) {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    if (
      (character === "\n" ||
        character === "\r") &&
      !insideQuotes
    ) {
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        index += 1;
      }

      currentRow.push(currentValue.trim());
      currentValue = "";

      if (
        currentRow.some(
          (cell) =>
            String(cell || "").trim() !== ""
        )
      ) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentValue += character;
  }

  currentRow.push(currentValue.trim());

  if (
    currentRow.some(
      (cell) => String(cell || "").trim() !== ""
    )
  ) {
    rows.push(currentRow);
  }

  if (rows.length < 2) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;

  const headers = headerRow.map((header) =>
    String(header || "")
      .replace(/^\uFEFF/, "")
      .trim()
  );

  return dataRows
    .map((row, index) => {
      const record = {};

      headers.forEach((header, headerIndex) => {
        record[header] = String(
          row[headerIndex] ?? ""
        ).trim();
      });

      record.__row = index + 2;

      return record;
    })
    .filter((record) =>
      Object.values(record).some(
        (value) =>
          String(value || "").trim() !== ""
      )
    );
}

function readField(record, possibleNames) {
  const entries = Object.entries(record || {});

  for (const possibleName of possibleNames) {
    const match = entries.find(
      ([key]) =>
        normalize(key) === normalize(possibleName)
    );

    if (
      match &&
      String(match[1] || "").trim() !== ""
    ) {
      return String(match[1]).trim();
    }
  }

  return "";
}

function getPlayerName(record) {
  const publicName = readField(record, [
    "Public Display Name",
    "Display Name",
    "Player Name",
    "Student Name",
    "Name",
  ]);

  if (publicName) {
    return publicName;
  }

  const firstName = readField(record, [
    "Student First Name",
    "First Name",
  ]);

  const surname = readField(record, [
    "Student Surname",
    "Surname",
    "Last Name",
  ]);

  if (!firstName) {
    return "";
  }

  const surnameInitial = surname
    ? `${surname.charAt(0).toUpperCase()}.`
    : "";

  return [firstName, surnameInitial]
    .filter(Boolean)
    .join(" ");
}

function parseTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatSubmittedDate(value) {
  const date = parseTimestamp(value);

  if (!date) {
    return "";
  }

  return date.toLocaleString("en-TT", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function LeaderRow({ player, rank }) {
  const rankClasses = {
    1: "bg-yellow-300 text-yellow-950",
    2: "bg-gray-200 text-gray-800",
    3: "bg-amber-200 text-amber-950",
  };

  return (
    <article
      className={[
        "grid gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5",
        rank <= 3
          ? "border-yellow-300"
          : "border-gray-200",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-12 w-12 items-center justify-center rounded-full text-base font-black",
          rankClasses[rank] ||
            "bg-blue-50 text-blue-700",
        ].join(" ")}
      >
        {rank}
      </div>

      <div className="min-w-0 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-lg font-black text-gray-950">
            {player.name}
          </h3>

          {rank === 1 && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-yellow-800">
              Current Leader
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-sm font-semibold text-gray-500">
          {[player.school, player.classForm]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {player.timestamp && (
          <p className="mt-1 text-xs font-semibold text-gray-400">
            Submitted{" "}
            {formatSubmittedDate(
              player.timestamp
            )}
          </p>
        )}
      </div>

      <div className="text-left sm:text-right">
        <p className="font-mono text-xl font-black text-blue-700">
          {player.time}
        </p>

        <p className="mt-1 text-xs font-black uppercase tracking-wide text-gray-400">
          {ordinal(rank)} place
        </p>
      </div>
    </article>
  );
}

function LoadingLeaderboard() {
  return (
    <div className="rounded-3xl border border-yellow-300 bg-white p-10 text-center shadow-xl">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

      <h2 className="mt-5 text-2xl font-black">
        Loading leaderboard…
      </h2>

      <p className="mt-2 text-gray-600">
        Retrieving the latest Bocas Couva
        challenge times.
      </p>
    </div>
  );
}

export default function BocasCouvaLeaderboard() {
  const [leaders, setLeaders] = useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  async function loadLeaderboard() {
    setIsLoading(true);
    setLoadError("");

    if (
      !BOCAS_SHEET_URL ||
      BOCAS_SHEET_URL.includes("PASTE_")
    ) {
      setLeaders([]);
      setLastUpdated(new Date());
      setLoadError(
        "The Bocas leaderboard sheet has not been connected yet."
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        BOCAS_SHEET_URL,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Leaderboard returned HTTP ${response.status}.`
        );
      }

      const text = await response.text();
      const records = parseCSV(text);

      const seenPlayers = new Set();

      const normalizedRows = records
        .map((record) => {
          const name = getPlayerName(record);

          const time = readField(record, [
            "Time",
            "Best Time",
            "Final Time",
            "Your Time",
          ]);

          const school = readField(record, [
            "School",
            "School Name",
          ]);

          const classForm = readField(record, [
            "Class/Form",
            "Class Form",
            "Class",
            "Class Level",
            "Form",
          ]);

          const challengeId = readField(record, [
            "Challenge ID",
            "Challenge",
          ]);

          const timestamp = readField(record, [
            "Timestamp",
            "Date",
            "Played At",
          ]);

          return {
            name,
            time,
            school,
            classForm,
            challengeId,
            timestamp,
            milliseconds: toMillis(time),
            rowNumber: record.__row || 0,
          };
        })
        .filter((row) => row.name && row.time)
        .filter((row) =>
          Number.isFinite(row.milliseconds)
        )
        .filter(
          (row) =>
            row.milliseconds <
            LEADERBOARD_TIME_LIMIT_MS
        )
        .filter((row) => {
          if (!row.challengeId) {
            return true;
          }

          return (
            normalize(row.challengeId) ===
            normalize(CHALLENGE_ID)
          );
        })
        .sort((first, second) => {
          const timeDifference =
            first.milliseconds -
            second.milliseconds;

          if (timeDifference !== 0) {
            return timeDifference;
          }

          const firstDate =
            parseTimestamp(
              first.timestamp
            )?.getTime() ??
            Number.POSITIVE_INFINITY;

          const secondDate =
            parseTimestamp(
              second.timestamp
            )?.getTime() ??
            Number.POSITIVE_INFINITY;

          if (firstDate !== secondDate) {
            return firstDate - secondDate;
          }

          return (
            first.rowNumber - second.rowNumber
          );
        })
        .filter((row) => {
          const playerKey = normalize(row.name);

          if (
            !playerKey ||
            seenPlayers.has(playerKey)
          ) {
            return false;
          }

          seenPlayers.add(playerKey);
          return true;
        })
        .slice(0, 10);

      setLeaders(normalizedRows);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Bocas leaderboard load error:",
        error
      );

      setLeaders([]);
      setLastUpdated(new Date());

      setLoadError(
        error?.message ||
          "The leaderboard could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    document.title =
      "Bocas Couva Leaderboard | CountMeInTT";

    loadLeaderboard();

    const refreshInterval =
      window.setInterval(() => {
        loadLeaderboard();
      }, 60000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, []);

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
      <main>
        <section className="border-b border-yellow-300 bg-yellow-200/90 px-5 py-8 sm:py-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <img
                src="/logo-countmeintt.svg"
                alt="CountMeInTT"
                className="h-14 w-auto sm:h-20"
              />

              <div className="hidden h-16 w-px bg-yellow-500 sm:block" />

              <img
                src="/logo-bocaslitfest2026.svg"
                alt="Bocas Lit Fest 2026"
                className="max-h-20 w-auto max-w-[230px] object-contain sm:max-h-24"
              />
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                All Together Now
              </p>

              <h1 className="mt-2 text-4xl font-black leading-tight sm:text-6xl">
                Bocas Couva Leaderboard
              </h1>

              <p className="mx-auto mt-4 max-w-3xl text-base font-semibold leading-7 text-gray-700 sm:text-lg">
                The ten fastest players who
                completed the 5×5 grid in under 20
                seconds.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/bocas-couva-challenge"
                  className="rounded-xl bg-black px-5 py-3 font-black text-white shadow transition hover:bg-gray-800"
                >
                  ⬅ Back to Challenge
                </Link>

                <button
                  type="button"
                  onClick={loadLeaderboard}
                  disabled={isLoading}
                  className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 font-black text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Refresh Leaderboard
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-8 sm:py-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 rounded-2xl border border-yellow-300 bg-white p-5 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                    5 × 5 Quick Grid
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    Under-20-Second Players
                  </h2>
                </div>

                <p className="text-sm font-semibold text-gray-500">
                  Updated:{" "}
                  {lastUpdated
                    ? lastUpdated.toLocaleString(
                        "en-TT"
                      )
                    : "Loading…"}
                </p>
              </div>
            </div>

            {isLoading ? (
              <LoadingLeaderboard />
            ) : loadError &&
              leaders.length === 0 ? (
              <div className="rounded-3xl border border-yellow-300 bg-white p-10 text-center shadow-xl">
                <div className="text-5xl">🏁</div>

                <h2 className="mt-5 text-2xl font-black">
                  Leaderboard unavailable
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                  {loadError}
                </p>

                <button
                  type="button"
                  onClick={loadLeaderboard}
                  className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : leaders.length > 0 ? (
              <div className="rounded-3xl border border-yellow-300 bg-yellow-50/95 p-5 shadow-xl sm:p-8">
                <div className="flex flex-col gap-3 border-b border-yellow-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                      Top 10
                    </p>

                    <h2 className="mt-1 text-3xl font-black">
                      Fastest Players
                    </h2>
                  </div>

                  <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm">
                    {leaders.length} qualifying{" "}
                    {leaders.length === 1
                      ? "player"
                      : "players"}
                  </p>
                </div>

                <div className="mt-6 grid gap-3">
                  {leaders.map(
                    (player, index) => (
                      <LeaderRow
                        key={`${player.name}-${player.time}-${player.rowNumber}`}
                        player={player}
                        rank={index + 1}
                      />
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-yellow-500 bg-white p-10 text-center shadow-lg">
                <div className="text-5xl">⏱️</div>

                <h2 className="mt-5 text-2xl font-black">
                  No qualifying times yet
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                  Be the first player to complete
                  the Bocas Couva 5×5 Challenge in
                  under 20 seconds.
                </p>

                <Link
                  to="/bocas-couva-challenge"
                  className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
                >
                  Play the Challenge
                </Link>
              </div>
            )}
          </div>
        </section>

        <footer className="border-t border-yellow-300 bg-yellow-200/85 px-5 py-10">
          <div className="mx-auto max-w-6xl text-center">
            <Link
              to="/bocas-couva-challenge"
              className="inline-block rounded-xl bg-black px-5 py-3 font-black text-white shadow transition hover:bg-gray-800"
            >
              ⬅ Back to Challenge
            </Link>

            <p className="mt-10 text-[11px] italic text-black">
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
          </div>
        </footer>
      </main>
    </div>
  );
}

