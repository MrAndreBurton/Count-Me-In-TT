import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";
import {
  formatMembershipDate,
  getCurrentStudentMembership,
} from "../lib/membership";

function getInitials(firstName = "", lastName = "") {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName.trim().charAt(0);

  return `${firstInitial}${lastInitial}`.toUpperCase() || "?";
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

  return score || "Result saved";
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

  return labels[gameType] || "CountMeInTT Activity";
}

function formatRelativeDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const resultDateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const differenceInDays = Math.round(
    (todayStart.getTime() - resultDateStart.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (differenceInDays === 0) return "Today";
  if (differenceInDays === 1) return "Yesterday";

  return new Intl.DateTimeFormat("en-TT", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== now.getFullYear()
        ? "numeric"
        : undefined,
  }).format(date);
}

function formatSchoolType(schoolType = "") {
  const labels = {
    primary: "Primary School",
    secondary: "Secondary School",
    homeschool: "Homeschool",
    not_enrolled: "Not currently enrolled",
  };

  return labels[schoolType] || "Not added";
}

function StatCard({
  label,
  value,
  detail,
  tone = "blue",
}) {
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
          toneClasses[tone] || toneClasses.blue,
        ].join(" ")}
      >
        {label}
      </span>

      <p className="mt-4 text-3xl font-black text-gray-950">
        {value}
      </p>

      <p className="mt-2 text-sm font-semibold text-gray-600">
        {detail}
      </p>
    </div>
  );
}

function LoadingProfile() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <h1 className="mt-6 text-2xl font-black">
            Loading student profile…
          </h1>

          <p className="mt-3 text-gray-600">
            We are retrieving the student’s profile, progress,
            badges and academic history.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ProfileError({ message }) {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-black text-red-700">
            !
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Student profile unavailable.
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

export default function StudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [schoolHistory, setSchoolHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStudentProfile() {
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
                pathname: `/students/${studentId}`,
              },
            },
          });

          return;
        }

        const [
  { data: studentData, error: studentError },
  { data: resultRows, error: resultsError },
  { data: historyRows, error: historyError },
  { data: badgeRows, error: badgesError },
  { data: accessLink, error: accessError },
  membershipOutcome,
] = await Promise.all([

          supabase
            .from("student_profiles")
            .select(
              `
                id,
                account_id,
                first_name,
                last_name,
                public_display_name,
                avatar_key,
                school_type,
                current_school,
                current_level,
                academic_year,
                school_visible,
                profile_status,
                student_account_id,
                login_enabled,
                created_at,
                updated_at
              `
            )
            .eq("id", studentId)
            .eq("profile_status", "active")
            .maybeSingle(),

          supabase
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
                verification_status,
                is_personal_best,
                played_at
              `
            )
            .eq("student_id", studentId)
            .eq("verification_status", "verified")
            .order("played_at", {
              ascending: false,
            }),

          supabase
            .from("student_school_history")
            .select(
              `
                id,
                student_id,
                account_id,
                academic_year,
                school_type,
                school_name,
                school_level,
                is_current,
                started_at,
                ended_at,
                created_at,
                updated_at
              `
            )
            .eq("student_id", studentId)
            .order("academic_year", {
              ascending: false,
            }),

          supabase
            .from("student_badges")
            .select(
              `
                id,
                student_id,
                account_id,
                badge_id,
                game_result_id,
                earned_at,
                metadata,
                badge_definitions (
                  id,
                  badge_key,
                  name,
                  description,
                  icon,
                  category,
                  sort_order
                )
              `
            )
            .eq("student_id", studentId)
            .eq("account_id", user.id)
            .order("earned_at", {
              ascending: false,
            }),

supabase
  .from("account_student_links")
  .select(
    `
      relationship_role,
      can_view,
      can_edit
    `
  )
  .eq("account_id", user.id)
  .eq("student_id", studentId)
  .maybeSingle(),

getCurrentStudentMembership(studentId),
        ]);

        if (studentError) {
          throw studentError;
        }

        if (!studentData) {
          throw new Error(
            "This student profile does not exist or you do not have permission to view it."
          );
        }

        if (resultsError) {
          throw resultsError;
        }

        if (historyError) {
          throw historyError;
        }

        if (badgesError) {
          throw badgesError;
        }

if (accessError) {
  throw accessError;
}

if (!accessLink?.can_view) {
  throw new Error(
    "You do not have permission to view this student profile."
  );
}

        const formattedBadges = (badgeRows || [])
          .map((row) => {
            const definition = row.badge_definitions;

            if (!definition) {
              return null;
            }

            return {
              id: row.id,
              badgeId: row.badge_id,
              badgeKey: definition.badge_key,
              icon: definition.icon || "🏅",
              name: definition.name,
              description: definition.description,
              earnedAt: row.earned_at,
              metadata: row.metadata || {},
            };
          })
          .filter(Boolean);

        if (!active) return;

        setStudent({
          id: studentData.id,
          accountId: studentData.account_id,

canEdit: Boolean(accessLink?.can_edit),

relationshipRole:
  accessLink?.relationship_role || "",

          studentAccountId:
            studentData.student_account_id || null,

          loginEnabled:
            Boolean(studentData.login_enabled),



          firstName: studentData.first_name || "",
          lastName: studentData.last_name || "",

          displayName:
            studentData.public_display_name ||
            `${studentData.first_name || "Student"} ${
              studentData.last_name
                ?.charAt(0)
                ?.toUpperCase() || ""
            }.`.trim(),

          initials: getInitials(
            studentData.first_name,
            studentData.last_name
          ),

          schoolType: studentData.school_type || "",
          school:
            studentData.current_school || "School not added",
          level:
            studentData.current_level || "Level not added",
          academicYear:
            studentData.academic_year || "Not added",
          schoolVisible: Boolean(studentData.school_visible),
          profileStatus: studentData.profile_status,

          membership: {
  plan:
    membershipOutcome?.plan?.name ||
    "Free Account",

  planKey:
    membershipOutcome?.plan?.key ||
    "free",

  isPaid:
    Boolean(
      membershipOutcome?.plan?.isPaid
    ),

  status:
    membershipOutcome?.status ||
    "active",

  startsAt:
    membershipOutcome?.startsAt ||
    null,

  expiresAt:
    membershipOutcome?.expiresAt ||
    null,

  entitlements:
    membershipOutcome?.plan?.entitlements ||
    {},
},


          badges: formattedBadges,
          badgesEarned: formattedBadges.length,
        });

        setResults(resultRows || []);
        setSchoolHistory(historyRows || []);
      } catch (error) {
        console.error(
          "Student profile loading error:",
          error
        );

        if (active) {
          setLoadError(
            error?.message ||
              "The student profile could not be loaded."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadStudentProfile();

    return () => {
      active = false;
    };
  }, [navigate, studentId]);

  const multiplicationResults = results.filter(
    (result) =>
      result.game_type === "multiplication" &&
      result.duration_ms !== null &&
      result.duration_ms !== undefined
  );

  const bestMultiplicationResult =
    multiplicationResults.length > 0
      ? [...multiplicationResults].sort(
          (a, b) =>
            Number(a.duration_ms) - Number(b.duration_ms)
        )[0]
      : null;

  const mathLanguageRounds = results.filter(
    (result) => result.game_type === "math_language"
  ).length;

  const recentResults = results.slice(0, 3);

  if (isLoading) {
    return <LoadingProfile />;
  }

  if (loadError || !student) {
    return (
      <ProfileError
        message={
          loadError ||
          "This student profile could not be found."
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

                <p className="mt-1 text-gray-600">
                  {student.school}
                </p>

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

             {student.canEdit && (
  <Link
    to={`/students/${student.id}/edit`}
    className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
  >
    Edit Profile
  </Link>
)}
              {student.relationshipRole === "parent" && (
  <Link
    to={`/students/${student.id}/login-setup`}
    className="rounded-xl border border-purple-300 bg-purple-50 px-5 py-3 text-center font-black text-purple-700 transition hover:bg-purple-100"
  >
    {student.studentAccountId
      ? "Manage Student Login"
      : "Create Student Login"}
  </Link>
)}



              <Link
                to={`/students/${student.id}/results`}
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
              >
                View Results
              </Link>

              <Link
                to="/dashboard"
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
              >
                Dashboard
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

              <p className="mt-3 max-w-3xl leading-7 text-gray-600">
                These figures are calculated from verified
                CountMeInTT results.
              </p>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Personal Best"
                value={
                  bestMultiplicationResult
                    ? formatDuration(
                        bestMultiplicationResult.duration_ms
                      )
                    : "—"
                }
                detail={
                  bestMultiplicationResult
                    ? bestMultiplicationResult.mode_label ||
                      bestMultiplicationResult.game_mode
                    : "No verified multiplication result yet"
                }
                tone="blue"
              />

              <StatCard
                label="Games Played"
                value={results.length}
                detail="Verified results saved"
                tone="green"
              />

              <StatCard
                label="Math Language"
                value={mathLanguageRounds}
                detail="Verified rounds completed"
                tone="yellow"
              />

              <StatCard
                label="Badges"
                value={student.badgesEarned}
                detail="Achievements earned"
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
                    School Type
                  </dt>

                  <dd className="mt-2 font-black text-gray-950">
                    {formatSchoolType(student.schoolType)}
                  </dd>
                </div>

                <div className="rounded-xl border border-gray-200 p-5 sm:col-span-2">
                  <dt className="text-sm font-black uppercase tracking-wide text-gray-500">
                    Public school visibility
                  </dt>

                  <dd className="mt-2 font-black text-gray-950">
                    {student.schoolVisible ? "Visible" : "Hidden"}
                  </dd>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {student.schoolVisible
                      ? "The school may appear beside eligible public leaderboard results."
                      : "The school remains hidden on public leaderboard results."}
                  </p>
                </div>
              </dl>

              {student.canEdit && (
  <Link
    to={`/students/${student.id}/edit`}
    className="mt-7 inline-block font-black text-blue-600 hover:underline"
  >
    Update academic information →
  </Link>
)}


            </div>

           <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg sm:p-8">
  <p className="text-sm font-black uppercase tracking-wider text-yellow-300">
    Membership
  </p>

  <h2 className="mt-2 text-3xl font-black">
    {student.membership.plan}
  </h2>

  <p className="mt-3 font-semibold text-blue-100">
    Status:{" "}
    {student.membership.status
      ? student.membership.status
          .charAt(0)
          .toUpperCase() +
        student.membership.status.slice(1)
      : "Active"}
  </p>

  {student.membership.expiresAt ? (
    <p className="mt-2 text-blue-100">
      Expires:{" "}
      {formatMembershipDate(
        student.membership.expiresAt
      )}
    </p>
  ) : (
    <p className="mt-2 text-blue-100">
      No expiry date.
    </p>
  )}

  <p className="mt-3 text-blue-100">
    {student.membership.isPaid
      ? "Full CountMeInTT membership access is active for this student."
      : "Free access includes saved progress and the latest 10 results."}
  </p>

  <Link
    to="/membership"
    className="mt-7 inline-block rounded-xl bg-yellow-300 px-5 py-3 font-black text-gray-950 transition hover:bg-yellow-200"
  >
    {student.membership.isPaid
      ? "View Membership"
      : "Explore Membership"}
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
                    Latest verified activity.
                  </h2>
                </div>

                <Link
                  to={`/students/${student.id}/results`}
                  className="font-black text-blue-600 hover:underline"
                >
                  View all results →
                </Link>
              </div>

              {recentResults.length > 0 ? (
                <div className="mt-6 divide-y divide-gray-100">
                  {recentResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-gray-950">
                            {result.mode_label ||
                              result.game_mode ||
                              formatGameType(result.game_type)}
                          </h3>

                          {result.is_personal_best && (
                            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-yellow-800">
                              Personal Best
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {formatGameType(result.game_type)} ·{" "}
                          {formatRelativeDate(result.played_at)}
                        </p>
                      </div>

                      <p className="text-lg font-black text-blue-600">
                        {formatResultValue(result)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-2xl">
                    🎮
                  </div>

                  <h3 className="mt-5 text-xl font-black">
                    No verified results yet.
                  </h3>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
                    Results will appear after the student completes a
                    connected CountMeInTT game.
                  </p>
                </div>
              )}
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

              {student.badges.length > 0 ? (
                <div className="mt-6 grid gap-4">
                  {student.badges
                    .slice(0, 3)
                    .map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-start gap-4 rounded-xl border border-gray-200 p-4"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-xl">
                          {badge.icon}
                        </div>

                        <div>
                          <h3 className="font-black text-gray-950">
                            {badge.name}
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-gray-600">
                            {badge.description}
                          </p>

                          <p className="mt-2 text-xs font-bold text-gray-500">
                            Earned{" "}
                            {formatRelativeDate(
                              badge.earnedAt
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-xl">
                    🏅
                  </div>

                  <h3 className="mt-4 font-black text-gray-950">
                    No badges earned yet.
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Complete a verified multiplication game to begin
                    earning achievements.
                  </p>
                </div>
              )}
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

              {student.canEdit && (
  <Link
    to={`/students/${student.id}/edit`}
    className="font-black text-blue-600 hover:underline"
  >
    Update current record →
  </Link>
)}


            </div>

            {schoolHistory.length > 0 ? (
              <div className="mt-7 grid gap-4">
                {schoolHistory.map((record) => (
                  <div
                    key={record.id}
                    className={[
                      "grid gap-4 rounded-xl border p-5 sm:grid-cols-[0.7fr_1.3fr_0.8fr_auto] sm:items-center",
                      record.is_current
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200 bg-white",
                    ].join(" ")}
                  >
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-gray-500">
                        Academic Year
                      </p>

                      <p className="mt-1 font-black text-gray-950">
                        {record.academic_year}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-gray-500">
                        School
                      </p>

                      <p className="mt-1 font-black text-gray-950">
                        {record.school_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-gray-500">
                        Level
                      </p>

                      <p className="mt-1 font-black text-gray-950">
                        {record.school_level}
                      </p>
                    </div>

                    {record.is_current && (
                      <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <h3 className="font-black">
                  No academic history recorded.
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  School-history records will appear after academic
                  information is saved.
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


