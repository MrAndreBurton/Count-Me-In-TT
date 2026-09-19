import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

const SIPARIA_API_URL =
  "https://script.google.com/macros/s/AKfycbz6sqboMDdJqywYW7Z5NGCbPjU1G1v33KUm3TMvIsfHdYrxDIRee9SAZVWZeibrDrdZ/exec";

const EVENT_ID = "bocas-siparia-2026";
const EVENT_NAME = "Bocas Lit Fest Siparia 2026";
const LEADERBOARD_LIMIT_MS = 25000;
const SUBMISSIONS_OPEN_AT = Date.parse(
  "2026-09-26T10:00:00-04:00"
);
const SUBMISSIONS_CLOSE_AT = Date.parse(
  "2026-09-26T16:00:00-04:00"
);

const PENDING_STORAGE_KEY =
  "countmeintt-bocas-siparia-pending-submission";

function generateGrid() {
  return Array.from({ length: 5 }, (_, rowIndex) =>
    Array.from({ length: 5 }, (_, columnIndex) => ({
      value: "",
      correct: null,
      answer: (rowIndex + 1) * (columnIndex + 1),
    }))
  );
}

function formatTime(milliseconds) {
  const safeMilliseconds = Math.max(
    0,
    Number(milliseconds) || 0
  );

  const minutes = Math.floor(safeMilliseconds / 60000);
  const seconds = Math.floor(
    (safeMilliseconds % 60000) / 1000
  );
  const hundredths = Math.floor(
    (safeMilliseconds % 1000) / 10
  );

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${hundredths
    .toString()
    .padStart(2, "0")}`;
}

function createSubmissionId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `siparia-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

function getSubmissionWindowStatus(now = Date.now()) {
  if (now < SUBMISSIONS_OPEN_AT) return "upcoming";
  if (now >= SUBMISSIONS_CLOSE_AT) return "closed";
  return "open";
}

function getAchievement(durationMs) {
  if (durationMs <= 20000) {
    return {
      icon: "⚡",
      label: "Lightning Finisher",
      message: "An elite sub-20-second performance!",
      classes:
        "border-violet-300 bg-violet-50 text-violet-800",
    };
  }

  if (durationMs <= LEADERBOARD_LIMIT_MS) {
    return {
      icon: "🚀",
      label: "Speed Finisher",
      message: "You qualified for the Siparia leaderboard!",
      classes:
        "border-blue-300 bg-blue-50 text-blue-800",
    };
  }

  return {
    icon: "⭐",
    label: "Grid Finisher",
    message: "You earned a place in the Siparia Hall of Fame!",
    classes:
      "border-yellow-300 bg-yellow-50 text-yellow-900",
  };
}

async function postSubmission(payload) {
  const body = new URLSearchParams();

  body.append("submissionId", payload.submissionId);
  body.append("name", payload.name);
  body.append("time", payload.time);
  body.append("durationMs", String(payload.durationMs));
  body.append("eventId", EVENT_ID);
  body.append("event", EVENT_NAME);
  body.append("grid", "5x5");

  await fetch(SIPARIA_API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type":
        "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
}

async function confirmSubmission(submissionId) {
  const confirmationUrl = new URL(SIPARIA_API_URL);

  confirmationUrl.searchParams.set(
    "submissionId",
    submissionId
  );
  confirmationUrl.searchParams.set("t", String(Date.now()));

  const response = await fetch(confirmationUrl.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Confirmation returned HTTP ${response.status}.`
    );
  }

  const responseText = await response.text();
  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      "The Siparia service did not return public JSON."
    );
  }

  return Boolean(data?.ok && data?.found);
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function waitForConfirmation(submissionId) {
  const delays = [500, 900, 1400, 2000, 2800];

  for (const delay of delays) {
    await wait(delay);

    try {
      if (await confirmSubmission(submissionId)) {
        return true;
      }
    } catch (error) {
      console.warn(
        "Siparia confirmation attempt failed:",
        error
      );
    }
  }

  return false;
}

export default function BocasSipariaChallenge() {
  const [grid, setGrid] = useState(() => generateGrid());
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [focusedCell, setFocusedCell] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [submissionNow, setSubmissionNow] = useState(
    Date.now()
  );

  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  const startTimestampRef = useRef(null);
  const completedRef = useRef(false);
  const submissionIdRef = useRef(createSubmissionId());

  const inputRefs = useRef(
    Array.from({ length: 5 }, () => Array(5).fill(null))
  );

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    document.title =
      "Bocas Lit Fest Siparia 2026 Challenge | CountMeInTT";

    let meta = document.querySelector(
      'meta[name="description"]'
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.content =
      "Play the CountMeInTT Bocas Lit Fest Siparia 2026 5x5 multiplication challenge and earn a place in the event Hall of Fame.";
  }, []);

  useEffect(() => {
    const retryPendingSubmission = async () => {
      try {
        if (getSubmissionWindowStatus() !== "open") {
          return;
        }

        const stored = window.localStorage.getItem(
          PENDING_STORAGE_KEY
        );

        if (!stored) return;

        const pending = JSON.parse(stored);

        if (
          pending?.eventId !== EVENT_ID ||
          !pending?.submissionId
        ) {
          return;
        }

        await postSubmission(pending);

        if (
          await waitForConfirmation(pending.submissionId)
        ) {
          window.localStorage.removeItem(
            PENDING_STORAGE_KEY
          );
        }
      } catch (error) {
        console.warn(
          "Pending Siparia submission could not be retried:",
          error
        );
      }
    };

    retryPendingSubmission();

    return () => {
      clearTimer();
    };
  }, []);

  useEffect(() => {
    const clockInterval = window.setInterval(() => {
      setSubmissionNow(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(clockInterval);
    };
  }, []);

  const displayTime = formatTime(elapsed);
  const achievement = getAchievement(elapsed);
  const submissionWindowStatus =
    getSubmissionWindowStatus(submissionNow);
  const submissionsOpen =
    submissionWindowStatus === "open";

  const focusFirstCell = () => {
    window.setTimeout(() => {
      inputRefs.current[0][0]?.focus();
    }, 80);
  };

  const beginTimer = () => {
    const now = Date.now();

    timerStartedRef.current = true;
    startTimestampRef.current = now;
    setElapsed(0);

    timerRef.current = window.setInterval(() => {
      setElapsed(Date.now() - now);
    }, 10);
  };

  const startChallenge = () => {
    clearTimer();

    setGrid(generateGrid());
    setElapsed(0);
    setCompleted(false);
    completedRef.current = false;
    setFocusedCell(null);
    setShowIntro(false);
    setShowForm(false);
    setSubmitSuccess(false);
    setSubmissionError("");
    setDisplayName("");
    setIsRunning(true);
    timerStartedRef.current = false;
    startTimestampRef.current = null;
    submissionIdRef.current = createSubmissionId();

    focusFirstCell();
  };

  const resetGrid = ({ showWelcome = false } = {}) => {
    clearTimer();

    setGrid(generateGrid());
    setElapsed(0);
    setCompleted(false);
    completedRef.current = false;
    setIsRunning(!showWelcome);
    setShowIntro(showWelcome);
    setShowForm(false);
    setSubmitSuccess(false);
    setIsSubmitting(false);
    setSubmissionError("");
    setFocusedCell(null);
    setDisplayName("");

    timerStartedRef.current = false;
    startTimestampRef.current = null;
    submissionIdRef.current = createSubmissionId();

    if (!showWelcome) {
      focusFirstCell();
    }
  };

  const checkCompletion = (nextGrid) => {
    const allCorrect = nextGrid.every((row) =>
      row.every((cell) => cell.correct === true)
    );

    if (!allCorrect || completedRef.current) return;

    completedRef.current = true;

    const stopTimestamp = Date.now();
    const finalElapsed = startTimestampRef.current
      ? stopTimestamp - startTimestampRef.current
      : elapsed;

    setCompleted(true);
    setIsRunning(false);
    setElapsed(finalElapsed);
    setFocusedCell(null);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    window.setTimeout(() => {
      setShowForm(true);
    }, 400);
  };

  const handleChange = (value, rowIndex, columnIndex) => {
    if (!isRunning || completedRef.current) return;

    const nextGrid = grid.map((row) =>
      row.map((cell) => ({ ...cell }))
    );

    const nextCell = nextGrid[rowIndex][columnIndex];
    const cleanValue = String(value || "")
      .replace(/\D+/g, "")
      .slice(0, 3);

    nextCell.value = cleanValue;
    nextCell.correct =
      cleanValue !== "" &&
      Number(cleanValue) === nextCell.answer;

    setGrid(nextGrid);

    if (
      !timerStartedRef.current &&
      cleanValue !== ""
    ) {
      beginTimer();
    }

    checkCompletion(nextGrid);
  };

  const handleKeyDown = (
    event,
    rowIndex,
    columnIndex
  ) => {
    if (!isRunning || completedRef.current) return;

    const lastRow = 4;
    const lastColumn = 4;

    if (
      event.key === "Enter" ||
      event.key === "NumpadEnter"
    ) {
      event.preventDefault();

      const currentCell = grid[rowIndex][columnIndex];

      if (currentCell.correct) {
        if (columnIndex < lastColumn) {
          inputRefs.current[rowIndex][
            columnIndex + 1
          ]?.focus();
        } else if (rowIndex < lastRow) {
          inputRefs.current[rowIndex + 1][0]?.focus();
        }
      } else {
        inputRefs.current[rowIndex][columnIndex]?.select();
      }

      return;
    }

    if (
      event.key === "ArrowRight" &&
      columnIndex < lastColumn
    ) {
      event.preventDefault();
      inputRefs.current[rowIndex][columnIndex + 1]?.focus();
    } else if (
      event.key === "ArrowLeft" &&
      columnIndex > 0
    ) {
      event.preventDefault();
      inputRefs.current[rowIndex][columnIndex - 1]?.focus();
    } else if (
      event.key === "ArrowDown" &&
      rowIndex < lastRow
    ) {
      event.preventDefault();
      inputRefs.current[rowIndex + 1][columnIndex]?.focus();
    } else if (
      event.key === "ArrowUp" &&
      rowIndex > 0
    ) {
      event.preventDefault();
      inputRefs.current[rowIndex - 1][columnIndex]?.focus();
    } else if (event.key === "Backspace") {
      event.preventDefault();

      const nextGrid = grid.map((row) =>
        row.map((cell) => ({ ...cell }))
      );

      nextGrid[rowIndex][columnIndex].value = "";
      nextGrid[rowIndex][columnIndex].correct = null;

      setGrid(nextGrid);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const currentTime = Date.now();
    const currentWindowStatus =
      getSubmissionWindowStatus(currentTime);

    setSubmissionNow(currentTime);

    if (currentWindowStatus !== "open") {
      setSubmissionError(
        currentWindowStatus === "upcoming"
          ? "Submissions open on September 26, 2026, at 10:00 a.m. Trinidad time."
          : "Event submissions closed on September 26, 2026, at 4:00 p.m. Trinidad time."
      );
      return;
    }

    const name = displayName.replace(/\s+/g, " ").trim();

    if (!name) {
      setSubmissionError(
        "Please enter a leaderboard display name."
      );
      return;
    }

    const payload = {
      submissionId: submissionIdRef.current,
      eventId: EVENT_ID,
      name,
      time: displayTime,
      durationMs: elapsed,
    };

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      window.localStorage.setItem(
        PENDING_STORAGE_KEY,
        JSON.stringify(payload)
      );

      await postSubmission(payload);

      const confirmed = await waitForConfirmation(
        payload.submissionId
      );

      if (!confirmed) {
        throw new Error(
          "The result was sent, but it could not yet be confirmed. Check the connection and try again."
        );
      }

      window.localStorage.removeItem(PENDING_STORAGE_KEY);
      setShowForm(false);
      setSubmitSuccess(true);
    } catch (error) {
      console.error("Siparia submission error:", error);

      setSubmissionError(
        error?.message ||
          "The result could not be confirmed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <style>{`
        .siparia-cell {
          position: relative;
        }

        .siparia-cell input {
          position: relative;
          z-index: 1;
        }

        .siparia-cell input::placeholder {
          color: transparent;
          opacity: 0;
        }

        .siparia-cell input:focus::placeholder {
          color: rgba(107, 114, 128, 0.72);
          opacity: 1;
          font-size: clamp(10px, 1.5vw, 15px);
          font-weight: 600;
        }

        .siparia-hide-native-caret:focus {
          caret-color: transparent;
        }

        .siparia-desktop-caret {
          position: absolute;
          left: 50%;
          bottom: 5px;
          z-index: 2;
          display: block;
          width: 10px;
          height: 1.5px;
          background-color: rgba(75, 85, 99, 0.9);
          transform: translateX(-50%);
          animation: sipariaCaretBlink 1s step-end infinite;
          pointer-events: none;
        }

        .siparia-mobile-prompt {
          display: none;
        }

        @media (max-width: 640px) {
          .siparia-cell input:focus::placeholder {
            color: transparent;
            opacity: 0;
          }

          .siparia-desktop-caret {
            display: none;
          }

          .siparia-mobile-prompt {
            position: absolute;
            inset: 0;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: rgba(107, 114, 128, 0.76);
            font-size: 8px;
            font-weight: 600;
            line-height: 0.8;
            pointer-events: none;
          }

          .siparia-mobile-caret {
            display: block;
            width: 8px;
            height: 1.5px;
            margin-top: 2px;
            background-color: rgba(75, 85, 99, 0.9);
            animation: sipariaCaretBlink 1s step-end infinite;
          }
        }

        @keyframes sipariaCaretBlink {
          0%, 49% {
            opacity: 1;
          }

          50%, 100% {
            opacity: 0;
          }
        }
      `}</style>

      {showIntro && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-200 text-2xl">
              📚
            </div>

            <h2 className="text-2xl font-black">
              Bocas Lit Fest Siparia
            </h2>

            <p className="leading-7 text-gray-600">
              Complete the 5×5 multiplication grid as quickly
              and accurately as you can.
            </p>

            <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
              <p className="font-black">
                Finish in 25 seconds or faster to reach the
                leaderboard!
              </p>
            </div>

            <button
              type="button"
              onClick={startChallenge}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white shadow transition hover:bg-blue-700"
            >
              Start Challenge
            </button>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-left text-sm">
              <p className="font-black text-blue-700">
                Keyboard Tips
              </p>

              <ul className="mt-2 list-inside list-disc space-y-1 text-gray-700">
                <li>
                  The timer starts when you enter your first
                  answer.
                </li>
                <li>Enter moves to the next cell.</li>
                <li>Arrow keys move around the grid.</li>
                <li>Backspace clears the current cell.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <main>
        <section className="border-b border-yellow-300 bg-yellow-200/90 px-5 py-8 sm:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid min-w-0 gap-5 md:grid-cols-[330px_minmax(0,1fr)] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/logo-countmeintt.svg"
                  alt="CountMeInTT"
                  className="h-16 w-auto shrink-0 object-contain sm:h-20"
                />

                <img
                  src="/logo-bocaslitfest2026.svg"
                  alt="Bocas Lit Fest 2026"
                  className="h-16 min-w-0 max-w-[220px] object-contain sm:h-20"
                />
              </div>

              <div className="min-w-0 md:pl-2">
                <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                  Live 5×5 Challenge
                </p>

                <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
                  Bocas Lit Fest Siparia
                </h1>

                <p className="mt-3 max-w-2xl text-base font-semibold text-gray-700 sm:text-lg">
                  Play. Improve. Compete.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/bocas-siparia-leaderboard"
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow transition hover:bg-blue-700"
              >
                Leaderboard
              </Link>

              <Link
                to="/bocas-siparia-hall-of-fame"
                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow transition hover:bg-violet-700"
              >
                Hall of Fame
              </Link>

              <button
                type="button"
                onClick={() => resetGrid()}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-black text-white shadow transition hover:bg-red-600"
              >
                Reset Grid
              </button>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-5 sm:py-10">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-wide text-gray-700">
                Your Timer
              </p>

              <p className="mt-2 inline-block rounded-xl bg-yellow-300 px-7 py-3 font-mono text-3xl font-black shadow-md">
                ⏱️ {displayTime}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-yellow-300 bg-yellow-50/95 p-4 shadow-lg sm:p-6">
              <div
                className="grid w-full gap-1"
                style={{
                  gridTemplateColumns:
                    "repeat(6, minmax(0, 1fr))",
                }}
              >
                <div className="flex h-11 items-center justify-center rounded-md bg-blue-500 text-lg font-black text-white">
                  ×
                </div>

                {Array.from(
                  { length: 5 },
                  (_, columnIndex) => (
                    <div
                      key={`column-${columnIndex}`}
                      className="flex h-11 items-center justify-center rounded-md bg-yellow-300 text-sm font-black"
                    >
                      {columnIndex + 1}
                    </div>
                  )
                )}

                {grid.map((row, rowIndex) => (
                  <React.Fragment key={`row-${rowIndex}`}>
                    <div className="flex h-11 items-center justify-center rounded-md bg-yellow-300 text-sm font-black">
                      {rowIndex + 1}
                    </div>

                    {row.map((cell, columnIndex) => {
                      const cellKey = `${rowIndex}-${columnIndex}`;
                      const showPrompt =
                        isRunning &&
                        focusedCell === cellKey &&
                        cell.value === "";

                      return (
                        <div
                          key={cellKey}
                          className="siparia-cell"
                        >
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={cell.value}
                            placeholder={`${rowIndex + 1} × ${
                              columnIndex + 1
                            }`}
                            aria-label={`${rowIndex + 1} times ${
                              columnIndex + 1
                            }`}
                            disabled={!isRunning || completed}
                            onFocus={() =>
                              setFocusedCell(cellKey)
                            }
                            onBlur={() =>
                              setFocusedCell((current) =>
                                current === cellKey ? null : current
                              )
                            }
                            onChange={(event) =>
                              handleChange(
                                event.target.value,
                                rowIndex,
                                columnIndex
                              )
                            }
                            onKeyDown={(event) =>
                              handleKeyDown(
                                event,
                                rowIndex,
                                columnIndex
                              )
                            }
                            onPaste={(event) =>
                              event.preventDefault()
                            }
                            onDrop={(event) =>
                              event.preventDefault()
                            }
                            onDragOver={(event) =>
                              event.preventDefault()
                            }
                            ref={(element) => {
                              inputRefs.current[rowIndex][
                                columnIndex
                              ] = element;
                            }}
                            className={[
                              "h-11 w-full rounded-md border text-center font-bold outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed",
                              cell.correct === null
                                ? "border-gray-400 bg-white"
                                : cell.correct
                                  ? "border-green-400 bg-green-200"
                                  : "border-red-400 bg-red-200",
                              showPrompt
                                ? "siparia-hide-native-caret"
                                : "",
                            ].join(" ")}
                          />

                          {showPrompt && (
                            <span
                              className="siparia-desktop-caret"
                              aria-hidden="true"
                            />
                          )}

                          {showPrompt && (
                            <span
                              className="siparia-mobile-prompt"
                              aria-hidden="true"
                            >
                              <span>{rowIndex + 1}</span>
                              <span>×</span>
                              <span>{columnIndex + 1}</span>
                              <span className="siparia-mobile-caret" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/95 p-4 text-center shadow-sm">
              <p className="font-black text-blue-800">
                5×5 Multiplication Challenge
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-600">
                The timer starts when you enter your first
                answer.
              </p>

              <p
                className={[
                  "mt-3 text-sm font-black",
                  submissionsOpen
                    ? "text-green-700"
                    : "text-gray-600",
                ].join(" ")}
              >
                {submissionWindowStatus === "upcoming"
                  ? "Submissions open September 26, 2026 · 10:00 a.m.–4:00 p.m. Trinidad time"
                  : submissionsOpen
                    ? "Submissions are open until 4:00 p.m. Trinidad time"
                    : "Event submissions are closed · The grid remains open for play"}
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t border-yellow-300 bg-yellow-200/85 px-5 py-10 text-center">
          <a
            href="/about-us-contact.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-gray-950 underline"
          >
            About Us/Contact
          </a>

          <p className="mt-8 text-[11px] italic text-black">
            © 2025 - 2026{" "}
            <span className="font-semibold">Count Me In TT</span>.
            Developed by{" "}
            <span className="font-semibold">Andre Burton</span>.
            Powered by{" "}
            <span className="font-semibold">
              A&apos;s Online
            </span>
            . All rights reserved.
          </p>
        </footer>
      </main>

      {showForm && submissionsOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <form
            onSubmit={handleSubmit}
            className="my-8 w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-black shadow-2xl"
          >
            <h2 className="text-center text-2xl font-black">
              Challenge Complete!
            </h2>

            <p className="text-center">Your time:</p>

            <p className="text-center font-mono text-3xl font-black text-blue-700">
              {displayTime}
            </p>

            <div
              className={[
                "rounded-xl border p-4 text-center",
                achievement.classes,
              ].join(" ")}
            >
              <p className="text-2xl">{achievement.icon}</p>
              <p className="mt-1 font-black">
                {achievement.label}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {achievement.message}
              </p>
            </div>

            <p className="text-center text-sm text-gray-600">
              Enter a safe display name to join the Siparia
              results.
            </p>

            <label className="block">
              <span className="text-sm font-black text-gray-700">
                Leaderboard Display Name
              </span>

              <input
                type="text"
                maxLength={40}
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                placeholder="Example: Alicia B."
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />

              <span className="mt-2 block text-xs leading-5 text-gray-500">
                For privacy, use your first name and the first
                letter of your surname—for example, Alicia B.
              </span>
            </label>

            {submissionError && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {submissionError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={[
                  "flex-1 rounded-xl px-4 py-3 font-black text-white",
                  isSubmitting
                    ? "cursor-not-allowed bg-green-400"
                    : "bg-green-600 hover:bg-green-700",
                ].join(" ")}
              >
                {isSubmitting
                  ? "Confirming…"
                  : submissionError
                    ? "Retry Submission"
                    : "Submit Result"}
              </button>

              <button
                type="button"
                onClick={() => resetGrid()}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                Reset Grid
              </button>
            </div>
          </form>
        </div>
      )}

      {showForm && !submissionsOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-8 w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-center text-black shadow-2xl">
            <h2 className="text-2xl font-black">
              Challenge Complete!
            </h2>

            <p>Your time:</p>

            <p className="font-mono text-3xl font-black text-blue-700">
              {displayTime}
            </p>

            <div
              className={[
                "rounded-xl border p-4",
                achievement.classes,
              ].join(" ")}
            >
              <p className="text-2xl">{achievement.icon}</p>
              <p className="mt-1 font-black">
                {achievement.label}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {achievement.message}
              </p>
            </div>

            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              <p className="font-black">
                {submissionWindowStatus === "upcoming"
                  ? "Event submissions are not open yet"
                  : "Event submissions are closed"}
              </p>

              <p className="mt-2 text-sm font-semibold leading-6">
                {submissionWindowStatus === "upcoming"
                  ? "Results can be submitted on September 26, 2026, from 10:00 a.m. to 4:00 p.m. Trinidad time. You can still practise now."
                  : "The Siparia submission window ended at 4:00 p.m. Trinidad time. You can continue playing the grid for practice."}
              </p>
            </div>

            <div className="grid gap-3 pt-2">
              <button
                type="button"
                onClick={() => resetGrid()}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white shadow transition hover:bg-blue-700"
              >
                Play Again
              </button>

              <Link
                to="/bocas-siparia-hall-of-fame"
                className="w-full rounded-xl border-2 border-violet-600 bg-white px-5 py-3 font-black text-violet-700 transition hover:bg-violet-50"
              >
                View Hall of Fame
              </Link>
            </div>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-black text-green-700">
              ✓
            </div>

            <h2 className="mt-4 text-2xl font-black">
              Result Confirmed
            </h2>

            <p className="mt-2 text-gray-600">
              Your result was saved successfully.
            </p>

            <div
              className={[
                "mt-5 rounded-xl border p-4",
                achievement.classes,
              ].join(" ")}
            >
              <p className="text-3xl">{achievement.icon}</p>
              <p className="mt-1 font-black">
                {achievement.label}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {achievement.message}
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() =>
                  resetGrid({ showWelcome: true })
                }
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white shadow transition hover:bg-blue-700"
              >
                Next Player
              </button>

              {elapsed <= LEADERBOARD_LIMIT_MS && (
                <Link
                  to="/bocas-siparia-leaderboard"
                  className="w-full rounded-xl border-2 border-blue-600 bg-white px-5 py-3 font-black text-blue-600 transition hover:bg-blue-50"
                >
                  View Leaderboard
                </Link>
              )}

              <Link
                to="/bocas-siparia-hall-of-fame"
                className="w-full rounded-xl border-2 border-violet-600 bg-white px-5 py-3 font-black text-violet-700 transition hover:bg-violet-50"
              >
                View Hall of Fame
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



