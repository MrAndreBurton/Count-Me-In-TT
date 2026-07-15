import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    const email = formData.email.trim().toLowerCase();

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password: formData.password,
        });

      if (error) {
        throw error;
      }

      if (!data?.session || !data?.user) {
        throw new Error(
          "Your session could not be created. Please try again."
        );
      }

      console.log("Supabase login successful:", data.user);

      const redirectPath =
        location.state?.from?.pathname || "/dashboard";

      navigate(redirectPath, {
        replace: true,
      });
    } catch (error) {
      console.error("Login error:", error);

      const rawMessage =
        error?.message ||
        "We could not log you in. Please try again.";

      const lowerMessage = rawMessage.toLowerCase();

      if (
        lowerMessage.includes("invalid login credentials") ||
        lowerMessage.includes("invalid credentials")
      ) {
        setErrorMessage(
          "The email address or password is incorrect."
        );
      } else if (
        lowerMessage.includes("email not confirmed") ||
        lowerMessage.includes("email_not_confirmed")
      ) {
        setErrorMessage(
          "Please verify your email address before logging in."
        );
      } else {
        setErrorMessage(rawMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Sign in to manage student profiles, view saved results and
              continue your CountMeInTT journey.
            </p>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Sign in
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Access your account.
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-black text-gray-800"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="block text-sm font-black text-gray-800"
                    >
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-sm font-black text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent px-2 py-1 text-sm font-black text-blue-600 hover:border-transparent"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
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
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Logging In..." : "Log In"}
                </button>
              </form>

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
            </div>

            <aside className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Your CountMeInTT account
              </p>

              <h2 className="mt-2 text-2xl font-black">
                One login. Every student profile.
              </h2>

              <p className="mt-4 leading-7 text-gray-700">
                Parents can manage multiple children from one account. Older
                students registering independently can manage their own
                learning profile.
              </p>

              <ul className="mt-6 grid gap-4">
                {[
                  "View saved results and personal bests",
                  "Manage each student’s membership",
                  "Update school and academic information",
                  "Access badges, progress and learning records",
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

