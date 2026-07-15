import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";
import {
  createStudentLogin,
  getStudentLoginAccount,
  normalizeStudentUsername,
  validateStudentUsername,
  validateTemporaryPassword,
} from "../lib/studentLogin";

function getInitials(firstName = "", lastName = "") {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName.trim().charAt(0);
  return `${firstInitial}${lastInitial}`.toUpperCase() || "?";
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-TT", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function statusLabel(status = "") {
  const labels = {
    pending: "Pending",
    active: "Active",
    disabled: "Disabled",
    password_reset_required: "Temporary Password Active",
  };

  return labels[status] || "Unknown";
}

function statusClasses(status = "") {
  const classes = {
    pending: "border-yellow-200 bg-yellow-50 text-yellow-800",
    active: "border-green-200 bg-green-50 text-green-800",
    disabled: "border-red-200 bg-red-50 text-red-800",
    password_reset_required: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return classes[status] || "border-gray-200 bg-gray-50 text-gray-700";
}

function LoadingPage() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />
      <main className="px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <h1 className="mt-6 text-2xl font-black">
            Loading student login setup…
          </h1>
          <p className="mt-3 text-gray-600">
            We are checking the student profile and current login status.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function SetupError({ message }) {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />
      <main className="px-5 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-black text-red-700">
            !
          </div>
          <h1 className="mt-5 text-3xl font-black">
            Student login setup unavailable.
          </h1>
          <p className="mt-4 leading-7 text-gray-600">{message}</p>

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

export default function StudentLoginSetup() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [existingLogin, setExistingLogin] = useState(null);

  const [username, setUsername] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setIsLoading(true);
      setLoadError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          navigate("/login", {
            replace: true,
            state: {
              from: {
                pathname: `/students/${studentId}/login-setup`,
              },
            },
          });
          return;
        }

        const [
          { data: accountProfile, error: accountProfileError },
          { data: parentLink, error: parentLinkError },
          { data: studentData, error: studentError },
          loginOutcome,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, account_type, account_status")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("account_student_links")
            .select(
              "id, account_id, student_id, relationship_role, can_view, can_edit"
            )
            .eq("account_id", user.id)
            .eq("student_id", studentId)
            .eq("relationship_role", "parent")
            .eq("can_view", true)
            .maybeSingle(),

          supabase
            .from("student_profiles")
            .select(
              `
                id,
                first_name,
                last_name,
                public_display_name,
                current_school,
                current_level,
                academic_year,
                profile_status,
                student_account_id,
                login_enabled
              `
            )
            .eq("id", studentId)
            .eq("profile_status", "active")
            .maybeSingle(),

          getStudentLoginAccount(studentId),
        ]);

        if (accountProfileError) throw accountProfileError;

        if (
          !accountProfile ||
          accountProfile.account_type !== "parent" ||
          accountProfile.account_status !== "active"
        ) {
          throw new Error(
            "Only an active parent account can set up a student login."
          );
        }

        if (parentLinkError) throw parentLinkError;

        if (!parentLink) {
          throw new Error("You do not manage this student profile.");
        }

        if (studentError) throw studentError;

        if (!studentData) {
          throw new Error("This student profile could not be found.");
        }

        const displayName =
          studentData.public_display_name ||
          `${studentData.first_name || "Student"} ${
            studentData.last_name?.charAt(0)?.toUpperCase() || ""
          }.`.trim();

        if (!active) return;

        setStudent({
          id: studentData.id,
          displayName,
          initials: getInitials(
            studentData.first_name,
            studentData.last_name
          ),
          school: studentData.current_school || "School not added",
          level: studentData.current_level || "Level not added",
          academicYear: studentData.academic_year || "Not added",
          studentAccountId: studentData.student_account_id,
          loginEnabled: Boolean(studentData.login_enabled),
        });

        setExistingLogin(loginOutcome?.login || null);

        if (loginOutcome?.login?.username) {
          setUsername(loginOutcome.login.username);
        }
      } catch (error) {
        console.error("Student login setup loading error:", error);

        if (active) {
          setLoadError(
            error?.message ||
              "The student login setup page could not be loaded."
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [navigate, studentId]);

  const usernameValidation = useMemo(
    () => validateStudentUsername(username),
    [username]
  );

  const passwordValidation = useMemo(
    () => validateTemporaryPassword(temporaryPassword),
    [temporaryPassword]
  );

  const passwordsMatch = temporaryPassword === confirmPassword;
  const normalizedPreview = normalizeStudentUsername(username);

  const formIsValid =
    usernameValidation.valid &&
    passwordValidation.valid &&
    confirmPassword.length > 0 &&
    passwordsMatch;

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting || existingLogin) return;

    setFormError("");
    setSuccessMessage("");

    if (!usernameValidation.valid) {
      setFormError(usernameValidation.message);
      return;
    }

    if (!passwordValidation.valid) {
      setFormError(passwordValidation.message);
      return;
    }

    if (!confirmPassword) {
      setFormError("Confirm the temporary password.");
      return;
    }

    if (!passwordsMatch) {
      setFormError("The temporary passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const outcome = await createStudentLogin({
        studentId,
        username: usernameValidation.normalizedUsername,
        temporaryPassword,
      });

      setExistingLogin(outcome.login);
      setSuccessMessage(
        outcome.message || "Student login created successfully."
      );
      setTemporaryPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Create student login error:", error);
      setFormError(
        error?.message || "The student login could not be created."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <LoadingPage />;

  if (loadError || !student) {
    return (
      <SetupError
        message={
          loadError || "The student profile could not be loaded."
        }
      />
    );
  }

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-xl font-black text-blue-700">
                {student.initials}
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Student Login Setup
                </p>
                <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
                  {student.displayName}
                </h1>
                <p className="mt-3 text-lg font-semibold text-gray-700">
                  {student.level}
                </p>
                <p className="mt-1 text-gray-600">{student.school}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={`/students/${student.id}`}
                className="rounded-xl border-2 border-blue-600 bg-white px-5 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
              >
                View Profile
              </Link>

              <Link
                to="/dashboard"
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-black text-gray-700 transition hover:bg-gray-50"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                How it works
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Give the student their own access.
              </h2>

              <div className="mt-6 grid gap-4">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="font-black text-gray-950">
                    1. Choose a username
                  </p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    The student will use this instead of an email address.
                  </p>
                </div>

                <div className="rounded-xl bg-yellow-50 p-4">
                  <p className="font-black text-gray-950">
                    2. Create a temporary password
                  </p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Share it privately with the student.
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-4">
                  <p className="font-black text-gray-950">
                    3. Student logs in independently
                  </p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Their gameplay will save only to their own profile.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-black uppercase tracking-wide text-gray-500">
                  Important
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  The password is stored securely by Supabase Auth.
                  CountMeInTT does not store or display the current password.
                </p>
              </div>
            </aside>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              {existingLogin ? (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                        Login Created
                      </p>
                      <h2 className="mt-2 text-3xl font-black">
                        Student access is set up.
                      </h2>
                    </div>

                    <span
                      className={[
                        "w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide",
                        statusClasses(
                          existingLogin.login_status ||
                            existingLogin.loginStatus
                        ),
                      ].join(" ")}
                    >
                      {statusLabel(
                        existingLogin.login_status ||
                          existingLogin.loginStatus
                      )}
                    </span>
                  </div>

                  {successMessage && (
                    <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 font-bold text-green-800">
                      ✅ {successMessage}
                    </div>
                  )}

                  <dl className="mt-7 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 p-5 sm:col-span-2">
                      <dt className="text-sm font-black uppercase tracking-wide text-gray-500">
                        Student Username
                      </dt>
                      <dd className="mt-2 break-all text-2xl font-black text-gray-950">
                        {existingLogin.username}
                      </dd>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-5">
                      <dt className="text-sm font-black uppercase tracking-wide text-gray-500">
                        Login Status
                      </dt>
                      <dd className="mt-2 font-black text-gray-950">
                        {statusLabel(
                          existingLogin.login_status ||
                            existingLogin.loginStatus
                        )}
                      </dd>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-5">
                      <dt className="text-sm font-black uppercase tracking-wide text-gray-500">
                        Created
                      </dt>
                      <dd className="mt-2 font-black text-gray-950">
                        {formatDate(
                          existingLogin.created_at ||
                            existingLogin.createdAt
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-7 rounded-xl border border-blue-200 bg-blue-50 p-5">
                    <h3 className="font-black text-gray-950">Next step</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      The student can use the Student Login option with
                      this username and the temporary password you created.
                    </p>
                  </div>

                  <p className="mt-6 text-sm leading-6 text-gray-500">
                    Password reset and login-disable controls will be added
                    after the first student-login test is complete.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Create Login
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    Set the student’s username and password.
                  </h2>
                  <p className="mt-3 leading-7 text-gray-600">
                    This creates a separate student account linked to
                    the existing learning profile.
                  </p>

                  {formError && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">
                      ⚠️ {formError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <label className="block">
                      <span className="text-sm font-black text-gray-700">
                        Student Username
                      </span>

                      <input
                        type="text"
                        value={username}
                        onChange={(event) => {
                          setUsername(event.target.value);
                          setFormError("");
                        }}
                        autoComplete="off"
                        placeholder="Example: christopherp"
                        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />

                      {username && (
                        <p
                          className={[
                            "mt-2 text-sm font-semibold",
                            usernameValidation.valid
                              ? "text-green-700"
                              : "text-red-700",
                          ].join(" ")}
                        >
                          {usernameValidation.valid
                            ? `Username will be: ${normalizedPreview}`
                            : usernameValidation.message}
                        </p>
                      )}
                    </label>

                    <label className="block">
                      <span className="text-sm font-black text-gray-700">
                        Temporary Password
                      </span>

                      <div className="mt-2 flex gap-2">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={temporaryPassword}
                          onChange={(event) => {
                            setTemporaryPassword(event.target.value);
                            setFormError("");
                          }}
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((current) => !current)
                          }
                          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>

                      {temporaryPassword && (
                        <p
                          className={[
                            "mt-2 text-sm font-semibold",
                            passwordValidation.valid
                              ? "text-green-700"
                              : "text-red-700",
                          ].join(" ")}
                        >
                          {passwordValidation.valid
                            ? "Password length accepted."
                            : passwordValidation.message}
                        </p>
                      )}
                    </label>

                    <label className="block">
                      <span className="text-sm font-black text-gray-700">
                        Confirm Temporary Password
                      </span>

                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setFormError("");
                        }}
                        autoComplete="new-password"
                        placeholder="Enter the password again"
                        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />

                      {confirmPassword && (
                        <p
                          className={[
                            "mt-2 text-sm font-semibold",
                            passwordsMatch
                              ? "text-green-700"
                              : "text-red-700",
                          ].join(" ")}
                        >
                          {passwordsMatch
                            ? "Passwords match."
                            : "Passwords do not match."}
                        </p>
                      )}
                    </label>

                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                      <p className="font-black text-gray-950">
                        Before creating the login
                      </p>
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        Record the temporary password somewhere safe.
                        For security, it will not be shown again after
                        the login is created.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !formIsValid}
                      className={[
                        "w-full rounded-xl px-5 py-4 text-lg font-black text-white shadow transition",
                        isSubmitting || !formIsValid
                          ? "cursor-not-allowed bg-blue-300"
                          : "bg-blue-600 hover:bg-blue-700",
                      ].join(" ")}
                    >
                      {isSubmitting
                        ? "Creating Student Login…"
                        : "Create Student Login"}
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}


