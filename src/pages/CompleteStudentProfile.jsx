import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  "2026–2027",
  "2027–2028",
  "2028–2029",
];

const INITIAL_FORM = {
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

function LoadingScreen() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <h1 className="mt-6 text-2xl font-black">
            Loading your student profile…
          </h1>

          <p className="mt-3 text-gray-600">
            We are retrieving your CountMeInTT learning profile.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function AccessMessage({ title, message }) {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-black text-red-700">
            !
          </div>

          <h1 className="mt-5 text-3xl font-black">{title}</h1>

          <p className="mt-4 leading-7 text-gray-600">{message}</p>

          <Link
            to="/dashboard"
            className="mt-7 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function CompleteStudentProfile() {
  const navigate = useNavigate();

  const [accountProfile, setAccountProfile] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM);

  const [schoolOptions, setSchoolOptions] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolLoadError, setSchoolLoadError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const levelOptions =
    formData.schoolType === "secondary"
      ? SECONDARY_LEVELS
      : PRIMARY_LEVELS;

  const studentInitials = useMemo(
    () =>
      getInitials(
        studentProfile?.first_name,
        studentProfile?.last_name
      ),
    [studentProfile]
  );

  useEffect(() => {
    let active = true;

    async function loadProfile() {
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
                pathname: "/complete-student-profile",
              },
            },
          });

          return;
        }

        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select(
              `
                id,
                full_name,
                account_type,
                account_status
              `
            )
            .eq("id", user.id)
            .single();

        if (profileError) {
          throw profileError;
        }

        if (profileData.account_type !== "student") {
          navigate("/dashboard", {
            replace: true,
          });

          return;
        }

        const { data: linkData, error: linkError } =
          await supabase
            .from("account_student_links")
            .select(
              `
                student_id,
                relationship_role,
                can_play
              `
            )
            .eq("account_id", user.id)
            .eq("relationship_role", "student")
            .eq("can_play", true)
            .maybeSingle();

        if (linkError) {
          throw linkError;
        }

        if (!linkData) {
          throw new Error(
            "No student learning profile is linked to this account."
          );
        }

        const { data: studentData, error: studentError } =
          await supabase
            .from("student_profiles")
            .select(
              `
                id,
                first_name,
                last_name,
                public_display_name,
                profile_type,
                profile_status,
                school_type,
                current_school,
                current_level,
                academic_year,
                school_visible
              `
            )
            .eq("id", linkData.student_id)
            .eq("profile_status", "active")
            .maybeSingle();

        if (studentError) {
          throw studentError;
        }

        if (!studentData) {
          throw new Error(
            "Your student learning profile could not be found."
          );
        }

        const profileAlreadyComplete =
          studentData.school_type &&
          studentData.current_school &&
          studentData.current_level &&
          studentData.academic_year;

        if (profileAlreadyComplete) {
          navigate("/dashboard", {
            replace: true,
          });

          return;
        }

        if (!active) return;

        setAccountProfile(profileData);
        setStudentProfile(studentData);

        setFormData((current) => ({
          ...current,
          schoolType:
            studentData.school_type === "secondary"
              ? "secondary"
              : "primary",
          school: studentData.current_school || "",
          schoolLevel: studentData.current_level || "",
          academicYear:
            studentData.academic_year || "2026–2027",
          schoolVisible: Boolean(
            studentData.school_visible ?? true
          ),
        }));
      } catch (error) {
        console.error(
          "Student profile setup loading error:",
          error
        );

        if (active) {
          setLoadError(
            error?.message ||
              "Your student profile could not be loaded."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
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

        if (schools.length === 0) {
          setSchoolLoadError(
            "No schools were found in the selected list."
          );
        }
      } catch (error) {
        console.error("School list loading error:", error);

        if (!active) return;

        setSchoolOptions([]);
        setSchoolLoadError(
          "The school list could not be loaded. Use School not listed."
        );
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
  }, [formData.schoolType]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSaving) return;

    setSaveError("");

    const selectedSchool = getSelectedSchoolName();

    if (!selectedSchool) {
      setSaveError(
        "Please select or enter your current school."
      );
      return;
    }

    if (!formData.schoolLevel) {
      setSaveError("Please select your current level.");
      return;
    }

    if (!formData.academicYear) {
      setSaveError("Please select the academic year.");
      return;
    }

    setIsSaving(true);

    try {
      const { data: rpcData, error: rpcError } =
        await supabase.rpc(
          "complete_own_student_profile",
          {
            profile_school_type: getDatabaseSchoolType(),
            profile_school_name: selectedSchool,
            profile_school_level: formData.schoolLevel,
            profile_academic_year: formData.academicYear,
            profile_school_visible: formData.schoolVisible,
          }
        );

      if (rpcError) {
        throw rpcError;
      }

      const updatedProfile = Array.isArray(rpcData)
        ? rpcData[0]
        : rpcData;

      if (!updatedProfile?.id) {
        throw new Error(
          "Your profile was updated, but the saved details were not returned."
        );
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Student profile completion error:",
        error
      );

      const rawMessage =
        error?.message ||
        "Your student profile could not be completed.";

      const lowerMessage = rawMessage.toLowerCase();

      if (
        lowerMessage.includes("function") &&
        lowerMessage.includes(
          "complete_own_student_profile"
        )
      ) {
        setSaveError(
          "The student-profile completion function could not be found. Confirm that the SQL function was created in Supabase."
        );
      } else if (
        lowerMessage.includes("only student accounts")
      ) {
        setSaveError(
          "Only an independent student account can complete this profile."
        );
      } else {
        setSaveError(rawMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (loadError || !studentProfile) {
    return (
      <AccessMessage
        title="Profile setup unavailable."
        message={
          loadError ||
          "Your student learning profile could not be found."
        }
      />
    );
  }

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              Student Profile Setup
            </p>

            <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
              Complete your learning profile.
            </h1>

            <p className="mt-3 max-w-3xl text-lg leading-8 text-gray-600">
              Add your school, current level and academic year before
              you begin saving CountMeInTT progress.
            </p>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.35fr_0.65fr]">
            <aside>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-black text-blue-700">
                  {studentInitials}
                </div>

                <p className="mt-5 text-sm font-black uppercase tracking-wider text-blue-600">
                  Student Profile
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {studentProfile.public_display_name ||
                    accountProfile?.full_name}
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Results from games you play while logged in will be
                  saved to this profile.
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <h3 className="font-black">
                  One profile, your progress
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Student accounts cannot add other students. This is
                  your personal playable learning profile.
                </p>
              </div>
            </aside>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                School Information
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Where are you currently studying?
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                This information helps organise your progress and
                eligible leaderboard results.
              </p>

              <div className="mt-8">
                <p className="mb-3 text-sm font-black text-gray-800">
                  School type
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => updateSchoolType("primary")}
                    className={[
                      "rounded-xl p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                      formData.schoolType === "primary"
                        ? "border-2 border-blue-600 bg-blue-50"
                        : "border border-gray-200 bg-white hover:border-blue-300",
                    ].join(" ")}
                  >
                    <p className="font-black">Primary School</p>

                    <p className="mt-1 text-sm text-gray-600">
                      Prep and Standard levels
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => updateSchoolType("secondary")}
                    className={[
                      "rounded-xl p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                      formData.schoolType === "secondary"
                        ? "border-2 border-blue-600 bg-blue-50"
                        : "border border-gray-200 bg-white hover:border-blue-300",
                    ].join(" ")}
                  >
                    <p className="font-black">Secondary School</p>

                    <p className="mt-1 text-sm text-gray-600">
                      Form and Sixth Form levels
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingSchools
                        ? "Loading schools..."
                        : "Select your school"}
                    </option>

                    {schoolOptions.map((school) => (
                      <option key={school} value={school}>
                        {school}
                      </option>
                    ))}

                    <option value="Homeschool">Homeschool</option>

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
                    <option value="">Select your level</option>

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
                      Allow your school to appear beside eligible
                      leaderboard results.
                    </span>
                  </span>
                </label>
              </div>

              {saveError && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                >
                  {saveError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving || loadingSchools}
                className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Completing Profile..."
                  : "Complete Student Profile"}
              </button>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

