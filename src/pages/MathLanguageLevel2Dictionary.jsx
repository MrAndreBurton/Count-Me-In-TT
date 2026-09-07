import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import SiteHeader from "../components/layout/SiteHeader";
import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";
import MathLanguageLevelNav from "../components/mathLanguage/MathLanguageLevelNav";
import HigherLevelDictionaryBrowser from "../components/mathLanguage/HigherLevelDictionaryBrowser";
import ScrollToTopButton from "../components/mathLanguage/ScrollToTopButton";

import { supabase } from "../lib/supabase";
import { loadLevel2Dictionary } from "../lib/mathLanguageLevel2Dictionary";

export default function MathLanguageLevel2Dictionary() {
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

        const rows = await loadLevel2Dictionary();

        if (!active) return;

        setItems(rows);
        setStatus("ready");
      } catch (loadError) {
        if (!active) return;

        console.error(
          "Level 2 dictionary load failed:",
          loadError
        );

        setError(
          loadError?.message ||
            "Unable to load the Level 2 dictionary."
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
        <MathLanguageLevelNav currentLevel="level-2" />

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <MathLanguageBrand />

          <p className="mt-6 text-sm font-black uppercase tracking-wider text-blue-700">
            Level 2 · Learn
          </p>

          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            Secondary Mathematics Dictionary
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-700">
            Learn the language behind the mathematics. Browse all 199
            Level 2 terms, study a meaning and example, then explore
            deeper connections and distinctions where the canonical
            bank provides them.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/math-language/level-2"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 font-black text-gray-700 hover:border-blue-400 hover:text-blue-700"
            >
              ← Level 2 Home
            </Link>

            <Link
              to="/math-language/level-2/play"
              className="rounded-xl bg-yellow-400 px-4 py-2 font-black text-gray-950 hover:bg-yellow-300"
            >
              Practise Level 2
            </Link>
          </div>
        </section>

        {(status === "checking" || status === "loading") && (
          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-yellow-400" />

            <p className="mt-5 font-black text-gray-700">
              {status === "checking"
                ? "Checking dictionary access..."
                : "Loading Level 2 mathematics language..."}
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
                Create an account to explore the Level 2 Mathematics
                Dictionary.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-700">
                Sign in to study the 199 Level 2 mathematics terms,
                explore examples and connections, practise Math
                Language and save your learning progress.
              </p>
            </div>

            <div className="p-7 sm:p-9">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  "199 mathematics terms",
                  "Examples and connections",
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
                        "/math-language/level-2/dictionary",
                    },
                  }}
                  className="rounded-xl border-2 border-blue-600 bg-white px-6 py-3 text-center font-black text-blue-600 transition hover:bg-blue-50"
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
              Level 2 dictionary could not load.
            </p>

            <p className="mt-2 leading-7">{error}</p>
          </section>
        )}

        {status === "ready" && (
          <div className="mt-6">
            <HigherLevelDictionaryBrowser
              items={items}
              playPath="/math-language/level-2/play"
              levelLabel="Level 2 mathematics language"
              playLabel="Practise Level 2"
            />
          </div>
        )}
      </main>

      <MathLanguageFooter />
      <ScrollToTopButton />
    </div>
  );
}


