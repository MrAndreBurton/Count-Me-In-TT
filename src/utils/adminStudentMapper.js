import {
  getCurrentMembership,
} from "./accessControl";

export function mapSupabaseStudentToAdminStudent(data) {
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

  return {
    id: data.id,
    parentId: data.account_id,

    name:
      fullName || "Unnamed student",

    displayName:
      data.public_display_name ||
      fullName ||
      "Unnamed student",

    initials: getInitials(fullName),

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

    status: formatStatus(
      data.profile_status,
      "Pending",
    ),

    joinedDate: formatDate(
      data.created_at,
      "Not available",
    ),

    parent: data.profiles
      ? {
          id: data.profiles.id,
          name:
            data.profiles.full_name ||
            "Parent account",
          email: "",
          phone:
            data.profiles.phone ||
            "Not provided",
          relationship: "Parent",
        }
      : {
          id: null,
          name: "No parent linked",
          email: "",
          phone: "",
          relationship: "",
        },

    gamesPlayed: 0,
    streak: 0,
    badges: 0,
    accuracy: 0,

    progress: [],
    activity: [],

    recommendation: {
      title:
        "Complete first learning activity",
      description:
        "Assign the student a suitable starter activity based on their current level.",
    },
  };
}

function getInitials(name = "") {
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

function formatLearningCategory(category) {
  if (!category) return "No School";

  const normalized =
    category.toLowerCase();

  if (normalized === "primary") {
    return "Primary";
  }

  if (normalized === "secondary") {
    return "Secondary";
  }

  if (
    normalized === "no_school" ||
    normalized === "no school"
  ) {
    return "No School";
  }

  return category;
}

function formatDate(
  dateValue,
  fallback = "Not available",
) {
  if (!dateValue) return fallback;

  return new Date(
    dateValue,
  ).toLocaleDateString("en-TT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

