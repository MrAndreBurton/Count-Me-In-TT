import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import SiteHeader from "../components/layout/SiteHeader";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";

const skills = [
  {
    name: "Operation Words",
    description: "Words that tell you to add, subtract, multiply, or divide.",
    icon: "+ − × ÷",
  },
  {
    name: "Place Value Words",
    description: "Words about digits, value, rounding, and number position.",
    icon: "123",
  },
  {
    name: "Fraction Words",
    description: "Words that help with parts, wholes, and equal groups.",
    icon: "½",
  },
  {
    name: "Measurement Words",
    description: "Words about length, mass, capacity, time, and units.",
    icon: "cm",
  },
  {
    name: "Geometry Words",
    description: "Words about shapes, angles, lines, and space.",
    icon: "△",
  },
  {
    name: "Data Words",
    description: "Words used in tables, charts, graphs, and averages.",
    icon: "▥",
  },
  {
    name: "Exam Instruction Words",
    description: "Words like find, calculate, estimate, explain, and compare.",
    icon: "✓",
  },
  {
    name: "Trap Words",
    description: "Words that students often misread or misunderstand.",
    icon: "!",
  },
];

export default function MathLanguageHome() {
  return (
  <div className="min-h-screen bg-white text-gray-950">
    <SiteHeader />

      <main className="min-h-screen bg-white px-4 py-8">
        <section className="mx-auto max-w-6xl">
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <MathLanguageBrand />

            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <h1 className="mb-4 text-4xl font-black leading-tight text-gray-900 sm:text-5xl">
                  Math is a language.
                </h1>

                <p className="mb-4 text-2xl font-bold leading-snug text-gray-900">
                  Learn the words. Decode the questions. Break the math barrier.
                </p>

                <p className="mb-6 max-w-2xl text-lg text-gray-700">
                  The CountMeInTT Math Language Challenge helps SEA students
                  understand the words, phrases, and instructions used in math
                  questions. Start with the Top 50 must-know SEA math words and
                  practise in a fun, simple challenge.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/math-language/play"
                    className="rounded-xl bg-yellow-400 px-6 py-4 text-center text-lg font-black text-gray-950 hover:bg-yellow-300"
                  >
                    Start Free Challenge
                  </a>

                  <a
                    href="/math-language/dictionary"
                    className="rounded-xl border border-gray-300 px-6 py-4 text-center text-lg font-bold text-gray-900 hover:bg-gray-50"
                  >
                    View Dictionary
                  </a>
                </div>
              </div>

              <div className="rounded-2xl bg-yellow-50 p-6">
                <p className="mb-2 text-sm font-black uppercase tracking-wide text-yellow-700">
                  Free MVP
                </p>

                <h2 className="mb-3 text-2xl font-black text-gray-900">
                  Top 50 SEA Math Words
                </h2>

                <p className="mb-5 text-gray-700">
                  Practise the words that help students understand what SEA math
                  questions are really asking.
                </p>

                <div className="space-y-3">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="font-bold text-gray-900">10-question round</p>
                    <p className="text-sm text-gray-600">
                      Short practice that feels manageable.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="font-bold text-gray-900">Instant feedback</p>
                    <p className="text-sm text-gray-600">
                      Every wrong answer teaches the correct meaning.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="font-bold text-gray-900">
                      Review missed words
                    </p>
                    <p className="text-sm text-gray-600">
                      Students know exactly what to practise next.
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

              <a
                href="/math-language/dictionary"
                className="text-sm font-bold text-gray-600 hover:text-gray-900"
              >
                See all words →
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {skills.map((skill) => (
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
                    {skill.description}
                  </p>

                  <a
                    href="/math-language/dictionary"
                    className="inline-flex rounded-xl border border-yellow-300 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-white"
                  >
                    View Words
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="mb-2 text-sm font-black uppercase tracking-wide text-yellow-600">
                Free Version
              </p>

              <h2 className="mb-3 text-2xl font-black text-gray-900">
                Start with the Top 50
              </h2>

              <p className="mb-5 text-gray-700">
                The free version gives students a focused starting point with
                the most important SEA math language words.
              </p>

              <ul className="mb-6 space-y-2 text-gray-700">
                <li>✓ Top 50 SEA math words</li>
                <li>✓ Dictionary cards</li>
                <li>✓ 10-question challenge</li>
                <li>✓ Instant feedback</li>
                <li>✓ Basic score and review</li>
              </ul>

              <a
                href="/math-language/play"
                className="inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-black text-gray-950 hover:bg-yellow-300"
              >
                Start Free Challenge
              </a>
            </article>

            <article className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
              <p className="mb-2 text-sm font-black uppercase tracking-wide text-yellow-700">
                Coming Soon
              </p>

              <h2 className="mb-3 text-2xl font-black text-gray-900">
                Full 200-Word Math Language Game
              </h2>

              <p className="mb-5 text-gray-700">
                The full version will unlock deeper practice, trap words, SEA
                question decoding, category mastery, and boss levels.
              </p>

              <ul className="mb-6 space-y-2 text-gray-700">
                <li>✓ All 200 SEA math words</li>
                <li>✓ Trap word challenges</li>
                <li>✓ SEA question decoder practice</li>
                <li>✓ Category mastery</li>
                <li>✓ Boss levels</li>
              </ul>

              <button
                type="button"
                disabled
                className="rounded-xl bg-gray-200 px-5 py-3 font-black text-gray-600"
              >
                Unlock Full Version — Coming Soon
              </button>
            </article>
          </section>
        </section>
      </main>

      <ScrollToTopButton />
      <MathLanguageFooter />
    </div>
  );
}

