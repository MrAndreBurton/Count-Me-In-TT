import React from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

const availableGames = [
  {
    title: "Numberverse",
    description:
      "Discover how numbers work. Investigate factors, multiples and number patterns.",
    image: "/images/games/numberverse.webp",
    to: "/games/numberverse",
    action: "Explore Numberverse",
    badge: "Discover & Investigate",
    accent: "purple",
  },
  {
    title: "Times Table Practice",
    description:
      "Build your multiplication skills. Practise individual tables and improve at your own pace.",
    image: "/images/games/times-table-practice.webp",
    to: "/games/multiplication/practice",
    action: "Start Practising",
    badge: "Learn & Improve",
    accent: "green",
  },
  {
    title: "Multiplication Challenge",
    description:
      "Race against the clock, beat your personal best and climb the leaderboard.",
    image: "/images/games/multiplication-challenge.webp",
    to: "/games/multiplication",
    action: "Take the Challenge",
    badge: "Speed & Competition",
    accent: "orange",
  },
  {
    title: "Math Language",
    description:
      "Understand the words used in mathematics through vocabulary activities and games.",
    image: "/images/games/math-language.webp",
    to: "/math-language",
    action: "Explore Math Language",
    badge: "Words & Understanding",
    accent: "blue",
  },
  {
    title: "Mathematics Symbol Bank",
    description:
      "Discover mathematical symbols, understand their meanings and build your knowledge.",
    image: "/images/games/symbol-bank.webp",
    to: "/symbol-bank",
    action: "Explore Symbols",
    badge: "Symbols & Knowledge",
    accent: "teal",
  },
];

const gameStyles = {
  purple: {
    border: "hover:border-purple-400",
    badge: "bg-purple-100 text-purple-800",
    button: "bg-purple-700 text-white group-hover:bg-purple-800",
    focus: "focus-visible:ring-purple-500",
  },
  green: {
    border: "hover:border-green-400",
    badge: "bg-green-100 text-green-800",
    button: "bg-green-700 text-white group-hover:bg-green-800",
    focus: "focus-visible:ring-green-500",
  },
  orange: {
    border: "hover:border-orange-400",
    badge: "bg-orange-100 text-orange-800",
    button: "bg-orange-700 text-white group-hover:bg-orange-800",
    focus: "focus-visible:ring-orange-500",
  },
  blue: {
    border: "hover:border-blue-400",
    badge: "bg-blue-100 text-blue-800",
    button: "bg-blue-700 text-white group-hover:bg-blue-800",
    focus: "focus-visible:ring-blue-500",
  },
  teal: {
    border: "hover:border-teal-400",
    badge: "bg-teal-100 text-teal-800",
    button: "bg-teal-700 text-white group-hover:bg-teal-800",
    focus: "focus-visible:ring-teal-500",
  },
};

const comingSoonGames = [
  { title: "Addition", icon: "+" },
  { title: "Subtraction", icon: "−" },
  { title: "Fractions", icon: "½" },
  { title: "Decimals", icon: "0.5" },
  { title: "Word Problems", icon: "?" },
  { title: "Algebra", icon: "x" },
];

function GameCard({ game }) {
  const styles = gameStyles[game.accent];

  return (
    <Link
      to={game.to}
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${styles.border} ${styles.focus}`}
      aria-label={`${game.title}: ${game.action}`}
    >
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={game.image}
          alt=""
          loading="lazy"
          decoding="async"
          width="1200"
          height="675"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide ${styles.badge}`}
          >
            {game.badge}
          </span>

          <h3 className="mt-4 text-2xl font-black leading-tight text-gray-950">
            {game.title}
          </h3>

          <p className="mt-3 leading-7 text-gray-600">
            {game.description}
          </p>
        </div>

        <div className="mt-auto pt-7">
          <span
            className={`flex min-h-12 w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-center text-sm font-black transition-colors sm:text-base ${styles.button}`}
          >
            {game.action}

            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Games() {
  return (
    <div className="platform-page-bg min-h-screen text-gray-950">
      <SiteHeader />

      <main>
        {/* HERO */}
        <section className="overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-yellow-50">
          <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 py-10 sm:py-12 lg:grid-cols-2 lg:gap-10 lg:py-14">
            <div className="relative z-10">
              <p className="text-sm font-black uppercase tracking-widest text-blue-700">
                CountMeInTT Games
              </p>

              <h1 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                What would you like to do{" "}
                <span className="text-blue-700">today?</span>
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-8 text-gray-700">
                Practise, compete, explore or discover something
                new. Find the maths experience that fits you.
              </p>

              <a
                href="#available-games"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-700 px-6 py-3 font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
              >
                Explore the Games
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className="flex min-w-0 items-center justify-center">
              <img
                src="/images/games/games-hero.webp"
                alt="Five students working together on mathematics activities"
                width="1600"
                height="800"
                fetchPriority="high"
                decoding="async"
                className="h-auto w-full max-w-2xl rounded-2xl object-contain"
              />
            </div>
          </div>
        </section>

        {/* AVAILABLE GAMES */}
        <section
          id="available-games"
          className="scroll-mt-24 px-5 py-12 sm:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-blue-700">
                Available Now
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Choose your experience
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                Five different ways to build your mathematics
                skills. Pick one and get started.
              </p>
            </div>

            <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {availableGames.map((game) => (
                <GameCard key={game.title} game={game} />
              ))}
            </div>
          </div>
        </section>

        {/* COMING SOON */}
        <section className="border-t border-yellow-100 bg-yellow-50/70 px-5 py-12 sm:py-14">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-blue-700">
                Coming Soon
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                More maths adventures are on the way
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                We're developing more ways to learn, practise
                and challenge yourself.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {comingSoonGames.map((game) => (
                <article
                  key={game.title}
                  className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-yellow-200 bg-white px-3 py-5 text-center"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl font-black text-gray-700"
                  >
                    {game.icon}
                  </span>

                  <h3 className="mt-3 text-sm font-black text-gray-800 sm:text-base">
                    {game.title}
                  </h3>

                  <span className="mt-1 text-xs font-bold text-gray-500">
                    Coming soon
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
