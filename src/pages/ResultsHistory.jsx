import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const sampleStudents = {
  joshua: {
    id: "joshua",
    displayName: "Joshua B.",
    initials: "JB",
    school: "St Xavier's Private School",
    level: "Standard 4",
    membership: {
      plan: "Annual Membership",
      isPaid: true,
    },
    results: [
      {
        id: 1,
        game: "Multiplication",
        mode: "5 × 5 Quick",
        result: "18.42 sec",
        numericValue: 18.42,
        dateLabel: "Today",
        dateISO: "2026-07-13",
        personalBest: true,
        verified: true,
        source: "Practice",
      },
      {
        id: 2,
        game: "Math Language",
        mode: "Word Match",
        result: "9 / 10",
        numericValue: 9,
        dateLabel: "Yesterday",
        dateISO: "2026-07-12",
        personalBest: false,
        verified: true,
        source: "Practice",
      },
      {
        id: 3,
        game: "Multiplication",
        mode: "12 × 12 Classic",
        result: "2:41.18",
        numericValue: 161.18,
        dateLabel: "July 10",
        dateISO: "2026-07-10",
        personalBest: false,
        verified: true,
        source: "Practice",
      },
      {
        id: 4,
        game: "Multiplication",
        mode: "5 × 12 Trainer",
        result: "1:04.26",
        numericValue: 64.26,
        dateLabel: "July 8",
        dateISO: "2026-07-08",
        personalBest: true,
        verified: true,
        source: "Practice",
      },
      {
        id: 5,
        game: "Math Language",
        mode: "Word Match",
        result: "8 / 10",
        numericValue: 8,
        dateLabel: "July 7",
        dateISO: "2026-07-07",
        personalBest: false,
        verified: true,
        source: "Practice",
      },
      {
        id: 6,
        game: "Multiplication",
        mode: "5 × 5 Quick",
        result: "20.11 sec",
        numericValue: 20.11,
        dateLabel: "July 5",
        dateISO: "2026-07-05",
        personalBest: false,
        verified: true,
        source: "Community Challenge",
      },
    ],
  },

  maya: {
    id: "maya",
    displayName: "Maya B.",
    initials: "MB",
    school: "San Juan Girls' RC School",
    level: "Standard 2",
    membership: {
      plan: "Free Account",
      isPaid: false,
    },
    results: [
      {
        id: 1,
        game: "Multiplication",
        mode: "5 × 5 Quick",
        result: "24.80 sec",
        numericValue: 24.8,
        dateLabel: "Today",
        dateISO: "2026-07-13",
        personalBest: true,
        verified: true,
        source: "Practice",
      },
      {
        id: 2,
        game: "Math Language",
        mode: "Word Match",
        result: "7 / 10",
        numericValue: 7,
        dateLabel: "July 11",
        dateISO: "2026-07-11",
        personalBest: false,
        verified: true,
        source: "Practice",
      },
      {
        id: 3,
        game: "Multiplication",
        mode: "5 × 5 Quick",
        result: "28.15 sec",
        numericValue: 28.15,
        dateLabel: "July 9",
        dateISO: "2026-07-09",
        personalBest: false,
        verified: true,
        source: "Practice",
      },
    ],
  },
};

const gameOptions = ["All Games", "Multiplication", "Math Language"];

const modeOptions = [
  "All Modes",
  "5 × 5 Quick",
  "5 × 12 Trainer",
  "12 × 12 Classic",
  "15 × 15 Pro",
  "Word Match",
];

function ResultCard({ result }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              {result.game}
            </span>

            {result.personalBest && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-800">
                Personal Best
              </span>
            )}

            {result.verified && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-green-700">
                Verified
              </span>
            )}
          </div>

          <h3 className="mt-4 text-xl font-black text-gray-950">
            {result.mode}
          </h3>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
            <span>
              <strong className="text-gray-800">Date:</strong>{" "}
              {result.dateLabel}
            </span>

            <span>
              <strong className="text-gray-800">Type:</strong>{" "}
              {result.source}
            </span>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-sm font-black uppercase tracking-wide text-gray-500">
            Result
          </p>

          <p className="mt-1 text-3xl font-black text-blue-600">
            {result.result}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function ResultsHistory() {
  const { studentId } = useParams();

  const student = sampleStudents[studentId] || sampleStudents.joshua;

  const [gameFilter, setGameFilter] = useState("All Games");
  const [modeFilter, setModeFilter] = useState("All Modes");
  const [sortOrder, setSortOrder] = useState("newest");

  const visibleResults = useMemo(() => {
    const filtered = student.results.filter((result) => {
      const matchesGame =
        gameFilter === "All Games" || result.game === gameFilter;

      const matchesMode =
        modeFilter === "All Modes" || result.mode === modeFilter;

      return matchesGame && matchesMode;
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === "oldest") {
        return a.dateISO.localeCompare(b.dateISO);
      }

      if (sortOrder === "best") {
        if (gameFilter === "Math Language") {
          return b.numericValue - a.numericValue;
        }

        return a.numericValue - b.numericValue;
      }

      return b.dateISO.localeCompare(a.dateISO);
    });
  }, [student.results, gameFilter, modeFilter, sortOrder]);

  const totalResults = student.results.length;
  const personalBestCount = student.results.filter(
    (result) => result.personalBest
  ).length;

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-xl font-black text-blue-700">
                {student.initials}
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Results History
                </p>

                <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
                  {student.displayName}
                </h1>

                <p className="mt-2 font-semibold text-gray-700">
                  {student.level}
                </p>

                <p className="mt-1 text-gray-600">{student.school}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={`/students/${student.id}`}
                className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
              >
                Back to Profile
              </Link>

              <Link
                to="/games/multiplication"
                className="rounded-xl bg-blue-600 px-5 py-3 text-center font-black text-white shadow transition hover:bg-blue-700"
              >
                Play Now
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                  Results Saved
                </p>

                <p className="mt-3 text-3xl font-black">{totalResults}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-yellow-700">
                  Personal Bests
                </p>

                <p className="mt-3 text-3xl font-black">
                  {personalBestCount}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-green-700">
                  Membership
                </p>

                <p className="mt-3 text-xl font-black">
                  {student.membership.plan}
                </p>
              </div>
            </div>

            {!student.membership.isPaid && (
              <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <p className="font-black text-gray-950">
                  Free Account result limit
                </p>

                <p className="mt-2 leading-7 text-gray-600">
                  Free student profiles keep the latest 10 results. Upgrade to
                  Membership for unlimited history.
                </p>

                <Link
                  to="/membership"
                  className="mt-3 inline-block font-black text-blue-600 hover:underline"
                >
                  Explore Membership →
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="bg-yellow-50 px-5 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Filter Results
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Find the activity you need.
              </h2>
            </div>

            <div className="mt-7 grid gap-5 rounded-2xl border border-yellow-200 bg-white p-5 shadow-sm md:grid-cols-3">
              <div>
                <label
                  htmlFor="gameFilter"
                  className="mb-2 block text-sm font-black text-gray-800"
                >
                  Game
                </label>

                <select
                  id="gameFilter"
                  value={gameFilter}
                  onChange={(event) => {
                    setGameFilter(event.target.value);
                    setModeFilter("All Modes");
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {gameOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="modeFilter"
                  className="mb-2 block text-sm font-black text-gray-800"
                >
                  Mode
                </label>

                <select
                  id="modeFilter"
                  value={modeFilter}
                  onChange={(event) => setModeFilter(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {modeOptions
                    .filter((option) => {
                      if (gameFilter === "Multiplication") {
                        return option !== "Word Match";
                      }

                      if (gameFilter === "Math Language") {
                        return (
                          option === "All Modes" || option === "Word Match"
                        );
                      }

                      return true;
                    })
                    .map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="sortOrder"
                  className="mb-2 block text-sm font-black text-gray-800"
                >
                  Sort
                </label>

                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="best">Best result first</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Saved Activity
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {visibleResults.length} result
                  {visibleResults.length === 1 ? "" : "s"} found.
                </h2>
              </div>
            </div>

            {visibleResults.length > 0 ? (
              <div className="mt-7 grid gap-5">
                {visibleResults.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-2xl">
                  🔎
                </div>

                <h3 className="mt-5 text-2xl font-black">
                  No matching results.
                </h3>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                  Try changing the game, mode or sorting options.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

