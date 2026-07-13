import React, { useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    // Temporary until Supabase password recovery is connected.
    console.log("Password reset requested for:", email);
    setSubmitted(true);
  };

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              Account Recovery
            </p>

            <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
              Forgot your password?
            </h1>

            <p className="mt-3 max-w-2xl text-lg leading-8 text-gray-600">
              Enter the email connected to your CountMeInTT account and we
              will send password-reset instructions.
            </p>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              {!submitted ? (
                <>
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Reset password
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Enter your email address.
                  </h2>

                  <p className="mt-3 leading-7 text-gray-600">
                    Use the same email address you entered when creating your
                    account.
                  </p>

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
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
                    >
                      Send Reset Instructions
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-3xl">
                    ✉️
                  </div>

                  <p className="mt-6 text-sm font-black uppercase tracking-wider text-blue-600">
                    Check your email
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Reset instructions requested.
                  </h2>

                  <p className="mt-4 leading-7 text-gray-600">
                    If an account exists for{" "}
                    <span className="font-black text-gray-950">{email}</span>,
                    password-reset instructions will be sent to that address.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-7 rounded-xl border-2 border-blue-600 bg-white px-6 py-3 font-black text-blue-600 transition hover:bg-blue-50"
                  >
                    Try Another Email
                  </button>
                </div>
              )}

              <div className="mt-8 border-t border-gray-100 pt-6 text-center">
                <Link
                  to="/login"
                  className="font-black text-blue-600 hover:underline"
                >
                  ← Return to Log In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

