function cleanOptionalText(value) {
  const cleaned = value?.trim();
  return cleaned || null;
}

export async function createOrganisationStudent({
  supabase,
  organisationId,
  firstName,
  lastName,
  publicDisplayName,
  schoolType = null,
  currentSchool = null,
  currentLevel = null,
  academicYear = null,
  schoolVisible = false,
  groupId = null,
}) {
  const cleanFirstName = firstName?.trim();
  const cleanLastName = lastName?.trim();

  if (!cleanFirstName || !cleanLastName) {
    throw new Error("First name and last name are required.");
  }

  const fallbackDisplayName =
    `${cleanFirstName} ${cleanLastName}`.trim();

  const { data, error } = await supabase.rpc(
    "create_organisation_student",
    {
      p_organisation_id: organisationId,
      p_first_name: cleanFirstName,
      p_last_name: cleanLastName,
      p_public_display_name:
        cleanOptionalText(publicDisplayName) ||
        fallbackDisplayName,
      p_school_type: cleanOptionalText(schoolType),
      p_current_school: cleanOptionalText(currentSchool),
      p_current_level: cleanOptionalText(currentLevel),
      p_academic_year: cleanOptionalText(academicYear),
      p_school_visible: Boolean(schoolVisible),
      p_group_id: groupId || null,
      p_avatar_key: "initials",
    }
  );

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.student_id || !row?.enrolment_id) {
    throw new Error(
      "The learner was created, but the roster command returned an unexpected result."
    );
  }

  return {
    studentId: row.student_id,
    enrolmentId: row.enrolment_id,
    organisationId: row.organisation_id,
    groupId: row.group_id,
    created: row.created === true,
  };
}

export async function updateOrganisationStudentProfile({
  supabase,
  organisationId,
  studentId,
  publicDisplayName,
  schoolType,
  currentSchool = null,
  currentLevel = null,
  academicYear = null,
}) {
  const cleanPublicDisplayName =
    publicDisplayName?.trim();

  const cleanSchoolType =
    schoolType?.trim().toLowerCase();

  if (!cleanPublicDisplayName) {
    throw new Error("Display name is required.");
  }

  if (!organisationId || !studentId) {
    throw new Error(
      "Organisation and learner are required to update the learner profile."
    );
  }

  if (
    ![
      "primary",
      "secondary",
      "no_school",
    ].includes(cleanSchoolType)
  ) {
    throw new Error(
      "A valid learning category is required."
    );
  }

  const isNoSchool =
    cleanSchoolType === "no_school";

  const { data, error } = await supabase.rpc(
    "update_organisation_student_profile",
    {
      p_organisation_id: organisationId,
      p_student_id: studentId,
      p_public_display_name:
        cleanPublicDisplayName,
      p_school_type: cleanSchoolType,
      p_current_school: isNoSchool
        ? null
        : cleanOptionalText(currentSchool),
      p_current_level: isNoSchool
        ? null
        : cleanOptionalText(currentLevel),
      p_academic_year: isNoSchool
        ? null
        : cleanOptionalText(academicYear),
    }
  );

  if (error) {
    throw error;
  }

  const row = Array.isArray(data)
    ? data[0]
    : data;

  if (!row?.student_id) {
    throw new Error(
      "The learner profile was updated, but the roster command returned an unexpected result."
    );
  }

  return {
    studentId: row.student_id,
    publicDisplayName:
      row.public_display_name,
    schoolType: row.school_type,
    currentSchool: row.current_school,
    currentLevel: row.current_level,
    academicYear: row.academic_year,
  };
}
