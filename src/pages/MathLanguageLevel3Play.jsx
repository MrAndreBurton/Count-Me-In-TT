import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import GameHeader from "../components/layout/GameHeader";
import MathLanguageLevelNav from "../components/mathLanguage/MathLanguageLevelNav";

import {
  LEVEL3_MODES,
  LEVEL3_RELEASE_ID,
  evaluateLevel3Answer,
  getLevel3Mode,
  loadLevel3Release,
  saveLevel3Round,
} from "../lib/mathLanguageLevel3";

const ROUND_LENGTH = 10;

function initialState() {
  return {
    status: "selecting",
    release: null,
    selectedModeId: null,
    questions: [],
    index: 0,
    answers: [],
    selectedOptionId: null,
    feedback: "",
    error: "",
  };
}

export default function MathLanguageLevel3Play() {
  const [state, setState] = useState(initialState);
  const [startedAt, setStartedAt] = useState(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(null);

  const question = state.questions[state.index] || null;
  const mode = getLevel3Mode(state.selectedModeId);

  const score = useMemo(
    () => state.answers.filter((answer) => answer.isCorrect).length,
    [state.answers]
  );

  const currentAnswer =
    state.answers.length > 0
      ? state.answers[state.answers.length - 1]
      : null;

  const progress =
    state.questions.length > 0
      ? ((state.index + (state.selectedOptionId ? 1 : 0)) /
          state.questions.length) *
        100
      : 0;

  async function startMode(modeId) {
    setState((previous) => ({
      ...previous,
      status: "loading",
      selectedModeId: modeId,
      error: "",
    }));

    try {
      const result = await loadLevel3Release({
        releaseId: LEVEL3_RELEASE_ID,
        questionCount: ROUND_LENGTH,
        modeId,
      });

      const now = Date.now();
      setStartedAt(now);
      setQuestionStartedAt(now);

      setState({
        status: "active",
        release: result.release,
        selectedModeId: modeId,
        questions: result.questions,
        index: 0,
        answers: [],
        selectedOptionId: null,
        feedback: "",
        error: "",
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        status: "error",
        error: error?.message || "Unable to load Level 3.",
      }));
    }
  }

  function chooseAnswer(option) {
    if (!question || state.selectedOptionId) return;

    const responseMs = questionStartedAt
      ? Date.now() - questionStartedAt
      : null;

    const evaluated = evaluateLevel3Answer(
      question,
      option,
      responseMs
    );

    setState((previous) => ({
      ...previous,
      selectedOptionId: option.option_id,
      feedback: evaluated.feedbackText,
      answers: [...previous.answers, evaluated],
    }));
  }

  async function next() {
    if (!state.selectedOptionId) return;

    if (state.index < state.questions.length - 1) {
      setQuestionStartedAt(Date.now());
      setState((previous) => ({
        ...previous,
        index: previous.index + 1,
        selectedOptionId: null,
        feedback: "",
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      status: "saving",
    }));

    try {
      await saveLevel3Round({
        releaseId: state.release.release_id,
        gameMode: state.selectedModeId,
        answers: state.answers,
        durationMs: startedAt
          ? Date.now() - startedAt
          : null,
      });

      setState((previous) => ({
        ...previous,
        status: "complete",
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        status: "error",
        error:
          error?.message ||
          "The round was completed, but it could not be saved.",
      }));
    }
  }

  function playAgain() {
    if (!state.selectedModeId) {
      setState(initialState());
      return;
    }
    startMode(state.selectedModeId);
  }

 if (state.status === "selecting") {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <GameHeader />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <MathLanguageLevelNav currentLevel="level-3" />

        <div className="mx-auto max-w-3xl text-center">

            <p className="text-sm font-black uppercase tracking-[0.18em] text-purple-700">
              Mathematics Language · Level 3
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Choose how you want to be challenged
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600">
              Level 3 is about discriminating and applying mathematical
              concepts. Each round contains {ROUND_LENGTH} questions.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {LEVEL3_MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => startMode(item.id)}
                className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700">
                    {item.tier}
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    {ROUND_LENGTH} questions
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-black">
                  {item.name}
                </h2>
                <p className="mt-2 leading-6 text-gray-600">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="font-bold">Preparing your Level 3 round…</p>
      </main>
    );
  }

 if (state.status === "error") {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <GameHeader />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-black text-red-800">
            Level 3 could not continue
          </h1>

          <p className="mt-2 text-red-700">
            {state.error}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setState(initialState())}
              className="rounded-xl bg-gray-950 px-5 py-3 font-black text-white"
            >
              Return to Level 3 modes
            </button>

            <Link
              to="/math-language"
              className="rounded-xl border-2 border-gray-900 px-5 py-3 text-center font-black text-gray-950 hover:bg-white"
            >
              Math Language Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

  if (state.status === "saving") {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="font-bold">Saving your Level 3 result…</p>
      </main>
    );
  }

  if (state.status === "complete") {
  const percent =
    state.questions.length > 0
      ? Math.round((score / state.questions.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <GameHeader />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <MathLanguageLevelNav currentLevel="level-3" />

        <section className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">

            <p className="text-sm font-black uppercase tracking-[0.16em] text-purple-700">
              {mode?.name || "Level 3"}
            </p>
            <h1 className="mt-3 text-4xl font-black">
              Round complete
            </h1>

            <div className="mx-auto mt-7 flex h-32 w-32 items-center justify-center rounded-full border-8 border-purple-100">
              <div>
                <div className="text-3xl font-black">
                  {score}/{state.questions.length}
                </div>
                <div className="text-sm font-bold text-gray-500">
                  {percent}%
                </div>
              </div>
            </div>

            <p className="mx-auto mt-6 max-w-xl leading-7 text-gray-600">
              Your result has been saved. Try the same mode again or
              choose a different Level 3 challenge.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={playAgain}
                className="rounded-xl bg-yellow-400 px-6 py-3 font-black text-gray-950 hover:bg-yellow-300"
              >
                Play this mode again
              </button>
              <button
                type="button"
                onClick={() => setState(initialState())}
                className="rounded-xl border-2 border-gray-900 px-6 py-3 font-black"
              >
                Choose another mode
              </button>
            </div>

            <Link
              to="/math-language"
              className="mt-6 inline-block font-bold text-blue-700 hover:underline"
            >
              Return to Math Language
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const isCorrect = Boolean(currentAnswer?.isCorrect);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <GameHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
  <button
    type="button"
    onClick={() => setState(initialState())}
    className="mb-5 text-sm font-black text-gray-600 hover:text-purple-700"
  >
    ← Back to Level 3 modes
  </button>

  <div className="flex flex-wrap items-end justify-between gap-3">

          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-700">
              Level 3 · {mode?.tier}
            </p>
            <h1 className="mt-1 text-xl font-black">
              {mode?.name}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-black">
              {state.index + 1} of {state.questions.length}
            </p>
            <p className="text-xs font-bold text-gray-500">
              Score {score}
            </p>
          </div>
        </div>

        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200"
          aria-label={`Question ${state.index + 1} of ${state.questions.length}`}
        >
          <div
            className="h-full rounded-full bg-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black leading-tight">
            {question.prompt}
          </h2>

          <div className="mt-6 grid gap-3">
            {question.answerOptions.map((option) => {
              const selected =
                state.selectedOptionId === option.option_id;

              const correctOption =
                Boolean(state.selectedOptionId) &&
                option.option_id ===
                  question.canonical_correct_option_id;

              let answerClass =
                "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50";

              if (state.selectedOptionId) {
                if (correctOption) {
                  answerClass =
                    "border-green-500 bg-green-50";
                } else if (selected) {
                  answerClass =
                    "border-red-400 bg-red-50";
                } else {
                  answerClass =
                    "border-gray-200 bg-white opacity-65";
                }
              }

              return (
                <button
                  key={option.option_id}
                  type="button"
                  onClick={() => chooseAnswer(option)}
                  disabled={Boolean(state.selectedOptionId)}
                  className={`rounded-2xl border-2 p-4 text-left transition ${answerClass}`}
                >
                  <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-black">
                    {option.displayedPosition}
                  </span>
                  <span className="font-semibold">
                    {option.option_text}
                  </span>
                </button>
              );
            })}
          </div>

          {state.selectedOptionId && (
            <div
              className={`mt-6 rounded-2xl border p-5 ${
                isCorrect
                  ? "border-green-200 bg-green-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <p className="text-lg font-black">
                {isCorrect ? "Correct" : "Not quite"}
              </p>
              <p className="mt-2 leading-7 text-gray-700">
                {state.feedback ||
                  (isCorrect
                    ? "That is the correct mathematical distinction."
                    : "Review the distinction and try to identify the strongest mathematical clue.")}
              </p>

              <button
                type="button"
                onClick={next}
                className="mt-5 rounded-xl bg-yellow-400 px-5 py-3 font-black text-gray-950 hover:bg-yellow-300"
              >
                {state.index === state.questions.length - 1
                  ? "Finish round"
                  : "Next question"}
              </button>
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-xs text-gray-400">
          Math Language · Level 3
        </p>
      </main>
    </div>
  );
}


