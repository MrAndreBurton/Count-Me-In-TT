import { Link } from "react-router-dom";

import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import SiteHeader from "../components/layout/SiteHeader";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";

const levels = [
  {
    id: "level-1",
    level: "Level 1",
    title: "Foundation Mathematics Language",
    audience: "SEA / Primary",
    description:
      "Build the core mathematics vocabulary needed to understand Primary and SEA questions.",
    details:
      "Practise essential words, meanings, instructions and common mathematical language.",
    path: "/math-language/level-1",
    accent:
      "border-yellow-300 bg-yellow-50 hover:border-yellow-400",
    badge:
      "border-yellow-300 bg-yellow-100 text-yellow-800",
    action: "Open Level 1",
  },
  {
    id: "level-2",
    level: "Level 2",
    title: "Secondary Mathematics Language",
    audience: "Forms 1–3",
    description:
      "Strengthen the mathematical language students meet as they move into secondary school.",
    details:
      "Practise terminology, examples, distinctions and connections across four Level 2 modes.",
    path: "/math-language/level-2",
    accent:
      "border-blue-300 bg-blue-50 hover:border-blue-400",
    badge:
      "border-blue-300 bg-blue-100 text-blue-800",
    action: "Open Level 2",
  },
  {
    id: "level-3",
    level: "Level 3",
    title: "CSEC Mathematics Language",
    audience: "CSEC Mathematics",
    description:
      "Develop the vocabulary and conceptual discrimination needed for CSEC Mathematics.",
    details:
      "Practise CSEC-level mathematical language through the full Level 3 challenge architecture.",
    path: "/math-language/level-3",
    accent:
      "border-purple-300 bg-purple-50 hover:border-purple-400",
    badge:
      "border-purple-300 bg-purple-100 text-purple-800",
    action: "Open Level 3",
  },
];

export default function MathLanguageHome() {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <SiteHeader />

      <main className="min-h-screen bg-white px-4 py-8">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <MathLanguageBrand />

            <div className="mt-8 max-w-4xl">
              <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                CountMeInTT Mathematics Language
              </p>

              <h1 className="mt-3 text-4xl font-black leading-tight text-gray-950 sm:text-5xl">
                Math is a language.
              </h1>

              <p className="mt-4 text-2xl font-bold leading-snug text-gray-900">
                Learn the words. Decode the questions. Break the math barrier.
              </p>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-700">
                Mathematics becomes easier to understand when students can read,
                recognise and use its language. Choose the level that best
                matches your current stage of mathematics.
              </p>
            </div>
          </div>

          <section className="mt-8">
            <div className="mb-5">
              <p className="text-sm font-black uppercase tracking-wide text-gray-500">
                Choose Your Level
              </p>

              <h2 className="mt-1 text-3xl font-black text-gray-950">
                Mathematics Language Levels
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-gray-600">
                The levels are organised by mathematical stage, but they are not
                locked prerequisites. Students can return to earlier vocabulary
                whenever they need stronger foundations.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {levels.map((level) => (
                <article
                  key={level.id}
                  className={`flex h-full flex-col rounded-3xl border-2 p-6 shadow-sm transition ${level.accent}`}
                >
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${level.badge}`}
                    >
                      {level.level}
                    </span>

                    <p className="mt-4 text-sm font-black uppercase tracking-wide text-gray-500">
                      {level.audience}
                    </p>

                    <h3 className="mt-2 text-2xl font-black leading-tight text-gray-950">
                      {level.title}
                    </h3>

                    <p className="mt-4 leading-7 text-gray-700">
                      {level.description}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      {level.details}
                    </p>
                  </div>

                  <div className="mt-auto pt-6">
                    <Link
                      to={level.path}
                      className="inline-flex w-full justify-center rounded-2xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-yellow-400 hover:text-slate-950"
                    >
                      {level.action}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                One Mathematics Language System
              </p>

              <h2 className="mt-2 text-2xl font-black text-gray-950">
                Different levels. One learning journey.
              </h2>

              <p className="mt-4 leading-7 text-gray-700">
                Each level keeps its own question and game architecture. Level 1
                focuses on foundational Primary and SEA vocabulary, Level 2
                develops secondary mathematics language, and Level 3 strengthens
                CSEC-level conceptual language.
              </p>
            </article>

            <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Build Up or Revisit
              </p>

              <h2 className="mt-2 text-2xl font-black text-gray-950">
                Move forward without losing the foundations.
              </h2>

              <p className="mt-4 leading-7 text-gray-700">
                Moving to a higher level does not replace earlier vocabulary.
                Students can revisit any available level when they need to
                strengthen a word, meaning or mathematical idea.
              </p>
            </article>
          </section>
        </section>
      </main>

      <ScrollToTopButton />
      <MathLanguageFooter />
    </div>
  );
}


