import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminLayout from "../../components/admin/layout/AdminLayout";

import {
  createInstitutionalStudentLogin,
  fetchInstitutionalLoginContext,
  validateInitialPassword,
  validateStudentUsername,
} from "../../services/adminStudentLoginService";

function getStudentName(student) {
  return (
    student?.public_display_name ||
    `${student?.first_name || ""} ${student?.last_name || ""}`.trim() ||
    "Learner"
  );
}

export default function OrganisationStudentLoginPage() {
  const {
    organisationId,
    studentId,
  } = useParams();

  const [context, setContext] =
    useState(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState("");

  const [username, setUsername] =
    useState("");
  const [
    initialPassword,
    setInitialPassword,
  ] = useState("");
  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");
  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [submitError, setSubmitError] =
    useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function loadContext() {
    try {
      setIsLoading(true);
      setLoadError("");

      const data =
        await fetchInstitutionalLoginContext({
          organisationId,
          studentId,
        });

      setContext(data);
    } catch (error) {
      console.error(
        "Unable to load institutional login context:",
        error,
      );

      setLoadError(
        error?.message ||
          "The learner login page could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadContext();
  }, [organisationId, studentId]);

  const validationError = useMemo(() => {
    const normalizedUsername =
      username.trim().toLowerCase();

    if (!normalizedUsername) {
      return "";
    }

    const usernameError =
      validateStudentUsername(
        normalizedUsername,
      );

    if (usernameError) {
      return usernameError;
    }

    if (initialPassword) {
      const passwordError =
        validateInitialPassword(
          initialPassword,
        );

      if (passwordError) {
        return passwordError;
      }
    }

    if (
      initialPassword &&
      confirmPassword &&
      initialPassword !== confirmPassword
    ) {
      return "The Initial Password entries do not match.";
    }

    return "";
  }, [
    username,
    initialPassword,
    confirmPassword,
  ]);

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError("");

    const usernameError =
      validateStudentUsername(username);

    if (usernameError) {
      setSubmitError(usernameError);
      return;
    }

    const passwordError =
      validateInitialPassword(
        initialPassword,
      );

    if (passwordError) {
      setSubmitError(passwordError);
      return;
    }

    if (
      initialPassword !== confirmPassword
    ) {
      setSubmitError(
        "The Initial Password entries do not match.",
      );
      return;
    }

    if (!context?.canManageCredentials) {
      setSubmitError(
        "You are not authorised to manage credentials for this learner.",
      );
      return;
    }

    if (context?.login) {
      setSubmitError(
        "This learner already has a login.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await createInstitutionalStudentLogin({
        organisationId,
        studentId,
        username,
        initialPassword,
      });

      setInitialPassword("");
      setConfirmPassword("");

      await loadContext();
    } catch (error) {
      console.error(
        "Unable to create learner login:",
        error,
      );

      setSubmitError(
        error?.message ||
          "The learner login could not be created.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <p className="font-bold text-slate-600">
            Loading learner login...
          </p>
        </section>
      </AdminLayout>
    );
  }

  const schoolPath =
    `/admin/schools/${organisationId}`;

  if (loadError || !context) {
    return (
      <AdminLayout>
        <section className="py-16 text-center">
          <h1 className="text-2xl font-black text-red-700">
            Unable to load learner login
          </h1>

          <p className="mt-3 text-red-600">
            {loadError ||
              "The requested learner could not be loaded."}
          </p>

          <Link
            to={schoolPath}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={18} />
            Return to school
          </Link>
        </section>
      </AdminLayout>
    );
  }

  const {
    organisation,
    student,
    login,
    canManageCredentials,
  } = context;

  const studentName =
    getStudentName(student);

  return (
    <AdminLayout>
      <section className="mx-auto max-w-3xl pb-12">
        <Link
          to={schoolPath}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft size={18} />
          Back to {organisation?.name || "school"}
        </Link>

        <div className="mt-7">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
            Student Credentials
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            {login
              ? "Manage Student Login"
              : "Create Student Login"}
          </h1>

          <div className="mt-6 flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
              <UserRound size={23} />
            </div>

            <div>
              <p className="text-lg font-black text-slate-950">
                {studentName}
              </p>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {organisation?.name}
              </p>
            </div>
          </div>
        </div>

        {!canManageCredentials && (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-3">
              <ShieldCheck
                size={22}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <h2 className="font-black text-amber-900">
                  Credential management unavailable
                </h2>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  This Admin account is not authorised
                  to manage institutional credentials
                  for this learner.
                </p>
              </div>
            </div>
          </div>
        )}

        {login ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <KeyRound size={22} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Login created
                </p>

                <h2 className="mt-2 break-all text-2xl font-black text-slate-950">
                  {login.username}
                </h2>               
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              This slice verifies creation and the
              resulting login record only. Password
              reset controls are intentionally not
              included yet.
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                <KeyRound size={21} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Create login
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Set the learner's username and
                  Initial Password.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-6">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Username
                </span>

                <input
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value.toLowerCase(),
                    )
                  }
                  disabled={
                    !canManageCredentials ||
                    isSubmitting
                  }
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-medium text-slate-950 outline-none transition focus:border-yellow-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="aiden.username"
                />

                <span className="mt-2 block text-xs leading-5 text-slate-400">
                  4–30 characters. Lowercase letters,
                  numbers, dots, underscores and
                  hyphens only.
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Initial Password
                </span>

                <div className="relative mt-2">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={initialPassword}
                    onChange={(event) =>
                      setInitialPassword(
                        event.target.value,
                      )
                    }
                    disabled={
                      !canManageCredentials ||
                      isSubmitting
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base font-medium text-slate-950 outline-none transition focus:border-yellow-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <span className="mt-2 block text-xs leading-5 text-slate-400">
                  At least 8 characters.
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Confirm Initial Password
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  disabled={
                    !canManageCredentials ||
                    isSubmitting
                  }
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-medium text-slate-950 outline-none transition focus:border-yellow-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              The password you set becomes the
              learner's password immediately.
              CountMeInTT does not display stored
              passwords.
            </div>

            {(validationError ||
              submitError) && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {submitError ||
                  validationError}
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                to={schoolPath}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  !canManageCredentials ||
                  isSubmitting ||
                  !username.trim() ||
                  !initialPassword ||
                  !confirmPassword
                }
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-yellow-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Creating Login..."
                  : "Create Login"}
              </button>
            </div>
          </form>
        )}
      </section>
    </AdminLayout>
  );
}
