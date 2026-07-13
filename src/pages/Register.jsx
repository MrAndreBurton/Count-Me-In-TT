import React, { useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const accountTypes = [
  {
    id: "parent",
    title: "I am a parent or guardian",
    description:
      "Create an account to manage one or more student profiles, memberships and progress records.",
    icon: "👨‍👩‍👧",
  },
  {
    id: "student",
    title: "I am a student registering for myself",
    description:
      "For older students who will manage their own learning profile and membership.",
    icon: "🎓",
  },
];

export default function Register() {
  const [accountType, setAccountType] = useState("parent");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    communicationPreference: "email",
    consentAccepted: false,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("The passwords do not match.");
      return;
    }

    console.log("Registration submitted:", {
      accountType,
      ...formData,
    });

    alert("Registration will be connected to Supabase next.");
  };

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
              Start with a free account, then add a student profile and choose
              membership later.
            </p>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Step 1
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Who is this account for?
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                Choose the account type that best matches how CountMeInTT will
                be used.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {accountTypes.map((type) => {
                const selected = accountType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAccountType(type.id)}
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

                    <h3 className="mt-5 text-xl font-black">{type.title}</h3>

                    <p className="mt-2 leading-7 text-gray-600">
                      {type.description}
                    </p>
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
                    ? "Use the parent or guardian’s information. Student details will be added after the account is created."
                    : "Use your own information. Your student profile will be created automatically after registration."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-black text-gray-800"
                    >
                      {accountType === "parent"
                        ? "Parent or guardian name"
                        : "Full name"}
                    </label>

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder={
                        accountType === "parent"
                          ? "Enter parent or guardian name"
                          : "Enter your full name"
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Optional phone number"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                      value={formData.communicationPreference}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="both">Email and WhatsApp</option>
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
                      Confirm password
                    </label>

                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={8}
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
                </div>

                {accountType === "student" && (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <p className="font-black text-gray-950">
                      Independent student registration
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      This option is intended for older students registering
                      for themselves. Your student profile will be created from
                      the information you provide.
                    </p>
                  </div>
                )}

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <input
                    name="consentAccepted"
                    type="checkbox"
                    required
                    checked={formData.consentAccepted}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
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
                    and the collection of information required to create and
                    manage this account.
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow transition hover:bg-blue-700"
                >
                  Create Account
                </button>
              </form>

              <div className="mt-7 border-t border-gray-100 pt-6 text-center">
                <p className="text-gray-600">Already have an account?</p>

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

