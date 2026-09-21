import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import GameHeader from "../components/layout/GameHeader";
import {
  FREE_PRACTICE_TABLES,
  PRACTICE_MODES,
  PRACTICE_RANGES,
  PRACTICE_TABLES,
  createPracticeFacts,
  createPracticeResult,
  formatPracticeTime,
} from "../components/multiplication/practice/practiceConfig";
import {
  GUEST_PRACTICE_ACCESS,
  getMultiplicationPracticeAccess,
  getMultiplicationPracticeBest,
  saveMultiplicationPracticeRound,
  subscribeToPracticeAuthChanges,
} from "../services/multiplicationPracticeResults";

const INCORRECT_CHECK_DELAY_MS = 650;
const CORRECT_ADVANCE_DELAY_MS = 180;

export default function MultiplicationPractice() {
  const [screen, setScreen] = useState("setup");
  const [tableNumber, setTableNumber] = useState(2);
  const [mode, setMode] = useState("build");
  const [rangeMax, setRangeMax] = useState(12);
  const [facts, setFacts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [access, setAccess] = useState({
    ...GUEST_PRACTICE_ACCESS,
    status: "loading",
  });
  const [accessError, setAccessError] = useState("");
  const [lockedTable, setLockedTable] = useState(null);
  const [personalBest, setPersonalBest] = useState({
    status: "idle",
    durationMs: null,
  });
  const [saveState, setSaveState] = useState({
    status: "idle",
    data: null,
    message: "",
  });

  const answerInputRef = useRef(null);
  const answerValueRef = useRef("");
  const startTimestampRef = useRef(null);
  const timerRef = useRef(null);
  const validationTimerRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const incorrectAttemptsRef = useRef(0);
  const missedFactsRef = useRef(new Set());
  const lastCountedWrongRef = useRef("");

  const currentFact = facts[currentIndex] || null;
  const displayTime = formatPracticeTime(elapsed);

  const clearValidationTimer = useCallback(() => {
    if (validationTimerRef.current) {
      window.clearTimeout(validationTimerRef.current);
      validationTimerRef.current = null;
    }
  }, []);

  const clearRoundTimers = useCallback(() => {
    clearValidationTimer();

    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [clearValidationTimer]);

  useEffect(() => {
    document.title =
      "Times Table Practice | CountMeInTT";

    let meta = document.querySelector(
      'meta[name="description"]'
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.content =
      "Practise individual multiplication tables in order or shuffled with timed CountMeInTT rounds.";
  }, []);

  useEffect(() => {
    return () => clearRoundTimers();
  }, [clearRoundTimers]);

  const loadAccess = useCallback(async () => {
    setAccessError("");

    try {
      const nextAccess =
        await getMultiplicationPracticeAccess();

      setAccess({
        ...nextAccess,
        status: "ready",
      });
    } catch (error) {
      console.error("Practice access error:", error);
      setAccess({
        ...GUEST_PRACTICE_ACCESS,
        status: "ready",
      });
      setAccessError(
        error?.message ||
          "Your practice access could not be checked."
      );
    }
  }, []);

  useEffect(() => {
    void loadAccess();

    return subscribeToPracticeAuthChanges(() => {
      void loadAccess();
    });
  }, [loadAccess]);

  const canUseTable = useCallback(
    (number) =>
      FREE_PRACTICE_TABLES.has(number) ||
      access.hasMemberAccess,
    [access.hasMemberAccess]
  );

  useEffect(() => {
    if (
      access.status === "ready" &&
      !canUseTable(tableNumber)
    ) {
      setTableNumber(2);
    }
  }, [access.status, canUseTable, tableNumber]);

  useEffect(() => {
    let isCurrent = true;

    if (
      screen !== "setup" ||
      !access.authenticated ||
      !access.profile?.id ||
      !canUseTable(tableNumber)
    ) {
      setPersonalBest({
        status: "idle",
        durationMs: null,
      });
      return () => {
        isCurrent = false;
      };
    }

    setPersonalBest({
      status: "loading",
      durationMs: null,
    });

    getMultiplicationPracticeBest({
      tableNumber,
      mode,
      rangeMax,
    })
      .then((best) => {
        if (!isCurrent) return;

        setPersonalBest({
          status: "ready",
          durationMs: best.bestDurationMs,
        });
      })
      .catch((error) => {
        if (!isCurrent) return;

        console.error("Practice best error:", error);
        setPersonalBest({
          status: "error",
          durationMs: null,
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [
    access.authenticated,
    access.profile?.id,
    canUseTable,
    mode,
    rangeMax,
    screen,
    tableNumber,
  ]);

  const focusAnswer = useCallback(() => {
    window.setTimeout(() => {
      answerInputRef.current?.focus();
    }, 60);
  }, []);

  const resetRoundState = useCallback(() => {
    clearRoundTimers();
    setCurrentIndex(0);
    setAnswer("");
    setFeedback("idle");
    setElapsed(0);
    setResult(null);
    setSaveState({
      status: "idle",
      data: null,
      message: "",
    });

    answerValueRef.current = "";
    startTimestampRef.current = null;
    incorrectAttemptsRef.current = 0;
    missedFactsRef.current = new Set();
    lastCountedWrongRef.current = "";
  }, [clearRoundTimers]);

  const openRound = useCallback(
    (nextFacts) => {
      resetRoundState();
      setFacts(nextFacts.map((fact) => ({ ...fact })));
      setScreen("play");
      focusAnswer();
    },
    [focusAnswer, resetRoundState]
  );

  const startNewRound = ({
    nextMode = mode,
  } = {}) => {
    if (!canUseTable(tableNumber)) {
      setLockedTable(tableNumber);
      return;
    }

    const nextFacts = createPracticeFacts({
      tableNumber,
      rangeMax,
      mode: nextMode,
    });

    setMode(nextMode);
    openRound(nextFacts);
  };

  const startClock = () => {
    if (startTimestampRef.current !== null) return;

    const startTimestamp = Date.now();
    startTimestampRef.current = startTimestamp;

    timerRef.current = window.setInterval(() => {
      setElapsed(Date.now() - startTimestamp);
    }, 10);
  };

  const finishRound = async () => {
    clearRoundTimers();

    const finalElapsed =
      startTimestampRef.current !== null
        ? Date.now() - startTimestampRef.current
        : elapsed;

    const completedResult = createPracticeResult({
      tableNumber,
      mode,
      rangeMax,
      durationMs: finalElapsed,
      incorrectAttempts:
        incorrectAttemptsRef.current,
      factsMissedFirstTry:
        missedFactsRef.current.size,
    });

    setElapsed(finalElapsed);
    setResult(completedResult);
    setScreen("results");

    if (!access.authenticated) {
      setSaveState({
        status: "guest",
        data: null,
        message: "Guest rounds are not saved.",
      });
      return;
    }

    setSaveState({
      status: "saving",
      data: null,
      message: "Saving your round…",
    });

    try {
      const saved = await saveMultiplicationPracticeRound(
        completedResult
      );

      if (!saved.saved) {
        setSaveState({
          status: "guest",
          data: saved,
          message: "Guest rounds are not saved.",
        });
        return;
      }

      setSaveState({
        status: "saved",
        data: saved,
        message: "Your round was saved.",
      });
      setPersonalBest({
        status: "ready",
        durationMs: saved.bestDurationMs,
      });
    } catch (error) {
      console.error("Practice save error:", error);
      setSaveState({
        status: "error",
        data: null,
        message:
          error?.message ||
          "This round could not be saved.",
      });
    }
  };

  const moveToNextFact = () => {
    if (currentIndex >= facts.length - 1) {
      void finishRound();
      return;
    }

    setCurrentIndex((index) => index + 1);
    setAnswer("");
    setFeedback("idle");
    answerValueRef.current = "";
    lastCountedWrongRef.current = "";
    focusAnswer();
  };

  const acceptCorrectAnswer = () => {
    clearValidationTimer();
    setFeedback("correct");

    advanceTimerRef.current = window.setTimeout(
      moveToNextFact,
      CORRECT_ADVANCE_DELAY_MS
    );
  };

  const registerIncorrectAnswer = useCallback(
    (value, fact) => {
      if (!fact || !value) return;

      const wrongKey = `${fact.id}:${value}`;

      if (lastCountedWrongRef.current === wrongKey) {
        return;
      }

      lastCountedWrongRef.current = wrongKey;
      incorrectAttemptsRef.current += 1;
      missedFactsRef.current.add(fact.id);
      setFeedback("incorrect");

      window.requestAnimationFrame(() => {
        answerInputRef.current?.focus();
        answerInputRef.current?.select();
      });
    },
    []
  );

  const scheduleIncorrectCheck = (value, fact) => {
    clearValidationTimer();

    validationTimerRef.current = window.setTimeout(() => {
      if (
        answerValueRef.current === value &&
        Number(value) !== fact.answer
      ) {
        registerIncorrectAnswer(value, fact);
      }
    }, INCORRECT_CHECK_DELAY_MS);
  };

  const handleAnswerChange = (event) => {
    if (!currentFact || feedback === "correct") return;

    const cleanValue = String(event.target.value || "")
      .replace(/\D+/g, "")
      .slice(0, 3);

    setAnswer(cleanValue);
    answerValueRef.current = cleanValue;
    setFeedback("idle");
    clearValidationTimer();

    if (!cleanValue) return;

    startClock();

    if (Number(cleanValue) === currentFact.answer) {
      acceptCorrectAnswer();
      return;
    }

    scheduleIncorrectCheck(cleanValue, currentFact);
  };

  const handleAnswerKeyDown = (event) => {
    if (event.key !== "Enter" || !currentFact) return;

    event.preventDefault();

    if (
      answer &&
      Number(answer) !== currentFact.answer
    ) {
      clearValidationTimer();
      registerIncorrectAnswer(answer, currentFact);
    }
  };

  const tryAgain = () => {
    openRound(facts);
  };

  const shuffleAgain = () => {
    startNewRound({ nextMode: "mix" });
  };

  const returnToSetup = () => {
    resetRoundState();
    setFacts([]);
    setScreen("setup");
  };

  const progressPercent = facts.length
    ? Math.round((currentIndex / facts.length) * 100)
    : 0;

  const selectedMode = PRACTICE_MODES[mode];

  const resultSummary = useMemo(() => {
    if (!result) return null;

    return {
      time: formatPracticeTime(result.durationMs),
      accuracy: `${result.firstTryAccuracy}%`,
      mistakes: result.incorrectAttempts,
    };
  }, [result]);

  const personalBestMessage = useMemo(() => {
    if (saveState.status !== "saved" || !saveState.data) {
      return null;
    }

    const saved = saveState.data;

    if (saved.previousBestDurationMs === null) {
      return `First result saved — ${formatPracticeTime(
        saved.bestDurationMs
      )} is your starting personal best.`;
    }

    if (saved.isPersonalBest) {
      const improvement =
        saved.previousBestDurationMs - saved.durationMs;

      return `New personal best! You improved by ${formatPracticeTime(
        improvement
      )}.`;
    }

    if (saved.durationMs === saved.bestDurationMs) {
      return `You matched your personal best of ${formatPracticeTime(
        saved.bestDurationMs
      )}.`;
    }

    return `Your personal best is ${formatPracticeTime(
      saved.bestDurationMs
    )}.`;
  }, [saveState]);

  return (
    <div
      className="min-h-screen text-gray-950"
      style={{
        backgroundColor: "#fce500",
        backgroundImage: 'url("/math-bg.svg")',
        backgroundRepeat: "repeat",
        backgroundSize: "300px",
        backgroundAttachment: "fixed",
      }}
    >
      <GameHeader />

      <main className="px-4 py-8 sm:px-5 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/games"
              className="rounded-xl border-2 border-blue-600 bg-white px-4 py-2 text-sm font-black text-blue-600 transition hover:bg-blue-50"
            >
              ← All Games
            </Link>

            {screen !== "setup" && (
              <button
                type="button"
                onClick={returnToSetup}
                disabled={saveState.status === "saving"}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Choose Another Table
              </button>
            )}
          </div>

          {screen === "setup" && (
            <section className="rounded-3xl border border-yellow-300 bg-yellow-50/95 p-5 shadow-xl sm:p-8">
              <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                Build multiplication fluency
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-5xl">
                Times Table Practice
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                Choose one table, decide how you want the
                facts arranged, and complete a timed round.
              </p>

              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                {access.status === "loading" ? (
                  <p className="font-black text-blue-900">
                    Checking your practice access…
                  </p>
                ) : access.authenticated ? (
                  <>
                    <p className="font-black text-blue-950">
                      Playing as {access.profile?.displayName || "Student"}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-600">
                      {access.hasMemberAccess
                        ? "Member access is active. All tables are unlocked and completed rounds are saved."
                        : "Your free tables are available and completed rounds are saved to your profile."}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-black text-blue-950">
                      Playing as a guest
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-600">
                      Free tables are available, but guest rounds are never saved.{" "}
                      <Link
                        to="/login?returnTo=%2Fgames%2Fmultiplication%2Fpractice"
                        className="font-black text-blue-700 underline"
                      >
                        Sign in to save results.
                      </Link>
                    </p>
                  </>
                )}

                {accessError && (
                  <p className="mt-2 text-sm font-bold text-red-700">
                    {accessError}
                  </p>
                )}
              </div>

              <div className="mt-8">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <h2 className="text-xl font-black">
                    1. Choose a table
                  </h2>

                  <p className="text-xs font-bold text-gray-500">
                    ×1, ×2, ×5 and ×10 are free
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {PRACTICE_TABLES.map((number) => {
                    const isFree =
                      FREE_PRACTICE_TABLES.has(number);
                    const isLocked =
                      !isFree && !access.hasMemberAccess;
                    const isSelected =
                      tableNumber === number;

                    return (
                      <button
                        key={number}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={
                          isLocked
                            ? `Times ${number}, member table, locked`
                            : `Times ${number}`
                        }
                        onClick={() => {
                          if (isLocked) {
                            setLockedTable(number);
                            return;
                          }

                          setTableNumber(number);
                        }}
                        className={[
                          "relative min-h-16 rounded-xl border-2 px-3 py-3 text-xl font-black transition",
                          isSelected
                            ? "border-blue-700 bg-blue-600 text-white shadow-lg"
                            : isLocked
                              ? "border-gray-300 bg-gray-100 text-gray-500 hover:border-violet-400 hover:bg-violet-50"
                              : "border-yellow-300 bg-white hover:border-blue-400 hover:bg-blue-50",
                        ].join(" ")}
                      >
                        ×{number}

                        <span
                          className={[
                            "mt-1 block text-[9px] font-black uppercase tracking-wide",
                            isSelected
                              ? "text-blue-100"
                              : isFree
                                ? "text-green-700"
                                : isLocked
                                  ? "text-violet-700"
                                  : "text-green-700",
                          ].join(" ")}
                        >
                          {isFree
                            ? "Free"
                            : isLocked
                              ? "🔒 Member"
                              : "Member"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-9">
                <h2 className="text-xl font-black">
                  2. Choose a mode
                </h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.values(PRACTICE_MODES).map(
                    (practiceMode) => {
                      const isSelected =
                        mode === practiceMode.id;

                      return (
                        <button
                          key={practiceMode.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() =>
                            setMode(practiceMode.id)
                          }
                          className={[
                            "rounded-2xl border-2 p-5 text-left transition",
                            isSelected
                              ? "border-blue-700 bg-blue-600 text-white shadow-lg"
                              : "border-yellow-300 bg-white hover:border-blue-400 hover:bg-blue-50",
                          ].join(" ")}
                        >
                          <span className="block text-lg font-black">
                            {practiceMode.label}
                          </span>

                          <span
                            className={[
                              "mt-2 block text-sm font-semibold",
                              isSelected
                                ? "text-blue-100"
                                : "text-gray-600",
                            ].join(" ")}
                          >
                            {practiceMode.description}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="mt-9">
                <h2 className="text-xl font-black">
                  3. Choose the length
                </h2>

                <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border-2 border-yellow-300 bg-white">
                  {PRACTICE_RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      aria-pressed={rangeMax === range}
                      onClick={() => setRangeMax(range)}
                      className={[
                        "min-h-14 px-4 py-3 font-black transition",
                        rangeMax === range
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-800 hover:bg-blue-50",
                      ].join(" ")}
                    >
                      Up to {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-blue-950">
                    ×{tableNumber} · {selectedMode.label}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-600">
                    {rangeMax} timed facts · {tableNumber} × 1
                    through {tableNumber} × {rangeMax}
                  </p>

                  {access.authenticated && (
                    <p className="mt-2 text-xs font-bold text-blue-700">
                      {personalBest.status === "loading"
                        ? "Loading personal best…"
                        : personalBest.status === "ready" &&
                            personalBest.durationMs !== null
                          ? `Personal best for this exact round: ${formatPracticeTime(
                              personalBest.durationMs
                            )}`
                          : "No saved result yet for this exact round."}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => startNewRound()}
                  className="rounded-xl bg-blue-600 px-7 py-3 font-black text-white shadow transition hover:bg-blue-700"
                >
                  Start Round
                </button>
              </div>

              <p className="mt-4 text-center text-xs font-semibold text-gray-500">
                The timer starts when you enter your first
                answer.
              </p>
            </section>
          )}

          {screen === "play" && currentFact && (
            <section className="rounded-3xl border border-yellow-300 bg-yellow-50/95 p-5 shadow-xl sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-blue-700">
                    ×{tableNumber} · {selectedMode.label}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-500">
                    Fact {currentIndex + 1} of {facts.length}
                  </p>
                </div>

                <p className="rounded-xl bg-yellow-300 px-4 py-2 font-mono text-xl font-black shadow-sm sm:text-2xl">
                  {displayTime}
                </p>
              </div>

              <div
                className="mt-5 h-3 overflow-hidden rounded-full bg-yellow-200"
                role="progressbar"
                aria-label="Practice round progress"
                aria-valuenow={currentIndex}
                aria-valuemin={0}
                aria-valuemax={facts.length}
              >
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="py-10 text-center sm:py-14">
                <p className="text-5xl font-black sm:text-7xl">
                  {currentFact.tableNumber}
                  <span className="mx-4 text-blue-600">×</span>
                  {currentFact.factor}
                </p>

                <label
                  htmlFor="practice-answer"
                  className="mt-9 block text-sm font-black uppercase tracking-wide text-gray-600"
                >
                  Your answer
                </label>

                <input
                  ref={answerInputRef}
                  id="practice-answer"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={answer}
                  onChange={handleAnswerChange}
                  onKeyDown={handleAnswerKeyDown}
                  onPaste={(event) => event.preventDefault()}
                  onDrop={(event) => event.preventDefault()}
                  aria-describedby="practice-feedback"
                  className={[
                    "mx-auto mt-3 block h-20 w-full max-w-xs rounded-2xl border-2 bg-white text-center text-4xl font-black outline-none transition focus:ring-4",
                    feedback === "correct"
                      ? "border-green-500 bg-green-100 text-green-800 focus:ring-green-100"
                      : feedback === "incorrect"
                        ? "border-red-500 bg-red-100 text-red-800 focus:ring-red-100"
                        : "border-blue-500 focus:border-blue-600 focus:ring-blue-100",
                  ].join(" ")}
                />

                <div
                  id="practice-feedback"
                  className="mt-4 min-h-7 text-sm font-black"
                  aria-live="polite"
                >
                  {feedback === "correct" && (
                    <span className="text-green-700">
                      Correct! Moving to the next fact…
                    </span>
                  )}

                  {feedback === "incorrect" && (
                    <span className="text-red-700">
                      Try that one again.
                    </span>
                  )}

                  {feedback === "idle" && (
                    <span className="text-gray-500">
                      Correct answers move automatically.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 border-t border-yellow-200 pt-5">
                <button
                  type="button"
                  onClick={tryAgain}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700 transition hover:bg-gray-50"
                >
                  Reset Round
                </button>

                <button
                  type="button"
                  onClick={returnToSetup}
                  className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                >
                  Choose Another Table
                </button>
              </div>
            </section>
          )}

          {screen === "results" && resultSummary && (
            <section className="rounded-3xl border border-yellow-300 bg-yellow-50/95 p-5 text-center shadow-xl sm:p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-black text-green-700">
                ✓
              </div>

              <p className="mt-5 text-sm font-black uppercase tracking-wider text-blue-700">
                Round complete
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                ×{tableNumber} · {selectedMode.label}
              </h1>

              <p className="mt-2 font-semibold text-gray-600">
                {rangeMax} facts completed
              </p>

              <div className="mt-7 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <p className="text-sm font-black uppercase tracking-wide text-gray-600">
                  Your time
                </p>

                <p className="mt-2 font-mono text-4xl font-black text-blue-700 sm:text-5xl">
                  {resultSummary.time}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-yellow-300 bg-white p-5">
                  <p className="text-sm font-bold text-gray-500">
                    Mistakes
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {resultSummary.mistakes}
                  </p>
                </div>

                <div className="rounded-2xl border border-yellow-300 bg-white p-5">
                  <p className="text-sm font-bold text-gray-500">
                    First-try accuracy
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {resultSummary.accuracy}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left">
                {saveState.status === "saving" && (
                  <>
                    <p className="font-black text-violet-800">
                      Saving your round…
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-600">
                      Keep this page open for a moment.
                    </p>
                  </>
                )}

                {saveState.status === "saved" && (
                  <>
                    <p className="font-black text-violet-800">
                      Personal best
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-600">
                      {personalBestMessage}
                    </p>

                    <p className="mt-2 text-xs font-bold text-violet-700">
                      Saved for {access.profile?.displayName || "your profile"}.
                    </p>
                  </>
                )}

                {saveState.status === "guest" && (
                  <>
                    <p className="font-black text-violet-800">
                      This guest round was not saved
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-600">
                      <Link
                        to="/login?returnTo=%2Fgames%2Fmultiplication%2Fpractice"
                        className="font-black text-blue-700 underline"
                      >
                        Sign in
                      </Link>{" "}
                      before starting a round to record results and personal bests.
                    </p>
                  </>
                )}

                {saveState.status === "error" && (
                  <>
                    <p className="font-black text-red-800">
                      Round not saved
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-600">
                      {saveState.message}
                    </p>
                  </>
                )}
              </div>

              <div className="mt-7 grid gap-3">
                <button
                  type="button"
                  onClick={tryAgain}
                  disabled={saveState.status === "saving"}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Try Again
                </button>

                {mode === "mix" ? (
                  <button
                    type="button"
                    onClick={shuffleAgain}
                    disabled={saveState.status === "saving"}
                    className="w-full rounded-xl bg-violet-600 px-5 py-3 font-black text-white shadow transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Shuffle Again
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={shuffleAgain}
                    disabled={saveState.status === "saving"}
                    className="w-full rounded-xl bg-violet-600 px-5 py-3 font-black text-white shadow transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Try Mix It Up
                  </button>
                )}

                <button
                  type="button"
                  onClick={returnToSetup}
                  disabled={saveState.status === "saving"}
                  className="w-full rounded-xl border-2 border-blue-600 bg-white px-5 py-3 font-black text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Choose Another Table
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {lockedTable !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="practice-lock-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-2xl">
              🔒
            </div>

            <h2
              id="practice-lock-title"
              className="mt-4 text-2xl font-black"
            >
              ×{lockedTable} is a member table
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              {access.authenticated
                ? "Your account can use the free tables now. Activate membership to unlock every practice table."
                : "Sign in with an active membership to unlock every practice table, or continue with the free tables."}
            </p>

            <div className="mt-6 grid gap-3">
              <Link
                to={
                  access.authenticated
                    ? "/membership/request"
                    : "/login?returnTo=%2Fgames%2Fmultiplication%2Fpractice"
                }
                className="w-full rounded-xl bg-violet-600 px-5 py-3 font-black text-white shadow transition hover:bg-violet-700"
              >
                {access.authenticated
                  ? "Activate Membership"
                  : "Sign In"}
              </Link>

              <Link
                to="/membership"
                className="w-full rounded-xl border-2 border-violet-600 bg-white px-5 py-3 font-black text-violet-700 transition hover:bg-violet-50"
              >
                View Membership
              </Link>

              <button
                type="button"
                onClick={() => setLockedTable(null)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 font-black text-gray-700 transition hover:bg-gray-100"
              >
                Keep Practising Free Tables
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 border-t border-yellow-300 bg-yellow-200/85 px-5 py-8 text-center">
        <p className="text-xs font-semibold text-gray-700">
          CountMeInTT · Play. Practise. Improve.
        </p>
      </footer>
    </div>
  );
}



