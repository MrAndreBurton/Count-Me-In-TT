import { supabase } from "../lib/supabase";

export async function fetchAdminMembershipRequests() {
  const { data, error } = await supabase
    .from("membership_requests")
    .select(`
      id,
      student_profile_id,
      requested_by_user_id,
      plan_id,
      status,
      preferred_contact_method,
      contact_name,
      contact_email,
      contact_phone,
      notes,
      payment_reference,
      admin_notes,
      requested_at,
      contacted_at,
      approved_at,
      declined_at,
      reviewed_by_user_id,

      student_profiles!membership_requests_student_profile_id_fkey (
        id,
        first_name,
        last_name,
        public_display_name,
        current_level,
        current_school,

        profiles!student_profiles_account_id_fkey (
          id,
          full_name,
          phone,
          communication_preference
        )
      ),

      membership_plans!membership_requests_plan_id_fkey (
        id,
        plan_key,
        name,
        plan_type,
        price_ttd,
        duration_months,
        is_paid
      )
    `)
    .order("requested_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchAdminMembershipRequestById(
  requestId,
) {
  const { data, error } = await supabase
    .from("membership_requests")
    .select(`
      id,
      student_profile_id,
      requested_by_user_id,
      plan_id,
      status,
      preferred_contact_method,
      contact_name,
      contact_email,
      contact_phone,
      notes,
      payment_reference,
      admin_notes,
      requested_at,
      contacted_at,
      approved_at,
      declined_at,
      reviewed_by_user_id,

      student_profiles!membership_requests_student_profile_id_fkey (
        id,
        first_name,
        last_name,
        public_display_name,
        current_level,
        current_school,
        school_type,
        profile_status,

        profiles!student_profiles_account_id_fkey (
          id,
          full_name,
          phone,
          communication_preference,
          account_status
        )
      ),

      membership_plans!membership_requests_plan_id_fkey (
        id,
        plan_key,
        name,
        description,
        plan_type,
        price_ttd,
        duration_months,
        is_paid
      )
    `)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAdminMembershipRequest(
  requestId,
  updates,
) {
  const { data, error } = await supabase
    .from("membership_requests")
    .update(updates)
    .eq("id", requestId)
    .select(`
      id,
      student_profile_id,
      requested_by_user_id,
      plan_id,
      status,
      preferred_contact_method,
      contact_name,
      contact_email,
      contact_phone,
      notes,
      payment_reference,
      admin_notes,
      requested_at,
      contacted_at,
      approved_at,
      declined_at,
      reviewed_by_user_id,

      student_profiles!membership_requests_student_profile_id_fkey (
        id,
        first_name,
        last_name,
        public_display_name,
        current_level,
        current_school,
        school_type,
        profile_status,

        profiles!student_profiles_account_id_fkey (
          id,
          full_name,
          phone,
          communication_preference,
          account_status
        )
      ),

      membership_plans!membership_requests_plan_id_fkey (
        id,
        plan_key,
        name,
        description,
        plan_type,
        price_ttd,
        duration_months,
        is_paid
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function approveAdminMembershipRequest(
  requestId,
) {
  const { data, error } = await supabase.rpc(
    "admin_approve_membership_request",
    {
      p_request_id: requestId,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


