// src/lib/organisationDiscovery.js

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export async function discoverAssignedGroupScope({
  supabase,
  organisationId,
  staffId,
}) {
  const { data: assignments, error: assignmentsError } = await supabase
    .from("organisation_group_staff")
    .select("group_id, organisation_id, staff_id, assigned_at, ended_at")
    .eq("organisation_id", organisationId)
    .eq("staff_id", staffId)
    .is("ended_at", null);

  if (assignmentsError) {
    throw assignmentsError;
  }

  const groupIds = unique(
    (assignments ?? []).map((assignment) => assignment.group_id)
  );

  if (groupIds.length === 0) {
    return {
      groups: [],
      learners: [],
      counts: {
        activeGroups: 0,
        visibleLearners: 0,
      },
    };
  }

  const { data: groups, error: groupsError } = await supabase
    .from("organisation_groups")
    .select("id, organisation_id, name, level_key, academic_year, status")
    .eq("organisation_id", organisationId)
    .eq("status", "active")
    .in("id", groupIds);

  if (groupsError) {
    throw groupsError;
  }

  const authorisedGroups = groups ?? [];

  const authorisedGroupIds = unique(
    authorisedGroups.map((group) => group.id)
  );

  if (authorisedGroupIds.length === 0) {
    return {
      groups: [],
      learners: [],
      counts: {
        activeGroups: 0,
        visibleLearners: 0,
      },
    };
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("organisation_group_students")
    .select("group_id, organisation_id, enrolment_id, joined_at, ended_at")
    .eq("organisation_id", organisationId)
    .in("group_id", authorisedGroupIds)
    .is("ended_at", null);

  if (membershipsError) {
    throw membershipsError;
  }

  const enrolmentIds = unique(
    (memberships ?? []).map((membership) => membership.enrolment_id)
  );

  if (enrolmentIds.length === 0) {
    return {
      groups: authorisedGroups.map((group) => ({
        ...group,
        learnerCount: 0,
      })),
      learners: [],
      counts: {
        activeGroups: authorisedGroups.length,
        visibleLearners: 0,
      },
    };
  }

  const { data: enrolments, error: enrolmentsError } = await supabase
    .from("organisation_enrolments")
    .select("id, organisation_id, student_id, status, joined_at, ended_at")
    .eq("organisation_id", organisationId)
    .eq("status", "active")
    .is("ended_at", null)
    .in("id", enrolmentIds);

  if (enrolmentsError) {
    throw enrolmentsError;
  }

  const activeEnrolments = enrolments ?? [];

  const studentIds = unique(
    activeEnrolments.map((enrolment) => enrolment.student_id)
  );

  if (studentIds.length === 0) {
    return {
      groups: authorisedGroups.map((group) => ({
        ...group,
        learnerCount: 0,
      })),
      learners: [],
      counts: {
        activeGroups: authorisedGroups.length,
        visibleLearners: 0,
      },
    };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("student_profiles")
    .select("id, first_name, last_name, public_display_name, origin_type")
    .in("id", studentIds);

  if (profilesError) {
    throw profilesError;
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  const enrolmentById = new Map(
    activeEnrolments.map((enrolment) => [enrolment.id, enrolment])
  );

  const groupById = new Map(
    authorisedGroups.map((group) => [group.id, group])
  );

  const learnerMap = new Map();

  for (const membership of memberships ?? []) {
    const enrolment = enrolmentById.get(membership.enrolment_id);
    const group = groupById.get(membership.group_id);

    if (!enrolment || !group) {
      continue;
    }

    const profile = profileById.get(enrolment.student_id);

    // If RLS withholds the profile, do not infer learner identity.
    if (!profile) {
      continue;
    }

    const existing = learnerMap.get(profile.id);

    const groupContext = {
      groupId: group.id,
      groupName: group.name,
    };

    if (existing) {
      if (!existing.groups.some((item) => item.groupId === group.id)) {
        existing.groups.push(groupContext);
      }

      continue;
    }

    learnerMap.set(profile.id, {
      studentId: profile.id,
      enrolmentId: enrolment.id,
      displayName:
        [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || profile.public_display_name,
      originType: profile.origin_type,
      groups: [groupContext],
    });
  }

  const learners = [...learnerMap.values()];

  const groupsWithCounts = authorisedGroups.map((group) => ({
    ...group,
    learnerCount: learners.filter((learner) =>
      learner.groups.some((item) => item.groupId === group.id)
    ).length,
  }));

  return {
    groups: groupsWithCounts,
    learners,
    counts: {
      activeGroups: groupsWithCounts.length,
      visibleLearners: learners.length,
    },
  };
}

export async function discoverOrganisationAdminScope({
  supabase,
  organisationId,
}) {
  /*
   * Organisation administrators discover learners
   * through active organisation enrolments.
   *
   * The frontend may choose this path because the
   * account has the organisation_admin role, but
   * database RLS remains authoritative.
   */
  const { data: enrolments, error: enrolmentsError } = await supabase
    .from("organisation_enrolments")
    .select("id, organisation_id, student_id, status, joined_at, ended_at")
    .eq("organisation_id", organisationId)
    .eq("status", "active")
    .is("ended_at", null);

  if (enrolmentsError) {
    throw enrolmentsError;
  }

  const activeEnrolments = enrolments ?? [];

  if (activeEnrolments.length === 0) {
    return {
      learners: [],
      counts: {
        activeEnrolments: 0,
        visibleLearners: 0,
      },
    };
  }

  const studentIds = unique(
    activeEnrolments.map((enrolment) => enrolment.student_id)
  );

  if (studentIds.length === 0) {
    return {
      learners: [],
      counts: {
        activeEnrolments: activeEnrolments.length,
        visibleLearners: 0,
      },
    };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("student_profiles")
    .select("id, first_name, last_name, public_display_name, origin_type")
    .in("id", studentIds);

  if (profilesError) {
    throw profilesError;
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  const learners = [];

  for (const enrolment of activeEnrolments) {
    const profile = profileById.get(enrolment.student_id);

    // If RLS withholds the profile, do not infer learner identity.
    if (!profile) {
      continue;
    }

    learners.push({
      studentId: profile.id,
      enrolmentId: enrolment.id,
      displayName:
        [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || profile.public_display_name,
      originType: profile.origin_type,
      groups: [],
    });
  }

  return {
    learners,
    counts: {
      activeEnrolments: activeEnrolments.length,
      visibleLearners: learners.length,
    },
  };
}


