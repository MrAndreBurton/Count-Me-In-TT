import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

const BOCAS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmch7DIGBKuuLjFUKt_fUFjd56sIqpYNFblmDFik2An4CXTVPlMhsWANyP7J15IJEr6i7hBkErGh5I/pubhtml";

const BOCAS_WEBHOOK =
  "PASTE_BOCAS_APPS_SCRIPT_WEBHOOK_URL_HERE";

const CHALLENGE_ID = "bocas-couva-2026";

const EVENT_NAME =
  "All Together Now at Bocas Couva Festival";

const LEADERBOARD_TIME_LIMIT_MS = 20000;

/*
  Saturday 18 July 2026 at 4:30 PM
  Trinidad and Tobago time: UTC-4
*/
const CHALLENGE_CLOSES_AT = new Date(
  "2026-07-18T16:30:00-04:00"
).getTime();

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

  const minutes = Math.floor(
    safeMilliseconds / 60000
  );

  const seconds = Math.floor(
    (safeMilliseconds % 60000) / 1000
  );

  const hundredths = Math.floor(
    (safeMilliseconds % 1000) / 10
  );

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}.${String(hundredths).padStart(2, "0")}`;
}

function toMillis(value) {
  const text = String(value || "").trim();

  const match =
    /^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(
      text
    );

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fractionText = match[3] || "";

  let milliseconds = 0;

  if (fractionText.length === 1) {
    milliseconds = Number(fractionText) * 100;
  } else if (fractionText.length === 2) {
    milliseconds = Number(fractionText) * 10;
  } else if (fractionText.length === 3) {
    milliseconds = Number(fractionText);
  }

  return (
    minutes * 60000 +
    seconds * 1000 +
    milliseconds
  );
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCSV(text) {
  if (
    !text ||
    typeof text !== "string" ||
    text.trim() === ""
  ) {
    return [];
  }

  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (
      character === '"' &&
      insideQuotes &&
      nextCharacter === '"'
    ) {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    if (
      (character === "\n" ||
        character === "\r") &&
      !insideQuotes
    ) {
      if (
        character === "\r" &&
        nextCharacter === "\n"
      ) {
        index += 1;
      }

      currentRow.push(currentValue.trim());
      currentValue = "";

      if (
        currentRow.some(
          (cell) =>
            String(cell || "").trim() !== ""
        )
      ) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentValue += character;
  }

  currentRow.push(currentValue.trim());

  if (
    currentRow.some(
      (cell) => String(cell || "").trim() !== ""
    )
  ) {
    rows.push(currentRow);
  }

  if (rows.length < 2) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;

  const headers = headerRow.map((header) =>
    String(header || "")
      .replace(/^\uFEFF/, "")
      .trim()
  );

  return dataRows
    .map((row, index) => {
      const record = {};

      headers.forEach((header, headerIndex) => {
        record[header] = String(
          row[headerIndex] ?? ""
        ).trim();
      });

      record.__row = index + 2;

      return record;
    })
    .filter((record) =>
      Object.values(record).some(
        (value) =>
          String(value || "").trim() !== ""
      )
    );
}

function readField(record, possibleNames) {
  const entries = Object.entries(record || {});

  for (const possibleName of possibleNames) {
    const match = entries.find(
      ([key]) =>
        normalize(key) === normalize(possibleName)
    );

    if (
      match &&
      String(match[1] || "").trim() !== ""
    ) {
      return String(match[1]).trim();
    }
  }

  return "";
}

function getPlayerName(record) {
  const publicName = readField(record, [
    "Public Display Name",
    "Display Name",
    "Player Name",
    "Student Name",
    "Name",
  ]);

  if (publicName) {
    return publicName;
  }

  const firstName = readField(record, [
    "Student First Name",
    "First Name",
  ]);

  const surname = readField(record, [
    "Student Surname",
    "Surname",
    "Last Name",
  ]);

  if (!firstName) {
    return "";
  }

  const surnameInitial = surname
    ? `${surname.charAt(0).toUpperCase()}.`
    : "";

  return [firstName, surnameInitial]
    .filter(Boolean)
    .join(" ");
}

export default function BocasCouvaChallenge() {
  const [grid, setGrid] = useState(generateGrid());

  const [startTime, setStartTime] =
    useState(null);

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

  const [leaders, setLeaders] = useState([]);

  const [leadersLoading, setLeadersLoading] =
    useState(true);

  const [currentTime, setCurrentTime] =
    useState(Date.now());

  const [formData, setFormData] = useState({
    studentFirstName: "",
    studentSurname: "",
    school: "",
    classForm: "",
    parentGuardianName: "",
    parentGuardianPhone: "",
    email: "",
    playedAtFestival: "",
    permissionConfirmed: false,
  });

  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  const inputRefs = useRef(
    Array.from({ length: 5 }, () =>
      Array(5).fill(null)
    )
  );

  const successTimeoutRef = useRef(null);

  const challengeClosed =
    currentTime >= CHALLENGE_CLOSES_AT;

  const isUnder20 =
    elapsed > 0 &&
    elapsed < LEADERBOARD_TIME_LIMIT_MS;

  const displayTime = formatTime(elapsed);

  async function loadTopThree() {
    if (
      !BOCAS_SHEET_URL ||
      BOCAS_SHEET_URL.includes("PASTE_")
    ) {
      setLeaders([]);
      setLeadersLoading(false);
      return;
    }

    setLeadersLoading(true);

    try {
      const response = await fetch(
        BOCAS_SHEET_URL,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Leaderboard returned HTTP ${response.status}.`
        );
      }

      const text = await response.text();
      const records = parseCSV(text);

      const normalizedRows = records
        .map((record) => {
          const name = getPlayerName(record);

          const time = readField(record, [
            "Time",
            "Best Time",
            "Final Time",
            "Your Time",
          ]);

          const challengeId = readField(record, [
            "Challenge ID",
            "Challenge",
          ]);

          const timestamp = readField(record, [
            "Timestamp",
            "Date",
            "Played At",
          ]);

          return {
            name,
            time,
            challengeId,
            timestamp,
            milliseconds: toMillis(time),
            rowNumber: record.__row || 0,
          };
        })
        .filter((row) => row.name && row.time)
        .filter((row) =>
          Number.isFinite(row.milliseconds)
        )
        .filter(
          (row) =>
            row.milliseconds <
            LEADERBOARD_TIME_LIMIT_MS
        )
        .filter((row) => {
          if (!row.challengeId) {
            return true;
          }

          return (
            normalize(row.challengeId) ===
            normalize(CHALLENGE_ID)
          );
        })
        .sort((first, second) => {
          const timeDifference =
            first.milliseconds -
            second.milliseconds;

          if (timeDifference !== 0) {
            return timeDifference;
          }

          return (
            first.rowNumber - second.rowNumber
          );
        })
        .slice(0, 3);

      setLeaders(normalizedRows);
    } catch (error) {
      console.error(
        "Bocas top-three load error:",
        error
      );

      setLeaders([]);
    } finally {
      setLeadersLoading(false);
    }
  }

  useEffect(() => {
    document.title =
      "Bocas Couva 5×5 Challenge | CountMeInTT";

    loadTopThree();

    const closeClock = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(closeClock);

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }

      if (successTimeoutRef.current) {
        window.clearTimeout(
          successTimeoutRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!challengeClosed) {
      return;
    }

    setShowIntro(false);
    setShowForm(false);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
  }, [challengeClosed]);

  function checkCompletion(nextGrid) {
    const allCorrect = nextGrid.every((row) =>
      row.every((cell) => cell.correct === true)
    );

    if (!allCorrect || completed) {
      return;
    }

    const stopTime = Date.now();

    setCompleted(true);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    const finalTime = startTime
      ? stopTime - startTime
      : elapsed;

    setElapsed(finalTime);

    if (
      finalTime <
        LEADERBOARD_TIME_LIMIT_MS &&
      stopTime < CHALLENGE_CLOSES_AT
    ) {
      window.setTimeout(() => {
        setShowForm(true);
      }, 500);
    }
  }

  function handleChange(
    value,
    rowIndex,
    columnIndex
  ) {
    if (challengeClosed || completed) {
      return;
    }

    const nextGrid = grid.map((row) =>
      row.map((cell) => ({ ...cell }))
    );

    const cell =
      nextGrid[rowIndex][columnIndex];

    const cleanValue = String(value || "")
      .replace(/\D+/g, "")
      .slice(0, 3);

    cell.value = cleanValue;

    cell.correct =
      cleanValue !== "" &&
      Number(cleanValue) === cell.answer;

    if (
      !timerStartedRef.current &&
      cleanValue !== ""
    ) {
      const now = Date.now();

      setStartTime(now);

      timerRef.current = window.setInterval(
        () => {
          setElapsed(Date.now() - now);
        },
        10
      );

      timerStartedRef.current = true;
    }

    setGrid(nextGrid);
    checkCompletion(nextGrid);
  }

  function handleKeyDown(
    event,
    rowIndex,
    columnIndex
  ) {
    if (challengeClosed || completed) {
      event.preventDefault();
      return;
    }

    const lastRow = 4;
    const lastColumn = 4;

    if (
      event.key === "Enter" ||
      event.key === "NumpadEnter"
    ) {
      event.preventDefault();

      if (columnIndex < lastColumn) {
        inputRefs.current[rowIndex][
          columnIndex + 1
        ]?.focus();
      } else if (rowIndex < lastRow) {
        inputRefs.current[rowIndex + 1][
          0
        ]?.focus();
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

      return;
    }

    if (
      event.key === "ArrowLeft" &&
      columnIndex > 0
    ) {
      event.preventDefault();

      inputRefs.current[rowIndex][
        columnIndex - 1
      ]?.focus();

      return;
    }

    if (
      event.key === "ArrowDown" &&
      rowIndex < lastRow
    ) {
      event.preventDefault();

      inputRefs.current[rowIndex + 1][
        columnIndex
      ]?.focus();

      return;
    }

    if (
      event.key === "ArrowUp" &&
      rowIndex > 0
    ) {
      event.preventDefault();

      inputRefs.current[rowIndex - 1][
        columnIndex
      ]?.focus();

      return;
    }

    if (event.key === "Backspace") {
      const nextGrid = grid.map((row) =>
        row.map((cell) => ({ ...cell }))
      );

      nextGrid[rowIndex][columnIndex].value =
        "";

      nextGrid[rowIndex][columnIndex].correct =
        null;

      setGrid(nextGrid);
    }
  }

  function handleReset() {
    if (challengeClosed) {
      return;
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    setGrid(generateGrid());
    setStartTime(null);
    setElapsed(0);
    setCompleted(false);
    setShowForm(false);
    setSubmitSuccess(false);

    timerStartedRef.current = false;

    window.setTimeout(() => {
      inputRefs.current[0][0]?.focus();
    }, 50);
  }

  function updateFormField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (
      Date.now() >= CHALLENGE_CLOSES_AT
    ) {
      setShowForm(false);

      alert(
        "The Bocas Couva Challenge closed at 4:30 PM."
      );

      return;
    }

    if (!isUnder20) {
      alert(
        "Only times under 20 seconds can be submitted to the leaderboard."
      );

      return;
    }

    if (
      formData.playedAtFestival !== "Yes"
    ) {
      alert(
        "Leaderboard entries must be completed at the Bocas Couva Festival."
      );

      return;
    }

    if (!formData.permissionConfirmed) {
      alert(
        "Please confirm that a parent or guardian has given permission."
      );

      return;
    }

    if (
      !BOCAS_WEBHOOK ||
      BOCAS_WEBHOOK.includes("PASTE_")
    ) {
      alert(
        "The Bocas submission webhook has not been connected yet."
      );

      return;
    }

    setIsSubmitting(true);

    const body = new URLSearchParams();

    body.append(
      "challengeId",
      CHALLENGE_ID
    );

    body.append("event", EVENT_NAME);
    body.append("grid", "5x5");

    body.append(
      "studentFirstName",
      formData.studentFirstName.trim()
    );

    body.append(
      "studentSurname",
      formData.studentSurname.trim()
    );

    body.append(
      "school",
      formData.school.trim()
    );

    body.append(
      "classForm",
      formData.classForm.trim()
    );

    body.append(
      "parentGuardianName",
      formData.parentGuardianName.trim()
    );

    body.append(
      "parentGuardianPhone",
      formData.parentGuardianPhone.trim()
    );

    body.append(
      "email",
      formData.email.trim() || "N/A"
    );

    body.append(
      "playedAtFestival",
      formData.playedAtFestival
    );

    body.append(
      "permissionConfirmed",
      formData.permissionConfirmed
        ? "Yes"
        : "No"
    );

    body.append("time", displayTime);

    try {
      await fetch(BOCAS_WEBHOOK, {
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

      window.setTimeout(() => {
        loadTopThree();
      }, 2000);

      if (successTimeoutRef.current) {
        window.clearTimeout(
          successTimeoutRef.current
        );
      }

      successTimeoutRef.current =
        window.setTimeout(() => {
          setSubmitSuccess(false);
        }, 10000);
    } catch (error) {
      console.error(
        "Bocas submission error:",
        error
      );

      alert(
        "There was an error submitting your time."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen px-4 py-6 text-gray-950 sm:px-6 sm:py-8"
      style={{
        backgroundColor: "#fce500",
        backgroundImage:
          'url("/math-bg.svg")',
        backgroundRepeat: "repeat",
        backgroundSize: "300px",
        backgroundAttachment: "fixed",
      }}
    >
      <style>{`
        .bocas-challenge-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          border-radius: 12px;
          padding: 10px 18px;
          font-weight: 900;
          text-decoration: none;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            opacity 160ms ease;
        }

        .bocas-challenge-button:hover {
          transform: translateY(-1px);
        }

        .bocas-grid-input:focus {
          position: relative;
          z-index: 2;
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
        }
      `}</style>

      {showIntro && !challengeClosed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6">
          <div className="max-h-[calc(100vh-48px)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="text-4xl">🏁</div>

            <h2 className="mt-3 text-2xl font-black">
              Bocas Couva 5×5 Challenge
            </h2>

            <p className="mt-3 leading-7 text-gray-700">
              Complete all 25 multiplication
              questions as quickly as you can.
            </p>

            <div className="mt-5 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
              <p className="font-black">
                Beat the grid in under 20 seconds
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                You must complete the challenge in
                under 20 seconds to submit your time
                to the Bocas Couva leaderboard.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left text-sm">
              <h3 className="font-black text-blue-700">
                Keyboard Tips
              </h3>

              <ul className="mt-2 space-y-1 text-gray-700">
                <li>
                  <strong>Enter:</strong> Move to the
                  next box
                </li>

                <li>
                  <strong>Arrow keys:</strong> Move
                  around the grid
                </li>

                <li>
                  <strong>Backspace:</strong> Clear
                  the current box
                </li>

                <li>
                  The timer begins with your first
                  answer.
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIntro(false);

                window.setTimeout(() => {
                  inputRefs.current[0][0]?.focus();
                }, 100);
              }}
              className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white shadow transition hover:bg-blue-700"
            >
              Start Challenge
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-yellow-300 bg-white/95 p-5 shadow-xl sm:p-8">
          <div className="flex flex-col items-center justify-center gap-5 text-center">
            <img
              src="/logo-countmeintt.svg"
              alt="CountMeInTT"
              className="h-14 w-auto sm:h-16"
            />

            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                All Together Now
              </p>

              <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">
                Bocas Couva 5×5 Challenge
              </h1>

              <p className="mx-auto mt-3 max-w-2xl text-base font-semibold leading-7 text-gray-700 sm:text-lg">
                Complete the multiplication grid in
                under 20 seconds to make the
                leaderboard.
              </p>
            </div>

            <img
              src="/as-online-logo.svg"
              alt="A's Online Tutoring Services"
              className="max-h-20 w-auto max-w-[220px] object-contain"
            />
          </div>
        </section>

        {challengeClosed ? (
          <section className="mt-6 rounded-3xl border-2 border-red-300 bg-white p-8 text-center shadow-xl sm:p-12">
            <div className="text-5xl">🏁</div>

            <h2 className="mt-4 text-3xl font-black text-red-700">
              The Challenge Is Now Closed
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-gray-700">
              The Bocas Couva 5×5 Challenge closed
              at 4:30 PM on Saturday 18 July 2026.
            </p>

            <Link
              to="/bocas-couva-leaderboard"
              className="bocas-challenge-button mt-6 bg-black text-white shadow-lg hover:bg-gray-800"
            >
              View Final Leaderboard
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-6 rounded-3xl border border-yellow-300 bg-white p-5 shadow-xl sm:p-8">
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-wider text-gray-500">
                  Your Timer
                </p>

                <p className="mt-2 inline-block rounded-2xl bg-yellow-300 px-7 py-3 font-mono text-3xl font-black text-black shadow-sm">
                  ⏱ {displayTime}
                </p>

                {completed && (
                  <div
                    className={[
                      "mx-auto mt-4 max-w-xl rounded-xl border p-4 font-black",
                      isUnder20
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-red-300 bg-red-50 text-red-700",
                    ].join(" ")}
                  >
                    {isUnder20
                      ? "You beat 20 seconds! Submit your details to join the leaderboard."
                      : "Good effort! Reset the grid and try again to beat 20 seconds."}
                  </div>
                )}
              </div>

              <div className="mx-auto mt-7 max-w-3xl overflow-x-auto">
                <div className="min-w-[520px]">
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns:
                        "repeat(6, minmax(0, 1fr))",
                    }}
                  >
                    <div />

                    {Array.from(
                      { length: 5 },
                      (_, index) => (
                        <div
                          key={`column-${index}`}
                          className="flex h-12 items-center justify-center rounded-lg bg-yellow-300 text-lg font-black"
                        >
                          {index + 1}
                        </div>
                      )
                    )}

                    {grid.map(
                      (row, rowIndex) => (
                        <React.Fragment
                          key={`row-${rowIndex}`}
                        >
                          <div className="flex h-12 items-center justify-center rounded-lg bg-yellow-300 text-lg font-black">
                            {rowIndex + 1}
                          </div>

                          {row.map(
                            (
                              cell,
                              columnIndex
                            ) => (
                              <input
                                key={`cell-${rowIndex}-${columnIndex}`}
                                ref={(element) => {
                                  inputRefs.current[
                                    rowIndex
                                  ][columnIndex] =
                                    element;
                                }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="off"
                                value={cell.value}
                                disabled={
                                  challengeClosed ||
                                  completed
                                }
                                onChange={(event) =>
                                  handleChange(
                                    event.target
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
                                className={[
                                  "bocas-grid-input h-12 w-full rounded-lg border-2 text-center text-lg font-black transition",
                                  cell.correct ===
                                  null
                                    ? "border-gray-300 bg-white"
                                    : cell.correct
                                    ? "border-green-400 bg-green-100 text-green-900"
                                    : "border-red-400 bg-red-100 text-red-900",
                                  completed
                                    ? "cursor-not-allowed opacity-90"
                                    : "",
                                ].join(" ")}
                              />
                            )
                          )}
                        </React.Fragment>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="bocas-challenge-button border-0 bg-red-600 text-white shadow hover:bg-red-700"
                >
                  🔁 Reset Grid and Clock
                </button>

                <Link
                  to="/bocas-couva-leaderboard"
                  className="bocas-challenge-button bg-black text-white shadow hover:bg-gray-800"
                >
                  View Leaderboard
                </Link>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-yellow-300 bg-yellow-50/95 p-5 shadow-xl sm:p-8">
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-wider text-blue-700">
                  Bocas Couva Rankings
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  🏆 Top Three Players
                </h2>

                <p className="mt-2 text-gray-600">
                  Only completed times under 20
                  seconds qualify.
                </p>
              </div>

              {leadersLoading ? (
                <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                  <p className="mt-4 font-bold text-gray-600">
                    Loading the top players…
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {Array.from(
                    { length: 3 },
                    (_, index) => {
                      const player =
                        leaders[index];

                      const medals = [
                        "🥇",
                        "🥈",
                        "🥉",
                      ];

                      return (
                        <article
                          key={`leader-${index}`}
                          className="rounded-2xl border border-yellow-300 bg-white p-5 text-center shadow-sm"
                        >
                          <div className="text-4xl">
                            {medals[index]}
                          </div>

                          <p className="mt-3 text-sm font-black uppercase tracking-wide text-gray-500">
                            {index === 0
                              ? "1st Place"
                              : index === 1
                              ? "2nd Place"
                              : "3rd Place"}
                          </p>

                          {player ? (
                            <>
                              <h3 className="mt-2 text-xl font-black">
                                {player.name}
                              </h3>

                              <p className="mt-2 font-mono text-xl font-black text-blue-700">
                                {player.time}
                              </p>
                            </>
                          ) : (
                            <>
                              <h3 className="mt-2 text-xl font-black text-gray-500">
                                Open Position
                              </h3>

                              <p className="mt-2 font-mono text-xl font-black text-gray-400">
                                --:--.--
                              </p>
                            </>
                          )}
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {submitSuccess && (
          <section className="mt-6 rounded-3xl border border-green-300 bg-white p-6 text-center shadow-xl sm:p-8">
            <div className="text-4xl">✅</div>

            <h2 className="mt-3 text-2xl font-black text-green-700">
              Time Submitted
            </h2>

            <p className="mt-2 text-gray-700">
              Your time of{" "}
              <span className="font-mono font-black">
                {displayTime}
              </span>{" "}
              was submitted successfully.
            </p>

            <Link
              to="/bocas-couva-leaderboard"
              className="bocas-challenge-button mt-5 bg-black text-white shadow"
            >
              View Leaderboard
            </Link>
          </section>
        )}

        <footer className="py-10 text-center">
          <p className="text-[11px] italic text-black">
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

      {showForm &&
        !challengeClosed &&
        isUnder20 && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 px-4 py-6">
            <form
              onSubmit={handleSubmit}
              className="relative mx-auto w-full max-w-lg rounded-2xl bg-white p-6 text-black shadow-2xl"
            >
              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                aria-label="Close submission form"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black font-black text-white"
              >
                ×
              </button>

              <div className="pr-8 text-center">
                <div className="text-4xl">🎉</div>

                <h2 className="mt-3 text-2xl font-black">
                  You Beat 20 Seconds!
                </h2>

                <p className="mt-2 text-gray-600">
                  Your time:{" "}
                  <span className="font-mono font-black text-blue-700">
                    {displayTime}
                  </span>
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Student First Name"
                    value={
                      formData.studentFirstName
                    }
                    onChange={(event) =>
                      updateFormField(
                        "studentFirstName",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Student Surname"
                    value={
                      formData.studentSurname
                    }
                    onChange={(event) =>
                      updateFormField(
                        "studentSurname",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="School"
                    value={formData.school}
                    onChange={(event) =>
                      updateFormField(
                        "school",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Class/Form"
                    value={formData.classForm}
                    onChange={(event) =>
                      updateFormField(
                        "classForm",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                    required
                  />
                </div>

                <input
                  type="text"
                  placeholder="Parent/Guardian Name"
                  value={
                    formData.parentGuardianName
                  }
                  onChange={(event) =>
                    updateFormField(
                      "parentGuardianName",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  required
                />

                <input
                  type="tel"
                  placeholder="Parent/Guardian Phone Number"
                  value={
                    formData.parentGuardianPhone
                  }
                  onChange={(event) =>
                    updateFormField(
                      "parentGuardianPhone",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  required
                />

                <input
                  type="email"
                  placeholder="Parent/Guardian Email (Optional)"
                  value={formData.email}
                  onChange={(event) =>
                    updateFormField(
                      "email",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                />

                <label className="block text-left">
                  <span className="text-sm font-black">
                    Did you complete this challenge
                    at the Bocas Couva Festival?
                  </span>

                  <select
                    value={
                      formData.playedAtFestival
                    }
                    onChange={(event) =>
                      updateFormField(
                        "playedAtFestival",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                    required
                  >
                    <option value="">
                      Select one
                    </option>

                    <option value="Yes">
                      Yes
                    </option>

                    <option value="No">
                      No
                    </option>
                  </select>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-left text-sm leading-6">
                  <input
                    type="checkbox"
                    checked={
                      formData.permissionConfirmed
                    }
                    onChange={(event) =>
                      updateFormField(
                        "permissionConfirmed",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                    required
                  />

                  <span>
                    I confirm that a parent or
                    guardian has given permission
                    for CountMeInTT / A&apos;s Online
                    Tutoring Services to contact us
                    about this challenge entry.
                  </span>
                </label>

                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-green-600 px-5 py-3 font-black text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : "✅ Submit Time"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowForm(false)
                    }
                    className="rounded-xl bg-gray-200 px-5 py-3 font-black text-gray-900 transition hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
    </div>
  );
}
