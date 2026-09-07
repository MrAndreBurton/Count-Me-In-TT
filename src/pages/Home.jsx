import React from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const activityCards = [
  {
    title: "Play Multiplication",
    description:
      "Choose from four multiplication grids and challenge your fastest time.",
    icon: "×",
    to: "/games/multiplication",
    action: "Play now",
    badge: "Challenge",
  },
  {
    title: "Explore Math Language",
    description:
      "Learn the vocabulary and phrases used across mathematics from primary to secondary level.",
    icon: "Aa",
    to: "/math-language",
    action: "Start learning",
    badge: "Learn + Play",
  },
  {
    title: "Enter the Symbol Bank",
    description:
      "Explore 92 mathematical symbols, notation systems and structures from SEA to CSEC.",
    icon: "π",
    to: "/symbol-bank",
    action: "Enter the vault",
    badge: "Explore",
  },
  {
    title: "Community Challenges",
    description:
      "Explore special competitions, events and local CountMeInTT challenges.",
    icon: "🏆",
    to: "/challenges",
    action: "Explore challenges",
    badge: "Compete",
  },
  {
    title: "Leaderboards",
    description:
      "See how players are performing across CountMeInTT challenges.",
    icon: "📈",
    to: "/leaderboard",
    action: "View rankings",
    badge: "Rankings",
  },
];

const accountBenefits = [
  "Save your personal best and recent results",
  "Build your CountMeInTT student profile",
  "Track your Symbol Bank discoveries in My Vault",
  "Access free learning experiences across the platform",
];

export default function Home() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              Welcome to CountMeInTT
            </p>

            <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
              Explore mathematics. Build confidence. Challenge yourself.
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-600">
              CountMeInTT brings together mathematics games, learning tools,
              challenges and progress experiences designed to help students
              practise, understand and grow.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/games"
                className="rounded-xl bg-blue-600 px-6 py-3 text-center font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
              >
                Explore CountMeInTT
              </Link>

              <Link
                to="/symbol-bank"
                className="rounded-xl border-2 border-gray-950 bg-white px-6 py-3 text-center font-black text-gray-950 transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
              >
                Enter the Symbol Bank
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Explore CountMeInTT
              </p>

              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                What would you like to do today?
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-gray-600">
                Choose an experience based on what you want to practise,
                explore or challenge yourself with.
              </p>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {activityCards.map((activity) => (
                <Link
                  key={activity.title}
                  to={activity.to}
                  className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-3xl font-black text-blue-700">
                      <span aria-hidden="true">{activity.icon}</span>
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
                      {activity.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-gray-950">
                    {activity.title}
                  </h3>

                  <p className="mt-3 leading-7 text-gray-600">
                    {activity.description}
                  </p>

                  <div className="mt-auto pt-7">
                    <span className="inline-flex items-center gap-2 font-black text-blue-600">
                      {activity.action}

                      <span
                        aria-hidden="true"
                        className="transition group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-yellow-50 px-5 py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Your CountMeInTT account
              </p>

              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Save your progress and unlock more ways to learn.
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-gray-700">
                CountMeInTT remains open for everyone to explore. Create a
                free account to build a personal learning profile and keep
                track of your progress, or explore membership for access to
                additional learning content and experiences.
              </p>

              <div className="mt-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    to="/register"
                    className="rounded-xl bg-blue-600 px-6 py-3 text-center font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                  >
                    Create Free Account
                  </Link>

                  <Link
                    to="/membership"
                    className="rounded-xl bg-yellow-400 px-6 py-3 text-center font-black text-gray-900 transition hover:-translate-y-0.5 hover:bg-yellow-500 hover:shadow-md"
                  >
                    Explore Membership
                  </Link>
                </div>

                <p className="mt-4 text-sm font-semibold text-gray-600">
                  Not ready to create an account?{" "}
                  <Link
                    to="/games"
                    className="font-black text-blue-600 underline decoration-2 underline-offset-4 hover:text-blue-700"
                  >
                    Continue exploring as a guest
                  </Link>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black">With a free account:</h3>

              <ul className="mt-5 grid gap-4">
                {accountBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-200 font-black text-gray-950"
                    >
                      ✓
                    </span>

                    <span className="pt-0.5 font-semibold text-gray-700">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Mathematics Symbol Bank
                  </p>

                  <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                    Learn to read the language of mathematical notation.
                  </h2>

                  <p className="mt-4 max-w-2xl leading-7 text-gray-600">
                    Explore 92 mathematical symbols, notation systems and
                    structures from SEA through CSEC. Thirty records are open
                    to everyone, while members can explore the complete vault.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/symbol-bank/vault"
                      className="rounded-xl bg-blue-600 px-6 py-3 text-center font-black text-white transition hover:bg-blue-700"
                    >
                      Explore the Vault
                    </Link>

                    <Link
                      to="/symbol-bank/my-vault"
                      className="rounded-xl border-2 border-blue-600 bg-white px-6 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
                    >
                      Open My Vault
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-yellow-50 p-5 text-center">
                    <p className="text-3xl font-black text-blue-700">29</p>
                    <p className="mt-1 text-sm font-bold text-gray-600">
                      Primary / SEA
                    </p>
                  </div>

                  <div className="rounded-2xl bg-yellow-50 p-5 text-center">
                    <p className="text-3xl font-black text-blue-700">25</p>
                    <p className="mt-1 text-sm font-bold text-gray-600">
                      Forms 1–3
                    </p>
                  </div>

                  <div className="rounded-2xl bg-yellow-50 p-5 text-center">
                    <p className="text-3xl font-black text-blue-700">38</p>
                    <p className="mt-1 text-sm font-bold text-gray-600">
                      CSEC
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-yellow-50 px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-yellow-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Supported by
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Growing with community support
              </h2>

              <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
                CountMeInTT is strengthened by the schools, businesses,
                community partners, sponsors and individuals who support the
                mission.
              </p>

              <Link
                to="/supporters"
                className="mt-7 inline-block rounded-xl border-2 border-gray-950 bg-white px-6 py-3 font-black text-gray-950 transition hover:bg-gray-50"
              >
                Meet Our Supporters
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}


