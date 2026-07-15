import { useMemo, useState } from "react";
import { mathLanguageTerms } from "../data/mathLanguageTerms";
import GameHeader from "../components/layout/GameHeader";
import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";


export default function MathLanguageDictionary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openTermId, setOpenTermId] = useState(null);


  const freeTerms = useMemo(() => {
  return mathLanguageTerms
    .filter((term) => term.accessLevel === "Free")
    .sort((a, b) => a.term.localeCompare(b.term));
}, []);


  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(freeTerms.map((term) => term.category).filter(Boolean))
    );

    return ["All", ...uniqueCategories];
  }, [freeTerms]);

  const filteredTerms = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return freeTerms.filter((term) => {
      const matchesCategory =
        selectedCategory === "All" || term.category === selectedCategory;

      const searchableText = [
        term.term,
        term.category,
        term.simpleMeaning,
        term.whatItTellsYouToDo,
        term.seaExample,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [freeTerms, searchQuery, selectedCategory]);

  return (
  <div className="min-h-screen bg-white text-gray-950">
    <GameHeader />

    <main className="min-h-screen bg-white px-4 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
           <MathLanguageBrand />

          <h1 className="mb-3 text-3xl font-black text-gray-900">
            Top 50 SEA Math Words
          </h1>

          <p className="max-w-2xl text-gray-700">
            Learn the words that help you understand SEA math questions. Each
            word explains what the question may be asking you to do.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search words..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />

            <a
              href="/math-language/play"
              className="rounded-xl bg-yellow-400 px-5 py-3 text-center font-bold text-gray-950 hover:bg-yellow-300"
            >
              Start Free Challenge
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={
                    isActive
                      ? "rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-gray-950"
                      : "rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-yellow-400 hover:bg-yellow-50"
                  }
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {filteredTerms.length === 0 ? (
  <div className="rounded-2xl border border-gray-200 p-6 text-center">
    <h2 className="mb-2 text-xl font-bold text-gray-900">
      No words found.
    </h2>
    <p className="text-gray-700">
      Try a different search or choose another category.
    </p>
  </div>
) : (
  <div className="space-y-3">
    {filteredTerms.map((term) => {
      const isOpen = openTermId === term.id;

      return (
        <article
  key={term.id}
  className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm"
>

          <button
  type="button"
  onClick={() => setOpenTermId(isOpen ? null : term.id)}
  className="flex w-full items-center justify-between gap-4 bg-white p-5 text-left text-gray-900 transition hover:bg-yellow-50 focus:bg-white focus:outline-none active:bg-yellow-50"
  style={{
    WebkitTapHighlightColor: "transparent",
  }}
>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-gray-900">
                  {term.term}
                </h2>

                {term.category && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                    {term.category}
                  </span>
                )}
              </div>

              {term.whatItTellsYouToDo && (
                <p className="mt-2 text-sm text-gray-700">
                  <span className="font-bold">What it tells you to do:</span>{" "}
                  <span className="rounded-full bg-yellow-100 px-2 py-1 font-bold text-gray-950">
                    {term.whatItTellsYouToDo}
                  </span>
                </p>
              )}
            </div>

            <span className="shrink-0 rounded-full border border-gray-200 px-3 py-1 text-sm font-bold text-gray-700">
              {isOpen ? "Close" : "Open"}
            </span>
          </button>

          {isOpen && (
            <div className="border-t border-yellow-200 bg-yellow-50/60 p-5">
              <div className="rounded-2xl border border-yellow-100 bg-white p-5">
              {term.simpleMeaning && (
                <div className="mb-4">
                  <p className="mb-1 text-sm font-bold text-gray-500">
                    Simple Meaning
                  </p>
                  <p className="text-gray-800">{term.simpleMeaning}</p>
                </div>
              )}

              {term.studentFriendlyExplanation && (
                <div className="mb-4">
                  <p className="mb-1 text-sm font-bold text-gray-500">
                    Student-Friendly Explanation
                  </p>
                  <p className="text-gray-800">
                    {term.studentFriendlyExplanation}
                  </p>
                </div>
              )}

              {term.seaExample && (
                <div className="mb-4">
                  <p className="mb-1 text-sm font-bold text-gray-500">
                    SEA Example
                  </p>
                  <p className="text-gray-800">{term.seaExample}</p>
                </div>
              )}

              {term.seaTip && (
                <div className="mb-4 rounded-xl bg-yellow-50 p-4">
                  <p className="mb-1 text-sm font-bold text-gray-600">
                    SEA Tip
                  </p>
                  <p className="text-gray-800">{term.seaTip}</p>
                </div>
              )}

              {term.commonMistake && (
                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="mb-1 text-sm font-bold text-gray-500">
                    Common Mistake
                  </p>
                  <p className="text-gray-800">{term.commonMistake}</p>
                </div>
              )}

              <a
                href="/math-language/play"
                className="inline-flex rounded-xl border border-yellow-300 px-4 py-3 font-bold text-gray-900 hover:bg-yellow-50"
              >
                Practise This Word
              </a>
            </div>
           </div>
          )}
        </article>
      );
    })}
  </div>
)}

        <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="mb-2 text-2xl font-black text-gray-900">
            Unlock the Full 200-Word SEA Math Language Game
          </h2>

          <p className="mb-4 max-w-2xl text-gray-700">
            The free version gives you the Top 50 must-know words. The full
            version will unlock trap word challenges, SEA question decoder
            practice, category mastery, and boss levels.
          </p>

          <button
            disabled
            className="rounded-xl bg-gray-200 px-5 py-3 font-bold text-gray-600"
          >
            Unlock Full Version — Coming Soon
          </button>
        </div>
      </section>
    </main>

    <ScrollToTopButton />
    <MathLanguageFooter />
    </div>
  );
}

