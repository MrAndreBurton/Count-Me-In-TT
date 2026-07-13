import React from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const availableGames = [
  {
    title: "Multiplication Challenge",
    description:
      "Build speed, accuracy and confidence through four multiplication grids.",
    icon: "🎮",
    to: "/games/multiplication",
    action: "Play Multiplication",
    features: ["5 × 5", "5 × 12", "12 × 12", "15 × 15"],
    badge: "Available",
  },
  {
    title: "Math Language",
    description:
      "Learn the words and phrases students need to understand maths questions.",
    icon: "📚",
    to: "/math-language",
    action: "Explore Math Language",
    features: [
      "Student-friendly dictionary",
      "Interactive word game",
      "Top 50 terms free",
      "Full 200 with membership",
    ],
    badge: "Available",
  },
];

const comingSoonGames = [
  {
    title: "Addition",
    description: "Build speed with number bonds and mental addition.",
    icon: "➕",
  },
  {
    title: "Subtraction",
    description: "Master subtraction strategies and improve accuracy.",
    icon: "➖",
  },
  {
    title: "Fractions",
    description: "Learn parts of a whole through interactive practice.",
    icon: "🍕",
  },
  {
    title: "Decimals",
    description: "Understand tenths, hundredths and decimal place value.",
    icon: "0.25",
  },
  {
    title: "Word Problems",
    description: "Read, think and solve real-world maths questions.",
    icon: "🧩",
  },
  {
    title: "Algebra",
    description: "Discover patterns, variables and simple equations.",
    icon: "x",
  },
];

export default function Games() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        <section className="border-b border-yellow-100 bg-yellow-50 px-5 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              CountMeInTT Games
            </p>

            <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
              Choose your next maths challenge.
            </h1>

            <p className="mt-3 max-w-2xl text-lg leading-8 text-gray-600">
              Practise important skills through games designed to build
              confidence, speed and understanding.
            </p>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Available now
              </p>

              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Start playing and learning.
              </h2>
            </div>

            <div className="mt-9 grid gap-6 lg:grid-cols-2">
              {availableGames.map((game) => (
                <Link
                  key={game.title}
                  to={game.to}
                  className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-3xl">
                      <span aria-hidden="true">{game.icon}</span>
                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-green-700">
                      {game.badge}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-black sm:text-3xl">
                    {game.title}
                  </h3>

                  <p className="mt-3 leading-7 text-gray-600">
                    {game.description}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {game.features.map((feature) => (
                      <div
                        key={feature}
                        className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-bold text-gray-700"
                      >
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-8">
                    <span className="inline-flex items-center gap-2 font-black text-blue-600">
                      {game.action}
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
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Coming soon
              </p>

              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                More ways to practise maths.
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                New games will gradually be added to help students practise
                different skills across primary and secondary mathematics.
              </p>
            </div>

            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoonGames.map((game) => (
                <article
                  key={game.title}
                  className="relative rounded-2xl border border-yellow-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl font-black text-gray-700">
                      <span aria-hidden="true">{game.icon}</span>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-gray-600">
                      Coming Soon
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black">{game.title}</h3>

                  <p className="mt-2 leading-7 text-gray-600">
                    {game.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                One platform, many experiences
              </p>

              <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
                <div>
                  <h2 className="text-3xl font-black sm:text-4xl">
                    Build confidence one skill at a time.
                  </h2>

                  <p className="mt-4 max-w-3xl leading-7 text-gray-600">
                    Each CountMeInTT game will focus on a specific area of
                    mathematics. Students will be able to practise individual
                    skills, save progress, earn badges and continue building
                    confidence across the platform.
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-600 p-6 text-white">
                  <p className="text-sm font-black uppercase tracking-wider text-yellow-300">
                    Start here
                  </p>

                  <h3 className="mt-2 text-2xl font-black">
                    Take the Multiplication Challenge.
                  </h3>

                  <p className="mt-3 leading-7 text-blue-100">
                    Choose from four grid sizes and challenge your fastest
                    accurate time.
                  </p>

                  <Link
                    to="/games/multiplication"
                    className="mt-6 inline-block rounded-xl bg-yellow-300 px-6 py-3 font-black text-gray-950 transition hover:bg-yellow-200"
                  >
                    Play Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

