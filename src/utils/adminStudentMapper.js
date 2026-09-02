import {
  getCurrentMembership,
} from "./accessControl";

export function mapSupabaseStudentToAdminStudent(
  data,
) {
  const fullName = [
    data.first_name,
    data.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const currentMembership =
    getCurrentMembership(
      data.student_memberships,
    );

  const results =
    Array.isArray(data.game_results)
      ? data.game_results
      : [];

  const gamesPlayed = results.length;

  const validAccuracyResults =
    results.filter(
      (result) =>
        result.accuracy_percent !== null &&
        result.accuracy_percent !==
          undefined &&
        Number.isFinite(
          Number(
            result.accuracy_percent,
          ),
        ),
    );

  const accuracy =
    validAccuracyResults.length > 0
      ? Math.round(
          validAccuracyResults.reduce(
            (total, result) =>
              total +
              Number(
                result.accuracy_percent,
              ),
            0,
          ) /
            validAccuracyResults.length,
        )
      : 0;

  const activity = results
    .slice(0, 10)
    .map((result) => ({
      id: result.id,

      title:
        result.mode_label ||
        formatGameType(
          result.game_type,
        ),

      detail:
        buildActivityDetail(result),

      date: formatDate(
        result.played_at,
        "Date unavailable",
      ),

      gameType:
        result.game_type,

      isPersonalBest:
        Boolean(
          result.is_personal_best,
        ),
    }));

  return {
    id: data.id,
    parentId: data.account_id,

    name:
      fullName ||
      "Unnamed student",

    displayName:
      data.public_display_name ||
      fullName ||
      "Unnamed student",

    initials:
      getInitials(fullName),

    learningCategory:
      formatLearningCategory(
        data.school_type,
      ),

    level:
      data.current_level ||
      "Level not provided",

    school:
      data.current_school ||
      "No school selected",

    membership:
      currentMembership
        ?.membership_plans?.name ||
      "Free",

    membershipStatus:
      formatStatus(
        currentMembership?.status,
        "Inactive",
      ),

    membershipExpiry:
      formatDate(
        currentMembership?.expires_at,
        "Not applicable",
      ),

    status:
      formatStatus(
        data.profile_status,
        "Pending",
      ),

    joinedDate:
      formatDate(
        data.created_at,
        "Not available",
      ),

    account: data.profiles
      ? {
          id:
            data.profiles.id,

          name:
            data.profiles.full_name ||
            "Account holder",

          email: "",

          phone:
            data.profiles.phone ||
            "Not provided",
        }
      : {
          id: null,
          name:
            "No linked account",
          email: "",
          phone: "",
        },

    gamesPlayed,

    accuracy,

    badges:
      Number(
        data.badge_count || 0,
      ),

    activity,
  };
}

function buildActivityDetail(
  result,
) {
  if (
    result.game_type ===
    "multiplication"
  ) {
    const seconds =
      result.duration_ms !== null &&
      result.duration_ms !==
        undefined
        ? (
            Number(
              result.duration_ms,
            ) / 1000
          ).toFixed(2)
        : null;

    const accuracy =
      result.accuracy_percent !==
        null &&
      result.accuracy_percent !==
        undefined
        ? `${Math.round(
            Number(
              result.accuracy_percent,
            ),
          )}% accuracy`
        : null;

    const correct =
      result.correct_answers !==
        null &&
      result.correct_answers !==
        undefined
        ? `${result.correct_answers} correct`
        : null;

    return [
      seconds
        ? `Completed in ${seconds} seconds`
        : null,

      correct,

      accuracy,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const score =
    result.correct_answers !==
      null &&
    result.correct_answers !==
      undefined &&
    result.max_score !== null &&
    result.max_score !==
      undefined
      ? `${result.correct_answers}/${result.max_score} correct`
      : result.score !== null &&
          result.score !==
            undefined &&
          result.max_score !==
            null &&
          result.max_score !==
            undefined
        ? `${result.score}/${result.max_score}`
        : null;

  const accuracy =
    result.accuracy_percent !==
      null &&
    result.accuracy_percent !==
      undefined
      ? `${Math.round(
          Number(
            result.accuracy_percent,
          ),
        )}% accuracy`
      : null;

  return [
    score,
    accuracy,
  ]
    .filter(Boolean)
    .join(" · ") ||
    "Learning activity completed";
}

function formatGameType(
  gameType,
) {
  if (!gameType) {
    return "Learning activity";
  }

  return String(gameType)
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function getInitials(
  name = "",
) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
}

function formatStatus(
  status,
  fallback = "Pending",
) {
  if (!status) return fallback;

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase()
  );
}

function formatLearningCategory(
  category,
) {
  if (!category) {
    return "No School";
  }

  const normalized =
    category.toLowerCase();

  if (
    normalized === "primary"
  ) {
    return "Primary";
  }

  if (
    normalized === "secondary"
  ) {
    return "Secondary";
  }

  if (
    normalized ===
      "no_school" ||
    normalized ===
      "no school"
  ) {
    return "No School";
  }

  return category;
}

function formatDate(
  dateValue,
  fallback = "Not available",
) {
  if (!dateValue) {
    return fallback;
  }

  return new Date(
    dateValue,
  ).toLocaleDateString(
    "en-TT",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
}


