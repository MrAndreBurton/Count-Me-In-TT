import { Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import MathLanguageLevelNav from "../components/mathLanguage/MathLanguageLevelNav";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";

export default function MathLanguageLevel3Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <MathLanguageLevelNav currentLevel="level-3" />

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">
          <MathLanguageBrand />
          <p className="mt-6 text-sm font-black uppercase tracking-wider text-purple-700">
            Level 3 · CSEC Mathematics
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            CSEC Mathematics Language
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-700">
            Build the mathematical language needed to recognise, distinguish and apply CSEC-level concepts. Learn the concept first, then practise it in authentic mathematical contexts.
          </p>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <Link
            to="/math-language/level-3/dictionary"
            className="group rounded-3xl border-2 border-purple-200 bg-purple-50 p-7 transition hover:border-purple-500 hover:bg-purple-100"
          >
            <p className="text-sm font-black uppercase tracking-wider text-purple-700">
              Learn
            </p>
            <h2 className="mt-2 text-3xl font-black">Dictionary</h2>
            <p className="mt-3 leading-7 text-gray-700">
              Browse all 95 frozen Level 3 mathematics terms. Each term includes its meaning, a mathematical example and a distinction, with deeper clues, mistakes or completion examples where the canonical bank provides them.
            </p>
            <p className="mt-6 font-black text-purple-800 group-hover:underline">
              Open Level 3 Dictionary →
            </p>
          </Link>

          <Link
            to="/math-language/level-3/play"
            className="group rounded-3xl border-2 border-yellow-300 bg-yellow-50 p-7 transition hover:border-yellow-500 hover:bg-yellow-100"
          >
            <p className="text-sm font-black uppercase tracking-wider text-yellow-700">
              Practise
            </p>
            <h2 className="mt-2 text-3xl font-black">Play Level 3</h2>
            <p className="mt-3 leading-7 text-gray-700">
              Test whether you can name the mathematics, distinguish close concepts, find the idea in the mathematics and handle higher-level clues or mistakes.
            </p>
            <p className="mt-6 font-black text-yellow-800 group-hover:underline">
              Choose a Level 3 mode →
            </p>
          </Link>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wider text-gray-500">
            Level 3 scope
          </p>
          <p className="mt-2 leading-7 text-gray-700">
            This dictionary contains the 95 frozen Level 3 mathematics concepts only. CSEC examination-command language remains separate and is not merged into this dictionary.
          </p>
        </section>
      </main>

      <MathLanguageFooter />
      <ScrollToTopButton />
    </div>
  );
}
