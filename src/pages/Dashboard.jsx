import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const sampleStudents = [
  {
    id: "joshua",
    firstName: "Joshua",
    lastName: "Burton",
    displayName: "Joshua B.",
    initials: "JB",
    school: "St Xavier's Private School",
    level: "Standard 4",
    academicYear: "2026–2027",
    membership: {
      plan: "Annual Membership",
      status: "Active",
      expiryDate: "July 12, 2027",
      tone: "blue",
    },
    attention: [
      {
        id: "school-review",
        title: "Confirm school details",
        description:
          "Review Joshua’s school and level before the next academic year.",
        action: "Review Profile",
        to: "/students/joshua/edit",
      },
    ],
    progress: {
      personalBest: "18.42 sec",
      personalBestMode: "5 × 5 Quick",
      gamesPlayed: 42,
      mathLanguageCompleted: 32,
      mathLanguageTotal: 50,
      badgesEarned: 7,
    },
    recentActivity: [
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
    latestBadge: {
      icon: "✓",
      name: "Perfect Grid",
      description:
        "Completed a multiplication grid without an incorrect answer.",
    },
  },
  {
    id: "maya",
    firstName: "Maya",
    lastName: "Burton",
    displayName: "Maya B.",
    initials: "MB",
    school: "San Juan Girls' RC School",
    level: "Standard 2",
    academicYear: "2026–2027",
    membership: {
      plan: "Free Account",
      status: "Active",
      expiryDate: null,
      tone: "gray",
    },
    attention: [],
    progress: {
      personalBest: "24.80 sec",
      personalBestMode: "5 × 5 Quick",
      gamesPlayed: 13,
      mathLanguageCompleted: 18,
      mathLanguageTotal: 50,
      badgesEarned: 3,
    },
    recentActivity: [
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
    latestBadge: {
      icon: "★",
      name: "First Game",
      description: "Completed a first CountMeInTT game.",
    },
  },
];

function StudentCard({ student, selected, onSelect }) {
  const membershipClasses =
    student.membership.plan === "Free Account"
      ? "bg-gray-100 text-gray-700"
      : "bg-blue-100 text-blue-700";

  return (
    <button
      type="button"
      onClick={() => onSelect(student.id)}
      className={[
        "rounded-2xl bg-white p-5 text-left shadow-sm transition duration-200",
        selected
          ? "border-2 border-blue-600 ring-4 ring-blue-100"
          : "border border-gray-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-lg font-black text-blue-700">
          {student.initials}
        </div>

        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
            membershipClasses,
          ].join(" ")}
        >
          {student.membership.plan}
        </span>
      </div>

      <h3 className="mt-4 text-xl font-black text-gray-950">
        {student.displayName}
      </h3>

      <p className="mt-1 font-semibold text-gray-600">{student.level}</p>

      <p className="mt-1 text-sm leading-6 text-gray-500">
        {student.school}
      </p>

      {student.membership.expiryDate && (
        <p className="mt-4 text-sm font-bold text-gray-600">
          Expires {student.membership.expiryDate}
        </p>
      )}

      <p className="mt-4 font-black text-blue-600">
        {selected ? "Currently viewing" : "View profile"}
      </p>
    </button>
  );
}

function ProgressCard({ label, value, detail, accent = "blue" }) {
  const accentClasses = {
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div
        className={[
          "inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
          accentClasses[accent],
        ].join(" ")}
      >
        {label}
      </div>

      <p className="mt-4 text-3xl font-black text-gray-950">{value}</p>

      <p className="mt-2 text-sm font-semibold text-gray-600">{detail}</p>
    </div>
  );
}

export default function Dashboard() {
  const [activeStudentId, setActiveStudentId] = useState(
    sampleStudents[0].id
  );

  const activeStudent = useMemo(
    () =>
      sampleStudents.find(
        (student) => student.id === activeStudentId
      ) || sampleStudents[0],
    [activeStudentId]
  );

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                My CountMeInTT
              </p>

              <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
                Good evening, Andre <span aria-hidden="true">👋</span>
              </h1>

              <p className="mt-3 max-w-3xl text-lg leading-8 text-gray-600">
                Manage your students, memberships and CountMeInTT progress.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/students/add"
                className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
              >
                Add Student
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
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Your students
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Choose a student profile.
              </h2>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sampleStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  selected={student.id === activeStudentId}
                  onSelect={setActiveStudentId}
                />
              ))}

              <Link
                to="/students/add"
                className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white/80 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-3xl font-black text-blue-700">
                  +
                </div>

                <h3 className="mt-4 text-xl font-black">Add another student</h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-gray-600">
                  Create another learning profile under this account.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-yellow-50 px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
              <div className="rounded-2xl border border-yellow-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-2xl font-black text-blue-700">
                      {activeStudent.initials}
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                        Selected student
                      </p>

                      <h2 className="mt-1 text-3xl font-black">
                        {activeStudent.displayName}
                      </h2>

                      <p className="mt-2 font-semibold text-gray-700">
                        {activeStudent.level}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {activeStudent.school}
                      </p>

                      <p className="mt-1 text-sm font-bold text-gray-500">
                        Academic Year {activeStudent.academicYear}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-50 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                      Membership
                    </p>

                    <p className="mt-1 font-black text-gray-950">
                      {activeStudent.membership.plan}
                    </p>

                    {activeStudent.membership.expiryDate && (
                      <p className="mt-1 text-sm text-gray-600">
                        Expires {activeStudent.membership.expiryDate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    to="/games/multiplication"
                    className="rounded-xl bg-blue-600 px-5 py-3 text-center font-black text-white transition hover:bg-blue-700"
                  >
                    Continue Playing
                  </Link>

                  <Link
                    to={`/students/${activeStudent.id}`}
                    className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
                  >
                    View Profile
                  </Link>

                  <Link
                    to={`/students/${activeStudent.id}/edit`}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
                  >
                    Edit Profile
                  </Link>

                  <Link
                    to="/membership"
                    className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
                  >
                    Manage Membership
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Needs your attention
                </p>

                {activeStudent.attention.length > 0 ? (
                  <div className="mt-5 grid gap-4">
                    {activeStudent.attention.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-yellow-200 bg-yellow-50 p-4"
                      >
                        <h3 className="font-black text-gray-950">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {item.description}
                        </p>

                        <Link
                          to={item.to}
                          className="mt-3 inline-block font-black text-blue-600 hover:underline"
                        >
                          {item.action} →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-black text-green-700">
                      ✓
                    </div>

                    <h3 className="mt-4 font-black text-gray-950">
                      You’re all caught up.
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      There are no urgent profile or membership actions for
                      {` ${activeStudent.displayName}`} right now.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Quick progress
              </p>

              <h2 className="mt-2 text-3xl font-black">
                A simple view of recent growth.
              </h2>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <ProgressCard
                label="Personal Best"
                value={activeStudent.progress.personalBest}
                detail={activeStudent.progress.personalBestMode}
                accent="blue"
              />

              <ProgressCard
                label="Games Played"
                value={activeStudent.progress.gamesPlayed}
                detail="Completed CountMeInTT games"
                accent="green"
              />

              <ProgressCard
                label="Math Language"
                value={`${activeStudent.progress.mathLanguageCompleted} / ${activeStudent.progress.mathLanguageTotal}`}
                detail="Free terms explored"
                accent="yellow"
              />

              <ProgressCard
                label="Badges"
                value={activeStudent.progress.badgesEarned}
                detail="Badges earned"
                accent="purple"
              />
            </div>
          </div>
        </section>

        <section className="px-5 pb-12 sm:pb-16">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Recent activity
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Latest saved results.
                  </h2>
                </div>

                <Link
                  to={`/students/${activeStudent.id}/results`}
                  className="font-black text-blue-600 hover:underline"
                >
                  View all results →
                </Link>
              </div>

              <div className="mt-6 divide-y divide-gray-100">
                {activeStudent.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-gray-950">
                          {activity.title}
                        </h3>

                        {activity.badge && (
                          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-yellow-800">
                            {activity.badge}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {activity.date}
                      </p>
                    </div>

                    <p className="text-lg font-black text-blue-600">
                      {activity.result}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Latest badge
                </p>

                <div className="mt-5 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-2xl font-black text-yellow-800">
                    {activeStudent.latestBadge.icon}
                  </div>

                  <div>
                    <h2 className="text-xl font-black">
                      {activeStudent.latestBadge.name}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {activeStudent.latestBadge.description}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/students/${activeStudent.id}/badges`}
                  className="mt-5 inline-block font-black text-blue-600 hover:underline"
                >
                  View badges →
                </Link>
              </div>

              <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg">
                <p className="text-sm font-black uppercase tracking-wider text-yellow-300">
                  Membership
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {activeStudent.membership.plan}
                </h2>

                {activeStudent.membership.expiryDate ? (
                  <p className="mt-3 text-blue-100">
                    Active until {activeStudent.membership.expiryDate}.
                  </p>
                ) : (
                  <p className="mt-3 text-blue-100">
                    Save a personal best and the latest 10 results.
                  </p>
                )}

                <Link
                  to="/membership"
                  className="mt-6 inline-block rounded-xl bg-yellow-300 px-5 py-3 font-black text-gray-950 transition hover:bg-yellow-200"
                >
                  {activeStudent.membership.plan === "Free Account"
                    ? "Explore Membership"
                    : "Manage Membership"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

