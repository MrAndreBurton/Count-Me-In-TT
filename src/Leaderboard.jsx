import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import GameHeader from "./components/layout/GameHeader";

const GRID_OPTIONS = [
  {
    id: "5x5",
    label: "5 × 5 Quick",
    shortLabel: "5 × 5",
  },
  {
    id: "5x12",
    label: "5 × 12 Trainer",
    shortLabel: "5 × 12",
  },
  {
    id: "12x12",
    label: "12 × 12 Classic",
    shortLabel: "12 × 12",
  },
  {
    id: "15x15",
    label: "15 × 15 Pro",
    shortLabel: "15 × 15",
  },
];

const CATEGORY_OPTIONS = [
  {
    id: "Primary",
    label: "Primary",
  },
  {
    id: "Secondary",
    label: "Secondary",
  },
  {
    id: "NoSchool",
    label: "No School",
  },
];

/*
  Add new published CSV URLs here as they become available.

  The current 5 × 5 and 5 × 12 sheets expose one published CSV each,
  so those modes currently load the known Primary dataset.

  Once separate Secondary and No School tabs are published for those
  grids, add them under the matching grid key.
*/
const SHEET_URLS = {
  "5x5": {
    Primary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXvvpwFIx6TuA-dB26pjW6K0w8oRhg0IDgMO-69ag19hMATBAzC2Wf-I6m4Q5fUjLgCFNnzuT_cQUn/pub?gid=0&single=true&output=csv",
  },

  "5x12": {
    Primary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXvvpwFIx6TuA-dB26pjW6K0w8oRhg0IDgMO-69ag19hMATBAzC2Wf-I6m4Q5fUjLgCFNnzuT_cQUn/pub?gid=1665132778&single=true&output=csv",
  },

  "12x12": {
    Primary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=0&single=true&output=csv",

    Secondary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1127334724&single=true&output=csv",

    NoSchool:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1462166071&single=true&output=csv",
  },

  "15x15": {
    Primary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=0&single=true&output=csv",

    Secondary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=1175275328&single=true&output=csv",

    NoSchool:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=800118807&single=true&output=csv",
  },
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/scool/g, "school")
    .replace(/\bst\.?\b/g, "st")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesLoose(value, filter) {
  if (!filter) return true;

  const normalizedValue = normalize(value);
  const normalizedFilter = normalize(filter);

  return (
    normalizedValue.includes(normalizedFilter) ||
    normalizedFilter.includes(normalizedValue)
  );
}

function canonicalClass(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bstandard\b/g, "std")
    .replace(/\bstd\.?\b/g, "std");

  const match = normalized.match(/\b(prep|std)\s*(\d)\b/);

  return match ? `p${match[2]}` : normalized;
}

function prettyClass(value, label = "Prep") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/\bstandard\b/g, "std")
    .replace(/\bstd\.?\b/g, "std");

  const match = normalized.match(/\b(prep|std)\s*(\d)\b/);

  return match
    ? `${label} ${match[2]}`
    : String(value || "");
}

function toMillis(value) {
  const match = /^(\d+):(\d{2})\.(\d{2})$/.exec(
    String(value || "").trim()
  );

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const [, minutes, seconds, hundredths] = match;

  return (
    Number(minutes) * 60000 +
    Number(seconds) * 1000 +
    Number(hundredths) * 10
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
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !inQuotes
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
          (cell) => String(cell || "").trim() !== ""
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
    String(header || "").replace(/^\uFEFF/, "").trim()
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
        (value) => String(value || "").trim() !== ""
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

function parseTimestamp(value) {
  if (!value) return null;

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  return null;
}

function isToday(value) {
  const date = parseTimestamp(value);

  if (!date) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function ordinal(number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = number % 100;

  return (
    number +
    (suffixes[(value - 20) % 10] ||
      suffixes[value] ||
      suffixes[0])
  );
}

function categoryLabel(category) {
  return category === "NoSchool"
    ? "No School"
    : category;
}

function gridLabel(gridId) {
  return (
    GRID_OPTIONS.find((option) => option.id === gridId)
      ?.label || gridId.replace("x", " × ")
  );
}

function getAvailableCategories(gridId) {
  return CATEGORY_OPTIONS.filter(
    (category) =>
      Boolean(SHEET_URLS[gridId]?.[category.id])
  );
}

function LeaderRow({
  row,
  rank,
  subtitle,
}) {
  const rankStyles = {
    1: "bg-yellow-300 text-yellow-950",
    2: "bg-gray-200 text-gray-800",
    3: "bg-amber-200 text-amber-900",
  };

  return (
    <article
      className={[
        "grid gap-3 rounded-xl border bg-white p-4 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center",
        rank <= 3
          ? "border-yellow-300"
          : "border-gray-200",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-black",
          rankStyles[rank] ||
            "bg-blue-50 text-blue-700",
        ].join(" ")}
      >
        {rank}
      </div>

      <div className="min-w-0 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-black text-gray-950 sm:text-lg">
            {row.name}
          </h3>

          {rank === 1 && (
            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-yellow-800">
              Leader
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 truncate text-sm font-semibold text-gray-500">
            {subtitle}
          </p>
        )}
      </div>

      <div className="text-left sm:text-right">
        <p className="font-mono text-lg font-black text-blue-700">
          {row.time}
        </p>

        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-400">
          {ordinal(rank)} place
        </p>
      </div>
    </article>
  );
}

function LoadingLeaderboard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

      <h2 className="mt-5 text-2xl font-black">
        Loading leaderboard…
      </h2>

      <p className="mt-2 text-gray-600">
        Retrieving the latest submitted times.
      </p>
    </div>
  );
}

export default function Leaderboard({
  schoolFilter = null,
  classFilter = null,
  titleOverride = null,
  onlyFromToday = false,
  classLabel = "Prep",
  showExtras = true,
}) {
  const [selectedGrid, setSelectedGrid] =
    useState("5x5");

  const [selectedCategory, setSelectedCategory] =
    useState("Primary");

  const [leaders, setLeaders] = useState([]);
  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const availableCategories = useMemo(
    () => getAvailableCategories(selectedGrid),
    [selectedGrid]
  );

  useEffect(() => {
    const categoryStillAvailable =
      availableCategories.some(
        (category) =>
          category.id === selectedCategory
      );

    if (!categoryStillAvailable) {
      setSelectedCategory(
        availableCategories[0]?.id || "Primary"
      );
    }
  }, [availableCategories, selectedCategory]);

  useEffect(() => {
    const pageTitle = titleOverride
      ? `${String(titleOverride)
          .replace(/[🏆🥇🥈🥉🌍🏫]/g, "")
          .trim()} | CountMeInTT`
      : "Leaderboard | CountMeInTT";

    document.title = pageTitle;

    let meta = document.querySelector(
      'meta[name="description"]'
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.content = schoolFilter
      ? "View CountMeInTT school leaderboard results, student rankings, and math challenge times for participating schools in Trinidad and Tobago."
      : "View the CountMeInTT leaderboard, top student times, math challenge rankings, and multiplication competition results across Trinidad and Tobago.";
  }, [titleOverride, schoolFilter]);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      setIsLoading(true);
      setLoadError("");

      try {
        const url =
          SHEET_URLS[selectedGrid]?.[
            selectedCategory
          ];

        if (!url) {
          if (!active) return;

          setLeaders([]);
          setLastUpdated(new Date());
          setLoadError(
            `${categoryLabel(
              selectedCategory
            )} results are not published yet for ${gridLabel(
              selectedGrid
            )}.`
          );

          return;
        }

        const response = await fetch(url, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Leaderboard source returned HTTP ${response.status}.`
          );
        }

        const text = await response.text();
        const records = parseCSV(text);

        const normalizedRows = records
          .map((record) => {
            const name = readField(record, [
              "Name",
              "Student Name",
              "Player",
              "Student",
            ]);

            const time = readField(record, [
              "Time",
              "Time (MM:SS)",
              "Best Time",
              "Final Time",
              "Your Time",
              "Result",
            ]);

            const school = readField(record, [
              "School",
              "School Name",
            ]);

            const classLevel = readField(record, [
              "Class",
              "class",
              "Class Level",
              "classLevel",
              "Level",
            ]);

            const category =
              readField(record, ["Category"]) ||
              selectedCategory;

            const timestamp = readField(record, [
              "Timestamp",
              "Played At",
              "playedAt",
              "Date",
            ]);

            return {
              name,
              time,
              school,
              classLevel,
              category,
              timestamp,
              ms: toMillis(time),
              rowNumber: record.__row || 0,
            };
          })
          .filter((row) => {
            if (!row.name || !row.time) {
              return false;
            }

            if (!Number.isFinite(row.ms)) {
              return false;
            }

            if (
              !matchesLoose(
                row.school,
                schoolFilter
              )
            ) {
              return false;
            }

            if (
              classFilter &&
              canonicalClass(row.classLevel) !==
                canonicalClass(classFilter)
            ) {
              return false;
            }

            if (
              onlyFromToday &&
              !isToday(row.timestamp)
            ) {
              return false;
            }

            return true;
          })
          .sort((first, second) => {
            const timeDifference =
              first.ms - second.ms;

            if (timeDifference !== 0) {
              return timeDifference;
            }

            const firstDate =
              parseTimestamp(first.timestamp)?.getTime() ||
              Number.POSITIVE_INFINITY;

            const secondDate =
              parseTimestamp(second.timestamp)?.getTime() ||
              Number.POSITIVE_INFINITY;

            if (firstDate !== secondDate) {
              return firstDate - secondDate;
            }

            return (
              first.rowNumber - second.rowNumber
            );
          })
          .slice(0, 10);

        if (!active) return;

        setLeaders(normalizedRows);
        setLastUpdated(new Date());
      } catch (error) {
        console.error(
          "Leaderboard load error:",
          error
        );

        if (!active) return;

        setLeaders([]);
        setLastUpdated(new Date());
        setLoadError(
          error?.message ||
            "The leaderboard could not be loaded."
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [
    selectedGrid,
    selectedCategory,
    schoolFilter,
    classFilter,
    onlyFromToday,
  ]);

  const isWholeSchool =
    Boolean(schoolFilter) && !classFilter;

  const isClassPage = Boolean(classFilter);

  const makeSubtitle = (row) => {
    if (isWholeSchool) {
      return (
        prettyClass(
          row.classLevel,
          classLabel
        ) || ""
      );
    }

    if (isClassPage) {
      return "";
    }

    if (selectedCategory === "NoSchool") {
      return "";
    }

    const details = [
      row.school,
      row.classLevel,
    ].filter(Boolean);

    return details.join(" · ");
  };

  const pageTitle =
    titleOverride || "🏆 Multiplication Leaderboard";

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
      <GameHeader />

      <main>
        <section className="border-b border-yellow-300 bg-yellow-200/90 px-5 py-8 sm:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                CountMeInTT Rankings
              </p>

              <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
                {pageTitle}
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-gray-700 sm:text-lg">
                Choose a grid and category to see
                the ten fastest submitted times.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {!schoolFilter ? (
                <Link
                  to="/schools"
                  className="rounded-xl border-2 border-blue-600 bg-white px-4 py-2.5 text-sm font-black text-blue-600 transition hover:bg-blue-50"
                >
                  🏫 School Boards
                </Link>
              ) : (
                <Link
                  to="/leaderboard"
                  className="rounded-xl border-2 border-blue-600 bg-white px-4 py-2.5 text-sm font-black text-blue-600 transition hover:bg-blue-50"
                >
                  🌍 Global Board
                </Link>
              )}

              {showExtras && (
                <Link
                  to="/hall-of-fame"
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white shadow transition hover:bg-gray-800"
                >
                  Hall of Fame
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="px-5 py-8 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl border border-yellow-300 bg-white p-5 shadow-lg sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black uppercase tracking-wide text-gray-600">
                    Choose Grid
                  </span>

                  <select
                    value={selectedGrid}
                    onChange={(event) =>
                      setSelectedGrid(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-black text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {GRID_OPTIONS.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-black uppercase tracking-wide text-gray-600">
                    Choose Category
                  </span>

                  <select
                    value={selectedCategory}
                    onChange={(event) =>
                      setSelectedCategory(
                        event.target.value
                      )
                    }
                    disabled={
                      availableCategories.length <= 1
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-black text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {availableCategories.map(
                      (option) => (
                        <option
                          key={option.id}
                          value={option.id}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>

                  {availableCategories.length <= 1 && (
                    <p className="mt-2 text-xs font-semibold text-gray-500">
                      Only the published Primary
                      dataset is currently connected
                      for this grid.
                    </p>
                  )}
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
                <div>
                  <p className="font-black text-gray-950">
                    {gridLabel(selectedGrid)}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {categoryLabel(
                      selectedCategory
                    )}
                    {schoolFilter
                      ? ` · ${schoolFilter}`
                      : ""}
                    {classFilter
                      ? ` · ${classFilter}`
                      : ""}
                  </p>
                </div>

                <p className="text-sm font-semibold text-gray-500">
                  Updated:{" "}
                  {lastUpdated
                    ? lastUpdated.toLocaleString()
                    : "Loading…"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-12 sm:pb-16">
          <div className="mx-auto max-w-6xl">
            {isLoading ? (
              <LoadingLeaderboard />
            ) : loadError && leaders.length === 0 ? (
              <div className="rounded-2xl border border-yellow-300 bg-white p-10 text-center shadow-lg">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-2xl">
                  🏁
                </div>

                <h2 className="mt-5 text-2xl font-black">
                  No leaderboard available.
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                  {loadError}
                </p>
              </div>
            ) : leaders.length > 0 ? (
              <div className="rounded-2xl border border-yellow-300 bg-yellow-50/95 p-5 shadow-lg sm:p-7">
                <div className="flex flex-col gap-3 border-b border-yellow-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                      Top 10
                    </p>

                    <h2 className="mt-1 text-3xl font-black">
                      Fastest Players
                    </h2>
                  </div>

                  <Link
                    to="/games/multiplication"
                    className="rounded-xl bg-blue-600 px-5 py-3 text-center font-black text-white shadow transition hover:bg-blue-700"
                  >
                    Play This Grid
                  </Link>
                </div>

                <div className="mt-6 grid gap-3">
                  {leaders.map((row, index) => (
                    <LeaderRow
                      key={`${row.name}-${row.time}-${row.rowNumber}`}
                      row={row}
                      rank={index + 1}
                      subtitle={makeSubtitle(row)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-yellow-400 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-2xl">
                  ⏱️
                </div>

                <h2 className="mt-5 text-2xl font-black">
                  No qualifying times yet.
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                  Be the first player to submit a
                  time for this grid and category.
                </p>

                <Link
                  to="/games/multiplication"
                  className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
                >
                  Play Multiplication
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-yellow-300 bg-yellow-200/85 px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="text-3xl font-black">
              🚀 Thanks for Playing
            </h2>

            <p className="mx-auto mt-3 max-w-2xl leading-7 text-gray-700">
              CountMeInTT is powered by community
              support, school participation and
              partners who believe in building math
              confidence.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              {[
                {
                  src: "/sponsor1.svg",
                  alt: "Sponsor 1",
                },
                {
                  src: "/sponsor2.svg",
                  alt: "Sponsor 2",
                },
                {
                  src: "/sponsor3.svg",
                  alt: "Sponsor 3",
                },
              ].map((sponsor) => (
                <div
                  key={sponsor.src}
                  className="flex h-28 w-56 items-center justify-center rounded-2xl bg-white/80 p-4 shadow-md"
                >
                  <img
                    src={sponsor.src}
                    alt={sponsor.alt}
                    className="max-h-20 max-w-full object-contain"
                  />
                </div>
              ))}
            </div>

            <div className="mt-10">
              <a
                href="/about-us-contact.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-gray-950 underline"
              >
                About Us/Contact
              </a>
            </div>

            <p className="mt-12 text-center text-[11px] italic text-black">
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
        </section>
      </main>
    </div>
  );
}


