import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import MathLanguageLevelNav from "../components/mathLanguage/MathLanguageLevelNav";
import SiteHeader from "../components/layout/SiteHeader";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";

import {
  getPlayableProfileMembership,
} from "../lib/membership";

import {
  canAccessFullDictionary,
  getMembershipPlanName,
} from "../lib/membershipAccess";

const skills = [
  {
    name: "Operation Words",
    description:
      "Words that tell you to add, subtract, multiply, or divide.",
    icon: "+ − × ÷",
  },
  {
    name: "Place Value Words",
    description:
      "Words about digits, value, rounding, and number position.",
    icon: "123",
  },
  {
    name: "Fraction Words",
    description:
      "Words that help with parts, wholes, and equal groups.",
    icon: "½",
  },
  {
    name: "Measurement Words",
    description:
      "Words about length, mass, capacity, time, and units.",
    icon: "cm",
  },
  {
    name: "Geometry Words",
    description:
      "Words about shapes, angles, lines, and space.",
    icon: "△",
  },
  {
    name: "Data Words",
    description:
      "Words used in tables, charts, graphs, and averages.",
    icon: "▥",
  },
  {
    name: "Exam Instruction Words",
    description:
      "Words like find, calculate, estimate, explain, and compare.",
    icon: "✓",
  },
  {
    name: "Trap Words",
    description:
      "Words that students often misread or misunderstand.",
    icon: "!",
  },
];

export default function MathLanguageLevel1Home() {
  const [
    membershipState,
    setMembershipState,
  ] = useState({
    loading: true,
    guest: false,
    profile: null,
    membership: null,
    error: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadMembershipAccess() {
      try {
        const outcome =
          await getPlayableProfileMembership();

        if (!isMounted) {
          return;
        }

        setMembershipState({
          loading: false,
          guest: outcome.guest,
          profile: outcome.profile,
          membership:
            outcome.membership,
          error: "",
        });
      } catch (error) {
        console.error(
          "Math Language Level 1 home membership error:",
          error
        );

        if (!isMounted) {
          return;
        }

        setMembershipState({
          loading: false,
          guest: false,
          profile: null,
          membership: null,
          error:
            error?.message ||
            "Your membership access could not be loaded.",
        });
      }
    }

    loadMembershipAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  const membership =
    membershipState.membership;

  const hasFullAccess =
    canAccessFullDictionary(
      membership
    );

  const membershipPlanName =
    membershipState.guest
      ? "Guest Access"
      : getMembershipPlanName(
          membership
        );

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <SiteHeader />

      <main className="min-h-screen bg-white px-4 py-8">
        <section className="mx-auto max-w-6xl">
          <MathLanguageLevelNav currentLevel="level-1" />

          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <MathLanguageBrand />

            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="mb-3 mt-5 text-sm font-black uppercase tracking-wider text-yellow-600">
                  Level 1 · Foundation
                  Mathematics Language
                </p>

                <h1 className="mb-4 text-4xl font-black leading-tight text-gray-900 sm:text-5xl">
                  Math is a language.
                </h1>

                <p className="mb-4 text-2xl font-bold leading-snug text-gray-900">
                  Learn the words. Decode
                  the questions. Break the
                  math barrier.
                </p>

                <p className="mb-6 max-w-2xl text-lg leading-7 text-gray-700">
                  Build the mathematics
                  vocabulary students need
                  for Primary and SEA
                  questions. Practise key
                  words, meanings,
                  instructions and common
                  mathematical language.
                </p>

                <p className="mb-6 font-bold text-blue-700">
                  {membershipState.loading
                    ? "Checking your access..."
                    : hasFullAccess
                      ? "Your membership includes the full 200-word Math Language experience."
                      : "Start with the Top 50 must-know SEA math words."}
                </p>

                {membershipState.error && (
                  <p className="mb-6 rounded-xl bg-red-50 p-4 font-bold text-red-700">
                    {
                      membershipState.error
                    }
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/math-language/level-1/play"
                    className="rounded-xl bg-yellow-400 px-6 py-4 text-center text-lg font-black text-gray-950 hover:bg-yellow-300"
                  >
                    {hasFullAccess
                      ? "Start Level 1 Challenge"
                      : "Start Free Challenge"}
                  </Link>

                  <Link
                    to="/math-language/level-1/dictionary"
                    className="rounded-xl border border-gray-300 px-6 py-4 text-center text-lg font-bold text-gray-900 hover:bg-gray-50"
                  >
                    View Level 1
                    Dictionary
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl bg-yellow-50 p-6">
                <p className="mb-2 text-sm font-black uppercase tracking-wide text-yellow-700">
                  {membershipState.loading
                    ? "Checking Access"
                    : membershipPlanName}
                </p>

                <h2 className="mb-3 text-2xl font-black text-gray-900">
                  {hasFullAccess
                    ? "Full 200-Word Access"
                    : "Top 50 SEA Math Words"}
                </h2>

                <p className="mb-5 text-gray-700">
                  Practise the words that
                  help students understand
                  what Primary and SEA
                  mathematics questions are
                  really asking.
                </p>

                <div className="space-y-3">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="font-bold text-gray-900">
                      {hasFullAccess
                        ? "10, 25 and 40-word rounds"
                        : "10 and 25-word rounds"}
                    </p>

                    <p className="text-sm text-gray-600">
                      Choose a challenge
                      level that matches
                      your readiness.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="font-bold text-gray-900">
                      Instant feedback
                    </p>

                    <p className="text-sm text-gray-600">
                      Every wrong answer
                      teaches the correct
                      meaning.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="font-bold text-gray-900">
                      Review missed words
                    </p>

                    <p className="text-sm text-gray-600">
                      Students know exactly
                      what to practise next.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-yellow-600">
                  Choose a Skill
                </p>

                <h2 className="text-3xl font-black text-gray-900">
                  Practise by word type
                </h2>
              </div>

              <Link
                to="/math-language/level-1/dictionary"
                className="text-sm font-bold text-gray-600 hover:text-gray-900"
              >
                See all words →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {skills.map(
                (skill) => (
                  <article
                    key={skill.name}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-yellow-300 hover:bg-yellow-50"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-lg font-black text-gray-950">
                      {skill.icon}
                    </div>

                    <h3 className="mb-2 text-lg font-black text-gray-900">
                      {skill.name}
                    </h3>

                    <p className="mb-4 text-sm text-gray-700">
                      {
                        skill.description
                      }
                    </p>

                    <Link
                      to="/math-language/level-1/dictionary"
                      className="inline-flex rounded-xl border border-yellow-300 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-white"
                    >
                      View Words
                    </Link>
                  </article>
                )
              )}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="mb-2 text-sm font-black uppercase tracking-wide text-yellow-600">
                Free Access
              </p>

              <h2 className="mb-3 text-2xl font-black text-gray-900">
                Start with the Top 50
              </h2>

              <p className="mb-5 text-gray-700">
                Free membership gives
                students a focused
                starting point with the
                most important SEA
                mathematics-language
                words.
              </p>

              <ul className="mb-6 space-y-2 text-gray-700">
                <li>
                  ✓ Top 50 SEA math words
                </li>
                <li>
                  ✓ Dictionary cards
                </li>
                <li>
                  ✓ 10-word challenge
                </li>
                <li>
                  ✓ 25-word challenge
                </li>
                <li>
                  ✓ Instant feedback
                </li>
                <li>
                  ✓ Basic score and review
                </li>
              </ul>

              <Link
                to="/math-language/level-1/play"
                className="inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-black text-gray-950 hover:bg-yellow-300"
              >
                Start Free Challenge
              </Link>
            </article>

            <article className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
              <p className="mb-2 text-sm font-black uppercase tracking-wide text-yellow-700">
                {hasFullAccess
                  ? "Your Current Access"
                  : "Term and Annual Membership"}
              </p>

              <h2 className="mb-3 text-2xl font-black text-gray-900">
                Full 200-Word Math
                Language Experience
              </h2>

              <p className="mb-5 text-gray-700">
                Full membership unlocks
                the complete Level 1
                dictionary, larger rounds
                and access to every Level
                1 Mathematics Language
                term.
              </p>

              <ul className="mb-6 space-y-2 text-gray-700">
                <li>
                  ✓ All 200 SEA math words
                </li>
                <li>
                  ✓ 10-word challenge
                </li>
                <li>
                  ✓ 25-word challenge
                </li>
                <li>
                  ✓ 40-word mastery round
                </li>
                <li>
                  ✓ Full dictionary access
                </li>
                <li>
                  ✓ Complete word bank
                </li>
              </ul>

              {hasFullAccess ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/math-language/level-1/play"
                    className="inline-flex justify-center rounded-xl bg-yellow-400 px-5 py-3 font-black text-gray-950 hover:bg-yellow-300"
                  >
                    Start Full
                    Challenge
                  </Link>

                  <Link
                    to="/math-language/level-1/dictionary"
                    className="inline-flex justify-center rounded-xl border border-yellow-400 bg-white px-5 py-3 font-black text-gray-900 hover:bg-yellow-100"
                  >
                    View All 200
                    Words
                  </Link>
                </div>
              ) : (
                <Link
                  to="/membership"
                  className="inline-flex rounded-xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-yellow-400 hover:text-slate-950"
                >
                  View Membership
                  Options
                </Link>
              )}
            </article>
          </section>

          <div className="mt-8 text-center">
            <Link
              to="/math-language"
              className="inline-flex rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-950"
            >
              ← Choose Another Math
              Language Level
            </Link>
          </div>
        </section>
      </main>

      <ScrollToTopButton />
      <MathLanguageFooter />
    </div>
  );
}


