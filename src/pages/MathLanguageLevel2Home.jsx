import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import MathLanguageLevelNav from "../components/mathLanguage/MathLanguageLevelNav";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";

export default function MathLanguageLevel2Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <MathLanguageLevelNav currentLevel="level-2" />

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">
          <MathLanguageBrand />
          <p className="mt-6 text-sm font-black uppercase tracking-wider text-blue-700">
            Level 2 · Forms 1–3
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            Secondary Mathematics Language
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-700">
            Learn the mathematics words used across lower secondary school, then practise recognising examples, differences and mathematical connections.
          </p>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <Link
            to="/math-language/level-2/dictionary"
            className="group rounded-3xl border-2 border-blue-200 bg-blue-50 p-7 transition hover:border-blue-500 hover:bg-blue-100"
          >
            <p className="text-sm font-black uppercase tracking-wider text-blue-700">
              Learn
            </p>
            <h2 className="mt-2 text-3xl font-black">Dictionary</h2>
            <p className="mt-3 leading-7 text-gray-700">
              Browse all 199 Level 2 words by topic. See each meaning, a mathematical example and, where available, a key connection or distinction.
            </p>
            <p className="mt-6 font-black text-blue-800 group-hover:underline">
              Open Level 2 Dictionary →
            </p>
          </Link>

          <Link
            to="/math-language/level-2/play"
            className="group rounded-3xl border-2 border-yellow-300 bg-yellow-50 p-7 transition hover:border-yellow-500 hover:bg-yellow-100"
          >
            <p className="text-sm font-black uppercase tracking-wider text-amber-700">
              Practise
            </p>
            <h2 className="mt-2 text-3xl font-black">Play Level 2</h2>
            <p className="mt-3 leading-7 text-gray-700">
              Test your mathematics language through the four frozen Level 2 game modes using the active canonical release.
            </p>
            <p className="mt-6 font-black text-amber-800 group-hover:underline">
              Choose a Level 2 Mode →
            </p>
          </Link>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-black">Seven learning areas</h2>
          <p className="mt-2 leading-7 text-gray-600">
            The student-facing dictionary groups the 199 terms into seven clear subject areas while preserving the frozen canonical term and question identities underneath.
          </p>
        </section>
      </main>

      <MathLanguageFooter />
      <ScrollToTopButton />
    </div>
  );
}
