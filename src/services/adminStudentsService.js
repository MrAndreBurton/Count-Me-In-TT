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
  const { data: student, error: studentError } =
    await supabase
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

  if (studentError) {
    throw studentError;
  }

  if (!student) {
    return null;
  }

  const {
    data: gameResults,
    error: gameResultsError,
  } = await supabase
    .from("game_results")
    .select(`
      id,
      student_id,
      game_type,
      game_mode,
      mode_label,
      duration_ms,
      score,
      max_score,
      correct_answers,
      incorrect_answers,
      accuracy_percent,
      submission_type,
      verification_status,
      is_personal_best,
      challenge_key,
      event_name,
      played_at
    `)
    .eq("student_id", studentId)
    .eq("verification_status", "verified")
    .order("played_at", {
      ascending: false,
    });

  if (gameResultsError) {
    throw gameResultsError;
  }

  const {
    count: badgeCount,
    error: badgeError,
  } = await supabase
    .from("student_badges")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("student_id", studentId);

  if (badgeError) {
    throw badgeError;
  }

  return {
    ...student,
    game_results: gameResults || [],
    badge_count: badgeCount || 0,
  };
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







