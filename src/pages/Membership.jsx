import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { getPlayableProfileMembership } from "../lib/membership";
import { getMembershipPlanName } from "../lib/membershipAccess";


const plans = [
  {
    id: "free",
    name: "Free Account",
    price: "TT$0",
    duration: "Ongoing",
    badge: null,
    featured: false,
    description:
      "Create a student profile and begin saving basic progress.",
    features: [
      "Student profile",
      "Personal best saved",
      "Last 10 results",
      "Access to free games",
      "Top 50 Math Language terms",
    ],
    action: "Create Free Account",
    link: "/register",
  },
  {
    id: "term",
    name: "Term Membership",
    price: "TT$40",
    duration: "120 days",
    badge: "Flexible Option",
    featured: false,
    description:
      "A shorter membership period with full access to premium features.",
    features: [
      "Unlimited game history",
      "Full progress dashboard",
      "Full 200 Math Language terms",
      "Student reports",
      "Premium badges and activities",
    ],
    action: "Request Term Membership",
    link: "/membership/request?plan=term",
  },
  {
    id: "annual",
    name: "Annual Membership",
    price: "TT$100",
    duration: "365 days",
    badge: "Best Value",
    featured: true,
    description:
      "A full year of access with the best overall membership value.",
    features: [
      "Everything in Term Membership",
      "Full year of access",
      "Fewer renewals",
      "Continuous yearly progress",
      "Full platform membership benefits",
    ],
    action: "Request Annual Membership",
    link: "/membership/request?plan=annual",
  },
];

const faqs = [
  {
    question: "Can I manage more than one child?",
    answer:
      "Yes. One parent account can manage multiple student profiles. Each child has a separate membership and progress record.",
  },
  {
    question: "Can my child still play without membership?",
    answer:
      "Yes. Public games remain open and free to play. Membership is for families who want saved progress, reports and premium access.",
  },
  {
    question: "What happens when membership expires?",
    answer:
      "The student can still log in and view previous records for 30 days, but premium features will be locked until renewal.",
  },
  {
    question: "Are payments recurring automatically?",
    answer:
      "No. Payments and renewals are currently manual. CountMeInTT will not automatically charge the parent again.",
  },
];

function PlanCard({
  plan,
  disabled = false,
  disabledMessage = "",
  isLoading = false,
}) {
  const buttonLabel = isLoading
    ? "Checking Account..."
    : disabled
      ? disabledMessage
      : plan.action;

  return (
    <article
      className={[
        "relative flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm sm:p-7",
        plan.featured
          ? "border-2 border-blue-600 shadow-xl"
          : "border border-gray-200",
      ].join(" ")}
    >
      {plan.badge && (
        <span
          className={[
            "absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
            plan.featured
              ? "bg-yellow-200 text-gray-950"
              : "bg-yellow-100 text-yellow-800",
          ].join(" ")}
        >
          {plan.badge}
        </span>
      )}

      <p className="text-sm font-black uppercase tracking-wider text-blue-600">
        {plan.name}
      </p>

      <div className="mt-5">
        <p className="text-4xl font-black text-gray-950">
          {plan.price}
        </p>

        <p className="mt-1 font-bold text-gray-500">
          {plan.duration}
        </p>
      </div>

      <p className="mt-5 leading-7 text-gray-600">
        {plan.description}
      </p>

      <ul className="mt-6 grid gap-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3"
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-200 text-sm font-black text-gray-950"
            >
              ✓
            </span>

            <span className="font-semibold text-gray-700">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-7">
        {disabled || isLoading ? (
          <button
            type="button"
            disabled
            className="block w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-5 py-3 text-center font-black text-gray-500"
          >
            {buttonLabel}
          </button>
        ) : (
          <Link
            to={plan.link}
            className={[
              "block w-full rounded-xl border px-5 py-3 text-center font-black transition",
              "hover:-translate-y-0.5 hover:shadow-md",
              plan.id === "free"
                ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                : plan.featured
                  ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                  : "border-yellow-400 bg-yellow-400 text-gray-900 hover:bg-yellow-500",
            ].join(" ")}
          >
            {plan.action}
          </Link>
        )}
      </div>
    </article>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 bg-transparent px-5 py-5 text-left hover:border-transparent focus:outline-none"
        aria-expanded={open}
      >
        <span className="font-black text-gray-950">{question}</span>

        <span
          aria-hidden="true"
          className="text-xl font-black text-blue-600"
        >
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5 leading-7 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Membership() {
  const [accessState, setAccessState] = useState({
    loading: true,
    loggedIn: false,
    membership: null,
    error: "",
  });

  useEffect(() => {
    let active = true;

    async function loadMembershipState() {
      try {
        const outcome =
          await getPlayableProfileMembership();

        if (!active) return;

        setAccessState({
          loading: false,
          loggedIn: !outcome.guest,
          membership: outcome.membership || null,
          error: "",
        });
      } catch (error) {
        console.error(
          "Membership page access error:",
          error
        );

        if (!active) return;

        setAccessState({
          loading: false,
          loggedIn: false,
          membership: null,
          error:
            error?.message ||
            "Your account status could not be checked.",
        });
      }
    }

    loadMembershipState();

    return () => {
      active = false;
    };
  }, []);

  const membershipPlanName = getMembershipPlanName(
    accessState.membership
  );

  const normalizedPlanName = String(
    membershipPlanName || ""
  )
    .trim()
    .toLowerCase();

  const membershipStatus = String(
    accessState.membership?.status || ""
  )
    .trim()
    .toLowerCase();

  const hasActiveMembership =
    membershipStatus === "active";

  const hasActiveTermMembership =
    hasActiveMembership &&
    normalizedPlanName.includes("term");

  const hasActiveAnnualMembership =
    hasActiveMembership &&
    normalizedPlanName.includes("annual");

  const getPlanButtonState = (planId) => {
    if (accessState.loading) {
      return {
        disabled: true,
        message: "Checking Account...",
      };
    }

    if (!accessState.loggedIn) {
      return {
        disabled: false,
        message: "",
      };
    }

    if (planId === "free") {
      return {
        disabled: true,
        message: "Free Account Already Created",
      };
    }

    if (
      planId === "term" &&
      (hasActiveTermMembership ||
        hasActiveAnnualMembership)
    ) {
      return {
        disabled: true,
        message: hasActiveAnnualMembership
          ? "Included in Annual Membership"
          : "Term Membership Active",
      };
    }

    if (
      planId === "annual" &&
      hasActiveAnnualMembership
    ) {
      return {
        disabled: true,
        message: "Annual Membership Active",
      };
    }

    return {
      disabled: false,
      message: "",
    };
  };

  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              CountMeInTT Membership
            </p>

            <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
              Play free. Join to save, track and grow.
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-600">
              CountMeInTT remains open for everyone to play. Membership gives
              students deeper progress tracking, full learning access and
              long-term records.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-gray-700">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                ✓ Parent-managed accounts
              </span>

              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                ✓ Membership belongs to each student
              </span>

              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                ✓ No automatic recurring charges
              </span>
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Choose a plan
              </p>

              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Simple membership options for every family.
              </h2>
            </div>

            <div className="mt-9 grid gap-6 lg:grid-cols-3">
             {plans.map((plan) => {
  const buttonState =
    getPlanButtonState(plan.id);

  return (
    <PlanCard
      key={plan.id}
      plan={plan}
      disabled={buttonState.disabled}
      disabledMessage={buttonState.message}
      isLoading={accessState.loading}
    />
  );
})}
            </div>

            <div className="mt-8 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-black uppercase tracking-wide text-gray-500">
                  Free
                </p>
                <p className="mt-1 font-black text-gray-950">
                  Save the last 10 results
                </p>
              </div>

              <div className="rounded-xl bg-yellow-50 p-4">
                <p className="text-sm font-black uppercase tracking-wide text-yellow-700">
                  Term
                </p>
                <p className="mt-1 font-black text-gray-950">
                  Unlimited history for 120 days
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                  Annual
                </p>
                <p className="mt-1 font-black text-gray-950">
                  Unlimited history for 365 days
                </p>
              </div>
            </div>

            <p className="mt-4 text-center font-bold text-gray-600">
              Annual Membership saves TT$20 compared with purchasing three
              terms.
            </p>
          </div>
        </section>

        <section className="bg-yellow-50 px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                How it works
              </p>

              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Membership activation in four simple steps.
              </h2>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["1", "Create account"],
                ["2", "Add student profile"],
                ["3", "Choose a plan and pay"],
                ["4", "Activated within 24 hours"],
              ].map(([number, title]) => (
                <div
                  key={number}
                  className="rounded-2xl border border-yellow-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-black text-white">
                    {number}
                  </div>

                  <h3 className="mt-4 text-lg font-black">{title}</h3>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-100 px-5 py-4 font-bold text-yellow-900">
              Payment must be confirmed before membership is activated.
            </div>
          </div>
        </section>

        <section className="px-5 pb-14 sm:pb-16">
  <div className="mx-auto max-w-7xl rounded-3xl bg-blue-600 px-6 py-10 text-center text-white shadow-xl sm:px-10">
    <p className="text-sm font-black uppercase tracking-wider text-yellow-300">
      {accessState.loggedIn
        ? "Your CountMeInTT account"
        : "Start free"}
    </p>

    <h2 className="mt-2 text-3xl font-black sm:text-4xl">
      {accessState.loggedIn
        ? hasActiveAnnualMembership
          ? "Your Annual Membership is active."
          : hasActiveTermMembership
            ? "Your Term Membership is active."
            : "Your free account is ready."
        : "Create your free CountMeInTT account."}
    </h2>

    <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
      {accessState.loggedIn
        ? hasActiveMembership
          ? "Continue learning, saving progress and using the features included with your membership."
          : "You can continue with free access or request a Term or Annual Membership whenever you are ready."
        : "Create a student profile, save progress and upgrade to Term or Annual Membership whenever you are ready."}
    </p>

    <div className="mt-7 flex flex-col items-center justify-center gap-3">
      {accessState.loggedIn ? (
        <Link
          to="/dashboard"
          className="w-full rounded-xl bg-yellow-300 px-6 py-3 font-black text-gray-950 transition hover:bg-yellow-200 sm:w-auto"
        >
          Go to Dashboard
        </Link>
      ) : (
        <>
          <Link
            to="/register"
            className="w-full rounded-xl bg-yellow-300 px-6 py-3 font-black text-gray-950 transition hover:bg-yellow-200 sm:w-auto"
          >
            Create Free Account
          </Link>

          <Link
            to="/login"
            className="w-full rounded-xl border-2 border-white/70 bg-white/10 px-6 py-3 font-black text-white transition hover:bg-white/20 sm:w-auto"
          >
            Sign In
          </Link>
        </>
      )}

      <Link
        to="/games/multiplication"
        className="mt-1 text-sm font-bold text-blue-100 underline decoration-blue-200 underline-offset-4 transition hover:text-white"
      >
        Play Multiplication
      </Link>
    </div>
  </div>
</section>


      </main>

      <SiteFooter />
    </div>
  );
}

