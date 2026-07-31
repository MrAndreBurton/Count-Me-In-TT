import { supabase } from "../lib/supabase";

export async function fetchAdminParents() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      phone,
      communication_preference,
      account_status,
      created_at
    `)
    .eq("account_type", "parent")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchAdminParentById(parentId) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      phone,
      communication_preference,
      account_status,
      created_at,
      student_profiles!student_profiles_account_id_fkey (
        id,
        first_name,
        last_name,
        public_display_name,
        school_type,
        current_school,
        current_level,
        profile_status
      )
    `)
    .eq("id", parentId)
    .eq("account_type", "parent")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}




