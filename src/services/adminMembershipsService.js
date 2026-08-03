import { supabase } from "../lib/supabase";

export async function fetchAdminMemberships() {
  const { data, error } = await supabase
    .from("student_memberships")
    .select(`
      id,
      student_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      is_current,
      auto_renew,
      source,
      cancellation_reason,
      notes,
      created_at,
      updated_at,

      student_profiles!student_memberships_student_id_fkey (
        id,
        account_id,
        first_name,
        last_name,
        public_display_name,

        profiles!student_profiles_account_id_fkey (
          id,
          full_name,
          phone
        )
      ),

      membership_plans!student_memberships_plan_id_fkey (
        id,
        plan_key,
        name,
        plan_type,
        price_ttd,
        duration_months,
        is_paid,
        entitlements
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchMembershipPlans() {
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
      sort_order
    `)
    .eq("is_active", true)
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchAdminMembershipById(
  membershipId,
) {
  const { data, error } = await supabase
    .from("student_memberships")
    .select(`
      id,
      student_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      is_current,
      auto_renew,
      source,
      created_by_account_id,
      cancelled_at,
      cancellation_reason,
      notes,
      metadata,
      created_at,
      updated_at,

      student_profiles!student_memberships_student_id_fkey (
        id,
        account_id,
        first_name,
        last_name,
        public_display_name,
        school_type,
        current_school,
        current_level,

        profiles!student_profiles_account_id_fkey (
          id,
          full_name,
          phone,
          communication_preference
        )
      ),

      membership_plans!student_memberships_plan_id_fkey (
        id,
        plan_key,
        name,
        description,
        plan_type,
        price_ttd,
        duration_months,
        is_paid,
        entitlements
      )
    `)
    .eq("id", membershipId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAdminMembership(
  membershipId,
  updates,
) {
  const { data, error } = await supabase
    .from("student_memberships")
    .update(updates)
    .eq("id", membershipId)
    .select(`
      id,
      student_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      is_current,
      auto_renew,
      source,
      created_by_account_id,
      cancelled_at,
      cancellation_reason,
      notes,
      metadata,
      created_at,
      updated_at,

      student_profiles!student_memberships_student_id_fkey (
        id,
        account_id,
        first_name,
        last_name,
        public_display_name,
        school_type,
        current_school,
        current_level,

        profiles!student_profiles_account_id_fkey (
          id,
          full_name,
          phone,
          communication_preference
        )
      ),

      membership_plans!student_memberships_plan_id_fkey (
        id,
        plan_key,
        name,
        description,
        plan_type,
        price_ttd,
        duration_months,
        is_paid,
        entitlements
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function replaceAdminMembership({
  membershipId,
  planId,
  startsAt,
  expiresAt = null,
  status = "active",
  source = "manual",
  autoRenew = false,
  notes = null,
  action = "change_plan",
}) {
  const { data, error } = await supabase.rpc(
    "admin_replace_student_membership",
    {
      p_membership_id: membershipId,
      p_plan_id: planId,
      p_starts_at:
        startsAt || new Date().toISOString(),
      p_expires_at: expiresAt || null,
      p_status: status,
      p_source: source,
      p_auto_renew: autoRenew,
      p_notes: notes || null,
      p_action: action,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchStudentMembershipHistory(
  studentId,
) {
  const { data, error } = await supabase
    .from("student_memberships")
    .select(`
      id,
      student_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      is_current,
      auto_renew,
      source,
      cancelled_at,
      cancellation_reason,
      notes,
      metadata,
      created_at,
      updated_at,

      membership_plans!student_memberships_plan_id_fkey (
        id,
        plan_key,
        name,
        plan_type,
        price_ttd,
        duration_months,
        is_paid
      )
    `)
    .eq("student_id", studentId)
    .order("starts_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}



