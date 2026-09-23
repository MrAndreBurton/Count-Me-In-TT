import { supabase } from "../lib/supabase";

const INSTITUTIONAL_CREDENTIAL_ADMIN_ROLES = [
  "super_admin",
  "admin",
];

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

    supabase
      .from("student_login_accounts")
      .select(`
        id,
        student_id,
        username,        
        created_at,
        last_login_at,
        provisioning_type,
        organisation_id
      `)
      .eq("student_id", studentId)
      .maybeSingle(),
  ]);

  const firstError =
    profileResult.error ||
    organisationResult.error ||
    enrolmentResult.error ||
    studentResult.error ||
    loginResult.error;

  if (firstError) {
    throw firstError;
  }

  const profile = profileResult.data;
  const organisation = organisationResult.data;
  const enrolment = enrolmentResult.data;
  const student = studentResult.data;
  const login = loginResult.data;

  const isActiveSiteCredentialAdmin =
    profile?.account_status === "active" &&
    INSTITUTIONAL_CREDENTIAL_ADMIN_ROLES.includes(
      profile?.admin_role,
    );

  const isValidInstitutionalTarget =
    organisation?.status === "active" &&
    organisation?.organisation_type === "school" &&
    enrolment?.organisation_id === organisationId &&
    enrolment?.student_id === studentId &&
    student?.origin_type === "organisation" &&
    student?.profile_status === "active";

  return {
    profile,
    organisation,
    enrolment,
    student,
    login,
    canManageCredentials:
      isActiveSiteCredentialAdmin &&
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
