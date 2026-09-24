import { supabase } from "../lib/supabase";

export async function fetchAdminSchools() {
  const { data, error } = await supabase
    .from("organisations")
    .select(`
      id,
      name,
      organisation_type,
      school_catalogue_id,
      status,
      created_at
    `)
    .eq("organisation_type", "school")
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchAdminSchoolById(
  organisationId,
) {
  const {
    data: organisation,
    error: organisationError,
  } = await supabase
    .from("organisations")
    .select(`
      id,
      name,
      organisation_type,
      school_catalogue_id,
      status,
      created_at,
      updated_at
    `)
    .eq("id", organisationId)
    .eq("organisation_type", "school")
    .maybeSingle();

  if (organisationError) {
    throw organisationError;
  }

  if (!organisation) {
    return null;
  }

  const {
    data: enrolments,
    error: enrolmentsError,
  } = await supabase
    .from("organisation_enrolments")
    .select(`
      id,
      organisation_id,
      student_id,
      status,
      joined_at,
      ended_at
    `)
    .eq("organisation_id", organisationId)
    .eq("status", "active")
    .is("ended_at", null)
    .order("joined_at", {
      ascending: true,
    });

  if (enrolmentsError) {
    throw enrolmentsError;
  }

  const activeEnrolments = enrolments || [];

  if (activeEnrolments.length === 0) {
    return {
      ...organisation,
      learners: [],
    };
  }

  const studentIds = [
    ...new Set(
      activeEnrolments.map(
        (enrolment) => enrolment.student_id,
      ),
    ),
  ];

  const {
    data: students,
    error: studentsError,
  } = await supabase
    .from("student_profiles")
    .select(`
      id,
      first_name,
      last_name,
      public_display_name,
      current_level,
      academic_year,
      profile_status,
      origin_type
    `)
    .in("id", studentIds);

  if (studentsError) {
    throw studentsError;
  }

  // Fetch institutional login state for the roster in one
  // batched query. This is presentation/discovery state only;
  // credential authority remains enforced by the backend.
  const {
    data: loginAccounts,
    error: loginAccountsError,
  } = await supabase
    .from("student_login_accounts")
    .select(`
      id,
      student_id,
      username,
      login_status,
      provisioning_type,
      organisation_id,
      last_login_at
    `)
    .in("student_id", studentIds)
    .eq("provisioning_type", "organisation")
    .eq("organisation_id", organisationId);

  if (loginAccountsError) {
    throw loginAccountsError;
  }

  const enrolmentIds = activeEnrolments.map(
    (enrolment) => enrolment.id,
  );

  const {
    data: groupMemberships,
    error: groupMembershipsError,
  } = await supabase
    .from("organisation_group_students")
    .select(`
      enrolment_id,
      group_id,
      joined_at,
      ended_at
    `)
    .eq("organisation_id", organisationId)
    .in("enrolment_id", enrolmentIds)
    .is("ended_at", null);

  if (groupMembershipsError) {
    throw groupMembershipsError;
  }

  const activeGroupMemberships =
    groupMemberships || [];

  const groupIds = [
    ...new Set(
      activeGroupMemberships.map(
        (membership) => membership.group_id,
      ),
    ),
  ];

  let groups = [];

  if (groupIds.length > 0) {
    const {
      data: groupRows,
      error: groupsError,
    } = await supabase
      .from("organisation_groups")
      .select(`
        id,
        organisation_id,
        name,
        level_key,
        academic_year,
        status
      `)
      .eq("organisation_id", organisationId)
      .in("id", groupIds);

    if (groupsError) {
      throw groupsError;
    }

    groups = groupRows || [];
  }

  const studentsById = new Map(
    (students || []).map((student) => [
      student.id,
      student,
    ]),
  );

  const loginByStudentId = new Map(
    (loginAccounts || []).map((login) => [
      login.student_id,
      login,
    ]),
  );

  const groupsById = new Map(
    groups.map((group) => [
      group.id,
      group,
    ]),
  );

  const membershipsByEnrolmentId = new Map();

  for (const membership of activeGroupMemberships) {
    const existing =
      membershipsByEnrolmentId.get(
        membership.enrolment_id,
      ) || [];

    existing.push(membership);

    membershipsByEnrolmentId.set(
      membership.enrolment_id,
      existing,
    );
  }

  const learners = activeEnrolments
    .map((enrolment) => {
      const student = studentsById.get(
        enrolment.student_id,
      );

      if (!student) {
        return null;
      }

      const memberships =
        membershipsByEnrolmentId.get(
          enrolment.id,
        ) || [];

      const learnerGroups = memberships
        .map((membership) =>
          groupsById.get(membership.group_id),
        )
        .filter(Boolean)
        .filter(
          (group) => group.status === "active",
        );

      return {
        enrolmentId: enrolment.id,
        enrolmentStatus: enrolment.status,
        joinedAt: enrolment.joined_at,
        student,
        login:
          loginByStudentId.get(
            enrolment.student_id,
          ) || null,
        groups: learnerGroups,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aName =
        a.student.public_display_name ||
        `${a.student.first_name || ""} ${a.student.last_name || ""}`.trim();

      const bName =
        b.student.public_display_name ||
        `${b.student.first_name || ""} ${b.student.last_name || ""}`.trim();

      return aName.localeCompare(bName);
    });

  return {
    ...organisation,
    learners,
  };
}
