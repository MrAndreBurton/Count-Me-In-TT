import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";

function getInitials(firstName = "", lastName = "") {
  const firstInitial = firstName
    .trim()
    .charAt(0);

  const lastInitial = lastName
    .trim()
    .charAt(0);

  return (
    `${firstInitial}${lastInitial}`.toUpperCase() ||
    "?"
  );
}

function formatStudent(row) {
  return {
    id: row.id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    displayName:
      row.public_display_name ||
      `${row.first_name || "Student"} ${
        row.last_name
          ?.charAt(0)
          ?.toUpperCase() || ""
      }.`.trim(),
    initials: getInitials(
      row.first_name,
      row.last_name
    ),
    school:
      row.current_school || "School not added",
    level:
      row.current_level || "Level not added",
    academicYear:
      row.academic_year || "Not added",
  };
}

function formatEarnedDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-TT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDuration(milliseconds) {
  const value = Number(milliseconds);

  if (!Number.isFinite(value)) {
    return null;
  }

  const minutes = Math.floor(value / 60000);

  const seconds = Math.floor(
    (value % 60000) / 1000
  );

  const hundredths = Math.floor(
    (value % 1000) / 10
  );

  if (minutes > 0) {
    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}.${hundredths
      .toString()
      .padStart(2, "0")}`;
  }

  return `${seconds}.${hundredths
    .toString()
    .padStart(2, "0")} sec`;
}

function formatGameMode(mode) {
  const labels = {
    "5x5": "5 × 5 Quick",
    "5x12": "5 × 12 Trainer",
    "12x12": "12 × 12 Classic",
    "15x15": "15 × 15 Pro",
  };

  return labels[mode] || mode || null;
}

function BadgeCard({ badge }) {
  const duration = formatDuration(
    badge.metadata?.duration_ms
  );

  const gameMode = formatGameMode(
    badge.metadata?.game_mode
  );

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-yellow-300 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-2xl">
          {badge.icon || "🏅"}
        </div>

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-green-700">
          Earned
        </span>
      </div>

      <h3 className="mt-5 text-xl font-black text-gray-950">
        {badge.name}
      </h3>

      <p className="mt-2 leading-7 text-gray-600">
        {badge.description}
      </p>

      {(gameMode || duration) && (
        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
          {gameMode && (
            <p className="font-bold text-gray-700">
              Game: {gameMode}
            </p>
          )}

          {duration && (
            <p className="mt-1 font-bold text-gray-700">
              Time: {duration}
            </p>
          )}
        </div>
      )}

      <p className="mt-5 text-sm font-bold text-gray-500">
        Earned {formatEarnedDate(badge.earnedAt)}
      </p>
    </article>
  );
}

function LockedBadgeCard({ badge }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-gray-50 p-5 opacity-80">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-200 text-2xl grayscale">
          {badge.icon || "🏅"}
        </div>

        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-black uppercase tracking-wide text-gray-600">
          Locked
        </span>
      </div>

      <h3 className="mt-5 text-xl font-black text-gray-800">
        {badge.name}
      </h3>

      <p className="mt-2 leading-7 text-gray-600">
        {badge.description}
      </p>
    </article>
  );
}

function LoadingBadges() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <h1 className="mt-6 text-2xl font-black">
            Loading badges…
          </h1>

          <p className="mt-3 text-gray-600">
            We are retrieving the student’s
            achievements.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function Badges() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [earnedBadges, setEarnedBadges] =
    useState([]);
  const [allBadges, setAllBadges] = useState([]);

  const [isLoading, setIsLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadBadges() {
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
                pathname: `/students/${studentId}/badges`,
              },
            },
          });

          return;
        }

        const {
          data: studentRow,
          error: studentError,
        } = await supabase
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
          .eq("account_id", user.id)
          .eq("profile_status", "active")
          .maybeSingle();

        if (studentError) {
          throw studentError;
        }

        if (!studentRow) {
          throw new Error(
            "This student profile is unavailable or does not belong to your account."
          );
        }

        const [
          {
            data: badgeDefinitions,
            error: definitionsError,
          },
          {
            data: earnedRows,
            error: earnedError,
          },
        ] = await Promise.all([
          supabase
            .from("badge_definitions")
            .select(
              `
                id,
                badge_key,
                name,
                description,
                icon,
                category,
                requirement_type,
                requirement_value,
                sort_order,
                is_active
              `
            )
            .eq("category", "multiplication")
            .eq("is_active", true)
            .order("sort_order", {
              ascending: true,
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
        ]);

        if (definitionsError) {
          throw definitionsError;
        }

        if (earnedError) {
          throw earnedError;
        }

        const formattedEarned = (
          earnedRows || []
        )
          .map((row) => {
            const definition =
              row.badge_definitions;

            if (!definition) {
              return null;
            }

            return {
              id: row.id,
              badgeId: row.badge_id,
              badgeKey: definition.badge_key,
              name: definition.name,
              description:
                definition.description,
              icon: definition.icon,
              category: definition.category,
              sortOrder:
                definition.sort_order || 0,
              earnedAt: row.earned_at,
              metadata: row.metadata || {},
              gameResultId:
                row.game_result_id,
            };
          })
          .filter(Boolean);

        if (!active) return;

        setStudent(formatStudent(studentRow));
        setAllBadges(badgeDefinitions || []);
        setEarnedBadges(formattedEarned);
      } catch (error) {
        console.error(
          "Badges loading error:",
          error
        );

        if (active) {
          setLoadError(
            error?.message ||
              "The badges could not be loaded."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadBadges();

    return () => {
      active = false;
    };
  }, [navigate, studentId]);

  const earnedBadgeIds = useMemo(
    () =>
      new Set(
        earnedBadges.map(
          (badge) => badge.badgeId
        )
      ),
    [earnedBadges]
  );

  const lockedBadges = useMemo(
    () =>
      allBadges.filter(
        (badge) =>
          !earnedBadgeIds.has(badge.id)
      ),
    [allBadges, earnedBadgeIds]
  );

  const latestBadge =
    earnedBadges[0] || null;

  const completionPercent =
    allBadges.length > 0
      ? Math.round(
          (earnedBadges.length /
            allBadges.length) *
            100
        )
      : 0;

  if (isLoading) {
    return <LoadingBadges />;
  }

  if (loadError || !student) {
    return (
      <div className="platform-page-bg min-h-screen text-gray-950">
        <SiteHeader />

        <main className="px-5 py-16">
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-black text-red-700">
              !
            </div>

            <h1 className="mt-5 text-3xl font-black">
              Badges unavailable.
            </h1>

            <p className="mt-4 leading-7 text-gray-600">
              {loadError}
            </p>

            <Link
              to="/dashboard"
              className="mt-7 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </main>

        <SiteFooter />
      </div>
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
                  Student achievements
                </p>

                <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
                  {student.displayName}’s Badges
                </h1>

                <p className="mt-3 text-lg text-gray-600">
                  Track multiplication milestones,
                  personal bests and completed
                  challenges.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={`/students/${student.id}`}
                className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
              >
                View Profile
              </Link>

              <Link
                to="/games/multiplication"
                className="rounded-xl bg-blue-600 px-5 py-3 text-center font-black text-white shadow transition hover:bg-blue-700"
              >
                Play Multiplication
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                  Badges earned
                </p>

                <p className="mt-4 text-4xl font-black">
                  {earnedBadges.length}
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-600">
                  Out of {allBadges.length} available
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-green-700">
                  Completion
                </p>

                <p className="mt-4 text-4xl font-black">
                  {completionPercent}%
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${completionPercent}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                  Still to earn
                </p>

                <p className="mt-4 text-4xl font-black">
                  {lockedBadges.length}
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-600">
                  Keep playing to unlock more
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase tracking-wide text-yellow-800">
                  Latest badge
                </p>

                <p className="mt-4 text-2xl font-black">
                  {latestBadge
                    ? `${latestBadge.icon} ${latestBadge.name}`
                    : "None yet"}
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-600">
                  {latestBadge
                    ? formatEarnedDate(
                        latestBadge.earnedAt
                      )
                    : "Complete a game to begin"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-yellow-50 px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Earned badges
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Achievements unlocked.
              </h2>
            </div>

            {earnedBadges.length > 0 ? (
              <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {earnedBadges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-dashed border-yellow-300 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100 text-3xl">
                  🏅
                </div>

                <h3 className="mt-5 text-2xl font-black">
                  No badges earned yet.
                </h3>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                  Complete a verified multiplication
                  game to begin earning
                  CountMeInTT badges.
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

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Badge challenges
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Achievements still to unlock.
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-gray-600">
                Each badge can be earned once by
                completing its multiplication
                challenge.
              </p>
            </div>

            {lockedBadges.length > 0 ? (
              <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {lockedBadges.map((badge) => (
                  <LockedBadgeCard
                    key={badge.id}
                    badge={badge}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                  🎉
                </div>

                <h3 className="mt-4 text-2xl font-black">
                  Every multiplication badge has
                  been earned!
                </h3>

                <p className="mt-3 text-gray-600">
                  Keep playing to improve personal
                  bests and prepare for future badge
                  challenges.
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

