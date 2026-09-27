import { supabase } from "./supabase";

const ALLOWED_ORGANISATION_STAFF_ROLES = new Set([
  "organisation_admin",
  "teacher",
  "tutor",
]);

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeRoles(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map((value) => cleanText(value))
        .filter(Boolean)
    ),
  ].sort();
}

function createOrganisationStaffError({
  message,
  code = null,
  details = null,
}) {
  const error = new Error(message);

  error.code = code;
  error.details = details;

  return error;
}

export async function fetchOrganisationStaff(
  organisationId
) {
  const cleanOrganisationId =
    cleanText(organisationId);

  if (!cleanOrganisationId) {
    throw createOrganisationStaffError({
      message: "Organisation is required.",
      code: "ORGANISATION_REQUIRED",
    });
  }

  const { data, error } = await supabase.rpc(
    "get_organisation_staff_roster_v1",
    {
      p_organisation_id: cleanOrganisationId,
    }
  );

  if (error) {
    throw error;
  }

  return (data || []).map((row) => ({
    staffId: row.staff_id,
    organisationId: row.organisation_id,
    profileId: row.profile_id,
    fullName:
      row.full_name || "Unnamed staff member",
    accountStatus: row.account_status,
    position: row.staff_position,
    status: row.staff_status,
    joinedAt: row.joined_at,
    endedAt: row.ended_at,
    roles: Array.isArray(row.roles)
      ? [...row.roles].sort()
      : [],
  }));
}

export async function addOrganisationStaff({
  organisationId,
  firstName,
  lastName,
  email,
  position = null,
  roles,
}) {
  const cleanOrganisationId =
    cleanText(organisationId);
  const cleanFirstName = cleanText(firstName);
  const cleanLastName = cleanText(lastName);
  const normalizedEmail = normalizeEmail(email);
  const cleanPosition = cleanText(position) || null;
  const normalizedRoles = normalizeRoles(roles);

  if (!cleanOrganisationId) {
    throw createOrganisationStaffError({
      message: "Organisation is required.",
      code: "ORGANISATION_REQUIRED",
    });
  }

  if (!cleanFirstName) {
    throw createOrganisationStaffError({
      message: "First name is required.",
      code: "FIRST_NAME_REQUIRED",
    });
  }

  if (!cleanLastName) {
    throw createOrganisationStaffError({
      message: "Last name is required.",
      code: "LAST_NAME_REQUIRED",
    });
  }

  if (
    !normalizedEmail ||
    !isValidEmail(normalizedEmail)
  ) {
    throw createOrganisationStaffError({
      message: "A valid email address is required.",
      code: "VALID_EMAIL_REQUIRED",
    });
  }

  if (normalizedRoles.length === 0) {
    throw createOrganisationStaffError({
      message:
        "At least one organisation role is required.",
      code: "ROLE_REQUIRED",
    });
  }

  const invalidRole = normalizedRoles.find(
    (role) =>
      !ALLOWED_ORGANISATION_STAFF_ROLES.has(role)
  );

  if (invalidRole) {
    throw createOrganisationStaffError({
      message: "One or more organisation roles are invalid.",
      code: "INVALID_ROLE",
      details: {
        role: invalidRole,
      },
    });
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw createOrganisationStaffError({
      message:
        "You must be logged in to add organisation staff.",
      code: "AUTH_REQUIRED",
    });
  }

  const { data, error } =
    await supabase.functions.invoke(
      "add-organisation-staff",
      {
        body: {
          organisationId: cleanOrganisationId,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          email: normalizedEmail,
          position: cleanPosition,
          roles: normalizedRoles,
        },
      }
    );

  if (error) {
    console.error(
      "Organisation staff function error:",
      error
    );

    let responseBody = null;

    try {
      const response = error.context;

      if (response) {
        responseBody = await response.json();
      }
    } catch (responseError) {
      console.error(
        "Unable to read organisation staff function error response:",
        responseError
      );
    }

    console.error(
      "Organisation staff function response JSON:",
      JSON.stringify(responseBody, null, 2)
    );

    const serverMessage =
      typeof responseBody?.error === "string"
        ? responseBody.error
        : typeof responseBody?.message === "string"
          ? responseBody.message
          : typeof responseBody?.error?.message ===
              "string"
            ? responseBody.error.message
            : error.message ||
              "The staff member could not be added.";

    throw createOrganisationStaffError({
      message: serverMessage,
      code:
        typeof responseBody?.code === "string"
          ? responseBody.code
          : "FUNCTION_ERROR",
      details: responseBody?.details ?? null,
    });
  }

  if (!data?.success) {
    throw createOrganisationStaffError({
      message:
        typeof data?.error === "string"
          ? data.error
          : typeof data?.message === "string"
            ? data.message
            : "The staff member could not be added.",
      code:
        typeof data?.code === "string"
          ? data.code
          : "STAFF_PROVISIONING_FAILED",
      details: data?.details ?? null,
    });
  }

  return {
    success: true,
    message:
      data.message ||
      "Staff member added successfully.",
    accountResolution:
      data.accountResolution ?? null,
    organisation:
      data.organisation ?? null,
    account:
      data.account ?? null,
    staff:
      data.staff ?? null,
  };
}
