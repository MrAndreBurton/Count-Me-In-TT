import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type StudentLoginAuthorizationContext =
  | {
      type: "parent";
      parentAccountId: string;
      organisationId: null;
      provisionedByAccountId: string;
    }
  | {
      type: "organisation";
      parentAccountId: null;
      organisationId: string;
      provisionedByAccountId: string;
    };

type AuthorizeArgs = {
  adminClient: SupabaseClient;
  userId: string;
  studentId: string;
  organisationId?: string | null;
};

async function authorizeParentStudentManagement({
  adminClient,
  userId,
  studentId,
}: AuthorizeArgs): Promise<StudentLoginAuthorizationContext | null> {
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, account_type, account_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;

  if (
    !profile ||
    profile.account_type !== "parent" ||
    profile.account_status !== "active"
  ) {
    return null;
  }

  const { data: link, error: linkError } = await adminClient
    .from("account_student_links")
    .select("id")
    .eq("account_id", userId)
    .eq("student_id", studentId)
    .eq("relationship_role", "parent")
    .eq("can_view", true)
    .maybeSingle();

  if (linkError) throw linkError;
  if (!link) return null;

  // A parent relationship may grant visibility to an organisation-origin
  // learner, but it must not grant authority over institution-issued
  // credentials. Parent credential management is limited to personal-origin
  // learners.
  const { data: student, error: studentError } = await adminClient
    .from("student_profiles")
    .select("id")
    .eq("id", studentId)
    .eq("origin_type", "personal")
    .eq("profile_status", "active")
    .maybeSingle();

  if (studentError) throw studentError;
  if (!student) return null;

  return {
    type: "parent",
    parentAccountId: userId,
    organisationId: null,
    provisionedByAccountId: userId,
  };
}

async function authorizeOrganisationStudentManagement({
  adminClient,
  userId,
  studentId,
  organisationId,
}: AuthorizeArgs): Promise<StudentLoginAuthorizationContext | null> {
  const cleanOrganisationId = String(organisationId || "").trim();
  if (!cleanOrganisationId) return null;

  const { data: caller, error: callerError } = await adminClient
    .from("profiles")
    .select("id, account_status, admin_role")
    .eq("id", userId)
    .maybeSingle();

  if (callerError) throw callerError;
  if (!caller || caller.account_status !== "active") return null;

  // Credential administration is intentionally narrower than the platform's
  // generic frontend admin role list. Moderators do not qualify.
  const isSiteAdmin =
    caller.admin_role === "super_admin" ||
    caller.admin_role === "admin";

  const { data: organisation, error: organisationError } = await adminClient
    .from("organisations")
    .select("id")
    .eq("id", cleanOrganisationId)
    .eq("status", "active")
    .maybeSingle();

  if (organisationError) throw organisationError;
  if (!organisation) return null;

  let isOrganisationAdmin = false;

  if (!isSiteAdmin) {
    const { data: staff, error: staffError } = await adminClient
      .from("organisation_staff")
      .select("id")
      .eq("organisation_id", cleanOrganisationId)
      .eq("profile_id", userId)
      .eq("status", "active")
      .is("ended_at", null)
      .maybeSingle();

    if (staffError) throw staffError;

    if (staff) {
      const { data: adminRole, error: roleError } = await adminClient
        .from("organisation_staff_roles")
        .select("staff_id")
        .eq("staff_id", staff.id)
        .eq("role", "organisation_admin")
        .maybeSingle();

      if (roleError) throw roleError;
      isOrganisationAdmin = Boolean(adminRole);
    }
  }

  if (!isSiteAdmin && !isOrganisationAdmin) return null;

  const { data: student, error: studentError } = await adminClient
    .from("student_profiles")
    .select("id")
    .eq("id", studentId)
    .eq("origin_type", "organisation")
    .eq("profile_status", "active")
    .maybeSingle();

  if (studentError) throw studentError;
  if (!student) return null;

  const { data: enrolment, error: enrolmentError } = await adminClient
    .from("organisation_enrolments")
    .select("id")
    .eq("organisation_id", cleanOrganisationId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .is("ended_at", null)
    .maybeSingle();

  if (enrolmentError) throw enrolmentError;
  if (!enrolment) return null;

  return {
    type: "organisation",
    parentAccountId: null,
    organisationId: cleanOrganisationId,
    provisionedByAccountId: userId,
  };
}

export async function authorizeStudentLoginManagement(
  args: AuthorizeArgs
): Promise<StudentLoginAuthorizationContext | null> {
  const cleanOrganisationId = String(args.organisationId || "").trim();

  if (cleanOrganisationId) {
    return authorizeOrganisationStudentManagement({
      ...args,
      organisationId: cleanOrganisationId,
    });
  }

  return authorizeParentStudentManagement(args);
}
