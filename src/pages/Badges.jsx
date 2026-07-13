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
    membership: "Annual Membership",
    earnedCount: 7,
    totalCount: 12,
    badges: [
      {
        id: "first-game",
        name: "First Game",
        description: "Completed a first CountMeInTT game.",
        category: "Milestones",
        icon: "★",
        earned: true,
        earnedDate: "June 18, 2026",
        progress: 1,
        target: 1,
      },
      {
        id: "perfect-grid",
        name: "Perfect Grid",
        description:
          "Completed a multiplication grid without an incorrect answer.",
        category: "Accuracy",
        icon: "✓",
        earned: true,
        earnedDate: "July 5, 2026",
        progress: 1,
        target: 1,
      },
      {
        id: "quick-starter",
        name: "Quick Starter",
        description: "Completed the 5 × 5 grid in under 30 seconds.",
        category: "Speed",
        icon: "⚡",
        earned: true,
        earnedDate: "July 8, 2026",
        progress: 1,
        target: 1,
      },
      {
        id: "under-20",
        name: "Under 20",
        description: "Completed the 5 × 5 grid in under 20 seconds.",
        category: "Speed",
        icon: "⏱",
        earned: true,
        earnedDate: "July 13, 2026",
        progress: 1,
        target: 1,
      },
      {
        id: "word-explorer",
        name: "Word Explorer",
        description: "Completed a first Math Language round.",
        category: "Math Language",
        icon: "📚",
        earned: true,
        earnedDate: "July 4, 2026",
        progress: 1,
        target: 1,
      },
      {
        id: "ten-games",
        name: "Ten Games Played",
        description: "Completed 10 CountMeInTT games.",
        category: "Consistency",
        icon: "10",
        earned: true,
        earnedDate: "June 28, 2026",
        progress: 10,
        target: 10,
      },
      {
        id: "community-player",
        name: "Community Player",
        description: "Participated in a CountMeInTT community challenge.",
        category: "Community",
        icon: "🏆",
        earned: true,
        earnedDate: "July 5, 2026",
        progress: 1,
        target: 1,
      },
      {
        id: "fifty-games",
        name: "Fifty Games Played",
        description: "Complete 50 CountMeInTT games.",
        category: "Consistency",
        icon: "50",
        earned: false,
        earnedDate: null,
        progress: 42,
        target: 50,
      },
      {
        id: "perfect-five",
        name: "Accuracy Builder",
        description: "Complete 5 perfect multiplication grids.",
        category: "Accuracy",
        icon: "◎",
        earned: false,
        earnedDate: null,
        progress: 3,
        target: 5,
      },
      {
        id: "word-master",
        name: "Word Master",
        description: "Explore all 50 free Math Language terms.",
        category: "Math Language",
        icon: "ABC",
        earned: false,
        earnedDate: null,
        progress: 32,
        target: 50,
      },
      {
        id: "hundred-games",
        name: "Century Player",
        description: "Complete 100 CountMeInTT games.",
        category: "Milestones",
        icon: "100",
        earned: false,
        earnedDate: null,
        progress: 42,
        target: 100,
      },
      {
        id: "school-champion",
        name: "School Champion",
        description: "Finish first in an eligible school challenge.",
        category: "Community",
        icon: "🏫",
        earned: false,
        earnedDate: null,
        progress: 0,
        target: 1,
      },
    ],
  },

  maya: {
    id: "maya",
    displayName: "Maya B.",
    initials: "MB",
    school: "San Juan Girls' RC School",
    level: "Standard 2",
    membership: "Free Account",
    earnedCount: 3,
    totalCount: 12,
    badges: [
      {
        id: "first-game",
        name: "First Game",
        description: "Completed a first CountMeInTT game.",
        category: "Milestones",
        icon: "★",
        earned: true,
        earnedDate: "July 8, 2026",
        progress: 1,
        target: 1,
      },
      {
        id: "word-explorer",
        name: "Word Explorer",
        description: "Completed a first Math Language round.",
        category: "Math Language",
        icon: "📚",
        earned: true,
        earnedDate: "July 11, 2026",
        progress: 1,
        target: 1,
      },
      {
        id: "quick-starter",
        name: "Quick Starter",
        description: "Completed the 5 × 5 grid in under 30 seconds.",
        category: "Speed",
        icon: "⚡",
        earned: true,
        earnedDate: "July 13, 2026",
        progress: 1,
        target: 1,
      },
      {
        id: "perfect-grid",
        name: "Perfect Grid",
        description:
          "Completed a multiplication grid without an incorrect answer.",
        category: "Accuracy",
        icon: "✓",
        earned: false,
        earnedDate: null,
        progress: 0,
        target: 1,
      },
      {
        id: "ten-games",
        name: "Ten Games Played",
        description: "Complete 10 CountMeInTT games.",
        category: "Consistency",
        icon: "10",
        earned: false,
        earnedDate: null,
        progress: 3,
        target: 10,
      },
      {
        id: "word-master",
        name: "Word Master",
        description: "Explore all 50 free Math Language terms.",
        category: "Math Language",
        icon: "ABC",
        earned: false,
        earnedDate: null,
        progress: 18,
        target: 50,
      },
      {
        id: "under-20",
        name: "Under 20",
        description: "Completed the 5 × 5 grid in under 20 seconds.",
        category: "Speed",
        icon: "⏱",
        earned: false,
        earnedDate: null,
        progress: 0,
        target: 1,
      },
      {
        id: "community-player",
        name: "Community Player",
        description: "Participate in a CountMeInTT community challenge.",
        category: "Community",
        icon: "🏆",
        earned: false,
        earnedDate: null,
        progress: 0,
        target: 1,
      },
      {
        id: "fifty-games",
        name: "Fifty Games Played",
        description: "Complete 50 CountMeInTT games.",
        category: "Consistency",
        icon: "50",
        earned: false,
        earnedDate: null,
        progress: 3,
        target: 50,
      },
      {
        id: "perfect-five",
        name: "Accuracy Builder",
        description: "Complete 5 perfect multiplication grids.",
        category: "Accuracy",
        icon: "◎",
        earned: false,
        earnedDate: null,
        progress: 0,
        target: 5,
      },
      {
        id: "hundred-games",
        name: "Century Player",
        description: "Complete 100 CountMeInTT games.",
        category: "Milestones",
        icon: "100",
        earned: false,
        earnedDate: null,
        progress: 3,
        target: 100,
      },
      {
        id: "school-champion",
        name: "School Champion",
        description: "Finish first in an eligible school challenge.",
        category: "Community",
        icon: "🏫",
        earned: false,
        earnedDate: null,
        progress: 0,
        target: 1,
      },
    ],
  },
};

const categoryOptions = [
  "All Categories",
  "Speed",
  "Accuracy",
  "Consistency",
  "Math Language",
  "Community",
  "Milestones",
];

function ProgressBar({ progress, target }) {
  const safeTarget = target > 0 ? target : 1;
  const percentage = Math.min(100, Math.round((progress / safeTarget) * 100));

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-bold text-gray-600">
          {progress} / {target}
        </span>

        <span className="font-black text-blue-600">{percentage}%</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function BadgeCard({ badge }) {
  return (
    <article
      className={[
        "flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm",
        badge.earned
          ? "border-yellow-200"
          : "border-gray-200 opacity-80",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={[
            "flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black",
            badge.earned
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-500",
          ].join(" ")}
        >
          {badge.icon}
        </div>

        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
            badge.earned
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600",
          ].join(" ")}
        >
          {badge.earned ? "Earned" : "Locked"}
        </span>
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-wider text-blue-600">
        {badge.category}
      </p>

      <h3 className="mt-2 text-xl font-black text-gray-950">
        {badge.name}
      </h3>

      <p className="mt-2 flex-1 leading-7 text-gray-600">
        {badge.description}
      </p>

      {badge.earned ? (
        <p className="mt-5 text-sm font-bold text-gray-500">
          Earned {badge.earnedDate}
        </p>
      ) : (
        <div className="mt-5">
          <ProgressBar progress={badge.progress} target={badge.target} />
        </div>
      )}
    </article>
  );
}

export default function Badges() {
  const { studentId } = useParams();

  const student = sampleStudents[studentId] || sampleStudents.joshua;

  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const visibleBadges = useMemo(() => {
    return student.badges.filter((badge) => {
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Earned" && badge.earned) ||
        (statusFilter === "Locked" && !badge.earned);

      const matchesCategory =
        categoryFilter === "All Categories" ||
        badge.category === categoryFilter;

      return matchesStatus && matchesCategory;
    });
  }, [student.badges, statusFilter, categoryFilter]);

  const earnedBadges = student.badges.filter((badge) => badge.earned);
  const lockedBadges = student.badges.filter((badge) => !badge.earned);

  const latestEarnedBadge =
    [...earnedBadges]
      .filter((badge) => badge.earnedDate)
      .sort(
        (a, b) =>
          new Date(b.earnedDate).getTime() -
          new Date(a.earnedDate).getTime()
      )[0] || earnedBadges[0];

  const closestLockedBadge =
    [...lockedBadges]
      .map((badge) => ({
        ...badge,
        completion:
          badge.target > 0 ? badge.progress / badge.target : 0,
      }))
      .sort((a, b) => b.completion - a.completion)[0] || null;

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
                  Badge Collection
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
                to="/games"
                className="rounded-xl bg-blue-600 px-5 py-3 text-center font-black text-white shadow transition hover:bg-blue-700"
              >
                Explore Games
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                  Badges Earned
                </p>

                <p className="mt-3 text-3xl font-black">
                  {earnedBadges.length}
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-600">
                  Out of {student.badges.length} available
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-yellow-700">
                  Latest Badge
                </p>

                <p className="mt-3 text-xl font-black">
                  {latestEarnedBadge?.name || "No badges yet"}
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-600">
                  {latestEarnedBadge?.earnedDate || "Start playing to earn one"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-green-700">
                  Membership
                </p>

                <p className="mt-3 text-xl font-black">
                  {student.membership}
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-600">
                  Badge access follows the student profile
                </p>
              </div>
            </div>

            {closestLockedBadge && (
              <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <div className="grid gap-5 md:grid-cols-[1fr_0.8fr] md:items-center">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                      Closest to earning
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      {closestLockedBadge.name}
                    </h2>

                    <p className="mt-2 leading-7 text-gray-600">
                      {closestLockedBadge.description}
                    </p>
                  </div>

                  <ProgressBar
                    progress={closestLockedBadge.progress}
                    target={closestLockedBadge.target}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-yellow-50 px-5 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Filter badges
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Explore the collection.
              </h2>
            </div>

            <div className="mt-7 grid gap-5 rounded-2xl border border-yellow-200 bg-white p-5 shadow-sm sm:grid-cols-2">
              <div>
                <label
                  htmlFor="statusFilter"
                  className="mb-2 block text-sm font-black text-gray-800"
                >
                  Status
                </label>

                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="All">All badges</option>
                  <option value="Earned">Earned</option>
                  <option value="Locked">Locked</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="categoryFilter"
                  className="mb-2 block text-sm font-black text-gray-800"
                >
                  Category
                </label>

                <select
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
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
                  Badge collection
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {visibleBadges.length} badge
                  {visibleBadges.length === 1 ? "" : "s"} shown.
                </h2>
              </div>
            </div>

            {visibleBadges.length > 0 ? (
              <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-2xl">
                  🏅
                </div>

                <h3 className="mt-5 text-2xl font-black">
                  No matching badges.
                </h3>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                  Try changing the status or category filter.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="px-5 pb-12 sm:pb-16">
          <div className="mx-auto max-w-7xl rounded-3xl bg-blue-600 px-6 py-10 text-center text-white shadow-xl sm:px-10">
            <p className="text-sm font-black uppercase tracking-wider text-yellow-300">
              Keep progressing
            </p>

            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              Every game can move you closer to a new badge.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
              Play multiplication, explore Math Language and take part in
              eligible challenges to continue building your collection.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/games/multiplication"
                className="rounded-xl bg-yellow-300 px-6 py-3 font-black text-gray-950 transition hover:bg-yellow-200"
              >
                Play Multiplication
              </Link>

              <Link
                to="/math-language"
                className="rounded-xl border-2 border-white bg-transparent px-6 py-3 font-black text-white transition hover:bg-white/10"
              >
                Explore Math Language
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

