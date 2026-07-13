import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

const sampleStudents = {
  joshua: {
    firstName: "Joshua",
    lastName: "Burton",
    schoolType: "primary",
    school: "St Xavier's Private School",
    customSchool: "",
    schoolLevel: "Standard 4",
    academicYear: "2026–2027",
    schoolVisible: true,
  },

  maya: {
    firstName: "Maya",
    lastName: "Burton",
    schoolType: "primary",
    school: "San Juan Girls' RC School",
    customSchool: "",
    schoolLevel: "Standard 2",
    academicYear: "2026–2027",
    schoolVisible: false,
  },
};

export default function EditStudent() {
  const { studentId } = useParams();

  const initialStudent =
    sampleStudents[studentId] || sampleStudents.joshua;

  const [formData, setFormData] = useState(initialStudent);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolLoadError, setSchoolLoadError] = useState("");
  const [saved, setSaved] = useState(false);

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
    const nextStudent =
      sampleStudents[studentId] || sampleStudents.joshua;

    setFormData(nextStudent);
    setSaved(false);
  }, [studentId]);

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

    setSaved(false);
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
  };

  const getSelectedSchoolName = () => {
    if (formData.school === "Other") {
      return formData.customSchool.trim();
    }

    return formData.school.trim();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const selectedSchool = getSelectedSchoolName();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Please enter the student’s first name and surname.");
      return;
    }

    if (!selectedSchool) {
      alert("Please select or enter the student’s school.");
      return;
    }

    if (!formData.schoolLevel) {
      alert("Please select the student’s current school level.");
      return;
    }

    if (!formData.academicYear) {
      alert("Please select the academic year.");
      return;
    }

    const payload = {
      studentId,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      publicDisplayName,
      schoolType: formData.schoolType,
      school: selectedSchool,
      schoolLevel: formData.schoolLevel,
      academicYear: formData.academicYear,
      schoolVisible: formData.schoolVisible,
    };

    console.log("Student profile update submitted:", payload);

    // Temporary until Supabase is connected.
    setSaved(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
                Keep the student’s personal and academic information current.
                Previous academic records will remain part of the school
                history.
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
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 font-black text-green-700">
                    ✓
                  </div>

                  <div>
                    <h2 className="font-black text-gray-950">
                      Profile changes saved.
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      The update is currently a local UI preview. Supabase will
                      store the changes once the database is connected.
                    </p>
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
                          value={formData.firstName}
                          onChange={handleChange}
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
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                        The display name is generated automatically and cannot
                        be entered separately.
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
                      Updating this information will create or update the
                      current academic record without removing earlier school
                      history.
                    </p>

                    <div className="mt-6">
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
                          value={formData.customSchool}
                          onChange={handleChange}
                          placeholder="Enter the full school name"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                  </section>
                </div>
              </div>

              <div className="mt-9 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to={`/students/${studentId}`}
                  className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
                >
                  Save Changes
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

