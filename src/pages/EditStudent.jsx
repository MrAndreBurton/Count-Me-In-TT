import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";

const PRIMARY_LEVELS = [
  "Prep 1",
  "Prep 2",
  "Prep 3",
  "Prep 4",
  "Prep 5",
  "Standard 1",
  "Standard 2",
  "Standard 3",
  "Standard 4",
  "Standard 5",
];

const SECONDARY_LEVELS = [
  "Form 1 (Grade 6)",
  "Form 2 (Grade 7)",
  "Form 3 (Grade 8)",
  "Form 4 (Grade 9)",
  "Form 5 (Grade 10)",
  "Lower Six (Grade 12)",
  "Upper Six (Grade 13)",
];

const ACADEMIC_YEARS = [
  "2025–2026",
  "2026–2027",
  "2027–2028",
  "2028–2029",
];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  schoolType: "primary",
  school: "",
  customSchool: "",
  schoolLevel: "",
  academicYear: "2026–2027",
  schoolVisible: true,
};

function getInitials(firstName = "", lastName = "") {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName.trim().charAt(0);

  return `${firstInitial}${lastInitial}`.toUpperCase() || "?";
}

function LoadingEditStudent() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <h1 className="mt-6 text-2xl font-black">
            Loading student profile…
          </h1>

          <p className="mt-3 text-gray-600">
            We are retrieving the student’s information.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function EditStudentError({ message }) {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-black text-red-700">
            !
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Student profile unavailable.
          </h1>

          <p className="mt-4 leading-7 text-gray-600">
            {message}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
            >
              Return to Dashboard
            </Link>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border-2 border-blue-600 bg-white px-6 py-3 font-black text-blue-600 transition hover:bg-blue-50"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function EditStudent() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [originalStudent, setOriginalStudent] = useState(null);

  const [schoolOptions, setSchoolOptions] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [schoolLoadError, setSchoolLoadError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const publicDisplayName = useMemo(() => {
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();

    if (!firstName) return "Student";
    if (!lastName) return firstName;

    return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
  }, [formData.firstName, formData.lastName]);

  const profileInitials = useMemo(
    () => getInitials(formData.firstName, formData.lastName),
    [formData.firstName, formData.lastName]
  );

  const levelOptions =
    formData.schoolType === "secondary"
      ? SECONDARY_LEVELS
      : PRIMARY_LEVELS;

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      setIsLoading(true);
      setLoadError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          navigate("/login", {
            replace: true,
            state: {
              from: {
                pathname: `/students/${studentId}/edit`,
              },
            },
          });

          return;
        }

        const { data, error } = await supabase
          .from("student_profiles")
          .select(
            `
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
              school_visible,
              profile_status,
              created_at,
              updated_at
            `
          )
          .eq("id", studentId)
          .eq("profile_status", "active")
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "This student profile does not exist or you do not have permission to edit it."
          );
        }

        let interfaceSchoolType = data.school_type;

        if (
          !["primary", "secondary"].includes(interfaceSchoolType)
        ) {
          interfaceSchoolType =
            data.current_level?.startsWith("Form") ||
            data.current_level?.includes("Six")
              ? "secondary"
              : "primary";
        }

        const nextFormData = {
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          schoolType: interfaceSchoolType,
          school: data.current_school || "",
          customSchool: "",
          schoolLevel: data.current_level || "",
          academicYear: data.academic_year || "2026–2027",
          schoolVisible: Boolean(data.school_visible),
        };

        if (!active) return;

        setOriginalStudent(data);
        setFormData(nextFormData);
      } catch (error) {
        console.error("Student edit loading error:", error);

        if (active) {
          setLoadError(
            error?.message ||
              "The student profile could not be loaded."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadStudent();

    return () => {
      active = false;
    };
  }, [navigate, studentId]);

  useEffect(() => {
    if (!originalStudent || isLoading) return;

    let active = true;

    async function loadSchools() {
      setLoadingSchools(true);
      setSchoolLoadError("");

      const schoolFile =
        formData.schoolType === "secondary"
          ? "/secondary-schools.json"
          : "/primary-schools.json";

      try {
        const response = await fetch(schoolFile, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const schools = Array.isArray(data?.schools)
          ? [
              ...new Set(
                data.schools
                  .map((school) => String(school || "").trim())
                  .filter(Boolean)
              ),
            ].sort((a, b) =>
              a.localeCompare(b, "en", {
                sensitivity: "base",
              })
            )
          : [];

        if (!active) return;

        setSchoolOptions(schools);

        const currentSchool = formData.school.trim();

        const isSpecialSchool = [
          "",
          "Other",
          "Homeschool",
          "Not currently enrolled",
        ].includes(currentSchool);

        const schoolExistsInList = schools.some(
          (school) =>
            school.toLocaleLowerCase() ===
            currentSchool.toLocaleLowerCase()
        );

        if (
          currentSchool &&
          !isSpecialSchool &&
          !schoolExistsInList
        ) {
          setFormData((current) => ({
            ...current,
            school: "Other",
            customSchool: currentSchool,
          }));
        }

        if (schools.length === 0) {
          setSchoolLoadError(
            "No schools were found in the selected school list."
          );
        }
      } catch (error) {
        console.error("Unable to load schools:", error);

        if (!active) return;

        setSchoolOptions([]);
        setSchoolLoadError(
          "The school list could not be loaded. You can use School not listed."
        );

        const currentSchool = formData.school.trim();

        if (
          currentSchool &&
          ![
            "Other",
            "Homeschool",
            "Not currently enrolled",
          ].includes(currentSchool)
        ) {
          setFormData((current) => ({
            ...current,
            school: "Other",
            customSchool: currentSchool,
          }));
        }
      } finally {
        if (active) {
          setLoadingSchools(false);
        }
      }
    }

    loadSchools();

    return () => {
      active = false;
    };
  }, [
    formData.schoolType,
    isLoading,
    originalStudent,
  ]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setSaved(false);
    setSaveError("");
  };

  const updateSchoolType = (schoolType) => {
    setFormData((current) => ({
      ...current,
      schoolType,
      school: "",
      customSchool: "",
      schoolLevel: "",
    }));

    setSaved(false);
    setSaveError("");
  };

  const getSelectedSchoolName = () => {
    if (formData.school === "Other") {
      return formData.customSchool.trim();
    }

    return formData.school.trim();
  };

  const getDatabaseSchoolType = () => {
    if (formData.school === "Homeschool") {
      return "homeschool";
    }

    if (formData.school === "Not currently enrolled") {
      return "not_enrolled";
    }

    return formData.schoolType;
  };

  const validateForm = () => {
    const selectedSchool = getSelectedSchoolName();

    if (!formData.firstName.trim()) {
      setSaveError("Please enter the student’s first name.");
      return false;
    }

    if (!formData.lastName.trim()) {
      setSaveError("Please enter the student’s surname.");
      return false;
    }

    if (!selectedSchool) {
      setSaveError(
        "Please select or enter the student’s school."
      );
      return false;
    }

    if (!formData.schoolLevel) {
      setSaveError(
        "Please select the student’s current school level."
      );
      return false;
    }

    if (!formData.academicYear) {
      setSaveError("Please select the academic year.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

  if (isSaving) return;

  setSaveError("");
  setSaved(false);

  if (!validateForm()) return;

  setIsSaving(true);

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        "You must be logged in to update this student profile."
      );
    }

    const selectedSchool = getSelectedSchoolName();
    const databaseSchoolType = getDatabaseSchoolType();

    const previousAcademicYear =
      originalStudent.academic_year || "";

    const academicYearChanged =
      previousAcademicYear !== formData.academicYear;

    const updatePayload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      public_display_name: publicDisplayName,
      school_type: databaseSchoolType,
      current_school: selectedSchool,
      current_level: formData.schoolLevel,
      academic_year: formData.academicYear,
      school_visible: formData.schoolVisible,
    };

    /*
     * If the academic year has changed, close the old current
     * history record before creating the new one.
     */
    if (academicYearChanged) {
      const { error: closeHistoryError } = await supabase
        .from("student_school_history")
        .update({
          is_current: false,
        })
        .eq("student_id", studentId)
        .eq("is_current", true);

      if (closeHistoryError) {
        throw new Error(
          `The previous academic record could not be closed: ${closeHistoryError.message}`
        );
      }

      const { error: newHistoryError } = await supabase
        .from("student_school_history")
        .insert({
          student_id: studentId,
          account_id: user.id,
          academic_year: formData.academicYear,
          school_type: databaseSchoolType,
          school_name: selectedSchool,
          school_level: formData.schoolLevel,
          is_current: true,
        });

      if (newHistoryError) {
        /*
         * Restore the previous record as current if the new
         * history row could not be created.
         */
        await supabase
          .from("student_school_history")
          .update({
            is_current: true,
          })
          .eq("student_id", studentId)
          .eq("academic_year", previousAcademicYear);

        throw new Error(
          `The new academic record could not be created: ${newHistoryError.message}`
        );
      }
    } else {
      /*
       * Same academic year:
       * Update the existing history record rather than creating
       * a duplicate.
       */
      const { data: existingHistory, error: historyLookupError } =
        await supabase
          .from("student_school_history")
          .select("id")
          .eq("student_id", studentId)
          .eq("academic_year", formData.academicYear)
          .maybeSingle();

      if (historyLookupError) {
        throw historyLookupError;
      }

      if (existingHistory) {
        const { error: historyUpdateError } = await supabase
          .from("student_school_history")
          .update({
            account_id: user.id,
            school_type: databaseSchoolType,
            school_name: selectedSchool,
            school_level: formData.schoolLevel,
            is_current: true,
          })
          .eq("id", existingHistory.id);

        if (historyUpdateError) {
          throw new Error(
            `The academic record could not be updated: ${historyUpdateError.message}`
          );
        }
      } else {
        const { error: historyInsertError } = await supabase
          .from("student_school_history")
          .insert({
            student_id: studentId,
            account_id: user.id,
            academic_year: formData.academicYear,
            school_type: databaseSchoolType,
            school_name: selectedSchool,
            school_level: formData.schoolLevel,
            is_current: true,
          });

        if (historyInsertError) {
          throw new Error(
            `The academic record could not be created: ${historyInsertError.message}`
          );
        }
      }
    }

    const { data, error } = await supabase
      .from("student_profiles")
      .update(updatePayload)
      .eq("id", studentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    setOriginalStudent(data);

    setFormData((current) => ({
      ...current,
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      schoolType:
        data.school_type === "secondary"
          ? "secondary"
          : "primary",
      school:
        data.school_type === "homeschool"
          ? "Homeschool"
          : data.school_type === "not_enrolled"
            ? "Not currently enrolled"
            : data.current_school || "",
      customSchool: "",
      schoolLevel: data.current_level || "",
      academicYear: data.academic_year || "",
      schoolVisible: Boolean(data.school_visible),
    }));

    setSaved(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Student update error:", error);

    const rawMessage =
      error?.message ||
      "The student profile could not be updated.";

    if (rawMessage.toLowerCase().includes("row-level security")) {
      setSaveError(
        "You do not have permission to update this student profile."
      );
    } else if (
      rawMessage.toLowerCase().includes("duplicate key")
    ) {
      setSaveError(
        "An academic record already exists for this student and academic year."
      );
    } else {
      setSaveError(rawMessage);
    }
  } finally {
    setIsSaving(false);
  }
};

  if (isLoading) {
    return <LoadingEditStudent />;
  }

  if (loadError || !originalStudent) {
    return (
      <EditStudentError
        message={
          loadError ||
          "This student profile could not be found."
        }
      />
    );
  }

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Edit Student Profile
              </p>

              <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
                Update {publicDisplayName}.
              </h1>

              <p className="mt-3 max-w-3xl text-lg leading-8 text-gray-600">
                Keep the student’s personal and academic information
                current. School history will be preserved once the
                academic-history system is connected.
              </p>
            </div>

            <Link
              to={`/students/${studentId}`}
              className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
            >
              Back to Profile
            </Link>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl">
            {saved && (
              <div
                role="status"
                className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 font-black text-green-700">
                    ✓
                  </div>

                  <div>
                    <h2 className="font-black text-gray-950">
                      Profile changes saved.
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      The student information has been updated in
                      CountMeInTT.
                    </p>

                    <Link
                      to={`/students/${studentId}`}
                      className="mt-2 inline-block font-black text-blue-600 hover:underline"
                    >
                      View updated profile →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="grid gap-8 lg:grid-cols-[180px_1fr]">
                <aside>
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-yellow-100 text-4xl font-black text-blue-700">
                    {profileInitials}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-gray-500">
                    Publicly displayed as{" "}
                    <span className="font-black text-gray-800">
                      {publicDisplayName}
                    </span>
                    .
                  </p>

                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    This public name is generated automatically from the
                    student’s first name and surname.
                  </p>
                </aside>

                <div className="grid gap-8">
                  <section>
                    <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                      Student details
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Name and public identity.
                    </h2>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="mb-2 block text-sm font-black text-gray-800"
                        >
                          First name
                        </label>

                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          autoComplete="given-name"
                          required
                          disabled={isSaving}
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="mb-2 block text-sm font-black text-gray-800"
                        >
                          Surname
                        </label>

                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          autoComplete="family-name"
                          required
                          disabled={isSaving}
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                      <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                        Public display name
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {publicDisplayName}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        The display name is generated automatically and
                        cannot be entered separately.
                      </p>
                    </div>
                  </section>

                  <section className="border-t border-gray-100 pt-8">
                    <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                      Current academic record
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      School, level and academic year.
                    </h2>

                    <p className="mt-3 leading-7 text-gray-600">
                      These fields currently update the student’s active
                      academic information.
                    </p>

                    <div className="mt-6">
                      <p className="mb-3 text-sm font-black text-gray-800">
                        School type
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() =>
                            updateSchoolType("primary")
                          }
                          className={[
                            "rounded-xl p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                            formData.schoolType === "primary"
                              ? "border-2 border-blue-600 bg-blue-50"
                              : "border border-gray-200 bg-white hover:border-blue-300",
                          ].join(" ")}
                        >
                          <p className="font-black">Primary School</p>

                          <p className="mt-1 text-sm text-gray-600">
                            Prep, Standard or primary Grade levels
                          </p>
                        </button>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() =>
                            updateSchoolType("secondary")
                          }
                          className={[
                            "rounded-xl p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                            formData.schoolType === "secondary"
                              ? "border-2 border-blue-600 bg-blue-50"
                              : "border border-gray-200 bg-white hover:border-blue-300",
                          ].join(" ")}
                        >
                          <p className="font-black">
                            Secondary School
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            Form, secondary Grade or Sixth Form levels
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="school"
                          className="mb-2 block text-sm font-black text-gray-800"
                        >
                          Current school
                        </label>

                        <select
                          id="school"
                          name="school"
                          required
                          disabled={loadingSchools || isSaving}
                          value={formData.school}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:bg-gray-100"
                        >
                          <option value="">
                            {loadingSchools
                              ? "Loading schools..."
                              : "Select a school"}
                          </option>

                          {schoolOptions.map((school) => (
                            <option key={school} value={school}>
                              {school}
                            </option>
                          ))}

                          <option value="Homeschool">
                            Homeschool
                          </option>

                          <option value="Not currently enrolled">
                            Not currently enrolled
                          </option>

                          <option value="Other">
                            School not listed
                          </option>
                        </select>

                        {schoolLoadError && (
                          <p className="mt-2 text-sm font-semibold text-red-600">
                            {schoolLoadError}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="schoolLevel"
                          className="mb-2 block text-sm font-black text-gray-800"
                        >
                          Current level
                        </label>

                        <select
                          id="schoolLevel"
                          name="schoolLevel"
                          required
                          disabled={isSaving}
                          value={formData.schoolLevel}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        >
                          <option value="">Select level</option>

                          {levelOptions.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.school === "Other" && (
                      <div className="mt-5">
                        <label
                          htmlFor="customSchool"
                          className="mb-2 block text-sm font-black text-gray-800"
                        >
                          Enter school name
                        </label>

                        <input
                          id="customSchool"
                          name="customSchool"
                          type="text"
                          required
                          disabled={isSaving}
                          value={formData.customSchool}
                          onChange={handleChange}
                          placeholder="Enter the full school name"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                      </div>
                    )}

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="academicYear"
                          className="mb-2 block text-sm font-black text-gray-800"
                        >
                          Academic year
                        </label>

                        <select
                          id="academicYear"
                          name="academicYear"
                          required
                          disabled={isSaving}
                          value={formData.academicYear}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        >
                          {ACADEMIC_YEARS.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:mt-7">
                        <input
                          name="schoolVisible"
                          type="checkbox"
                          disabled={isSaving}
                          checked={formData.schoolVisible}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 disabled:cursor-not-allowed"
                        />

                        <span>
                          <span className="block font-black text-gray-800">
                            Show school publicly
                          </span>

                          <span className="mt-1 block text-sm leading-6 text-gray-600">
                            Allow the school name to appear beside
                            eligible leaderboard results.
                          </span>
                        </span>
                      </label>
                    </div>
                  </section>
                </div>
              </div>

              {saveError && (
                <div
                  role="alert"
                  className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                >
                  {saveError}
                </div>
              )}

              <div className="mt-9 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to={`/students/${studentId}`}
                  className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSaving || loadingSchools}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

