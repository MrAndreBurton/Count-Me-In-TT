import React, { useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [complete, setComplete] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

  if (isSubmitting) return;

  setErrorMessage("");

  if (formData.password !== formData.confirmPassword) {
    setErrorMessage("The passwords do not match.");
    return;
  }

  if (formData.password.length < 8) {
    setErrorMessage(
      "Your new password must contain at least 8 characters."
    );
    return;
  }

  setIsSubmitting(true);

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: formData.password,
    });

    if (error) {
      throw error;
    }

    if (!data?.user) {
      throw new Error(
        "Your password could not be updated. Please request a new reset link."
      );
    }

    setComplete(true);
  } catch (error) {
    console.error("Password update error:", error);

    const message =
      error?.message ||
      "Your password could not be updated. Please request a new reset link.";

    if (
      message.toLowerCase().includes("session") ||
      message.toLowerCase().includes("auth")
    ) {
      setErrorMessage(
        "This password reset link is invalid or has expired. Please request a new one."
      );
    } else {
      setErrorMessage(message);
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
              Account Security
            </p>

            <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
              Create a new password.
            </h1>

            <p className="mt-3 max-w-2xl text-lg leading-8 text-gray-600">
              Choose a secure password for your CountMeInTT account.
            </p>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              {!complete ? (
                <>
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    New password
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Secure your account.
                  </h2>

                  <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-black text-gray-800"
                      >
                        New password
                      </label>

                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          minLength={8}
                          required
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="At least 8 characters"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((current) => !current)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent px-2 py-1 text-sm font-black text-blue-600 hover:border-transparent"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-2 block text-sm font-black text-gray-800"
                      >
                        Confirm new password
                      </label>

                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          minLength={8}
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Re-enter your password"
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((current) => !current)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent px-2 py-1 text-sm font-black text-blue-600 hover:border-transparent"
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
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
                       {isSubmitting
                         ? "Updating Password..."
                         : "Update Password"}
                     </button>

                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                    ✓
                  </div>

                  <h2 className="mt-6 text-3xl font-black">
                    Password updated.
                  </h2>

                  <p className="mt-4 leading-7 text-gray-600">
                    Your new password has been saved. You can now return to the
                    login page.
                  </p>

                  <Link
                    to="/login"
                    className="mt-7 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
                  >
                    Log In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

