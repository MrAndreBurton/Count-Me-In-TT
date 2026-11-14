import {
  EXPERIENCE_MODES,
} from "../../lib/symbolChallenge/constants";

const LEVELS = [
  {
    value: "all",
    title: "All Levels",
    description: "Mixed practice",
  },
  {
    value: "1",
    title: "Level 1",
    description: "Primary / SEA",
  },
  {
    value: "2",
    title: "Level 2",
    description: "Forms 1–3",
  },
  {
    value: "3",
    title: "Level 3",
    description: "CSEC",
  },
];

const DIFFICULTIES = [
  {
    value: "D1",
    title: "D1",
    description: "Build Confidence",
  },
  {
    value: "D2",
    title: "D2",
    description: "Challenge Me",
  },
  {
    value: "D3",
    title: "D3",
    description: "Strong Challenge",
  },
];

function choiceClass(
  selected
) {
  return [
    "relative rounded-2xl border-2 p-5 text-left transition duration-200 focus-visible:outline-none",
    "focus:outline-none focus:ring-4 focus:ring-blue-100",
    selected
      ? "border-amber-400 bg-amber-50 shadow-md shadow-amber-900/10"
      : "border-blue-100 bg-white hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md",
  ].join(" ");
}

export default function SymbolChallengeSetup({
  experienceMode,
  level,
  difficulty,
  memberAccess,
  membershipResolved,
  loading,
  error,
  onExperienceModeChange,
  onLevelChange,
  onDifficultyChange,
  onStart,
}) {
  const isFocus =
    experienceMode ===
    EXPERIENCE_MODES.FOCUS;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-9 text-white shadow-xl sm:px-10 sm:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[30px] border-white/5" />
        <div className="relative"><p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Mathematics Symbol Bank · Challenge chamber</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">Put your symbol knowledge to the test.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-blue-100">Choose your mode, set your level and step into a new round. Every symbol is another opportunity to learn.</p></div>
      </div>
      <section className="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-lg shadow-blue-950/5 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">
          Mathematics Symbol Challenge
        </p>

        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          Choose your playing style
        </h1>

        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Choose the experience that feels right for
          this round. The mathematics stays the same.
        </p>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              onExperienceModeChange(
                EXPERIENCE_MODES.CHALLENGE
              )
            }
            className={choiceClass(
              experienceMode ===
                EXPERIENCE_MODES.CHALLENGE
            )}
          >
            <span className="block text-xl font-black text-slate-950">
              Challenge Mode
            </span>

            <span className="mt-2 block text-sm font-semibold leading-6 text-slate-600">
              10 questions · 4 choices
            </span>

            <span className="mt-1 block text-sm text-slate-500">
              Standard challenge
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              onExperienceModeChange(
                EXPERIENCE_MODES.FOCUS
              )
            }
            className={choiceClass(
              isFocus
            )}
          >
            <span className="block text-xl font-black text-slate-950">
              Focus Mode
            </span>

            <span className="mt-2 block text-sm font-semibold leading-6 text-slate-600">
              5 questions · 2 choices
            </span>

            <span className="mt-1 block text-sm text-slate-500">
              Calm pace · one supported retry
            </span>
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-lg shadow-blue-950/5 sm:p-8">
        <h2 className="text-xl font-black">
          Choose your level
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map(
            (item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  onLevelChange(
                    item.value
                  )
                }
                className={choiceClass(
                  level ===
                    item.value
                )}
              >
                <span className="block font-black">
                  {item.title}
                </span>

                <span className="mt-1 block text-sm text-slate-500">
                  {item.description}
                </span>
              </button>
            )
          )}
        </div>
      </section>

      <section className="mt-5 rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-lg shadow-blue-950/5 sm:p-8">
        <h2 className="text-xl font-black">
          Choose your challenge
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {DIFFICULTIES.map(
            (item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  onDifficultyChange(
                    item.value
                  )
                }
                className={choiceClass(
                  difficulty ===
                    item.value
                )}
              >
                <span className="block text-lg font-black">
                  {item.title}
                </span>

                <span className="mt-1 block text-sm text-slate-500">
                  {item.description}
                </span>
              </button>
            )
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {isFocus ? (
            <>
              Focus Mode is free to play and does not
              require an account. This round uses the
              public Symbol Bank collection.
            </>
          ) : membershipResolved &&
            memberAccess ? (
            <>
              Your membership is active. Member Symbol
              Bank records can appear in this round.
            </>
          ) : (
            <>
              This Challenge round will use the public
              Symbol Bank collection.
            </>
          )}
        </div>

        {error ? (
          <div
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-8 py-3 font-black text-slate-950 shadow-md shadow-amber-900/10 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Preparing round…"
            : "Start Challenge"}
        </button>
      </section>
    </div>
  );
}
