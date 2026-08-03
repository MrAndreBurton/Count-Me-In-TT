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
          is_paid,
          entitlements
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

export async function fetchAdminStudentById(
  studentId,
) {
  const { data, error } = await supabase
    .from("student_profiles")
    .select(`
      id,
      account_id,
      first_name,
      last_name,
      public_display_name,
      avatar_key,
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
          is_paid,
          entitlements
        )
      )
    `)
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAdminStudentProfile(
  studentId,
  updates,
) {
  const { data, error } = await supabase
    .from("student_profiles")
    .update(updates)
    .eq("id", studentId)
    .select(`
      id,
      account_id,
      first_name,
      last_name,
      public_display_name,
      avatar_key,
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
          is_paid,
          entitlements
        )
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function createAdminStudentProfile(
  profileData,
) {
  const { data, error } = await supabase
    .from("student_profiles")
    .insert(profileData)
    .select(`
      id,
      account_id,
      first_name,
      last_name,
      public_display_name,
      avatar_key,
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
          is_paid,
          entitlements
        )
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createAdminStudent({
  profileData,
}) {
  const student =
    await createAdminStudentProfile(
      profileData,
    );

  return student;
}







