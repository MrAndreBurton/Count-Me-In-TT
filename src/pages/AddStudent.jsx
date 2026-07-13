import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

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

export default function AddStudent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolLoadError, setSchoolLoadError] = useState("");
  const [profileCreated, setProfileCreated] = useState(false);

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
              a.localeCompare(b, "en", { sensitivity: "base" })
            )
          : [];

        if (active) {
          setSchoolOptions(schools);

          if (schools.length === 0) {
            setSchoolLoadError(
              "No schools were found in the selected school list."
            );
          }
        }
      } catch (error) {
        console.error("Unable to load schools:", error);

        if (active) {
          setSchoolOptions([]);
          setSchoolLoadError(
            "The school list could not be loaded. You can use School not listed."
          );
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
  }, [formData.schoolType]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateSchoolType = (schoolType) => {
    setFormData((current) => ({
      ...current,
      schoolType,
      school: "",
      customSchool: "",
      schoolLevel: "",
    }));
  };

  const getSelectedSchoolName = () => {
    if (formData.school === "Other") {
      return formData.customSchool.trim();
    }

    return formData.school.trim();
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        alert("Please enter the student’s first name and surname.");
        return false;
      }
    }

    if (currentStep === 2) {
      const selectedSchool = getSelectedSchoolName();

      if (!selectedSchool) {
        alert("Please select or enter the student’s school.");
        return false;
      }

      if (!formData.schoolLevel) {
        alert("Please select the student’s current school level.");
        return false;
      }

      if (!formData.academicYear) {
        alert("Please select the academic year.");
        return false;
      }
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;

    setCurrentStep((current) => Math.min(current + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setCurrentStep((current) => Math.max(current - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const selectedSchool = getSelectedSchoolName();

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      publicDisplayName,
      avatarChoice: formData.avatarChoice,
      schoolType: formData.schoolType,
      school: selectedSchool,
      schoolLevel: formData.schoolLevel,
      academicYear: formData.academicYear,
      schoolVisible: formData.schoolVisible,
      membershipPlan: "free",
    };

    console.log("Student profile submitted:", payload);

    // Temporary until Supabase is connected.
    setProfileCreated(true);
  };

  if (profileCreated) {
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
              {publicDisplayName} is ready to play.
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
              The student profile has been created with Free Account access.
              Membership can be added later.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/games/multiplication"
                className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
              >
                Start Playing
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
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              Student Profile Setup
            </p>

            <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
              Add a student to your account.
            </h1>

            <p className="mt-3 max-w-3xl text-lg leading-8 text-gray-600">
              Each student receives their own learning profile, results,
              badges, school history and membership.
            </p>
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
                    The public leaderboard name will be generated
                    automatically using the first name and surname initial.
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-[140px_1fr]">
                    <div>
                      <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-yellow-100 text-3xl font-black text-blue-700">
                        {profileInitials}
                      </div>

                      <p className="mt-3 text-sm font-semibold text-gray-500">
                        Avatar options can be expanded later.
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
                          This is the name that may appear on public
                          leaderboards and challenge pages.
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
                    This record will become part of the student’s academic
                    history and can be updated in future academic years.
                  </p>

                  <div className="mt-8 grid gap-6">
                    <div>
                      <p className="mb-3 text-sm font-black text-gray-800">
                        School type
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => updateSchoolType("primary")}
                          className={[
                            "rounded-xl p-5 text-left transition",
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
                          onClick={() => updateSchoolType("secondary")}
                          className={[
                            "rounded-xl p-5 text-left transition",
                            formData.schoolType === "secondary"
                              ? "border-2 border-blue-600 bg-blue-50"
                              : "border border-gray-200 bg-white hover:border-blue-300",
                          ].join(" ")}
                        >
                          <p className="font-black">Secondary School</p>

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

                          <option value="Homeschool">Homeschool</option>

                          <option value="Not currently enrolled">
                            Not currently enrolled
                          </option>

                          <option value="Other">School not listed</option>
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
                            Allow the school name to appear beside eligible
                            leaderboard results.
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
                    Review the student profile.
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
                          Current academic record
                        </p>

                        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="font-bold text-gray-500">
                              School type
                            </dt>

                            <dd className="mt-1 font-black capitalize text-gray-900">
                              {formData.schoolType}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-bold text-gray-500">School</dt>

                            <dd className="mt-1 font-black text-gray-900">
                              {getSelectedSchoolName()}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-bold text-gray-500">Level</dt>

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

                          <div>
                            <dt className="font-bold text-gray-500">
                              Public school visibility
                            </dt>

                            <dd className="mt-1 font-black text-gray-900">
                              {formData.schoolVisible ? "Visible" : "Hidden"}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                        <p className="font-black">
                          Starting plan: Free Account
                        </p>

                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          The student will be able to save a personal best,
                          retain the latest 10 results and access the Top 50
                          Math Language terms.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-9 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-black text-gray-700 transition hover:bg-gray-50 sm:w-auto"
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
                    className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
                  >
                    Create Student Profile
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


