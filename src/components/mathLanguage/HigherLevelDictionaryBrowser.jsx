import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function DetailBlock({ label, value, explanation }) {
  if (!value && !explanation) return null;

  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-gray-500">
        {label}
      </p>
      {value && (
        <p className="mt-2 text-base font-black leading-7 text-gray-950">
          {value}
        </p>
      )}
      {explanation && (
        <p className="mt-1 leading-7 text-gray-700">{explanation}</p>
      )}
    </div>
  );
}

function PromptAnswerBlock({ label, prompt, answer, explanation }) {
  if (!prompt && !answer && !explanation) return null;

  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-gray-500">
        {label}
      </p>
      {prompt && <p className="mt-2 leading-7 text-gray-800">{prompt}</p>}
      {answer && (
        <p className="mt-2 text-base font-black leading-7 text-gray-950">
          {answer}
        </p>
      )}
      {explanation && (
        <p className="mt-1 leading-7 text-gray-700">{explanation}</p>
      )}
    </div>
  );
}

function DictionaryCard({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-blue-700">
            {item.category}
          </p>
          <h2 className="mt-1 text-2xl font-black text-gray-950">{item.term}</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="min-h-11 shrink-0 rounded-xl border border-gray-300 px-4 py-2 text-sm font-black text-gray-700 transition hover:border-blue-400 hover:text-blue-700"
        >
          {open ? "Close" : "Learn"}
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-blue-50 p-4">
        <p className="text-xs font-black uppercase tracking-wider text-blue-700">
          Meaning
        </p>
        <p className="mt-2 leading-7 text-gray-800">{item.meaning}</p>
      </div>

      {open && (
        <div className="mt-4 grid gap-3">
          <DetailBlock
            label="Example"
            value={item.example}
            explanation={item.exampleExplanation}
          />
          <DetailBlock
            label="Make the connection"
            value={item.connection}
            explanation={item.connectionExplanation}
          />
          <DetailBlock
            label="Know the difference"
            value={item.difference}
            explanation={item.differenceExplanation}
          />
          <DetailBlock
            label="Key clue"
            value={item.clue}
            explanation={item.clueExplanation}
          />
          <PromptAnswerBlock
            label="Common mistake"
            prompt={item.mistakePrompt}
            answer={item.mistakeCorrection}
            explanation={item.mistakeExplanation}
          />
          <PromptAnswerBlock
            label="Complete the mathematics"
            prompt={item.completionPrompt}
            answer={item.completionAnswer}
            explanation={item.completionExplanation}
          />
        </div>
      )}
    </article>
  );
}

export default function HigherLevelDictionaryBrowser({
  items,
  playPath,
  levelLabel,
  playLabel = "Practise Level 2",
  emptyMessage = "No matching mathematics words found.",
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(items.map((item) => item.category))).sort((a, b) =>
        a.localeCompare(b)
      ),
    ],
    [items]
  );

  const filtered = useMemo(() => {
    const needle = normalize(query);

    return items
      .filter((item) => {
        const categoryMatch = category === "All" || item.category === category;
        if (!categoryMatch) return false;
        if (!needle) return true;

        const haystack = normalize(
          [
            item.term,
            item.category,
            item.meaning,
            item.example,
            item.exampleExplanation,
            item.connection,
            item.connectionExplanation,
            item.difference,
            item.differenceExplanation,
            item.clue,
            item.clueExplanation,
            item.mistakePrompt,
            item.mistakeCorrection,
            item.mistakeExplanation,
            item.completionPrompt,
            item.completionAnswer,
            item.completionExplanation,
          ]
            .filter(Boolean)
            .join(" ")
        );

        return haystack.includes(needle);
      })
      .sort((a, b) =>
        a.term.localeCompare(b.term, undefined, { sensitivity: "base" })
      );
  }, [items, query, category]);

  return (
    <>
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block">
            <span className="text-sm font-black text-gray-700">
              Search {levelLabel}
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a word, meaning or example..."
              className="mt-2 min-h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <Link
            to={playPath}
            className="min-h-12 rounded-2xl bg-yellow-400 px-6 py-3 text-center font-black text-gray-950 transition hover:bg-yellow-300"
          >
            {playLabel}
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" aria-label="Dictionary categories">
          {categories.map((item) => {
            const active = category === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-black transition ${
                  active
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-700"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-sm font-bold text-gray-500">
          Showing {filtered.length} of {items.length} words
        </p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {filtered.map((item) => (
          <DictionaryCard key={item.termId} item={item} />
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="font-black text-gray-800">{emptyMessage}</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
            className="mt-4 rounded-xl bg-gray-950 px-5 py-3 font-black text-white"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
