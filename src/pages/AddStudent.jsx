import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";

const CHILD_LIMIT = 5;

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

const initialFormData = {
  firstName: "",
  lastName: "",
  avatarChoice: "initials",
  schoolType: "primary",
  school: "",
  customSchool: "",
  schoolLevel: "",
  academicYear: "2026–2027",
  schoolVisible: true,
};

function StepIndicator({ currentStep }) {
  const steps = [
    { number: 1, label: "Student" },
    { number: 2, label: "School" },
    { number: 3, label: "Review" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {steps.map((step) => {
        const active = currentStep === step.number;
        const complete = currentStep > step.number;

        return (
          <div
            key={step.number}
            className={[
              "rounded-xl border px-3 py-3 text-center",
              active
                ? "border-blue-600 bg-blue-50"
                : complete
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-white",
            ].join(" ")}
          >
            <div
              className={[
                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-black",
                active
                  ? "bg-blue-600 text-white"
                  : complete
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600",
              ].join(" ")}
            >
              {complete ? "✓" : step.number}
            </div>

            <p className="mt-2 text-xs font-black uppercase tracking-wide text-gray-600">
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function LoadingAddStudent() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <h1 className="mt-6 text-2xl font-black">
            Checking your account…
          </h1>

          <p className="mt-3 text-gray-600">
            We are confirming your student-profile access.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function AccessMessage({
  title,
  message,
  icon = "!",
  tone = "red",
}) {
  const toneClasses = {
    red: {
      border: "border-red-200",
      circle: "bg-red-100 text-red-700",
    },
    yellow: {
      border: "border-yellow-200",
      circle: "bg-yellow-100 text-yellow-800",
    },
  };

  const selectedTone = toneClasses[tone] || toneClasses.red;

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-16">
        <div
          className={[
            "mx-auto max-w-2xl rounded-2xl border bg-white p-8 text-center shadow-sm",
            selectedTone.border,
          ].join(" ")}
        >
          <div
            className={[
              "mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black",
              selectedTone.circle,
            ].join(" ")}
          >
            {icon}
          </div>

          <h1 className="mt-5 text-3xl font-black">{title}</h1>

          <p className="mt-4 leading-7 text-gray-600">{message}</p>

          <Link
            to="/dashboard"
            className="mt-7 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function AddStudent() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);

  const [accountProfile, setAccountProfile] = useState(null);
  const [childCount, setChildCount] = useState(0);

  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessError, setAccessError] = useState("");

  const [schoolOptions, setSchoolOptions] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolLoadError, setSchoolLoadError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdStudent, setCreatedStudent] = useState(null);

  const isParentAccount =
    accountProfile?.account_type === "parent";

  const limitReached = childCount >= CHILD_LIMIT;

  const publicDisplayName = useMemo(() => {
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();

    if (!firstName) return "Student";
    if (!lastName) return firstName;

    return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
  }, [formData.firstName, formData.lastName]);

  const profileInitials = useMemo(() => {
    const firstInitial = formData.firstName.trim().charAt(0);
    const lastInitial = formData.lastName.trim().charAt(0);

    return `${firstInitial}${lastInitial}`.toUpperCase() || "?";
  }, [formData.firstName, formData.lastName]);

  const levelOptions =
    formData.schoolType === "secondary"
      ? SECONDARY_LEVELS
      : PRIMARY_LEVELS;

  useEffect(() => {
    let active = true;

    async function checkAccountAccess() {
      setIsCheckingAccess(true);
      setAccessError("");

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
                pathname: "/students/add",
              },
            },
          });

          return;
        }

        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select(
              "id, full_name, account_type, account_status"
            )
            .eq("id", user.id)
            .single();

        if (profileError) {
          throw profileError;
        }

        let currentChildCount = 0;

        if (profileData.account_type === "parent") {
          const { count, error: countError } = await supabase
            .from("account_student_links")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("account_id", user.id)
            .eq("relationship_role", "parent");

          if (countError) {
            throw countError;
          }

          currentChildCount = count || 0;
        }

        if (!active) return;

        setAccountProfile(profileData);
        setChildCount(currentChildCount);
      } catch (error) {
        console.error("Add Student access error:", error);

        if (active) {
          setAccessError(
            error?.message ||
              "Your account access could not be confirmed."
          );
        }
      } finally {
        if (active) {
          setIsCheckingAccess(false);
        }
      }
    }

    checkAccountAccess();

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

    if (submitError) {
      setSubmitError("");
    }
  };

  const updateSchoolType = (schoolType) => {
    setFormData((current) => ({
      ...current,
      schoolType,
      school: "",
      customSchool: "",
      schoolLevel: "",
    }));

    setSubmitError("");
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

  const validateStep = () => {
    setSubmitError("");

    if (currentStep === 1) {
      if (
        !formData.firstName.trim() ||
        !formData.lastName.trim()
      ) {
        setSubmitError(
          "Please enter the student’s first name and surname."
        );
        return false;
      }
    }

    if (currentStep === 2) {
      const selectedSchool = getSelectedSchoolName();

      if (!selectedSchool) {
        setSubmitError(
          "Please select or enter the student’s school."
        );
        return false;
      }

      if (!formData.schoolLevel) {
        setSubmitError(
          "Please select the student’s current school level."
        );
        return false;
      }

      if (!formData.academicYear) {
        setSubmitError("Please select the academic year.");
        return false;
      }
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;

    setCurrentStep((current) => Math.min(current + 1, 3));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goBack = () => {
    setSubmitError("");

    setCurrentStep((current) => Math.max(current - 1, 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting || limitReached) return;

    setSubmitError("");

    const selectedSchool = getSelectedSchoolName();

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim()
    ) {
      setSubmitError(
        "Please enter the student’s first name and surname."
      );
      return;
    }

    if (!selectedSchool) {
      setSubmitError(
        "Please select or enter the student’s school."
      );
      return;
    }

    if (!formData.schoolLevel) {
      setSubmitError(
        "Please select the student’s current school level."
      );
      return;
    }

    if (!formData.academicYear) {
      setSubmitError("Please select the academic year.");
      return;
    }

    setIsSubmitting(true);

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
          "You must be logged in to create a student profile."
        );
      }

      const { count, error: countError } = await supabase
        .from("account_student_links")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("account_id", user.id)
        .eq("relationship_role", "parent");

      if (countError) {
        throw countError;
      }

      if ((count || 0) >= CHILD_LIMIT) {
        setChildCount(count || CHILD_LIMIT);

        throw new Error(
          "This account has reached the limit of five child profiles."
        );
      }

      const databaseSchoolType = getDatabaseSchoolType();

      const { data: rpcData, error: rpcError } =
        await supabase.rpc("create_child_profile", {
          child_first_name: formData.firstName.trim(),
          child_last_name: formData.lastName.trim(),
          child_public_display_name: publicDisplayName,
          child_avatar_key: formData.avatarChoice,
          child_school_type: databaseSchoolType,
          child_school_name: selectedSchool,
          child_school_level: formData.schoolLevel,
          child_academic_year: formData.academicYear,
          child_school_visible: formData.schoolVisible,
        });

      if (rpcError) {
        throw rpcError;
      }

      /*
       * A Postgres function returning a composite row will normally
       * return one object. This also safely handles an array response.
       */
      const studentData = Array.isArray(rpcData)
        ? rpcData[0]
        : rpcData;

      if (!studentData?.id) {
        throw new Error(
          "The child profile was created, but its details were not returned."
        );
      }

      setChildCount((current) => current + 1);
      setCreatedStudent(studentData);
    } catch (error) {
      console.error("Student creation error:", error);

      const rawMessage =
        error?.message ||
        "The student profile could not be created. Please try again.";

      const lowerMessage = rawMessage.toLowerCase();

      if (
        lowerMessage.includes("limit of five") ||
        lowerMessage.includes("five child profiles")
      ) {
        setSubmitError(
          "This parent account has reached the limit of five child profiles."
        );
      } else if (
        lowerMessage.includes(
          "only parent or guardian accounts"
        )
      ) {
        setSubmitError(
          "Only parent or guardian accounts can add child profiles."
        );
      } else if (
        lowerMessage.includes("function") &&
        lowerMessage.includes("create_child_profile")
      ) {
        setSubmitError(
          "The child-profile setup function could not be found. Confirm that the create_child_profile SQL was run successfully in Supabase."
        );
      } else if (
        lowerMessage.includes("row-level security") ||
        lowerMessage.includes("permission denied")
      ) {
        setSubmitError(
          "Your account does not have permission to create this child profile."
        );
      } else {
        setSubmitError(rawMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAccess) {
    return <LoadingAddStudent />;
  }

  if (accessError) {
    return (
      <AccessMessage
        title="Student setup unavailable."
        message={accessError}
      />
    );
  }

  if (!isParentAccount) {
    return (
      <AccessMessage
        title="Parent access required."
        message="Student accounts cannot add or manage additional student profiles."
      />
    );
  }

  if (limitReached && !createdStudent) {
    return (
      <AccessMessage
        title="Family profile limit reached."
        message="This account already has five linked child profiles. Additional students will require a future tutor, school or expanded-family plan."
        icon="5"
        tone="yellow"
      />
    );
  }

  if (createdStudent) {
    return (
      <div className="platform-page-bg min-h-screen text-gray-950">
        <SiteHeader />

        <main className="px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-2xl rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl font-black text-green-700">
              ✓
            </div>

            <p className="mt-6 text-sm font-black uppercase tracking-wider text-blue-600">
              Profile created
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              {createdStudent.public_display_name} has been added.
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
              The child profile, parent relationship and first
              academic-history record have been saved to your
              CountMeInTT account.
            </p>

            <div className="mt-5 inline-flex rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-yellow-800">
              {childCount} of {CHILD_LIMIT} child profiles used
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-gray-500">
                    Student
                  </dt>

                  <dd className="mt-1 font-black text-gray-950">
                    {createdStudent.first_name}{" "}
                    {createdStudent.last_name}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-gray-500">
                    Public name
                  </dt>

                  <dd className="mt-1 font-black text-gray-950">
                    {createdStudent.public_display_name}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-gray-500">
                    School
                  </dt>

                  <dd className="mt-1 font-black text-gray-950">
                    {createdStudent.current_school}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold text-gray-500">
                    Level
                  </dt>

                  <dd className="mt-1 font-black text-gray-950">
                    {createdStudent.current_level}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to={`/students/${createdStudent.id}`}
                className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
              >
                View Student Profile
              </Link>

              <Link
                to="/dashboard"
                className="rounded-xl border-2 border-blue-600 bg-white px-6 py-3 font-black text-blue-600 transition hover:bg-blue-50"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Student Profile Setup
              </p>

              <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
                Add a child to your account.
              </h1>

              <p className="mt-3 max-w-3xl text-lg leading-8 text-gray-600">
                Create a parent-managed learning profile with school,
                progress, results and membership records.
              </p>
            </div>

            <div className="shrink-0 rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-yellow-800">
              {childCount} of {CHILD_LIMIT} used
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <StepIndicator currentStep={currentStep} />

            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
            >
              {currentStep === 1 && (
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Step 1
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Tell us about the student.
                  </h2>

                  <p className="mt-3 leading-7 text-gray-600">
                    The public leaderboard name will be generated using
                    the first name and surname initial.
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-[140px_1fr]">
                    <div>
                      <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-yellow-100 text-3xl font-black text-blue-700">
                        {profileInitials}
                      </div>

                      <p className="mt-3 text-sm font-semibold text-gray-500">
                        Child learning profile
                      </p>
                    </div>

                    <div className="grid gap-5">
                      <div className="grid gap-5 sm:grid-cols-2">
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
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Joshua"
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Burton"
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                          Public display name
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {publicDisplayName}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          This name may appear on public leaderboards and
                          challenge pages.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Step 2
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Add school information.
                  </h2>

                  <p className="mt-3 leading-7 text-gray-600">
                    This becomes the student’s first academic-history
                    record.
                  </p>

                  <div className="mt-8 grid gap-6">
                    <div>
                      <p className="mb-3 text-sm font-black text-gray-800">
                        School type
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateSchoolType("primary")
                          }
                          className={[
                            "rounded-xl p-5 text-left transition",
                            formData.schoolType === "primary"
                              ? "border-2 border-blue-600 bg-blue-50"
                              : "border border-gray-200 bg-white hover:border-blue-300",
                          ].join(" ")}
                        >
                          <p className="font-black">
                            Primary School
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            Prep, Standard or primary Grade levels
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateSchoolType("secondary")
                          }
                          className={[
                            "rounded-xl p-5 text-left transition",
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

                    <div className="grid gap-5 sm:grid-cols-2">
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
                          disabled={loadingSchools}
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
                          value={formData.schoolLevel}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                      <div>
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
                          value={formData.customSchool}
                          onChange={handleChange}
                          placeholder="Enter the full school name"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
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
                          value={formData.academicYear}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                          checked={formData.schoolVisible}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
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
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Step 3
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Review the child profile.
                  </h2>

                  <p className="mt-3 leading-7 text-gray-600">
                    Check the information before creating the profile.
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-[140px_1fr]">
                    <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-yellow-100 text-3xl font-black text-blue-700">
                      {profileInitials}
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-xl border border-gray-200 p-5">
                        <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                          Student
                        </p>

                        <p className="mt-2 text-2xl font-black">
                          {formData.firstName} {formData.lastName}
                        </p>

                        <p className="mt-1 text-gray-600">
                          Publicly displayed as {publicDisplayName}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-5">
                        <p className="text-sm font-black uppercase tracking-wide text-blue-600">
                          Academic record
                        </p>

                        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="font-bold text-gray-500">
                              School type
                            </dt>

                            <dd className="mt-1 font-black capitalize text-gray-900">
                              {getDatabaseSchoolType().replace(
                                "_",
                                " "
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-bold text-gray-500">
                              School
                            </dt>

                            <dd className="mt-1 font-black text-gray-900">
                              {getSelectedSchoolName()}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-bold text-gray-500">
                              Level
                            </dt>

                            <dd className="mt-1 font-black text-gray-900">
                              {formData.schoolLevel}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-bold text-gray-500">
                              Academic year
                            </dt>

                            <dd className="mt-1 font-black text-gray-900">
                              {formData.academicYear}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                        <p className="font-black">
                          Parent-managed child profile
                        </p>

                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          You will be able to view progress, edit school
                          information and manage membership. Gameplay
                          cannot be saved under this child until a
                          student login is connected.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {submitError && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                >
                  {submitError}
                </div>
              )}

              <div className="mt-9 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-black text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      Back
                    </button>
                  )}
                </div>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting
                      ? "Creating Child Profile..."
                      : "Create Child Profile"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

