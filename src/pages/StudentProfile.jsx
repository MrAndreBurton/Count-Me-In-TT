import React from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const sampleStudents = {
  joshua: {
    id: "joshua",
    firstName: "Joshua",
    lastName: "Burton",
    displayName: "Joshua B.",
    initials: "JB",
    school: "St Xavier's Private School",
    level: "Standard 4",
    academicYear: "2026–2027",
    schoolVisible: true,
    membership: {
      plan: "Annual Membership",
      status: "Active",
      expiryDate: "July 12, 2027",
    },
    progress: {
      personalBest: "18.42 sec",
      personalBestMode: "5 × 5 Quick",
      gamesPlayed: 42,
      mathLanguageCompleted: 32,
      mathLanguageTotal: 50,
      badgesEarned: 7,
    },
    recentResults: [
      {
        id: 1,
        title: "5 × 5 Multiplication",
        result: "18.42 seconds",
        date: "Today",
        badge: "New Personal Best",
      },
      {
        id: 2,
        title: "Math Language",
        result: "9 / 10",
        date: "Yesterday",
        badge: null,
      },
      {
        id: 3,
        title: "12 × 12 Multiplication",
        result: "2:41.18",
        date: "July 10",
        badge: null,
      },
    ],
    badges: [
      {
        id: 1,
        icon: "✓",
        name: "Perfect Grid",
        description:
          "Completed a multiplication grid without an incorrect answer.",
      },
      {
        id: 2,
        icon: "⚡",
        name: "Quick Starter",
        description: "Completed the 5 × 5 Quick Grid in under 30 seconds.",
      },
      {
        id: 3,
        icon: "📚",
        name: "Word Explorer",
        description: "Completed a first Math Language round.",
      },
    ],
    schoolHistory: [
      {
        id: 1,
        academicYear: "2026–2027",
        school: "St Xavier's Private School",
        level: "Standard 4",
        current: true,
      },
      {
        id: 2,
        academicYear: "2025–2026",
        school: "St Xavier's Private School",
        level: "Standard 3",
        current: false,
      },
    ],
  },

  maya: {
    id: "maya",
    firstName: "Maya",
    lastName: "Burton",
    displayName: "Maya B.",
    initials: "MB",
    school: "San Juan Girls' RC School",
    level: "Standard 2",
    academicYear: "2026–2027",
    schoolVisible: false,
    membership: {
      plan: "Free Account",
      status: "Active",
      expiryDate: null,
    },
    progress: {
      personalBest: "24.80 sec",
      personalBestMode: "5 × 5 Quick",
      gamesPlayed: 13,
      mathLanguageCompleted: 18,
      mathLanguageTotal: 50,
      badgesEarned: 3,
    },
    recentResults: [
      {
        id: 1,
        title: "5 × 5 Multiplication",
        result: "24.80 seconds",
        date: "Today",
        badge: "New Personal Best",
      },
      {
        id: 2,
        title: "Math Language",
        result: "7 / 10",
        date: "July 11",
        badge: null,
      },
    ],
    badges: [
      {
        id: 1,
        icon: "★",
        name: "First Game",
        description: "Completed a first CountMeInTT game.",
      },
      {
        id: 2,
        icon: "📚",
        name: "Word Explorer",
        description: "Completed a first Math Language round.",
      },
    ],
    schoolHistory: [
      {
        id: 1,
        academicYear: "2026–2027",
        school: "San Juan Girls' RC School",
        level: "Standard 2",
        current: true,
      },
    ],
  },
};

function StatCard({ label, value, detail, tone = "blue" }) {
  const toneClasses = {
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <span
        className={[
          "inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
          toneClasses[tone],
        ].join(" ")}
      >
        {label}
      </span>

      <p className="mt-4 text-3xl font-black text-gray-950">{value}</p>

      <p className="mt-2 text-sm font-semibold text-gray-600">{detail}</p>
    </div>
  );
}

export default function StudentProfile() {
  const { studentId } = useParams();

  const student = sampleStudents[studentId] || sampleStudents.joshua;

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-2xl font-black text-blue-700">
                {student.initials}
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Student Profile
                </p>

                <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
                  {student.displayName}
                </h1>

                <p className="mt-3 text-lg font-semibold text-gray-700">
                  {student.level}
                </p>

                <p className="mt-1 text-gray-600">{student.school}</p>

                <p className="mt-1 text-sm font-bold text-gray-500">
                  Academic Year {student.academicYear}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/games/multiplication"
                className="rounded-xl bg-blue-600 px-5 py-3 text-center font-black text-white shadow transition hover:bg-blue-700"
              >
                Play Now
              </Link>

              <Link
                to={`/students/${student.id}/edit`}
                className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
              >
                Edit Profile
              </Link>

              <Link
                to={`/students/${student.id}/results`}
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
              >
                View Results
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Overview
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Learning progress at a glance.
              </h2>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Personal Best"
                value={student.progress.personalBest}
                detail={student.progress.personalBestMode}
                tone="blue"
              />

              <StatCard
                label="Games Played"
                value={student.progress.gamesPlayed}
                detail="Completed CountMeInTT games"
                tone="green"
              />

              <StatCard
                label="Math Language"
                value={`${student.progress.mathLanguageCompleted} / ${student.progress.mathLanguageTotal}`}
                detail="Terms explored"
                tone="yellow"
              />

              <StatCard
                label="Badges"
                value={student.progress.badgesEarned}
                detail="Badges earned"
                tone="purple"
              />
            </div>
          </div>
        </section>

        <section className="bg-yellow-50 px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-yellow-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Current academic record
              </p>

              <h2 className="mt-2 text-3xl font-black">
                School and class information.
              </h2>

              <dl className="mt-7 grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-5">
                  <dt className="text-sm font-black uppercase tracking-wide text-gray-500">
                    School
                  </dt>

                  <dd className="mt-2 font-black text-gray-950">
                    {student.school}
                  </dd>
                </div>

                <div className="rounded-xl border border-gray-200 p-5">
                  <dt className="text-sm font-black uppercase tracking-wide text-gray-500">
                    Level
                  </dt>

                  <dd className="mt-2 font-black text-gray-950">
                    {student.level}
                  </dd>
                </div>

                <div className="rounded-xl border border-gray-200 p-5">
                  <dt className="text-sm font-black uppercase tracking-wide text-gray-500">
                    Academic Year
                  </dt>

                  <dd className="mt-2 font-black text-gray-950">
                    {student.academicYear}
                  </dd>
                </div>

                <div className="rounded-xl border border-gray-200 p-5">
                  <dt className="text-sm font-black uppercase tracking-wide text-gray-500">
                    Public school visibility
                  </dt>

                  <dd className="mt-2 font-black text-gray-950">
                    {student.schoolVisible ? "Visible" : "Hidden"}
                  </dd>
                </div>
              </dl>

              <Link
                to={`/students/${student.id}/edit`}
                className="mt-7 inline-block font-black text-blue-600 hover:underline"
              >
                Update academic information →
              </Link>
            </div>

            <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg sm:p-8">
              <p className="text-sm font-black uppercase tracking-wider text-yellow-300">
                Membership
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {student.membership.plan}
              </h2>

              <p className="mt-3 font-semibold text-blue-100">
                Status: {student.membership.status}
              </p>

              {student.membership.expiryDate ? (
                <p className="mt-2 text-blue-100">
                  Active until {student.membership.expiryDate}.
                </p>
              ) : (
                <p className="mt-2 text-blue-100">
                  Personal best and the latest 10 results are saved.
                </p>
              )}

              <Link
                to="/membership"
                className="mt-7 inline-block rounded-xl bg-yellow-300 px-5 py-3 font-black text-gray-950 transition hover:bg-yellow-200"
              >
                {student.membership.plan === "Free Account"
                  ? "Explore Membership"
                  : "Manage Membership"}
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Recent results
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Latest saved activity.
                  </h2>
                </div>

                <Link
                  to={`/students/${student.id}/results`}
                  className="font-black text-blue-600 hover:underline"
                >
                  View all results →
                </Link>
              </div>

              <div className="mt-6 divide-y divide-gray-100">
                {student.recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-gray-950">
                          {result.title}
                        </h3>

                        {result.badge && (
                          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-yellow-800">
                            {result.badge}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {result.date}
                      </p>
                    </div>

                    <p className="text-lg font-black text-blue-600">
                      {result.result}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Latest badges
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Recent achievements.
                  </h2>
                </div>

                <Link
                  to={`/students/${student.id}/badges`}
                  className="font-black text-blue-600 hover:underline"
                >
                  View all →
                </Link>
              </div>

              <div className="mt-6 grid gap-4">
                {student.badges.slice(0, 3).map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-start gap-4 rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-xl font-black text-yellow-800">
                      {badge.icon}
                    </div>

                    <div>
                      <h3 className="font-black text-gray-950">
                        {badge.name}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-12 sm:pb-16">
          <div className="mx-auto max-w-7xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  School history
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Academic records over time.
                </h2>
              </div>

              <Link
                to={`/students/${student.id}/edit`}
                className="font-black text-blue-600 hover:underline"
              >
                Update current record →
              </Link>
            </div>

            <div className="mt-7 grid gap-4">
              {student.schoolHistory.map((record) => (
                <div
                  key={record.id}
                  className={[
                    "grid gap-4 rounded-xl border p-5 sm:grid-cols-[0.7fr_1.3fr_0.8fr_auto] sm:items-center",
                    record.current
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-white",
                  ].join(" ")}
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-gray-500">
                      Academic Year
                    </p>

                    <p className="mt-1 font-black text-gray-950">
                      {record.academicYear}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-gray-500">
                      School
                    </p>

                    <p className="mt-1 font-black text-gray-950">
                      {record.school}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-gray-500">
                      Level
                    </p>

                    <p className="mt-1 font-black text-gray-950">
                      {record.level}
                    </p>
                  </div>

                  {record.current && (
                    <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

