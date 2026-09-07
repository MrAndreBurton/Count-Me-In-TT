import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import SiteHeader from "../components/layout/SiteHeader";
import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import MathLanguageLevelNav from "../components/mathLanguage/MathLanguageLevelNav";
import HigherLevelDictionaryBrowser from "../components/mathLanguage/HigherLevelDictionaryBrowser";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";

import { supabase } from "../lib/supabase";
import { loadLevel3Dictionary } from "../lib/mathLanguageLevel3Dictionary";

export default function MathLanguageLevel3Dictionary() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function initialise() {
      try {
        setStatus("checking");
        setError("");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!active) return;

        if (!session) {
          setStatus("guest");
          return;
        }

        setStatus("loading");

        const nextItems = await loadLevel3Dictionary();

        if (!active) return;

        setItems(nextItems);
        setStatus("ready");
      } catch (loadError) {
        if (!active) return;

        console.error(
          "Level 3 dictionary load failed:",
          loadError
        );

        setError(
          loadError?.message ||
            "Unable to load the Level 3 mathematics dictionary."
        );

        setStatus("error");
      }
    }

    initialise();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <MathLanguageLevelNav currentLevel="level-3" />

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">
          <MathLanguageBrand />

          <p className="mt-6 text-sm font-black uppercase tracking-wider text-purple-700">
            Level 3 · Learn
          </p>

          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            CSEC Mathematics Dictionary
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-700">
            Study the 95 frozen Level 3 mathematics concepts. Start
            with the meaning, then open a term to see its mathematical
            example, distinction and any deeper canonical clue,
            mistake or completion material available for that concept.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/math-language/level-3"
              className="min-h-11 rounded-xl border border-gray-300 bg-white px-4 py-2 font-black text-gray-700 transition hover:border-purple-400 hover:text-purple-700"
            >
              ← Level 3 Home
            </Link>

            <Link
              to="/math-language/level-3/play"
              className="min-h-11 rounded-xl bg-yellow-400 px-4 py-2 font-black text-gray-950 transition hover:bg-yellow-300"
            >
              Practise Level 3 →
            </Link>
          </div>
        </section>

        {(status === "checking" || status === "loading") && (
          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-yellow-400" />

            <p className="mt-5 font-black text-gray-700">
              {status === "checking"
                ? "Checking dictionary access..."
                : "Loading Level 3 mathematics language..."}
            </p>
          </section>
        )}

        {status === "guest" && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-yellow-200 bg-white shadow-lg">
            <div className="bg-yellow-50 p-7 text-center sm:p-10">
              <p className="text-sm font-black uppercase tracking-wider text-yellow-700">
                Free Account Required
              </p>

              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black leading-tight text-gray-950 sm:text-4xl">
                Create an account to explore the CSEC Mathematics
                Dictionary.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-700">
                Sign in to study the 95 Level 3 mathematics concepts,
                explore examples and distinctions, practise CSEC Math
                Language and save your learning progress.
              </p>
            </div>

            <div className="p-7 sm:p-9">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  "95 CSEC mathematics concepts",
                  "Examples, clues and distinctions",
                  "Saved practice results",
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
                      pathname:
                        "/math-language/level-3/dictionary",
                    },
                  }}
                  className="rounded-xl border-2 border-purple-600 bg-white px-6 py-3 text-center font-black text-purple-700 transition hover:bg-purple-50"
                >
                  Sign In
                </Link>
              </div>

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
        )}

        {status === "error" && (
          <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p className="font-black">
              Level 3 dictionary could not load.
            </p>

            <p className="mt-2 leading-7">{error}</p>
          </section>
        )}

        {status === "ready" && (
          <div className="mt-6">
            <HigherLevelDictionaryBrowser
              items={items}
              playPath="/math-language/level-3/play"
              levelLabel="Level 3 mathematics language"
              playLabel="Practise Level 3"
            />
          </div>
        )}
      </main>

      <MathLanguageFooter />
      <ScrollToTopButton />
    </div>
  );
}


