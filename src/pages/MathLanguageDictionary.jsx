import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import { mathLanguageTerms } from "../data/mathLanguageTerms";
import GameHeader from "../components/layout/GameHeader";
import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";

import {
  getPlayableProfileMembership,
} from "../lib/membership";

import {
  canAccessFullDictionary,
  getMembershipPlanName,
} from "../lib/membershipAccess";


export default function MathLanguageDictionary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openTermId, setOpenTermId] = useState(null);

  const [membershipState, setMembershipState] =
  useState({
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

      if (!isMounted) return;

      setMembershipState({
        loading: false,
        guest: outcome.guest,
        profile: outcome.profile,
        membership: outcome.membership,
        error: "",
      });
   } catch (error) {
  const errorMessage = String(
    error?.message || ""
  ).toLowerCase();

  const isMissingSession =
    errorMessage.includes("auth session missing") ||
    errorMessage.includes("session missing") ||
    errorMessage.includes("not authenticated");

  if (!isMounted) return;

  if (isMissingSession) {
    setMembershipState({
      loading: false,
      guest: true,
      profile: null,
      membership: null,
      error: "",
    });

    return;
  }

  console.error(
    "Math Language dictionary membership error:",
    error
  );

  setMembershipState({
    loading: false,
    guest: false,
    profile: null,
    membership: null,
    error:
      error?.message ||
      "Your dictionary access could not be loaded.",
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

const hasFullDictionaryAccess =
  canAccessFullDictionary(membership);

const availableTerms = useMemo(() => {
  const terms = hasFullDictionaryAccess
    ? mathLanguageTerms
    : mathLanguageTerms.filter(
        (term) =>
          String(term.accessLevel || "")
            .trim()
            .toLowerCase() === "free",
      );

  return [...terms].sort((a, b) =>
    a.term.localeCompare(b.term),
  );
}, [hasFullDictionaryAccess]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(availableTerms.map((term) => term.category).filter(Boolean))
    );

    return ["All", ...uniqueCategories];
  }, [availableTerms]);

  const filteredTerms = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return availableTerms.filter((term) => {
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
  }, [availableTerms, searchQuery, selectedCategory]);

if (membershipState.loading) {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <GameHeader />

      <main className="px-4 py-16">
        <section className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-yellow-400" />

          <p className="mt-5 font-black text-gray-700">
            Checking dictionary access...
          </p>
        </section>
      </main>

      <MathLanguageFooter />
    </div>
  );
}

if (membershipState.error) {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <GameHeader />

      <main className="px-4 py-16">
        <section className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-2xl font-black text-red-900">
            Unable to load dictionary access
          </h1>

          <p className="mt-3 text-red-700">
            {membershipState.error}
          </p>
        </section>
      </main>

      <MathLanguageFooter />
    </div>
  );
}

if (membershipState.guest) {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <GameHeader />

      <main className="px-4 py-12 sm:py-16">
        <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-yellow-200 bg-white shadow-lg">
          <div className="bg-yellow-50 p-7 text-center sm:p-10">
            <div className="mb-5">
              <MathLanguageBrand />
            </div>

            <p className="text-sm font-black uppercase tracking-wider text-yellow-700">
              Free Account Required
            </p>

            <h1 className="mx-auto mt-3 max-w-2xl text-3xl font-black leading-tight text-gray-950 sm:text-4xl">
              Create an account to explore the SEA Math Dictionary.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-700">
              A free CountMeInTT account gives you access to the Top
              50 must-know SEA Math words, saved game results and a
              personal learning profile.
            </p>
          </div>

          <div className="p-7 sm:p-9">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                "Top 50 SEA Math words",
                "Math Language practice rounds",
                "Saved learning progress",
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center"
                >
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-yellow-200 font-black text-gray-950">
                    ✓
                  </div>

                  <p className="mt-3 font-black text-gray-800">
                    {feature}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/register"
                className="rounded-xl bg-yellow-400 px-6 py-3 text-center font-black text-gray-950 transition hover:bg-yellow-300"
              >
                Create Free Account
              </Link>

              <Link
                to="/login"
                state={{
                  from: {
                    pathname: "/math-language/dictionary",
                  },
                }}
                className="rounded-xl border-2 border-blue-600 bg-white px-6 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
              >
                Sign In
              </Link>
            </div>

            <p className="mt-5 text-center text-sm leading-6 text-gray-500">
              After creating an account, you can request Term or
              Annual Membership for access to the complete 200-word
              dictionary.
            </p>

            <div className="mt-5 text-center">
              <Link
                to="/membership"
                className="font-black text-blue-700 underline underline-offset-4"
              >
                View Membership Options
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MathLanguageFooter />
    </div>
  );
}



  return (
  <div className="min-h-screen bg-white text-gray-950">
    <GameHeader />

    <main className="min-h-screen bg-white px-4 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
           <MathLanguageBrand />

          <h1 className="mb-3 text-3xl font-black text-gray-900">
            {hasFullDictionaryAccess
              ? "Full 200-Word SEA Math Dictionary"
              : "Top 50 SEA Math Words"}
          </h1>

          <p className="max-w-2xl text-gray-700">
            Learn the words that help you understand SEA math questions. Each
            word explains what the question may be asking you to do.
          </p>

          <p className="mt-3 text-sm font-bold text-blue-700">
            {membershipState.loading
              ? "Checking access..."
              : membershipState.guest
              ? "Guest access"
              : getMembershipPlanName(
                  membership,
                )}
         </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search words..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />

            <Link
  to="/math-language/play"
  className="rounded-xl bg-yellow-400 px-5 py-3 text-center font-bold text-gray-950 hover:bg-yellow-300"
>
  Start Challenge
</Link>
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

             <Link
               to="/math-language/play"
               className="inline-flex rounded-xl border border-yellow-300 px-4 py-3 font-bold text-gray-900 hover:bg-yellow-50"
              >
                Practise This Word
            </Link>
            </div>
           </div>
          )}
        </article>
      );
    })}
  </div>
)}

       {!hasFullDictionaryAccess && (
         <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="mb-2 text-2xl font-black text-gray-900">
            Unlock the Full 200-Word SEA Math Language Game
          </h2>

          <p className="mb-4 max-w-2xl text-gray-700">
            The free version gives you the Top 50 must-know words. The full
            version will unlock trap word challenges, SEA question decoder
            practice, category mastery, and boss levels.
          </p>

         <Link
  to="/membership"
  className="inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-bold text-gray-950 hover:bg-yellow-300"
>
  View Membership Options
</Link>

</div>
)}


      </section>
    </main>

    <ScrollToTopButton />
    <MathLanguageFooter />
    </div>
  );
}

