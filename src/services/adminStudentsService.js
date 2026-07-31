import { supabase } from "../lib/supabase";

export async function fetchAdminStudents() {
  const { data, error } = await supabase
    .from("student_profiles")
    .select(`
      id,
      account_id,
      first_name,
      last_name,
      public_display_name,
      school_type,
      current_school,
      current_level,
      academic_year,
      profile_status,
      created_at,
      profiles!student_profiles_account_id_fkey (
        id,
        full_name,
        phone,
        communication_preference,
        account_status
      ),
      student_memberships (
        id,
        status,
        starts_at,
        expires_at,
        is_current,
        membership_plans (
          id,
          plan_key,
          name,
          plan_type,
          is_paid
        )
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


