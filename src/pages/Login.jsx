import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";
import {
  recordStudentLogin,
  signInStudent,
} from "../lib/studentLogin";

const LOGIN_TYPES = {
  ADULT: "adult",
  STUDENT: "student",
};

function normalizeAdultLoginError(error) {
  const rawMessage =
    error?.message ||
    "We could not log you in. Please try again.";

  const lowerMessage = rawMessage.toLowerCase();

  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid credentials")
  ) {
    return "The email address or password is incorrect.";
  }

  if (
    lowerMessage.includes("email not confirmed") ||
    lowerMessage.includes("email_not_confirmed")
  ) {
    return "Please verify your email address before logging in.";
  }

  return rawMessage;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loginType, setLoginType] = useState(LOGIN_TYPES.ADULT);

  const [adultForm, setAdultForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [studentForm, setStudentForm] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isStudentLogin = loginType === LOGIN_TYPES.STUDENT;

  const switchLoginType = (nextType) => {
    if (isSubmitting) return;
    setLoginType(nextType);
    setShowPassword(false);
    setErrorMessage("");
  };

  const handleAdultChange = (event) => {
    const { name, value, type, checked } = event.target;

    setAdultForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrorMessage("");
  };

  const handleStudentChange = (event) => {
    const { name, value, type, checked } = event.target;

    setStudentForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrorMessage("");
  };

  const handleAdultLogin = async () => {
    const email = adultForm.email.trim().toLowerCase();

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password: adultForm.password,
      });

    if (error) throw error;

    if (!data?.session || !data?.user) {
      throw new Error(
        "Your session could not be created. Please try again."
      );
    }

    const { data: accountProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, account_type, account_status")
        .eq("id", data.user.id)
        .maybeSingle();

    if (profileError) throw profileError;

    if (
      accountProfile?.account_status &&
      accountProfile.account_status !== "active"
    ) {
      await supabase.auth.signOut();
      throw new Error("This account is not currently active.");
    }
  };

  const handleStudentLogin = async () => {
  const outcome = await signInStudent({
    username: studentForm.username,
    password: studentForm.password,
  });

  if (!outcome?.session || !outcome?.user) {
    throw new Error(
      "Your student session could not be created. Please try again."
    );
  }

  const {
    data: loginAccount,
    error: loginAccountError,
  } = await supabase
    .from("student_login_accounts")
    .select(
      `
        id,
        login_status,
        must_change_password,
        last_login_at
      `
    )
    .eq("student_account_id", outcome.user.id)
    .maybeSingle();

  if (loginAccountError) {
    throw loginAccountError;
  }

  if (!loginAccount) {
    await supabase.auth.signOut();

    throw new Error(
      "This student login is not connected to a learning profile."
    );
  }

  if (loginAccount.login_status === "disabled") {
    await supabase.auth.signOut();

    throw new Error(
      "This student login has been disabled. Please ask a parent or guardian for help."
    );
  }

  try {
    await recordStudentLogin();
  } catch (error) {
    console.error(
      "Unable to record student login:",
      error
    );
  }

  return {
    user: outcome.user,
    loginAccount,
  };
};

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isStudentLogin) {
        await handleStudentLogin();
      } else {
        await handleAdultLogin();
      }

      const redirectPath =
        location.state?.from?.pathname || "/dashboard";

      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Login error:", error);

      setErrorMessage(
        isStudentLogin
          ? error?.message ||
              "The student username or password is incorrect."
          : normalizeAdultLoginError(error)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRememberMe = isStudentLogin
    ? studentForm.rememberMe
    : adultForm.rememberMe;

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              CountMeInTT Account
            </p>

            <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
              Welcome back.
            </h1>

            <p className="mt-3 max-w-2xl text-lg leading-8 text-gray-600">
              Parents and adults sign in with an email address.
              Students sign in with the username created by their parent.
            </p>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Sign In
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Access your account.
              </h2>

              <div
                className="mt-7 grid grid-cols-2 rounded-2xl border border-gray-200 bg-gray-50 p-1"
                role="tablist"
                aria-label="Choose login type"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isStudentLogin}
                  onClick={() => switchLoginType(LOGIN_TYPES.ADULT)}
                  className={[
                    "rounded-xl px-3 py-3 text-sm font-black transition sm:text-base",
                    !isStudentLogin
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-white/70 hover:text-gray-950",
                  ].join(" ")}
                >
                  Parent / Adult
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={isStudentLogin}
                  onClick={() => switchLoginType(LOGIN_TYPES.STUDENT)}
                  className={[
                    "rounded-xl px-3 py-3 text-sm font-black transition sm:text-base",
                    isStudentLogin
                      ? "bg-yellow-300 text-gray-950 shadow-sm"
                      : "text-gray-600 hover:bg-white/70 hover:text-gray-950",
                  ].join(" ")}
                >
                  Student
                </button>
              </div>

              <div
                className={[
                  "mt-5 rounded-xl border p-4",
                  isStudentLogin
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-blue-200 bg-blue-50",
                ].join(" ")}
              >
                <p className="font-black text-gray-950">
                  {isStudentLogin
                    ? "Student Login"
                    : "Parent / Adult Login"}
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {isStudentLogin
                    ? "Use the username and password created by your parent or guardian."
                    : "Use the email address and password connected to your CountMeInTT account."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
                {isStudentLogin ? (
                  <div>
                    <label
                      htmlFor="student-username"
                      className="mb-2 block text-sm font-black text-gray-800"
                    >
                      Student username
                    </label>

                    <input
                      id="student-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={studentForm.username}
                      onChange={handleStudentChange}
                      placeholder="Example: christopherp"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="adult-email"
                      className="mb-2 block text-sm font-black text-gray-800"
                    >
                      Email address
                    </label>

                    <input
                      id="adult-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={adultForm.email}
                      onChange={handleAdultChange}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="login-password"
                      className="block text-sm font-black text-gray-800"
                    >
                      Password
                    </label>

                    {!isStudentLogin && (
                      <Link
                        to="/forgot-password"
                        className="text-sm font-black text-blue-600 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={
                        isStudentLogin
                          ? studentForm.password
                          : adultForm.password
                      }
                      onChange={
                        isStudentLogin
                          ? handleStudentChange
                          : handleAdultChange
                      }
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent px-2 py-1 text-sm font-black text-blue-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    name="rememberMe"
                    type="checkbox"
                    checked={currentRememberMe}
                    onChange={
                      isStudentLogin
                        ? handleStudentChange
                        : handleAdultChange
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                  />

                  <span className="text-sm font-semibold text-gray-700">
                    Keep me signed in on this device
                  </span>
                </label>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={[
                    "w-full rounded-xl px-6 py-3 font-black shadow transition disabled:cursor-not-allowed disabled:opacity-60",
                    isStudentLogin
                      ? "bg-yellow-400 text-gray-950 hover:bg-yellow-300"
                      : "bg-blue-600 text-white hover:bg-blue-700",
                  ].join(" ")}
                >
                  {isSubmitting
                    ? "Logging In..."
                    : isStudentLogin
                      ? "Student Log In"
                      : "Parent / Adult Log In"}
                </button>
              </form>

              {!isStudentLogin ? (
                <div className="mt-7 border-t border-gray-100 pt-6 text-center">
                  <p className="text-gray-600">
                    Do not have an account yet?
                  </p>

                  <Link
                    to="/register"
                    className="mt-3 inline-block rounded-xl border-2 border-blue-600 bg-white px-6 py-3 font-black text-blue-600 transition hover:bg-blue-50"
                  >
                    Create an Account
                  </Link>
                </div>
              ) : (
                <div className="mt-7 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                  <p className="font-black text-gray-950">
                    Do not know your username?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Ask the parent or guardian who created your student login.
                  </p>
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Your CountMeInTT account
              </p>

              <h2 className="mt-2 text-2xl font-black">
                The right access for every player.
              </h2>

              <p className="mt-4 leading-7 text-gray-700">
                Parents manage family profiles. Students log in
                independently so their gameplay saves only to their
                own learning record.
              </p>

              <ul className="mt-6 grid gap-4">
                {[
                  "View saved results and personal bests",
                  "Track Math Language rounds and accuracy",
                  "Earn badges and achievements",
                  "Keep each player’s learning history separate",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-200 font-black"
                    >
                      ✓
                    </span>

                    <span className="pt-0.5 font-semibold text-gray-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 rounded-xl border border-yellow-200 bg-white p-4">
                <p className="font-black text-gray-950">
                  Just want to play?
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  You do not need an account to access the public
                  multiplication game.
                </p>

                <Link
                  to="/games/multiplication"
                  className="mt-4 inline-block font-black text-blue-600 hover:underline"
                >
                  Continue as Guest →
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}