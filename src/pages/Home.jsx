import React from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const activityCards = [
  {
    title: "Play Multiplication",
    description: "Choose from four grids and challenge your fastest time.",
    icon: "🎮",
    to: "/games/multiplication",
    action: "Play now",
  },
  {
    title: "Learn Math Language",
    description: "Learn the words used in SEA Maths questions.",
    icon: "📚",
    to: "/math-language",
    action: "Start learning",
  },
  {
    title: "Community Challenges",
    description: "Explore special competitions, events and local challenges.",
    icon: "🏆",
    to: "/challenges",
    action: "Explore challenges",
  },
  {
    title: "Leaderboards",
    description: "See the fastest players across CountMeInTT.",
    icon: "📈",
    to: "/leaderboard",
    action: "View rankings",
  },
];

const accountBenefits = [
  "Save your personal best",
  "Keep your last 10 results",
  "Build your student profile",
  "Access free games and the Top 50 Math Language terms",
];

export default function Home() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-9 sm:py-11">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              Welcome to CountMeInTT
            </p>

            <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
              Good evening <span aria-hidden="true">👋</span>
            </h1>

            <p className="mt-3 max-w-2xl text-lg leading-8 text-gray-600">
              Choose an activity and start building your maths confidence.
            </p>
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
            </div>

            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              {activityCards.map((activity) => (
                <Link
                  key={activity.title}
                  to={activity.to}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-3xl">
                        <span aria-hidden="true">{activity.icon}</span>
                      </div>

                      <h3 className="mt-5 text-2xl font-black text-gray-950">
                        {activity.title}
                      </h3>

                      <p className="mt-2 max-w-lg leading-7 text-gray-600">
                        {activity.description}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className="mt-2 text-2xl text-blue-600 transition group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>

                  <p className="mt-6 font-black text-blue-600">
                    {activity.action}
                  </p>
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
        CountMeInTT remains open for everyone to play. Create a free account
        to build a personal learning profile and keep track of progress, or
        explore our membership options for access to additional learning
        tools and features.
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
            to="/games/multiplication"
            className="font-black text-blue-600 underline decoration-2 underline-offset-4 hover:text-blue-700"
          >
            Continue as a guest
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
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
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

