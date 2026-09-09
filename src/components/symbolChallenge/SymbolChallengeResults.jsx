import {
  Link,
} from "react-router-dom";

export default function SymbolChallengeResults({
  experienceMode,
  responses,
  total,
  onPlayAgain,
  onChangeSettings,
}) {
  const isFocus =
    experienceMode ===
    "FOCUS";

  const firstTryCorrect =
    responses.filter(
      (response) =>
        response
          .firstResponseCorrect ===
        true
    ).length;

  const finalCorrect =
    responses.filter(
      (response) =>
        response
          .finalResponseCorrect ===
        true
    ).length;

  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">
          Round Complete
        </p>

        <h1 className="mt-3 text-4xl font-black sm:text-5xl">
          {finalCorrect} / {total}
        </h1>

        <p className="mt-3 text-lg font-bold text-slate-700">
          correct
        </p>

        {isFocus ? (
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">
              First try
            </p>

            <p className="mt-1 text-2xl font-black">
              {firstTryCorrect} /{" "}
              {total}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Focus Mode keeps first-response
              results separate from answers
              completed with the supported
              retry.
            </p>
          </div>
        ) : null}

        <p className="mx-auto mt-6 max-w-lg leading-7 text-slate-600">
          {finalCorrect === total
            ? "Excellent work. You completed the whole round correctly."
            : finalCorrect >=
                Math.ceil(
                  total * 0.7
                )
              ? "Strong work. Keep building your symbol knowledge."
              : "Good practice. Another round will help these symbols become more familiar."}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-700"
          >
            Play Again
          </button>

          <button
            type="button"
            onClick={onChangeSettings}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-black text-slate-800 hover:bg-slate-50"
          >
            Change Settings
          </button>

          <Link
            to="/symbol-bank"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-black text-slate-800 hover:bg-slate-50"
          >
            Back to Symbol Bank
          </Link>
        </div>
      </section>
    </div>
  );
}
