import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import GameHeader from "../components/layout/GameHeader";

const ARIMA_API_URL =
  "https://script.google.com/macros/s/AKfycbxUr3wn5kRh74o-SMmGX6VkncbLaAH5d4ui6IpvdMh38xVu1Q1IoqHdbL9Fl_7E9TAhXQ/exec";

const EVENT_NAME =
  "Bocas Lit Fest Arima 2026";

function generateGrid() {
  return Array.from(
    { length: 5 },
    (_, rowIndex) =>
      Array.from(
        { length: 5 },
        (_, columnIndex) => ({
          value: "",
          correct: null,
          answer:
            (rowIndex + 1) *
            (columnIndex + 1),
        })
      )
  );
}

function formatTime(milliseconds) {
  const safeMilliseconds = Math.max(
    0,
    Number(milliseconds) || 0
  );

  const minutes = Math.floor(
    safeMilliseconds / 60000
  );

  const seconds = Math.floor(
    (safeMilliseconds % 60000) / 1000
  );

  const hundredths = Math.floor(
    (safeMilliseconds % 1000) / 10
  );

  return `${minutes
    .toString()
    .padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${hundredths
    .toString()
    .padStart(2, "0")}`;
}

export default function BocasArimaChallenge() {
  const [grid, setGrid] = useState(() =>
    generateGrid()
  );

  const [elapsed, setElapsed] = useState(0);

  const [completed, setCompleted] =
    useState(false);

  const [showIntro, setShowIntro] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [submitSuccess, setSubmitSuccess] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [focusedCell, setFocusedCell] =
    useState(null);

  const [formData, setFormData] = useState({
    name: "",
    school: "",
    noSchool: false,
  });

  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  const startTimestampRef = useRef(null);

  const inputRefs = useRef(
    Array.from(
      { length: 5 },
      () => Array(5).fill(null)
    )
  );

  useEffect(() => {
    document.title =
      "Bocas Lit Fest Arima 2026 Challenge | CountMeInTT";

    let meta = document.querySelector(
      'meta[name="description"]'
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.content =
      "Play the CountMeInTT Bocas Lit Fest Arima 2026 5x5 multiplication challenge and compete on the live event leaderboard.";
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(
          timerRef.current
        );
      }
    };
  }, []);

  const displayTime = formatTime(elapsed);

  const focusFirstCell = () => {
    window.setTimeout(() => {
      inputRefs.current[0][0]?.focus();
    }, 100);
  };

  const startChallenge = () => {
    setShowIntro(false);
    focusFirstCell();
  };

  const resetGame = ({
    showWelcome = false,
  } = {}) => {
    if (timerRef.current) {
      window.clearInterval(
        timerRef.current
      );
    }

    setGrid(generateGrid());
    setElapsed(0);
    setCompleted(false);
    setShowForm(false);
    setSubmitSuccess(false);
    setFocusedCell(null);

    setFormData({
      name: "",
      school: "",
      noSchool: false,
    });

    timerStartedRef.current = false;
    startTimestampRef.current = null;
    timerRef.current = null;

    setShowIntro(showWelcome);

    if (!showWelcome) {
      focusFirstCell();
    }
  };

  const checkCompletion = (nextGrid) => {
    const allCorrect = nextGrid.every((row) =>
      row.every(
        (cell) => cell.correct === true
      )
    );

    if (!allCorrect || completed) return;

    const stopTimestamp = Date.now();

    const finalElapsed =
      startTimestampRef.current !== null
        ? stopTimestamp -
          startTimestampRef.current
        : elapsed;

    setCompleted(true);
    setElapsed(finalElapsed);
    setFocusedCell(null);

    if (timerRef.current) {
      window.clearInterval(
        timerRef.current
      );
    }

    window.setTimeout(() => {
      setShowForm(true);
    }, 400);
  };

  const handleChange = (
    value,
    rowIndex,
    columnIndex
  ) => {
    const nextGrid = grid.map((row) =>
      row.map((cell) => ({ ...cell }))
    );

    const nextCell =
      nextGrid[rowIndex][columnIndex];

    const cleanValue = String(value || "")
      .replace(/\D+/g, "")
      .slice(0, 3);

    nextCell.value = cleanValue;

    nextCell.correct =
      cleanValue !== "" &&
      Number(cleanValue) ===
        nextCell.answer;

    setGrid(nextGrid);

    if (
      !timerStartedRef.current &&
      cleanValue !== ""
    ) {
      const now = Date.now();

      timerStartedRef.current = true;
      startTimestampRef.current = now;

      timerRef.current =
        window.setInterval(() => {
          setElapsed(Date.now() - now);
        }, 10);
    }

    checkCompletion(nextGrid);
  };

  const handleKeyDown = (
    event,
    rowIndex,
    columnIndex
  ) => {
    const lastRow = 4;
    const lastColumn = 4;

    if (
      event.key === "Enter" ||
      event.key === "NumpadEnter"
    ) {
      event.preventDefault();

      const currentCell =
        grid[rowIndex][columnIndex];

      if (currentCell.correct) {
        if (columnIndex < lastColumn) {
          inputRefs.current[rowIndex][
            columnIndex + 1
          ]?.focus();
        } else if (rowIndex < lastRow) {
          inputRefs.current[
            rowIndex + 1
          ][0]?.focus();
        }
      } else {
        inputRefs.current[rowIndex][
          columnIndex
        ]?.select();
      }

      return;
    }

    if (
      event.key === "ArrowRight" &&
      columnIndex < lastColumn
    ) {
      event.preventDefault();

      inputRefs.current[rowIndex][
        columnIndex + 1
      ]?.focus();
    } else if (
      event.key === "ArrowLeft" &&
      columnIndex > 0
    ) {
      event.preventDefault();

      inputRefs.current[rowIndex][
        columnIndex - 1
      ]?.focus();
    } else if (
      event.key === "ArrowDown" &&
      rowIndex < lastRow
    ) {
      event.preventDefault();

      inputRefs.current[
        rowIndex + 1
      ][columnIndex]?.focus();
    } else if (
      event.key === "ArrowUp" &&
      rowIndex > 0
    ) {
      event.preventDefault();

      inputRefs.current[
        rowIndex - 1
      ][columnIndex]?.focus();
    } else if (
      event.key === "Backspace"
    ) {
      event.preventDefault();

      const nextGrid = grid.map((row) =>
        row.map((cell) => ({ ...cell }))
      );

      nextGrid[rowIndex][
        columnIndex
      ].value = "";

      nextGrid[rowIndex][
        columnIndex
      ].correct = null;

      setGrid(nextGrid);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const name = formData.name.trim();

    const school = formData.noSchool
      ? "No School"
      : formData.school.trim();

    if (!name) {
      alert(
        "Please enter the player's name."
      );
      return;
    }

    if (!school) {
      alert(
        "Please enter a school or select No School."
      );
      return;
    }

    setIsSubmitting(true);

    const body = new URLSearchParams();

    body.append("name", name);
    body.append("school", school);
    body.append("time", displayTime);
    body.append(
      "durationMs",
      String(elapsed)
    );
    body.append("event", EVENT_NAME);
    body.append("grid", "5x5");

    try {
      await fetch(ARIMA_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      setShowForm(false);
      setSubmitSuccess(true);
    } catch (error) {
      console.error(
        "Arima submission error:",
        error
      );

      alert(
        "There was an error submitting the time. Please try again."
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
        backgroundImage:
          'url("/math-bg.svg")',
        backgroundRepeat: "repeat",
        backgroundSize: "300px",
        backgroundAttachment: "fixed",
      }}
    >
      <GameHeader />

      <style>{`
        .arima-cell {
          position: relative;
        }

        .arima-cell input {
          position: relative;
          z-index: 1;
        }

        /*
          Every placeholder is completely hidden
          when its cell does not have focus.
        */
        .arima-cell input::placeholder {
          color: transparent;
          opacity: 0;
        }

        /*
          Desktop prompt appears only when the
          input has focus and remains empty.
        */
        .arima-cell input:focus::placeholder {
          color: rgba(107, 114, 128, 0.72);
          opacity: 1;
          font-size: clamp(
            10px,
            1.5vw,
            15px
          );
          font-weight: 600;
        }

        .arima-hide-native-caret:focus {
          caret-color: transparent;
        }

        .arima-desktop-caret {
          position: absolute;
          left: 50%;
          bottom: 5px;
          z-index: 2;
          display: block;
          width: 10px;
          height: 1.5px;
          background-color:
            rgba(75, 85, 99, 0.9);
          transform: translateX(-50%);
          animation:
            arimaCaretBlink
            1s
            step-end
            infinite;
          pointer-events: none;
        }

        /*
          Mobile prompt is completely hidden
          outside the mobile breakpoint.
        */
        .arima-mobile-prompt {
          display: none;
        }

        @media (max-width: 640px) {
          /*
            Hide the normal horizontal placeholder
            because mobile uses the vertical prompt.
          */
          .arima-cell input:focus::placeholder {
            color: transparent;
            opacity: 0;
          }

          .arima-desktop-caret {
            display: none;
          }

          /*
            This element is only rendered for the
            focused, empty cell.
          */
          .arima-mobile-prompt {
            position: absolute;
            inset: 0;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color:
              rgba(107, 114, 128, 0.76);
            font-size: 8px;
            font-weight: 600;
            line-height: 0.8;
            pointer-events: none;
          }

          .arima-mobile-caret {
            display: block;
            width: 8px;
            height: 1.5px;
            margin-top: 2px;
            background-color:
              rgba(75, 85, 99, 0.9);
            animation:
              arimaCaretBlink
              1s
              step-end
              infinite;
          }
        }

        @keyframes arimaCaretBlink {
          0%,
          49% {
            opacity: 1;
          }

          50%,
          100% {
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
              Bocas Lit Fest Arima
            </h2>

            <p className="leading-7 text-gray-600">
              Complete the 5×5 multiplication
              grid as quickly and accurately as
              you can.
            </p>

            <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
              <p className="font-black">
                Can you beat 30 seconds?
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
                  Enter moves to the next cell.
                </li>

                <li>
                  Arrow keys move around the grid.
                </li>

                <li>
                  Backspace clears the current
                  cell.
                </li>

                <li>
                  The timer starts with your first
                  answer.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <main>
        <section className="border-b border-yellow-300 bg-yellow-200/90 px-5 py-8 sm:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-countmeintt.svg"
                  alt="CountMeInTT"
                  className="h-20 w-auto object-contain sm:h-24"
                />

                <img
                  src="/logo-bocaslitfest2026.svg"
                  alt="Bocas Lit Fest 2026"
                  className="h-20 w-auto object-contain sm:h-24"
                />
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                  Live 5×5 Challenge
                </p>

                <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
                  Bocas Lit Fest Arima
                </h1>

                <p className="mt-3 max-w-2xl text-base font-semibold text-gray-700 sm:text-lg">
                  Play. Improve. Compete.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/games"
                className="rounded-xl border-2 border-blue-600 bg-white px-4 py-2.5 text-sm font-black text-blue-600 transition hover:bg-blue-50"
              >
                All Games
              </Link>

              <Link
                to="/bocas-arima-leaderboard"
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow transition hover:bg-blue-700"
              >
                View Leaderboard
              </Link>

              <button
                type="button"
                onClick={() => resetGame()}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-black text-white shadow transition hover:bg-red-600"
              >
                Reset Game
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
                <div className="h-11" />

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

                {grid.map(
                  (row, rowIndex) => (
                    <React.Fragment
                      key={`row-${rowIndex}`}
                    >
                      <div className="flex h-11 items-center justify-center rounded-md bg-yellow-300 text-sm font-black">
                        {rowIndex + 1}
                      </div>

                      {row.map(
                        (
                          cell,
                          columnIndex
                        ) => {
                          const cellKey = `rowIndex-{columnIndex}`;

                          const showPrompt =
                            focusedCell ===
                              cellKey &&
                            cell.value === "";

                          return (
                            <div
                              key={cellKey}
                              className="arima-cell"
                            >
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={
                                  cell.value
                                }
                                placeholder={`${
                                  rowIndex +
                                  1
                                } × ${
                                  columnIndex +
                                  1
                                }`}
                                aria-label={`${
                                  rowIndex +
                                  1
                                } times ${
                                  columnIndex +
                                  1
                                }`}
                                onFocus={() =>
                                  setFocusedCell(
                                    cellKey
                                  )
                                }
                                onBlur={() =>
                                  setFocusedCell(
                                    (
                                      current
                                    ) =>
                                      current ===
                                      cellKey
                                        ? null
                                        : current
                                  )
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleChange(
                                    event
                                      .target
                                      .value,
                                    rowIndex,
                                    columnIndex
                                  )
                                }
                                onKeyDown={(
                                  event
                                ) =>
                                  handleKeyDown(
                                    event,
                                    rowIndex,
                                    columnIndex
                                  )
                                }
                                onPaste={(
                                  event
                                ) =>
                                  event.preventDefault()
                                }
                                onDrop={(
                                  event
                                ) =>
                                  event.preventDefault()
                                }
                                onDragOver={(
                                  event
                                ) =>
                                  event.preventDefault()
                                }
                                ref={(
                                  element
                                ) => {
                                  inputRefs.current[
                                    rowIndex
                                  ][
                                    columnIndex
                                  ] = element;
                                }}
                                className={[
                                  "h-11 w-full rounded-md border text-center font-bold outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200",
                                  cell.correct ===
                                  null
                                    ? "border-gray-400 bg-white"
                                    : cell.correct
                                      ? "border-green-400 bg-green-200"
                                      : "border-red-400 bg-red-200",
                                  showPrompt
                                    ? "arima-hide-native-caret"
                                    : "",
                                ].join(
                                  " "
                                )}
                              />

                              {showPrompt && (
                                <span
                                  className="arima-desktop-caret"
                                  aria-hidden="true"
                                />
                              )}

                              {showPrompt && (
                                <span
                                  className="arima-mobile-prompt"
                                  aria-hidden="true"
                                >
                                  <span>
                                    {rowIndex +
                                      1}
                                  </span>

                                  <span>
                                    ×
                                  </span>

                                  <span>
                                    {columnIndex +
                                      1}
                                  </span>

                                  <span className="arima-mobile-caret" />
                                </span>
                              )}
                            </div>
                          );
                        }
                      )}
                    </React.Fragment>
                  )
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/95 p-4 text-center shadow-sm">
              <p className="font-black text-blue-800">
                5×5 Multiplication Challenge
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-600">
                The timer starts when you enter
                your first answer.
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
            <span className="font-semibold">
              Count Me In TT
            </span>
            . Developed by{" "}
            <span className="font-semibold">
              Andre Burton
            </span>
            . Powered by{" "}
            <span className="font-semibold">
              A&apos;s Online
            </span>
            . All rights reserved.
          </p>
        </footer>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <form
            onSubmit={handleSubmit}
            className="my-8 w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-black shadow-2xl"
          >
            <h2 className="text-center text-2xl font-black">
              Challenge Complete!
            </h2>

            <p className="text-center">
              Your time:
            </p>

            <p className="text-center font-mono text-3xl font-black text-blue-700">
              {displayTime}
            </p>

            <p className="text-center text-sm text-gray-600">
              Enter the player’s information to
              join the Bocas Arima leaderboard.
            </p>

            <label className="block">
              <span className="text-sm font-black text-gray-700">
                Player Name
              </span>

              <input
                type="text"
                maxLength={60}
                value={formData.name}
                onChange={(event) =>
                  setFormData(
                    (current) => ({
                      ...current,
                      name:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Enter player name"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-gray-700">
                School
              </span>

              <input
                type="text"
                maxLength={100}
                value={formData.school}
                onChange={(event) =>
                  setFormData(
                    (current) => ({
                      ...current,
                      school:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Enter school name"
                disabled={
                  formData.noSchool
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                required={
                  !formData.noSchool
                }
              />
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <input
                type="checkbox"
                checked={
                  formData.noSchool
                }
                onChange={(event) =>
                  setFormData(
                    (current) => ({
                      ...current,
                      noSchool:
                        event.target
                          .checked,
                      school:
                        event.target
                          .checked
                          ? ""
                          : current.school,
                    })
                  )
                }
                className="h-5 w-5 accent-blue-600"
              />

              <span className="font-bold">
                No School
              </span>
            </label>

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
                  ? "Submitting…"
                  : "Submit Time"}
              </button>

              <button
                type="button"
                onClick={() =>
                  resetGame()
                }
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-black text-white hover:bg-red-600"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {submitSuccess && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-black text-green-700">
              ✓
            </div>

            <h2 className="mt-4 text-2xl font-black">
              Time Submitted
            </h2>

            <p className="mt-2 text-gray-600">
              The result has been added to the
              Bocas Arima leaderboard.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() =>
                  resetGame({
                    showWelcome: true,
                  })
                }
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white shadow transition hover:bg-blue-700"
              >
                Next Player
              </button>

              <Link
                to="/bocas-arima-leaderboard"
                className="w-full rounded-xl border-2 border-blue-600 bg-white px-5 py-3 font-black text-blue-600 transition hover:bg-blue-50"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


