import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";

const GAME_FILTERS = [
  { value: "all", label: "All Games" },
  { value: "multiplication", label: "Multiplication" },
  { value: "math_language", label: "Math Language" },
  { value: "fractions", label: "Fractions" },
  { value: "decimals", label: "Decimals" },
  { value: "algebra", label: "Algebra" },
  { value: "word_problems", label: "Word Problems" },
  { value: "other", label: "Other" },
];

function getInitials(firstName = "", lastName = "") {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName.trim().charAt(0);

  return `${firstInitial}${lastInitial}`.toUpperCase() || "?";
}

function formatGameType(gameType = "") {
  const labels = {
    multiplication: "Multiplication",
    math_language: "Math Language",
    fractions: "Fractions",
    decimals: "Decimals",
    algebra: "Algebra",
    word_problems: "Word Problems",
    other: "Other",
  };

  return labels[gameType] || "Game";
}

function formatSubmissionType(submissionType = "") {
  const labels = {
    practice: "Practice",
    community_challenge: "Community Challenge",
    school_challenge: "School Challenge",
    special_event: "Special Event",
    admin_entry: "Admin Entry",
  };

  return labels[submissionType] || "Activity";
}

function formatVerificationStatus(status = "") {
  const labels = {
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    flagged: "Flagged",
  };

  return labels[status] || "Unknown";
}

function formatDuration(milliseconds) {
  if (
    milliseconds === null ||
    milliseconds === undefined ||
    Number.isNaN(Number(milliseconds))
  ) {
    return null;
  }

  const totalMilliseconds = Math.max(0, Number(milliseconds));
  const minutes = Math.floor(totalMilliseconds / 60000);
  const seconds = Math.floor(
    (totalMilliseconds % 60000) / 1000
  );
  const hundredths = Math.floor(
    (totalMilliseconds % 1000) / 10
  );

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(
      hundredths
    ).padStart(2, "0")}`;
  }

  return `${seconds}.${String(hundredths).padStart(2, "0")} sec`;
}

function formatScore(score, maxScore) {
  if (score === null || score === undefined) {
    return null;
  }

  if (maxScore !== null && maxScore !== undefined) {
    return `${score} / ${maxScore}`;
  }

  return String(score);
}

function formatResultValue(result) {
  const duration = formatDuration(result.duration_ms);

  if (duration) {
    return duration;
  }

  const score = formatScore(result.score, result.max_score);

  if (score) {
    return score;
  }

  return "Result unavailable";
}

function formatPlayedDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-TT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function VerificationBadge({ status }) {
  const classes = {
    verified: "bg-green-100 text-green-700",
    pending: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    flagged: "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
        classes[status] || "bg-gray-100 text-gray-700",
      ].join(" ")}
    >
      {formatVerificationStatus(status)}
    </span>
  );
}

function ResultCard({ result }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              {formatGameType(result.game_type)}
            </span>

            {result.is_personal_best && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-800">
                Personal Best
              </span>
            )}

            <VerificationBadge
              status={result.verification_status}
            />
          </div>

          <h3 className="mt-4 text-xl font-black text-gray-950">
            {result.mode_label || result.game_mode}
          </h3>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
            <span>
              <strong className="text-gray-800">Played:</strong>{" "}
              {formatPlayedDate(result.played_at)}
            </span>

            <span>
              <strong className="text-gray-800">Type:</strong>{" "}
              {formatSubmissionType(result.submission_type)}
            </span>

            {result.event_name && (
              <span>
                <strong className="text-gray-800">Event:</strong>{" "}
                {result.event_name}
              </span>
            )}
          </div>

          {(result.correct_answers !== null ||
            result.incorrect_answers !== null ||
            result.accuracy_percent !== null) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {result.correct_answers !== null && (
                <span className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-bold text-green-700">
                  {result.correct_answers} correct
                </span>
              )}

              {result.incorrect_answers !== null && (
                <span className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700">
                  {result.incorrect_answers} incorrect
                </span>
              )}

              {result.accuracy_percent !== null && (
                <span className="rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-bold text-purple-700">
                  {Number(result.accuracy_percent).toFixed(0)}%
                  accuracy
                </span>
              )}
            </div>
          )}

          {result.verification_status === "rejected" &&
            result.rejection_reason && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {result.rejection_reason}
              </div>
            )}
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-sm font-black uppercase tracking-wide text-gray-500">
            Result
          </p>

          <p className="mt-1 text-3xl font-black text-blue-600">
            {formatResultValue(result)}
          </p>
        </div>
      </div>
    </article>
  );
}

function LoadingResults() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <h1 className="mt-6 text-2xl font-black">
            Loading results…
          </h1>

          <p className="mt-3 text-gray-600">
            We are retrieving the student’s saved activity.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ResultsError({ message }) {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-black text-red-700">
            !
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Results unavailable.
          </h1>

          <p className="mt-4 leading-7 text-gray-600">
            {message}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
            >
              Return to Dashboard
            </Link>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border-2 border-blue-600 bg-white px-6 py-3 font-black text-blue-600 transition hover:bg-blue-50"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function ResultsHistory() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);

  const [gameFilter, setGameFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadResultsPage() {
      setIsLoading(true);
      setLoadError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          navigate("/login", {
            replace: true,
            state: {
              from: {
                pathname: `/students/${studentId}/results`,
              },
            },
          });

          return;
        }

        const { data: studentData, error: studentError } =
          await supabase
            .from("student_profiles")
            .select(
              `
                id,
                account_id,
                first_name,
                last_name,
                public_display_name,
                current_school,
                current_level,
                academic_year,
                profile_status
              `
            )
            .eq("id", studentId)
            .eq("profile_status", "active")
            .maybeSingle();

        if (studentError) {
          throw studentError;
        }

        if (!studentData) {
          throw new Error(
            "This student profile does not exist or you do not have permission to view its results."
          );
        }

        const { data: resultRows, error: resultsError } =
          await supabase
            .from("game_results")
            .select(
              `
                id,
                student_id,
                account_id,
                game_type,
                game_mode,
                mode_label,
                duration_ms,
                score,
                max_score,
                correct_answers,
                incorrect_answers,
                accuracy_percent,
                submission_type,
                challenge_key,
                event_name,
                public_eligible,
                verification_status,
                rejection_reason,
                is_personal_best,
                played_at,
                created_at
              `
            )
            .eq("student_id", studentId)
            .order("played_at", {
              ascending: false,
            });

        if (resultsError) {
          throw resultsError;
        }

        if (!active) return;

        setStudent({
          id: studentData.id,
          displayName:
            studentData.public_display_name ||
            `${studentData.first_name || "Student"} ${
              studentData.last_name?.charAt(0)?.toUpperCase() || ""
            }.`.trim(),
          initials: getInitials(
            studentData.first_name,
            studentData.last_name
          ),
          school:
            studentData.current_school || "School not added",
          level:
            studentData.current_level || "Level not added",
          academicYear:
            studentData.academic_year || "Not added",

          // Temporary until memberships are connected.
          membership: {
            plan: "Free Account",
            isPaid: false,
          },
        });

        setResults(resultRows || []);
      } catch (error) {
        console.error("Results history loading error:", error);

        if (active) {
          setLoadError(
            error?.message ||
              "The student’s results could not be loaded."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadResultsPage();

    return () => {
      active = false;
    };
  }, [navigate, studentId]);

  const availableModes = useMemo(() => {
    const matchingResults =
      gameFilter === "all"
        ? results
        : results.filter(
            (result) => result.game_type === gameFilter
          );

    const uniqueModes = new Map();

    matchingResults.forEach((result) => {
      if (!uniqueModes.has(result.game_mode)) {
        uniqueModes.set(
          result.game_mode,
          result.mode_label || result.game_mode
        );
      }
    });

    return Array.from(uniqueModes.entries()).map(
      ([value, label]) => ({
        value,
        label,
      })
    );
  }, [results, gameFilter]);

  useEffect(() => {
    if (
      modeFilter !== "all" &&
      !availableModes.some(
        (mode) => mode.value === modeFilter
      )
    ) {
      setModeFilter("all");
    }
  }, [availableModes, modeFilter]);

  const visibleResults = useMemo(() => {
    const filtered = results.filter((result) => {
      const matchesGame =
        gameFilter === "all" ||
        result.game_type === gameFilter;

      const matchesMode =
        modeFilter === "all" ||
        result.game_mode === modeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        result.verification_status === statusFilter;

      return matchesGame && matchesMode && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === "oldest") {
        return (
          new Date(a.played_at).getTime() -
          new Date(b.played_at).getTime()
        );
      }

      if (sortOrder === "best") {
        const bothTimed =
          a.duration_ms !== null && b.duration_ms !== null;

        if (bothTimed) {
          return a.duration_ms - b.duration_ms;
        }

        const bothScored =
          a.score !== null && b.score !== null;

        if (bothScored) {
          const aPercentage = a.max_score
            ? a.score / a.max_score
            : a.score;

          const bPercentage = b.max_score
            ? b.score / b.max_score
            : b.score;

          return bPercentage - aPercentage;
        }

        if (a.duration_ms !== null) return -1;
        if (b.duration_ms !== null) return 1;

        return 0;
      }

      return (
        new Date(b.played_at).getTime() -
        new Date(a.played_at).getTime()
      );
    });
  }, [
    results,
    gameFilter,
    modeFilter,
    statusFilter,
    sortOrder,
  ]);

  const verifiedResults = results.filter(
    (result) => result.verification_status === "verified"
  );

  const personalBestCount = results.filter(
    (result) => result.is_personal_best
  ).length;

  const gameTypesPlayed = new Set(
    results.map((result) => result.game_type)
  ).size;

  const clearFilters = () => {
    setGameFilter("all");
    setModeFilter("all");
    setStatusFilter("all");
    setSortOrder("newest");
  };

  if (isLoading) {
    return <LoadingResults />;
  }

  if (loadError || !student) {
    return (
      <ResultsError
        message={
          loadError ||
          "This student’s results could not be found."
        }
      />
    );
  }

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

                <p className="mt-1 text-gray-600">
                  {student.school}
                </p>

                <p className="mt-1 text-sm font-bold text-gray-500">
                  Academic Year {student.academicYear}
                </p>
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
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                  Results Saved
                </p>

                <p className="mt-3 text-3xl font-black">
                  {results.length}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-green-700">
                  Verified
                </p>

                <p className="mt-3 text-3xl font-black">
                  {verifiedResults.length}
                </p>
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
                <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                  Games Explored
                </p>

                <p className="mt-3 text-3xl font-black">
                  {gameTypesPlayed}
                </p>
              </div>
            </div>

            {!student.membership.isPaid && (
              <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <p className="font-black text-gray-950">
                  Free Account result limit
                </p>

                <p className="mt-2 leading-7 text-gray-600">
                  Free student profiles will retain the latest 10
                  results. Membership will provide access to unlimited
                  result history.
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

            <div className="mt-7 grid gap-5 rounded-2xl border border-yellow-200 bg-white p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
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
                    setModeFilter("all");
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {GAME_FILTERS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
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
                  onChange={(event) =>
                    setModeFilter(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">All Modes</option>

                  {availableModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="statusFilter"
                  className="mb-2 block text-sm font-black text-gray-800"
                >
                  Verification
                </label>

                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="flagged">Flagged</option>
                  <option value="rejected">Rejected</option>
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
                  onChange={(event) =>
                    setSortOrder(event.target.value)
                  }
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Saved Activity
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {visibleResults.length} result
                  {visibleResults.length === 1 ? "" : "s"} found.
                </h2>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-black text-gray-700 transition hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>

            {visibleResults.length > 0 ? (
              <div className="mt-7 grid gap-5">
                {visibleResults.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                  />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="mt-7 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-2xl">
                  🎮
                </div>

                <h3 className="mt-5 text-2xl font-black">
                  No results saved yet.
                </h3>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                  Results will appear here after the student completes
                  a connected CountMeInTT game.
                </p>

                <Link
                  to="/games/multiplication"
                  className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
                >
                  Play Multiplication
                </Link>
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
                  Try changing or clearing the current filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-xl border-2 border-blue-600 bg-white px-6 py-3 font-black text-blue-600 transition hover:bg-blue-50"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

