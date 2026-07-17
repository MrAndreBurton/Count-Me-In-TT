import { supabase } from "./supabase";

/**
 * Returns the currently authenticated user.
 */
async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to request membership."
    );
  }

  return user;
}

/**
 * Loads the student profiles that the current account
 * is allowed to manage for membership.
 *
 * Supports:
 * - parent accounts with linked students
 * - student accounts requesting for themselves
 */
export async function getEligibleMembershipStudents() {
  const user = await getCurrentUser();

  const eligibleStudents = new Map();

  /*
   * Parent-linked students
   */
  const {
    data: parentLinks,
    error: parentLinksError,
  } = await supabase
    .from("account_student_links")
    .select(`
      student_id,
      can_manage_membership,
      student_profiles:student_id (
        id,
        first_name,
        last_name,
        public_display_name,
        profile_status,
        login_enabled
      )
    `)
    .eq("account_id", user.id)
    .eq("can_manage_membership", true);

  if (parentLinksError) {
    throw parentLinksError;
  }

  for (const link of parentLinks || []) {
    const student = link.student_profiles;

    if (
      student?.id &&
      student.profile_status !== "inactive"
    ) {
      eligibleStudents.set(student.id, student);
    }
  }

  /*
   * Student account's own profile
   */
  const {
    data: ownStudentProfiles,
    error: ownStudentError,
  } = await supabase
    .from("student_profiles")
    .select(`
      id,
      first_name,
      last_name,
      public_display_name,
      profile_status,
      login_enabled
    `)
    .eq("student_account_id", user.id)
    .eq("login_enabled", true);

  if (ownStudentError) {
    throw ownStudentError;
  }

  for (const student of ownStudentProfiles || []) {
    if (
      student?.id &&
      student.profile_status !== "inactive"
    ) {
      eligibleStudents.set(student.id, student);
    }
  }

  return Array.from(eligibleStudents.values());
}

/**
 * Loads paid membership plans that can be requested.
 *
 * This assumes membership_plans includes:
 * id, name, slug, price, is_active, is_paid
 *
 * Remove or rename fields here if your actual columns differ.
 */
export async function getRequestableMembershipPlans() {
  const { data, error } = await supabase
    .from("membership_plans")
    .select(`
      id,
      plan_key,
      name,
      description,
      plan_type,
      price_ttd,
      duration_months,
      is_paid,
      is_active,
      is_public,
      entitlements,
      sort_order
    `)
    .eq("is_active", true)
    .eq("is_paid", true)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Checks whether this student already has an open
 * request for the selected plan.
 */
export async function hasOpenMembershipRequest({
  studentProfileId,
  planId,
}) {
  if (!studentProfileId || !planId) {
    return false;
  }

  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("membership_requests")
    .select("id, status")
    .eq("requested_by_user_id", user.id)
    .eq("student_profile_id", studentProfileId)
    .eq("plan_id", planId)
    .in("status", [
      "pending",
      "contacted",
      "payment_pending",
    ])
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

/**
 * Returns the current user's submitted membership requests.
 */
export async function getMyMembershipRequests() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("membership_requests")
    .select(`
      id,
      status,
      preferred_contact_method,
      contact_name,
      contact_email,
      contact_phone,
      notes,
      requested_at,
      contacted_at,
      approved_at,
      declined_at,
      student_profile_id,
      plan_id,
      student_profiles:student_profile_id (
        id,
        first_name,
        last_name,
        public_display_name
      ),
      membership_plans:plan_id (
        id,
        plan_key,
        name,
        description,
        plan_type,
        price_ttd,
        duration_months
      )

    `)
    .eq("requested_by_user_id", user.id)
    .order("requested_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Creates a new membership request.
 */
export async function createMembershipRequest({
  studentProfileId,
  planId,
  preferredContactMethod,
  contactName,
  contactEmail,
  contactPhone,
  notes,
}) {
  const user = await getCurrentUser();

  if (!studentProfileId) {
    throw new Error("Please select a student.");
  }

  if (!planId) {
    throw new Error(
      "Please select a membership plan."
    );
  }

  const allowedContactMethods = [
    "whatsapp",
    "email",
    "phone",
  ];

  if (
    preferredContactMethod &&
    !allowedContactMethods.includes(
      preferredContactMethod
    )
  ) {
    throw new Error(
      "Please choose a valid contact method."
    );
  }

  /*
   * Confirm that the selected student is one the
   * current user is authorised to manage.
   */
  const eligibleStudents =
    await getEligibleMembershipStudents();

  const selectedStudent = eligibleStudents.find(
    (student) => student.id === studentProfileId
  );

  if (!selectedStudent) {
    throw new Error(
      "You are not authorised to request membership for this student."
    );
  }

  /*
   * Confirm that the selected plan is a paid,
   * currently available plan.
   */
  const requestablePlans =
    await getRequestableMembershipPlans();

  const selectedPlan = requestablePlans.find(
    (plan) => plan.id === planId
  );

  if (!selectedPlan) {
    throw new Error(
      "That membership plan is not currently available."
    );
  }

  /*
   * Prevent an unnecessary new request if the student
   * already has an active membership.
   */
  const now = new Date().toISOString();

  const {
  data: activeMemberships,
  error: activeMembershipError,
} = await supabase
  .from("student_memberships")
  .select(`
    id,
    status,
    starts_at,
    expires_at,
    plan_id,
    membership_plans (
      plan_key,
      is_paid
    )
  `)
  .eq("student_id", studentProfileId)
  .eq("status", "active")
  .or(`expires_at.is.null,expires_at.gt.${now}`);

if (activeMembershipError) {
  throw activeMembershipError;
}

const activePaidMembership =
  activeMemberships?.find(
    (membership) =>
      membership.membership_plans?.is_paid === true
  );

if (activePaidMembership) {
  throw new Error(
    "This student already has an active paid membership."
  );
}



  const alreadyOpen =
    await hasOpenMembershipRequest({
      studentProfileId,
      planId,
    });

  if (alreadyOpen) {
    throw new Error(
      "A membership request for this student and plan is already being processed."
    );
  }

  const cleanContactName =
    contactName?.trim() || null;

  const cleanContactEmail =
    contactEmail?.trim() ||
    user.email ||
    null;

  const cleanContactPhone =
    contactPhone?.trim() || null;

  const cleanNotes = notes?.trim() || null;

  const { data, error } = await supabase
    .from("membership_requests")
    .insert({
      student_profile_id: studentProfileId,
      requested_by_user_id: user.id,
      plan_id: planId,
      status: "pending",
      preferred_contact_method:
        preferredContactMethod || null,
      contact_name: cleanContactName,
      contact_email: cleanContactEmail,
      contact_phone: cleanContactPhone,
      notes: cleanNotes,
    })
    .select(`
      id,
      status,
      requested_at,
      student_profile_id,
      plan_id
    `)
    .single();

  if (error) {
    /*
     * PostgreSQL unique constraint violation.
     * This also catches duplicate requests created
     * from double-clicks or simultaneous submissions.
     */
    if (error.code === "23505") {
      throw new Error(
        "A membership request for this student and plan is already being processed."
      );
    }

    throw error;
  }

  return {
    request: data,
    student: selectedStudent,
    plan: selectedPlan,
  };
}

