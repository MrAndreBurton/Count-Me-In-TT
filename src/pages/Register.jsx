import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { supabase } from "../lib/supabase";

const accountTypes = [
  {
    id: "parent",
    title: "I am a parent or guardian",
    description:
      "Manage up to five child profiles, view their progress and use your own profile to test and play CountMeInTT games.",
    icon: "👨‍👩‍👧",
    features: [
      "Your own playable learning profile",
      "Add up to five child profiles",
      "View and manage each child’s progress",
    ],
  },
  {
    id: "student",
    title: "I am a student registering for myself",
    description:
      "Create one personal learning profile to play games, save results, earn badges and track your progress.",
    icon: "🎓",
    features: [
      "One automatic student profile",
      "Play and save your own results",
      "No child-management access",
    ],
  },
];

const initialFormData = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  communicationPreference: "email",
  consentAccepted: false,
};

function RegistrationSuccess({
  accountType,
  email,
  needsConfirmation,
}) {
  const isStudent = accountType === "student";

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main className="px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-green-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl font-black text-green-700">
            ✓
          </div>

          <p className="mt-6 text-sm font-black uppercase tracking-wider text-blue-600">
            Account created
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Welcome to CountMeInTT.
          </h1>

          {needsConfirmation ? (
            <>
              <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
                We sent a confirmation message to{" "}
                <span className="font-black text-gray-950">
                  {email}
                </span>
                . Open the message and confirm your email before logging
                in.
              </p>

              <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-left">
                <h2 className="font-black text-gray-950">
                  What happens next?
                </h2>

                <ol className="mt-3 grid gap-2 text-sm leading-6 text-gray-700">
                  <li>1. Confirm your email address.</li>
                  <li>2. Return to CountMeInTT and log in.</li>
                  <li>
                    3.{" "}
                    {isStudent
                      ? "Complete your school and student-profile details."
                      : "Open your dashboard and add child profiles when ready."}
                  </li>
                </ol>
              </div>

              <Link
                to="/login"
                className="mt-7 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
              >
                Go to Log In
              </Link>
            </>
          ) : (
            <>
              <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
                Your account and learning profile have been created
                successfully.
              </p>

              <Link
                to={
                  isStudent
                    ? "/complete-student-profile"
                    : "/dashboard"
                }
                className="mt-7 inline-block rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
              >
                {isStudent
                  ? "Complete Student Profile"
                  : "Open Dashboard"}
              </Link>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState("parent");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState(initialFormData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [registrationComplete, setRegistrationComplete] =
    useState(false);

  const [needsEmailConfirmation, setNeedsEmailConfirmation] =
    useState(false);

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

  const selectAccountType = (type) => {
    setAccountType(type);
    setSubmitError("");
  };

  const validateForm = () => {
    const cleanName = formData.fullName.trim();
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!cleanName) {
      setSubmitError("Please enter your full name.");
      return false;
    }

    if (!cleanEmail) {
      setSubmitError("Please enter your email address.");
      return false;
    }

    if (formData.password.length < 8) {
      setSubmitError(
        "Your password must contain at least 8 characters."
      );
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitError("The passwords do not match.");
      return false;
    }

    if (!formData.consentAccepted) {
      setSubmitError(
        "You must accept the Terms of Use and Privacy Policy."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setSubmitError("");

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const cleanName = formData.fullName.trim();
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanPhone = formData.phone.trim();

      const confirmationDestination =
        accountType === "student"
          ? "/complete-student-profile"
          : "/dashboard";

      const emailRedirectTo = `${
        window.location.origin
      }${confirmationDestination}`;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          emailRedirectTo,
          data: {
            full_name: cleanName,
            account_type: accountType,
            phone: cleanPhone || null,
            communication_preference:
              formData.communicationPreference,
            consent_accepted: true,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error(
          "The account could not be created. Please try again."
        );
      }

      /*
       * If email confirmation is disabled, Supabase returns a
       * session immediately and we can continue into the app.
       *
       * If confirmation is enabled, the user exists but the
       * session is null until the email is confirmed.
       */
      if (data.session) {
        if (accountType === "student") {
          navigate("/complete-student-profile", {
            replace: true,
          });
        } else {
          navigate("/dashboard", {
            replace: true,
          });
        }

        return;
      }

      setNeedsEmailConfirmation(true);
      setRegistrationComplete(true);
    } catch (error) {
      console.error("Registration error:", error);

      const rawMessage =
        error?.message ||
        "Your account could not be created. Please try again.";

      const lowerMessage = rawMessage.toLowerCase();

      if (
        lowerMessage.includes("already registered") ||
        lowerMessage.includes("user already exists")
      ) {
        setSubmitError(
          "An account may already exist for this email address. Try logging in or resetting the password."
        );
      } else if (
        lowerMessage.includes("password") &&
        lowerMessage.includes("weak")
      ) {
        setSubmitError(
          "Please choose a stronger password with at least 8 characters."
        );
      } else if (
        lowerMessage.includes("database error") ||
        lowerMessage.includes("saving new user")
      ) {
        setSubmitError(
          "The account was not completed because the profile setup failed. Please check the Supabase registration trigger."
        );
      } else {
        setSubmitError(rawMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationComplete) {
    return (
      <RegistrationSuccess
        accountType={accountType}
        email={formData.email.trim().toLowerCase()}
        needsConfirmation={needsEmailConfirmation}
      />
    );
  }

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              Join CountMeInTT
            </p>

            <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
              Create your CountMeInTT account.
            </h1>

            <p className="mt-3 max-w-3xl text-lg leading-8 text-gray-600">
              Choose how you will use CountMeInTT. Every person who
              plays receives their own learning profile.
            </p>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Step 1
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Choose your account type.
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-gray-600">
                Parents manage children and receive their own playable
                profile. Students receive one personal profile and
                cannot add other students.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {accountTypes.map((type) => {
                const selected = accountType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => selectAccountType(type.id)}
                    aria-pressed={selected}
                    className={[
                      "relative rounded-2xl bg-white p-6 text-left shadow-sm transition duration-200",
                      selected
                        ? "border-2 border-blue-600 ring-4 ring-blue-100"
                        : "border border-gray-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-3xl">
                        <span aria-hidden="true">{type.icon}</span>
                      </div>

                      <span
                        className={[
                          "flex h-6 w-6 items-center justify-center rounded-full border-2",
                          selected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 bg-white",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        {selected ? "✓" : ""}
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-black">
                      {type.title}
                    </h3>

                    <p className="mt-2 leading-7 text-gray-600">
                      {type.description}
                    </p>

                    <ul className="mt-4 grid gap-2">
                      {type.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm font-semibold text-gray-700"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-0.5 text-blue-600"
                          >
                            ✓
                          </span>

                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Step 2
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Enter your account details.
                </h2>

                <p className="mt-3 leading-7 text-gray-600">
                  {accountType === "parent"
                    ? "Use the parent or guardian’s information. Your personal learning profile will be created automatically, and children can be added afterward."
                    : "Use your own information. Your student learning profile will be created automatically, and school details will be completed next."}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-8 grid gap-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-black text-gray-800"
                    >
                      {accountType === "parent"
                        ? "Parent or guardian name"
                        : "Student’s full name"}
                    </label>

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      disabled={isSubmitting}
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder={
                        accountType === "parent"
                          ? "Enter parent or guardian name"
                          : "Enter your full name"
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />
                  </div>

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
                      disabled={isSubmitting}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-black text-gray-800"
                    >
                      Phone number{" "}
                      <span className="font-semibold text-gray-500">
                        (Optional)
                      </span>
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      disabled={isSubmitting}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Optional phone number"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="communicationPreference"
                      className="mb-2 block text-sm font-black text-gray-800"
                    >
                      Communication preference
                    </label>

                    <select
                      id="communicationPreference"
                      name="communicationPreference"
                      disabled={isSubmitting}
                      value={formData.communicationPreference}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="both">
                        Email and WhatsApp
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-black text-gray-800"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        disabled={isSubmitting}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 8 characters"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                      />

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent px-2 py-1 text-sm font-black text-blue-600 hover:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
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
                      Confirm password
                    </label>

                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={
                          showConfirmPassword ? "text" : "password"
                        }
                        autoComplete="new-password"
                        required
                        minLength={8}
                        disabled={isSubmitting}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                      />

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          setShowConfirmPassword(
                            (current) => !current
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent px-2 py-1 text-sm font-black text-blue-600 hover:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className={[
                    "rounded-xl border p-4",
                    accountType === "parent"
                      ? "border-blue-200 bg-blue-50"
                      : "border-yellow-200 bg-yellow-50",
                  ].join(" ")}
                >
                  <p className="font-black text-gray-950">
                    {accountType === "parent"
                      ? "Parent account setup"
                      : "Independent student setup"}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {accountType === "parent"
                      ? "A playable profile for the parent will be created automatically. It does not count toward the five-child family limit."
                      : "One student profile will be created automatically. Student accounts cannot add or manage other students."}
                  </p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <input
                    name="consentAccepted"
                    type="checkbox"
                    required
                    disabled={isSubmitting}
                    checked={formData.consentAccepted}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 disabled:cursor-not-allowed"
                  />

                  <span className="text-sm leading-6 text-gray-700">
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="font-black text-blue-600 hover:underline"
                    >
                      Terms of Use
                    </Link>
                    ,{" "}
                    <Link
                      to="/privacy"
                      className="font-black text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </Link>{" "}
                    and the collection of information required to
                    create and manage this account.
                  </span>
                </label>

                {submitError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                  >
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Creating Account..."
                    : "Create Account"}
                </button>
              </form>

              <div className="mt-7 border-t border-gray-100 pt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?
                </p>

                <Link
                  to="/login"
                  className="mt-3 inline-block rounded-xl border-2 border-blue-600 bg-white px-6 py-3 font-black text-blue-600 transition hover:bg-blue-50"
                >
                  Log In
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


