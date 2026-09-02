export function mapSupabaseParentToAdminParent(
  data,
) {
  return {
    id: data.id,

    name:
      data.full_name ||
      "Unnamed parent",

    firstName: getFirstName(
      data.full_name,
    ),

    lastName: getLastName(
      data.full_name,
    ),

    initials: getInitials(
      data.full_name,
    ),

    email: "",

    phone:
      data.phone ||
      "Not provided",

    relationship: "Parent",

    status: formatAccountStatus(
      data.account_status,
    ),

    communicationPreference:
      formatCommunicationPreference(
        data.communication_preference,
      ),

    joined: formatDate(
      data.created_at,
    ),

    lastActive: "Not available",

    notes:
      "No admin notes added.",

    connectedStudents:
      data.student_profiles || [],

    studentIds:
      data.student_profiles?.map(
        (student) => student.id,
      ) || [],
  };
}

function getFirstName(fullName = "") {
  return (
    fullName
      .trim()
      .split(/\s+/)[0] || ""
  );
}

function getLastName(fullName = "") {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(1)
    .join(" ");
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

function formatAccountStatus(status) {
  if (!status) return "Pending";

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase()
  );
}

function formatCommunicationPreference(
  preference,
) {
  if (!preference) {
    return "Not provided";
  }

  if (
    preference.toLowerCase() ===
    "whatsapp"
  ) {
    return "WhatsApp";
  }

  return (
    preference.charAt(0).toUpperCase() +
    preference.slice(1).toLowerCase()
  );
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

