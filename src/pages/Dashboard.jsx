import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";

const CHILD_LIMIT = 5;

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

  return (
    formatScore(result.score, result.max_score) ||
    "Result saved"
  );
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

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const playedDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const differenceInDays = Math.round(
    (today.getTime() - playedDate.getTime()) /
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

function createProfileSummary(
  link,
  studentRow,
  resultRows = [],
  badgeRows = []
) {
  const verifiedResults = resultRows
    .filter(
      (result) => result.verification_status === "verified"
    )
    .sort(
      (a, b) =>
        new Date(b.played_at).getTime() -
        new Date(a.played_at).getTime()
    );

  const multiplicationResults = verifiedResults.filter(
    (result) =>
      result.game_type === "multiplication" &&
      result.duration_ms !== null &&
      result.duration_ms !== undefined
  );

  const bestMultiplicationResult =
    multiplicationResults.length > 0
      ? [...multiplicationResults].sort(
          (a, b) =>
            Number(a.duration_ms) -
            Number(b.duration_ms)
        )[0]
      : null;

  const mathLanguageRounds = verifiedResults.filter(
    (result) => result.game_type === "math_language"
  ).length;

  const sortedBadges = [...badgeRows].sort(
    (a, b) =>
      new Date(b.earned_at).getTime() -
      new Date(a.earned_at).getTime()
  );

  const latestBadgeRow = sortedBadges[0] || null;
  const latestBadgeDefinition =
    latestBadgeRow?.badge_definitions || null;

  const latestBadge = latestBadgeDefinition
    ? {
        id: latestBadgeRow.id,
        badgeId: latestBadgeRow.badge_id,
        badgeKey: latestBadgeDefinition.badge_key,
        icon: latestBadgeDefinition.icon || "🏅",
        name: latestBadgeDefinition.name,
        description: latestBadgeDefinition.description,
        earnedAt: latestBadgeRow.earned_at,
      }
    : null;

  const recentActivity = verifiedResults
    .slice(0, 3)
    .map((result) => ({
      id: result.id,
      title:
        result.mode_label ||
        result.game_mode ||
        formatGameType(result.game_type),
      gameType: formatGameType(result.game_type),
      result: formatResultValue(result),
      date: formatRelativeDate(result.played_at),
      isPersonalBest: Boolean(result.is_personal_best),
    }));

  return {
    id: studentRow.id,

    firstName: studentRow.first_name || "",
    lastName: studentRow.last_name || "",

    displayName:
      studentRow.public_display_name ||
      `${studentRow.first_name || "Player"} ${
        studentRow.last_name?.charAt(0)?.toUpperCase() || ""
      }.`.trim(),

    initials: getInitials(
      studentRow.first_name,
      studentRow.last_name
    ),

    profileType: studentRow.profile_type,
    profileStatus: studentRow.profile_status,

    school:
      studentRow.current_school || "School not added",

    level:
      studentRow.current_level || "Level not added",

    academicYear:
      studentRow.academic_year || "Not added",

    relationshipRole: link.relationship_role,
    canView: Boolean(link.can_view),
    canEdit: Boolean(link.can_edit),
    canManageMembership: Boolean(
      link.can_manage_membership
    ),
    canPlay: Boolean(link.can_play),

    progress: {
      personalBest: bestMultiplicationResult
        ? formatDuration(
            bestMultiplicationResult.duration_ms
          )
        : "—",

      personalBestMode: bestMultiplicationResult
        ? bestMultiplicationResult.mode_label ||
          bestMultiplicationResult.game_mode
        : "No verified multiplication result yet",

      gamesPlayed: verifiedResults.length,
      mathLanguageCompleted: mathLanguageRounds,
      badgesEarned: sortedBadges.length,
    },

    recentActivity,
    latestResult: verifiedResults[0] || null,
    latestBadge,
  };
}

function ProfileCard({
  profile,
  selected,
  onSelect,
  isOwnProfile = false,
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(profile.id)}
      className={[
        "relative rounded-2xl bg-white p-5 text-left shadow-sm transition duration-200",
        selected
          ? "border-2 border-blue-600 ring-4 ring-blue-100"
          : "border border-gray-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={[
            "flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black",
            isOwnProfile
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-blue-700",
          ].join(" ")}
        >
          {profile.initials}
        </div>

        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
            isOwnProfile
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-yellow-800",
          ].join(" ")}
        >
          {isOwnProfile
            ? profile.relationshipRole === "student"
              ? "Student Profile"
              : "Parent Profile"
            : "Child"}
        </span>
      </div>

      <h3 className="mt-4 text-xl font-black text-gray-950">
        {profile.displayName}
      </h3>

      {isOwnProfile ? (
        <>
          <p className="mt-1 font-semibold text-gray-600">
            My playable learning profile
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Results from games you play while logged in are saved
            here.
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 font-semibold text-gray-600">
            {profile.level}
          </p>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            {profile.school}
          </p>
        </>
      )}

      <p className="mt-4 font-black text-blue-600">
        {selected ? "Currently viewing" : "View profile"}
      </p>
    </button>
  );
}

function ProgressCard({
  label,
  value,
  detail,
  accent = "blue",
}) {
  const accentClasses = {
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
          accentClasses[accent] || accentClasses.blue,
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

function LoadingDashboard() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <h1 className="mt-6 text-2xl font-black">
            Loading your dashboard…
          </h1>

          <p className="mt-3 text-gray-600">
            We are retrieving your profiles, saved results and badges.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function DashboardError({ message }) {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-black text-red-700">
            !
          </div>

          <h1 className="mt-5 text-3xl font-black">
            We could not load your dashboard.
          </h1>

          <p className="mt-4 leading-7 text-gray-600">
            {message}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-7 rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [accountProfile, setAccountProfile] =
    useState(null);

  const [linkedProfiles, setLinkedProfiles] =
    useState([]);

  const [activeProfileId, setActiveProfileId] =
    useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
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
                pathname: "/dashboard",
              },
            },
          });

          return;
        }

        const [
          { data: profileData, error: profileError },
          { data: linkRows, error: linksError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              `
                id,
                full_name,
                account_type,
                phone,
                communication_preference,
                account_status
              `
            )
            .eq("id", user.id)
            .single(),

          supabase
            .from("account_student_links")
            .select(
              `
                id,
                account_id,
                student_id,
                relationship_role,
                can_view,
                can_edit,
                can_manage_membership,
                can_play,
                created_at
              `
            )
            .eq("account_id", user.id)
            .eq("can_view", true)
            .order("created_at", {
              ascending: true,
            }),
        ]);

        if (profileError) {
          throw profileError;
        }

        if (linksError) {
          throw linksError;
        }

        const links = linkRows || [];
        const studentIds = links.map(
          (link) => link.student_id
        );

        let studentRows = [];
        let resultRows = [];
        let badgeRows = [];

        if (studentIds.length > 0) {
          const [
            { data: studentsData, error: studentsError },
            { data: resultsData, error: resultsError },
            { data: badgesData, error: badgesError },
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
                  profile_type,
                  created_at,
                  updated_at
                `
              )
              .in("id", studentIds)
              .eq("profile_status", "active"),

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
              .in("student_id", studentIds)
              .eq("verification_status", "verified")
              .order("played_at", {
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
              .eq("account_id", user.id)
              .in("student_id", studentIds)
              .order("earned_at", {
                ascending: false,
              }),
          ]);

          if (studentsError) {
            throw studentsError;
          }

          if (resultsError) {
            throw resultsError;
          }

          if (badgesError) {
            throw badgesError;
          }

          studentRows = studentsData || [];
          resultRows = resultsData || [];
          badgeRows = badgesData || [];
        }

        const summaries = links
          .map((link) => {
            const studentRow = studentRows.find(
              (student) =>
                String(student.id) ===
                String(link.student_id)
            );

            if (!studentRow) {
              return null;
            }

            const matchingResults = resultRows.filter(
              (result) =>
                String(result.student_id) ===
                String(studentRow.id)
            );

            const matchingBadges = badgeRows.filter(
              (badge) =>
                String(badge.student_id) ===
                String(studentRow.id)
            );

            return createProfileSummary(
              link,
              studentRow,
              matchingResults,
              matchingBadges
            );
          })
          .filter(Boolean);

        if (!active) return;

        setAccountProfile(profileData);
        setLinkedProfiles(summaries);

        setActiveProfileId((currentId) => {
          const currentStillExists = summaries.some(
            (profile) => profile.id === currentId
          );

          if (currentStillExists) {
            return currentId;
          }

          const ownProfile = summaries.find(
            (profile) =>
              profile.relationshipRole === "self" ||
              profile.relationshipRole === "student"
          );

          return ownProfile?.id || summaries[0]?.id || null;
        });
      } catch (error) {
        console.error("Dashboard loading error:", error);

        if (active) {
          setLoadError(
            error?.message ||
              "Your dashboard could not be loaded."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [navigate]);

  const ownProfile = useMemo(
    () =>
      linkedProfiles.find(
        (profile) =>
          profile.relationshipRole === "self" ||
          profile.relationshipRole === "student"
      ) || null,
    [linkedProfiles]
  );

  const childProfiles = useMemo(
    () =>
      linkedProfiles.filter(
        (profile) =>
          profile.relationshipRole === "parent"
      ),
    [linkedProfiles]
  );

  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;

    return (
      linkedProfiles.find(
        (profile) => profile.id === activeProfileId
      ) ||
      ownProfile ||
      linkedProfiles[0] ||
      null
    );
  }, [linkedProfiles, activeProfileId, ownProfile]);

  const isParentAccount =
    accountProfile?.account_type === "parent";

  const activeIsOwnProfile =
    activeProfile?.relationshipRole === "self" ||
    activeProfile?.relationshipRole === "student";

  const accountFirstName =
    accountProfile?.full_name
      ?.trim()
      .split(/\s+/)[0] || "there";

  if (isLoading) {
    return <LoadingDashboard />;
  }

  if (loadError) {
    return <DashboardError message={loadError} />;
  }

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
                {isParentAccount
                  ? `Good evening, ${accountFirstName}`
                  : `Welcome back, ${accountFirstName}`}{" "}
                <span aria-hidden="true">👋</span>
              </h1>

              <p className="mt-3 max-w-3xl text-lg leading-8 text-gray-600">
                {isParentAccount
                  ? "Manage your children and practise using your own learning profile."
                  : "Play, build your personal best and review your progress."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {isParentAccount &&
                childProfiles.length < CHILD_LIMIT && (
                  <Link
                    to="/students/add"
                    className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
                  >
                    Add Student
                  </Link>
                )}

              {ownProfile?.canPlay && (
  <>
    <Link
      to="/games/multiplication"
      className="rounded-xl bg-blue-600 px-5 py-3 text-center font-black text-white shadow transition hover:bg-blue-700"
    >
      {isParentAccount
        ? `Play as ${ownProfile.displayName}`
        : "Play Multiplication"}
    </Link>

    {!isParentAccount && (
      <Link
        to="/math-language/play"
        className="rounded-xl bg-yellow-400 px-5 py-3 text-center font-black text-gray-950 shadow transition hover:bg-yellow-300"
      >
        Play Math Language
      </Link>
    )}
  </>
)}
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            {ownProfile && isParentAccount && (
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  My Profile
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  My learning profile.
                </h2>

                <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <ProfileCard
                    profile={ownProfile}
                    selected={
                      ownProfile.id === activeProfileId
                    }
                    onSelect={setActiveProfileId}
                    isOwnProfile
                  />
                </div>
              </div>
            )}

            {isParentAccount && (
              <div className={ownProfile ? "mt-12" : ""}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                      My Children
                    </p>

                    <h2 className="mt-2 text-3xl font-black">
                      Linked student profiles.
                    </h2>
                  </div>

                  <div className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-yellow-800">
                    {childProfiles.length} of {CHILD_LIMIT} used
                  </div>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {childProfiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      selected={
                        profile.id === activeProfileId
                      }
                      onSelect={setActiveProfileId}
                    />
                  ))}

                  {childProfiles.length < CHILD_LIMIT ? (
                    <Link
                      to="/students/add"
                      className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white/80 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-3xl font-black text-blue-700">
                        +
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        Add another student
                      </h3>

                      <p className="mt-2 max-w-xs text-sm leading-6 text-gray-600">
                        {childProfiles.length} of {CHILD_LIMIT} child
                        profiles currently used.
                      </p>
                    </Link>
                  ) : (
                    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-200 text-2xl">
                        ✓
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        Family limit reached
                      </h3>

                      <p className="mt-2 max-w-xs text-sm leading-6 text-gray-600">
                        This account currently has five child
                        profiles.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {activeProfile && (
          <>
            <section className="bg-yellow-50 px-5 py-12 sm:py-16">
              <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.75fr]">
                <div className="rounded-2xl border border-yellow-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-start gap-4">
                    <div
                      className={[
                        "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-blue-700",
                        activeIsOwnProfile
                          ? "bg-blue-100"
                          : "bg-yellow-100",
                      ].join(" ")}
                    >
                      {activeProfile.initials}
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                        {activeIsOwnProfile
                          ? "My Profile"
                          : "Selected Child"}
                      </p>

                      <h2 className="mt-1 text-3xl font-black">
                        {activeProfile.displayName}
                      </h2>

                      {activeIsOwnProfile ? (
                        <p className="mt-2 text-gray-600">
                          Your personal CountMeInTT learning and
                          practice profile.
                        </p>
                      ) : (
                        <>
                          <p className="mt-2 font-semibold text-gray-700">
                            {activeProfile.level}
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {activeProfile.school}
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-500">
                            Academic Year{" "}
                            {activeProfile.academicYear}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {activeProfile.canPlay && (
  <Link
    to="/games/multiplication"
    className="rounded-xl bg-blue-600 px-5 py-3 text-center font-black text-white transition hover:bg-blue-700"
  >
    {isParentAccount
      ? `Play as ${activeProfile.displayName}`
      : "Play Multiplication"}
  </Link>
)}

{!isParentAccount && activeProfile.canPlay && (
  <Link
    to="/math-language/play"
    className="rounded-xl bg-yellow-400 px-5 py-3 text-center font-black text-gray-950 transition hover:bg-yellow-300"
  >
    Play Math Language
  </Link>
)}

                    <Link
                      to={`/students/${activeProfile.id}`}
                      className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
                    >
                      View Profile
                    </Link>

                    {activeProfile.canEdit &&
                      !activeIsOwnProfile && (
                        <Link
                          to={`/students/${activeProfile.id}/edit`}
                          className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
                        >
                          Edit Profile
                        </Link>
                      )}

                    <Link
                      to={`/students/${activeProfile.id}/results`}
                      className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
                    >
                      View Results
                    </Link>

                    {activeProfile.canManageMembership && (
                      <Link
                        to="/membership"
                        className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
                      >
                        Manage Membership
                      </Link>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-yellow-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Profile access
                  </p>

                  {activeIsOwnProfile ? (
  <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
    <h3 className="font-black text-gray-950">
      {isParentAccount
        ? "Playable profile"
        : "Your learning profile"}
    </h3>

    <p className="mt-2 text-sm leading-6 text-gray-600">
      {isParentAccount
        ? "Results from games you play while logged in will be saved to this profile."
        : "Your game results, personal bests and badges are saved here automatically."}
    </p>
  </div>
) : (
                    <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                      <h3 className="font-black text-gray-950">
                        Parent-managed profile
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        You can view and manage this child’s
                        information, but gameplay cannot be saved
                        under the child from the parent login.
                      </p>

                      <p className="mt-3 text-sm font-black text-blue-600">
                        Student login access can be managed from the student profile.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="px-5 py-12 sm:py-16">
              <div className="mx-auto max-w-7xl">
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Quick Progress
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Verified CountMeInTT activity.
                </h2>

                <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <ProgressCard
                    label="Personal Best"
                    value={
                      activeProfile.progress.personalBest
                    }
                    detail={
                      activeProfile.progress
                        .personalBestMode
                    }
                    accent="blue"
                  />

                  <ProgressCard
                    label="Games Played"
                    value={
                      activeProfile.progress.gamesPlayed
                    }
                    detail="Verified results saved"
                    accent="green"
                  />

                  <ProgressCard
                    label="Math Language"
                    value={
                      activeProfile.progress
                        .mathLanguageCompleted
                    }
                    detail="Verified rounds completed"
                    accent="yellow"
                  />

                  <ProgressCard
                    label="Badges"
                    value={
                      activeProfile.progress.badgesEarned
                    }
                    detail="Achievements earned"
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
                        Recent Activity
                      </p>

                      <h2 className="mt-2 text-2xl font-black">
                        Latest verified results.
                      </h2>
                    </div>

                    <Link
                      to={`/students/${activeProfile.id}/results`}
                      className="font-black text-blue-600 hover:underline"
                    >
                      View all results →
                    </Link>
                  </div>

                  {activeProfile.recentActivity.length > 0 ? (
                    <div className="mt-6 divide-y divide-gray-100">
                      {activeProfile.recentActivity.map(
                        (activity) => (
                          <div
                            key={activity.id}
                            className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-black text-gray-950">
                                  {activity.title}
                                </h3>

                                {activity.isPersonalBest && (
                                  <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-yellow-800">
                                    Personal Best
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-sm text-gray-500">
                                {activity.gameType} ·{" "}
                                {activity.date}
                              </p>
                            </div>

                            <p className="text-lg font-black text-blue-600">
                              {activity.result}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-7 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-2xl">
                        🎮
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        No verified results yet.
                      </h3>

                      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600">
                        Results will appear after this profile
                        completes a connected CountMeInTT game.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid gap-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                          Latest Badge
                        </p>

                        <h2 className="mt-2 text-2xl font-black">
                          Recent achievement.
                        </h2>
                      </div>

                      <Link
                        to={`/students/${activeProfile.id}/badges`}
                        className="shrink-0 font-black text-blue-600 hover:underline"
                      >
                        View all →
                      </Link>
                    </div>

                    {activeProfile.latestBadge ? (
                      <div className="mt-6 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-2xl">
                          {activeProfile.latestBadge.icon}
                        </div>

                        <div>
                          <h3 className="text-xl font-black text-gray-950">
                            {activeProfile.latestBadge.name}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {activeProfile.latestBadge.description}
                          </p>

                          <p className="mt-3 text-sm font-bold text-gray-500">
                            Earned{" "}
                            {formatRelativeDate(
                              activeProfile.latestBadge.earnedAt
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-2xl">
                          🏅
                        </div>

                        <h3 className="mt-4 text-xl font-black">
                          No badges earned yet.
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          Complete a verified multiplication game
                          to begin earning achievements.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg">
                    <p className="text-sm font-black uppercase tracking-wider text-yellow-300">
                      Membership
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Free Account
                    </h2>

                    <p className="mt-3 text-blue-100">
                      Save a personal best and retain the latest 10
                      results.
                    </p>

                    {isParentAccount ? (
  <Link
    to="/membership"
    className="mt-6 inline-block rounded-xl bg-yellow-300 px-5 py-3 font-black text-gray-950 transition hover:bg-yellow-200"
  >
    Explore Membership
  </Link>
) : (
  <p className="mt-5 rounded-xl bg-blue-500/40 p-4 text-sm font-semibold text-blue-50">
    Ask your parent or guardian about membership options.
  </p>
)}

                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}


