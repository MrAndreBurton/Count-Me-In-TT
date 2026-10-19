import { supabase } from "../lib/supabase";

const INSTITUTIONAL_CREDENTIAL_ADMIN_ROLES = [
  "super_admin",
  "admin",
];

export const ORGANISATION_CREDENTIAL_STATES = {
  NONE: "NONE",
  CURRENT_ORGANISATION_MANAGED:
    "CURRENT_ORGANISATION_MANAGED",
  EXTERNAL: "EXTERNAL",
};

export function validateStudentUsername(value) {
  const username = String(value || "")
    .trim()
    .toLowerCase();

  if (username.length < 4) {
    return "Username must be at least 4 characters.";
  }

  if (username.length > 30) {
    return "Username must be 30 characters or fewer.";
  }

  if (!/^[a-z0-9._-]+$/.test(username)) {
    return "Use only lowercase letters, numbers, dots, underscores or hyphens.";
  }

  return "";
}

export function validateInitialPassword(value) {
  if (String(value || "").length < 8) {
    return "Initial Password must be at least 8 characters.";
  }

  return "";
}

export function validateNewPassword(value) {
  if (String(value || "").length < 8) {
    return "New Password must be at least 8 characters.";
  }

  return "";
}

export async function fetchInstitutionalLoginContext({
  organisationId,
  studentId,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const [
    profileResult,
    organisationResult,
    enrolmentResult,
    studentResult,
    credentialStateResult,
    staffResult,
    loginResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, admin_role, account_status")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("organisations")
      .select("id, name, organisation_type, status")
      .eq("id", organisationId)
      .maybeSingle(),

    supabase
      .from("organisation_enrolments")
      .select("id, organisation_id, student_id, status, ended_at")
      .eq("organisation_id", organisationId)
      .eq("student_id", studentId)
      .eq("status", "active")
      .is("ended_at", null)
      .maybeSingle(),

    supabase
      .from("student_profiles")
      .select(`
        id,
        first_name,
        last_name,
        public_display_name,
        profile_status,
        origin_type
      `)
      .eq("id", studentId)
      .maybeSingle(),

    supabase.rpc(
      "discover_organisation_student_credential_state",
      {
        target_organisation_id: organisationId,
        target_student_id: studentId,
      },
    ),

    supabase
      .from("organisation_staff")
      .select("id, status, ended_at, organisation_staff_roles(role)")
      .eq("organisation_id", organisationId)
      .eq("profile_id", user.id)
      .eq("status", "active")
      .is("ended_at", null),

    supabase
      .from("student_login_accounts")
      .select(`
        id,
        student_id,
        username,
        login_status,
        created_at,
        password_changed_at,
        last_login_at,
        provisioning_type,
        organisation_id
      `)
      .eq("student_id", studentId)
      .eq(
        "provisioning_type",
        "organisation",
      )
      .eq("organisation_id", organisationId)
      .maybeSingle(),
  ]);

  const firstError =
    profileResult.error ||
    organisationResult.error ||
    enrolmentResult.error ||
    studentResult.error ||
    credentialStateResult.error ||
    staffResult.error ||
    loginResult.error;

  if (firstError) {
    throw firstError;
  }

  const profile = profileResult.data;
  const organisation = organisationResult.data;
  const enrolment = enrolmentResult.data;
  const student = studentResult.data;
  const credentialState =
    credentialStateResult.data;
  const login = loginResult.data;
  const isOrganisationAdmin = (staffResult.data || []).some(
    (staff) => (staff.organisation_staff_roles || []).some(
      (role) => role.role === "organisation_admin",
    ),
  );

  if (
    !Object.values(
      ORGANISATION_CREDENTIAL_STATES,
    ).includes(credentialState)
  ) {
    throw new Error(
      "The learner credential state could not be determined.",
    );
  }

  const isActiveSiteCredentialAdmin =
    profile?.account_status === "active" &&
    INSTITUTIONAL_CREDENTIAL_ADMIN_ROLES.includes(
      profile?.admin_role,
    );

  const isValidInstitutionalTarget =
    organisation?.status === "active" &&
    enrolment?.organisation_id === organisationId &&
    enrolment?.student_id === studentId &&
    student?.profile_status === "active";

  return {
    profile,
    organisation,
    enrolment,
    student,
    credentialState,
    login,
    canManageCredentials:
      (isActiveSiteCredentialAdmin || isOrganisationAdmin) &&
      isValidInstitutionalTarget,
  };
}

async function getFunctionErrorMessage(error) {
  if (!error) {
    return "The request could not be completed.";
  }

  try {
    if (error.context?.json) {
      const payload = await error.context.json();

      return (
        payload?.error ||
        payload?.message ||
        error.message ||
        "The request could not be completed."
      );
    }
  } catch {
    // Fall through to the normal error message.
  }

  return (
    error.message ||
    "The request could not be completed."
  );
}

export async function createInstitutionalStudentLogin({
  organisationId,
  studentId,
  username,
  initialPassword,
}) {
  const normalizedUsername = String(username || "")
    .trim()
    .toLowerCase();

  const usernameError =
    validateStudentUsername(normalizedUsername);

  if (usernameError) {
    throw new Error(usernameError);
  }

  const passwordError =
    validateInitialPassword(initialPassword);

  if (passwordError) {
    throw new Error(passwordError);
  }

  const { data, error } =
    await supabase.functions.invoke(
      "create-student-login",
      {
       body: {
  studentId,
  organisationId,
  username: normalizedUsername,
  password: initialPassword,
},

      },
    );

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(error),
    );
  }

  return data;
}

export async function changeInstitutionalStudentPassword({
  organisationId,
  studentId,
  newPassword,
}) {
  const passwordError =
    validateNewPassword(newPassword);

  if (passwordError) {
    throw new Error(passwordError);
  }

  const { data, error } =
    await supabase.functions.invoke(
      "reset-student-password",
      {
        body: {
          studentId,
          organisationId,
          newPassword,
        },
      },
    );

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(error),
    );
  }

  return data;
}
