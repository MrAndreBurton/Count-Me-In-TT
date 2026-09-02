import { useMemo, useRef, useState } from "react";

import GameHeader from "../components/layout/GameHeader";
import MathLanguageLevelNav from "../components/mathLanguage/MathLanguageLevelNav";
import MathLanguageBrand from "../components/mathLanguage/MathLanguageBrand";
import MathLanguageFooter from "../components/mathLanguage/MathLanguageFooter";

import {
  LEVEL2_MODES,
  createShuffleSeed,
  loadLevel2Round,
  saveLevel2Round,
  seededFisherYates,
} from "../lib/mathLanguageLevel2";

const QUESTION_COUNT = 10;

function prepareQuestions(rawQuestions, roundNonce) {
  return rawQuestions.map((question) => {
    const shuffleSeed = createShuffleSeed(
      question.question_id,
      roundNonce
    );

    const options = seededFisherYates(
      question.options || [],
      shuffleSeed
    );

    if (options.length !== 4) {
      throw new Error(
        `Question ${question.question_id} does not contain four active options.`
      );
    }

    return {
      ...question,
      shuffleSeed,
      options,
    };
  });
}

export default function MathLanguageLevel2Play() {
  const [status, setStatus] = useState("select");
  const [modeId, setModeId] = useState(
    LEVEL2_MODES[0].id
  );
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [
    selectedOptionId,
    setSelectedOptionId,
  ] = useState(null);
  const [
    attemptItems,
    setAttemptItems,
  ] = useState([]);
  const [error, setError] = useState("");
  const [
    saveResult,
    setSaveResult,
  ] = useState(null);

  const startedAtRef = useRef(null);
  const questionStartedAtRef =
    useRef(null);

  const currentQuestion =
    questions[index] || null;

  const selectedOption = useMemo(
    () =>
      currentQuestion?.options?.find(
        (option) =>
          option.option_id ===
          selectedOptionId
      ) || null,
    [
      currentQuestion,
      selectedOptionId,
    ]
  );

  const score = attemptItems.filter(
    (item) => item.is_correct
  ).length;

  async function startRound() {
    setError("");
    setStatus("loading");
    setSaveResult(null);

    try {
      const payload =
        await loadLevel2Round({
          modeId,
          questionCount:
            QUESTION_COUNT,
        });

      const roundNonce = `${
        Date.now()
      }:${
        crypto?.randomUUID?.() ||
        Math.random()
          .toString(36)
          .slice(2)
      }`;

      const prepared =
        prepareQuestions(
          payload.questions || [],
          roundNonce
        );

      if (
        prepared.length !==
        QUESTION_COUNT
      ) {
        throw new Error(
          `Expected ${QUESTION_COUNT} Level 2 questions but received ${prepared.length}.`
        );
      }

      setQuestions(prepared);
      setIndex(0);
      setSelectedOptionId(null);
      setAttemptItems([]);

      startedAtRef.current =
        performance.now();

      questionStartedAtRef.current =
        performance.now();

      setStatus("active");
    } catch (roundError) {
      console.error(
        "Level 2 production round load failed:",
        roundError
      );

      setError(
        roundError?.message ||
          "The Level 2 round could not be loaded."
      );

      setStatus("select");
    }
  }

  function selectAnswer(option) {
    if (
      status !== "active" ||
      selectedOptionId ||
      !currentQuestion
    ) {
      return;
    }

    const isCorrect =
      option.option_id ===
      currentQuestion
        .canonical_correct_option_id;

    const responseMs = Math.max(
      0,
      Math.round(
        performance.now() -
          questionStartedAtRef.current
      )
    );

    setSelectedOptionId(
      option.option_id
    );

    setAttemptItems((previous) => [
      ...previous,
      {
        release_id:
          currentQuestion.release_id,

        question_id:
          currentQuestion.question_id,

        term_id:
          currentQuestion.term_id,

        selected_option_id:
          option.option_id,

        displayed_position:
          option.displayed_position,

        shuffle_seed:
          currentQuestion.shuffleSeed,

        is_correct: isCorrect,

        response_ms: responseMs,

        answer_sequence:
          previous.length + 1,

        attempt_metadata: {
          runtime:
            "level2-production-v1",

          difficulty_id:
            currentQuestion
              .difficulty_id,
        },
      },
    ]);
  }

  async function nextQuestion() {
    if (!selectedOptionId) {
      return;
    }

    if (
      index <
      questions.length - 1
    ) {
      setIndex(
        (previous) =>
          previous + 1
      );

      setSelectedOptionId(null);

      questionStartedAtRef.current =
        performance.now();

      return;
    }

    setStatus("saving");

    try {
      const durationMs = Math.max(
        0,
        Math.round(
          performance.now() -
            startedAtRef.current
        )
      );

      const result =
        await saveLevel2Round({
          modeId,
          durationMs,
          attemptItems,
        });

      setSaveResult(result);
      setStatus("complete");
    } catch (saveError) {
      console.error(
        "Level 2 production round save failed:",
        saveError
      );

      setError(
        saveError?.message ||
          "The round was completed, but the result could not be saved."
      );

      setStatus("save_error");
    }
  }

  function reset() {
    setStatus("select");
    setQuestions([]);
    setIndex(0);
    setSelectedOptionId(null);
    setAttemptItems([]);
    setError("");
    setSaveResult(null);

    startedAtRef.current = null;
    questionStartedAtRef.current =
      null;
  }

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <GameHeader />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
       <MathLanguageLevelNav currentLevel="level-2" />

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <MathLanguageBrand />

          <p className="mt-5 text-sm font-black uppercase tracking-wider text-blue-700">
            Level 2 · Forms 1–3
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Secondary Mathematics
            Language
          </h1>

          {status === "select" && (
            <div className="mt-7">
              <p className="leading-7 text-gray-700">
                Choose one of the
                four Level 2
                Mathematics Language
                modes and complete a
                10-question round.
              </p>

              <div className="mt-6 grid gap-3">
                {LEVEL2_MODES.map(
                  (mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        setModeId(
                          mode.id
                        )
                      }
                      className={`rounded-2xl border-2 p-5 text-left transition ${
                        modeId ===
                        mode.id
                          ? "border-yellow-400 bg-yellow-50 ring-4 ring-yellow-100"
                          : "border-gray-200 hover:border-yellow-300"
                      }`}
                    >
                      <p className="text-lg font-black">
                        {
                          mode.shortName
                        }
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        {
                          mode.description
                        }
                      </p>
                    </button>
                  )
                )}
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={startRound}
                className="mt-6 w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-black hover:bg-yellow-300"
              >
                Start 10-Question
                Round
              </button>
            </div>
          )}

          {status === "loading" && (
            <p className="mt-8 font-bold text-gray-600">
              Loading Level 2
              questions…
            </p>
          )}

          {(status === "active" ||
            status === "saving") &&
            currentQuestion && (
              <div className="mt-7">
                <div className="flex items-center justify-between gap-4 text-sm font-black text-gray-500">
                  <span>
                    Question{" "}
                    {index + 1} of{" "}
                    {
                      questions.length
                    }
                  </span>

                  <span>
                    {
                      LEVEL2_MODES.find(
                        (mode) =>
                          mode.id ===
                          modeId
                      )?.shortName
                    }
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-black leading-snug">
                  {
                    currentQuestion.prompt
                  }
                </h2>

                <div className="mt-6 grid gap-3">
                  {currentQuestion.options.map(
                    (option) => {
                      const chosen =
                        selectedOptionId ===
                        option.option_id;

                      const revealedCorrect =
                        Boolean(
                          selectedOptionId
                        ) &&
                        option.option_id ===
                          currentQuestion
                            .canonical_correct_option_id;

                      return (
                        <button
                          key={
                            option.option_id
                          }
                          type="button"
                          disabled={
                            Boolean(
                              selectedOptionId
                            ) ||
                            status ===
                              "saving"
                          }
                          onClick={() =>
                            selectAnswer(
                              option
                            )
                          }
                          className={`rounded-2xl border-2 p-4 text-left transition ${
                            revealedCorrect
                              ? "border-green-400 bg-green-50"
                              : chosen
                                ? "border-red-400 bg-red-50"
                                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-black">
                            {
                              option.displayed_position
                            }
                          </span>

                          <span className="font-bold">
                            {
                              option.option_text
                            }
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                {selectedOption && (
                  <div
                    className={`mt-5 rounded-2xl p-4 ${
                      selectedOption.option_id ===
                      currentQuestion
                        .canonical_correct_option_id
                        ? "bg-green-50 text-green-900"
                        : "bg-amber-50 text-amber-950"
                    }`}
                  >
                    <p className="font-black">
                      {selectedOption.option_id ===
                      currentQuestion
                        .canonical_correct_option_id
                        ? "Correct"
                        : "Not quite"}
                    </p>

                    {selectedOption.feedback_text && (
                      <p className="mt-1 leading-6">
                        {
                          selectedOption.feedback_text
                        }
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={
                    nextQuestion
                  }
                  disabled={
                    !selectedOptionId ||
                    status ===
                      "saving"
                  }
                  className="mt-6 w-full rounded-2xl bg-blue-700 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status ===
                  "saving"
                    ? "Saving round…"
                    : index ===
                        questions.length -
                          1
                      ? "Finish & Save Round"
                      : "Next Question"}
                </button>
              </div>
            )}

          {status ===
            "save_error" && (
            <div className="mt-7 rounded-2xl bg-red-50 p-5 text-red-800">
              <p className="font-black">
                The round completed
                but did not save.
              </p>

              <p className="mt-2">
                {error}
              </p>

              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-xl bg-white px-4 py-2 font-black"
              >
                Return to mode
                selection
              </button>
            </div>
          )}

          {status ===
            "complete" && (
            <div className="mt-7 text-center">
              <p className="text-sm font-black uppercase tracking-wider text-green-700">
                Round Saved
              </p>

              <p className="mt-3 text-5xl font-black">
                {saveResult?.score ??
                  score}
                /
                {saveResult?.max_score ??
                  questions.length}
              </p>

              <p className="mt-3 text-gray-600">
                Your Level 2
                Mathematics Language
                result has been saved
                to your learning
                profile.
              </p>

              <button
                type="button"
                onClick={reset}
                className="mt-6 rounded-2xl bg-yellow-400 px-6 py-3 font-black"
              >
                Play Another Mode
              </button>
            </div>
          )}
        </section>
      </main>

      <MathLanguageFooter />
    </div>
  );
}


