import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const STYLES_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQahm0Nbt9w45e2XHEfOvjuwDb6LMd8Z4hS-1OW-4tSugjOtETC3w1AoRg8IJmonRkgGbGtbw5TTJ_K/pub?gid=0&single=true&output=csv";

const STYLES_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbzX37oDjGg9bUdXsaR11DDnKGgn2Ngk0k6zz_4FSQXS8sqdeZhZPm4zIL1-jpBy9Xa8/exec";

const CHALLENGE_ID = "styles-barbershop";
const EVENT_NAME = "Styles Barbershop Challenge";
const PRIZE_TIME_LIMIT_MS = 20000;

const generateGrid = () => {
  const grid = [];

  for (let r = 1; r <= 5; r++) {
    const row = [];

    for (let c = 1; c <= 5; c++) {
      row.push({ value: "", correct: null, answer: r * c });
    }

    grid.push(row);
  }

  return grid;
};

const formatTime = (milliseconds) => {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor((milliseconds % 1000) / 10);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

const toMillis = (t) => {
  const s = String(t || "").trim();
  const m = /^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(s);

  if (!m) return Number.POSITIVE_INFINITY;

  const mm = +m[1];
  const ss = +m[2];
  const frac = +(m[3] || 0);
  const ms = m[3] ? (m[3].length === 3 ? frac : frac * 10) : 0;

  return mm * 60000 + ss * 1000 + ms;
};

const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const formatDate = (value) => {
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
};

export default function StylesChallenge() {
  const [grid, setGrid] = useState(generateGrid());
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [prizeTracker, setPrizeTracker] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [formData, setFormData] = useState({
    studentFirstName: "",
    studentSurname: "",
    school: "",
    classForm: "",
    parentGuardianName: "",
    parentGuardianPhone: "",
    email: "",
    playedInStore: "",
    permissionConfirmed: false,
  });

  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  const successTimeoutRef = useRef(null);
  const inputRefs = useRef([]);

  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  if (
    inputRefs.current.length !== 5 ||
    inputRefs.current.some((r) => !Array.isArray(r) || r.length !== 5)
  ) {
    inputRefs.current = Array.from({ length: 5 }, () => Array(5).fill(null));
  }

  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getPlaceLabel = (i) => {
    if (i === 0) return "1st";
    if (i === 1) return "2nd";
    if (i === 2) return "3rd";
    if (i === 3) return "4th";
    return "5th";
  };

  const parseCSV = (text) => {
    if (!text || typeof text !== "string" || text.trim() === "") return [];

    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const [headersLine, ...rows] = lines;

    const headers = [...headersLine.matchAll(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)]
      .map((m) => (m[0] || "").replace(/^"|"$/g, "").trim());

    return rows
      .map((line, index) => {
        const cols = [...line.matchAll(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)].map(
          (m) => (m[0] || "").replace(/^"|"$/g, "").trim()
        );

        if (cols.length === 0 || !cols[0]) return null;

        while (cols.length < headers.length) cols.push("N/A");

        const obj = Object.fromEntries(
          headers.map((h, i) => [h, (cols[i] ?? "N/A").trim()])
        );

        obj.__row = index + 1;
        return obj;
      })
      .filter(Boolean);
  };

  const loadPrizeTracker = async () => {
    try {
      const res = await fetch(STYLES_SHEET_URL, { cache: "no-store" });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      const rows = parseCSV(text);

      const seenNames = new Set();

      const eligibleRows = rows
        .map((entry) => ({
          submissionId: String(entry["Submission ID"] ?? "").trim(),
          timestamp: String(entry["Timestamp"] ?? "").trim(),
          challengeId: String(entry["Challenge ID"] ?? "").trim(),
          monthKey: String(entry["Month Key"] ?? "").trim(),
          publicDisplayName: String(entry["Public Display Name"] ?? "").trim(),
          grid: String(entry["Grid"] ?? "").trim(),
          time: String(entry["Time"] ?? "").trim(),
          playedInStore: String(entry["Played In-Store"] ?? "").trim(),
          permissionConfirmed: String(entry["Permission Confirmed"] ?? "").trim(),
          prizeTrackerStatus:
            String(entry["Prize Tracker Status"] ?? "").trim() ||
            "Pending Review",
          verificationStatus: String(entry["Verification Status"] ?? "").trim(),
          ms: toMillis(String(entry["Time"] ?? "").trim()),
          _row: entry.__row || 0,
        }))
        .filter((r) => norm(r.challengeId) === norm(CHALLENGE_ID))
        .filter((r) => r.monthKey === currentMonthKey)
        .filter((r) => norm(r.grid) === norm("5x5") || norm(r.grid) === norm("5×5"))
        .filter((r) => r.ms < PRIZE_TIME_LIMIT_MS)
        .filter((r) => norm(r.playedInStore) === norm("Yes"))
        .filter((r) => norm(r.permissionConfirmed) === norm("Yes"))
        .filter((r) =>
          ["pending review", "confirmed winner"].includes(
            norm(r.prizeTrackerStatus)
          )
        )
        .sort((a, b) => {
          const timeCompare =
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();

          if (!Number.isNaN(timeCompare) && timeCompare !== 0) return timeCompare;

          return a._row - b._row;
        })
        .filter((r) => {
          const key = norm(r.publicDisplayName);

          if (!key || seenNames.has(key)) return false;

          seenNames.add(key);
          return true;
        })
        .slice(0, 5);

      setPrizeTracker(eligibleRows);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Styles Prize Tracker load error:", e);
      setPrizeTracker([]);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    loadPrizeTracker();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const checkCompletion = (newGrid) => {
    const allCorrect = newGrid.every((row) =>
      row.every((cell) => cell.correct === true)
    );

    if (!allCorrect || completed) return;

    const stopTime = Date.now();

    setCompleted(true);
    clearInterval(timerRef.current);

    if (startTime) setElapsed(stopTime - startTime);

    setTimeout(() => setShowForm(true), 500);
  };

  const handleKeyDown = (e, rowIdx, colIdx) => {
    const lastRow = 4;
    const lastCol = 4;

    if (e.key === "Enter" || e.key === "NumpadEnter") {
      e.preventDefault();

      if (colIdx < lastCol) {
        inputRefs.current[rowIdx][colIdx + 1]?.focus();
      } else if (rowIdx < lastRow) {
        inputRefs.current[rowIdx + 1][0]?.focus();
      }
    } else if (e.key === "ArrowRight" && colIdx < lastCol) {
      e.preventDefault();
      inputRefs.current[rowIdx][colIdx + 1]?.focus();
    } else if (e.key === "ArrowLeft" && colIdx > 0) {
      e.preventDefault();
      inputRefs.current[rowIdx][colIdx - 1]?.focus();
    } else if (e.key === "ArrowDown" && rowIdx < lastRow) {
      e.preventDefault();
      inputRefs.current[rowIdx + 1][colIdx]?.focus();
    } else if (e.key === "ArrowUp" && rowIdx > 0) {
      e.preventDefault();
      inputRefs.current[rowIdx - 1][colIdx]?.focus();
    } else if (e.key === "Backspace") {
      const next = grid.map((r) => r.map((c) => ({ ...c })));

      next[rowIdx][colIdx].value = "";
      next[rowIdx][colIdx].correct = null;

      setGrid(next);
    }
  };

  const handleChange = (value, rowIdx, colIdx) => {
    const next = grid.map((r) => r.map((c) => ({ ...c })));
    const cell = next[rowIdx][colIdx];

    const clean = String(value || "").replace(/\D+/g, "").slice(0, 3);

    cell.value = clean;
    cell.correct = clean !== "" && Number(clean) === cell.answer;

    setGrid(next);
    checkCompletion(next);

    if (!timerStartedRef.current && clean !== "") {
      const now = Date.now();

      setStartTime(now);
      timerRef.current = setInterval(() => setElapsed(Date.now() - now), 10);
      timerStartedRef.current = true;
    }
  };

  const handleReset = () => {
    window.location.reload();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.permissionConfirmed) {
      alert("I confirm that a parent/guardian has given permission for CountMeInTT / A’s Online Tutoring Services to contact us by phone or email if this student wins or qualifies for challenge updates.");
      return;
    }

    if (formData.playedInStore !== "Yes") {
      alert("Please confirm whether this was played in-store at Styles Barber Salon.");
      return;
    }

    setIsSubmitting(true);

    const body = new URLSearchParams();

    body.append("studentFirstName", formData.studentFirstName);
    body.append("studentSurname", formData.studentSurname);
    body.append("school", formData.school);
    body.append("classForm", formData.classForm);
    body.append("parentGuardianName", formData.parentGuardianName);
    body.append("parentGuardianPhone", formData.parentGuardianPhone);
    body.append("email", (formData.email || "").trim() || "N/A");
    body.append("playedInStore", formData.playedInStore);
    body.append("permissionConfirmed", formData.permissionConfirmed ? "Yes" : "No");
    body.append("event", EVENT_NAME);
    body.append("grid", "5x5");
    body.append("time", formatTime(elapsed));

    try {
      await fetch(STYLES_WEBHOOK, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      setSubmitSuccess(true);
      setShowForm(false);

      setTimeout(() => {
        loadPrizeTracker();
      }, 2000);

      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);

      successTimeoutRef.current = setTimeout(() => {
        setSubmitSuccess(false);
      }, 9000);
    } catch (err) {
      alert("There was an error submitting your time.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayTime = formatTime(elapsed);
  const isUnder20 = elapsed > 0 && elapsed < PRIZE_TIME_LIMIT_MS;

  return (
    <div
      className="p-4 min-h-screen transition-colors duration-300 text-black"
      style={{
        backgroundColor: "#fff058",
        backgroundImage: `url("/my-bg.svg")`,
        backgroundRepeat: "repeat",
        backgroundSize: "800px",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        padding: "30px 20px",
        textAlign: "center",
        color: "#000",
        overflow: "hidden",
        position: "relative",
        zIndex: 0,
      }}
    >
      <style>{`
        .styles-logo-wrap {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          align-items: center;
          background: rgba(0,0,0,0.20);
          padding: 14px 20px;
          border-radius: 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          backdrop-filter: blur(2px);
        }

        .styles-btn {
          background-color: #000;
          color: #fff;
          padding: 10px 14px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
          line-height: 1;
          display: inline-block;
        }

        .status-pending {
          background: #ffb020;
          color: #000;
        }

        .status-confirmed {
          background: #16a34a;
          color: #fff;
        }

        @media (max-width: 640px) {
          .styles-top-nav {
            position: static !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          .styles-top-nav .styles-btn {
            position: static !important;
            margin: 4px;
          }
        }
      `}</style>

      {showIntro ? (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-white text-black p-6 rounded shadow max-w-md text-center space-y-4">
            <h2 className="text-xl font-bold">💈 Styles Barbershop Challenge</h2>

            <p>Fill in the 5×5 times table grid as fast as you can.</p>

            <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
              <p className="font-semibold mb-2">
                Beat the 5×5 Grid in Under 20 Seconds
              </p>

              <p className="text-xs text-gray-700 mb-3">
                Prize-eligible entries must be completed in-store at Styles
                Barber Salon.
              </p>

              <Link
                to="/styles-rules"
                className="text-xs font-bold text-blue-700 underline block mb-3"
              >
                View Rules & Prize Eligibility
              </Link>

              <button
                onClick={() => setShowIntro(false)}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded block mx-auto"
              >
                Start Challenge
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-left text-sm">
              <h3 className="font-semibold text-blue-700 mb-2">🔑 Keyboard Tips</h3>

              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Enter</strong> – Move to next cell
                </li>
                <li>
                  <strong>← ↑ → ↓</strong> – Move around the grid
                </li>
                <li>
                  <strong>Backspace</strong> – Clear current cell
                </li>
                <li>Timer starts with your first input</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className="styles-top-nav"
            style={{ position: "relative", marginBottom: 16, minHeight: 50 }}
          >
            <Link
              to="/challenges"
              className="styles-btn"
              style={{ position: "absolute", left: 16, top: 16 }}
            >
              ⬅ Challenges
            </Link>

            <Link
              to="/styles-leaderboard"
              className="styles-btn"
              style={{ position: "absolute", right: 16, top: 16 }}
            >
              View Leaderboard
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img
                src="/logo-countmeintt.svg"
                alt="Count Me In TT"
                className="h-12 w-auto drop-shadow-md ring-1 ring-black/20 rounded"
              />

              <div className="text-left">
                <h1 className="text-3xl font-bold">Styles Barbershop Challenge</h1>

                <p className="text-sm text-black font-bold">
                  5×5 Grid — Count Me In TT Powered by A&apos;s Online
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow self-start sm:self-auto"
            >
              Reset Game
            </button>
          </div>

          <div className="max-w-screen-md mx-auto">
            <div className="bg-white rounded-lg shadow p-4 border border-yellow-300">
              <h2 className="text-center font-bold text-xl mb-2 text-blue-600">
                💈 Beat the 5×5 Grid in Under 20 Seconds
              </h2>

              <p className="text-sm font-semibold text-black">
                Scan. Play in-store. Beat under 20 seconds. Win.
              </p>

              <p className="text-xs text-gray-700 mt-2">
                Must play and submit your time in store. $50 elegible winners will be contacted and verified.
              </p>
            </div>
          </div>

          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-black font-bold">Your Timer</p>

            <p className="text-2xl font-mono bg-yellow-300 text-black inline-block px-6 py-2 rounded shadow">
              ⏱️ {displayTime}
            </p>

            {completed && (
              <p
                className={`text-sm font-bold ${
                  isUnder20 ? "text-green-700" : "text-red-700"
                }`}
              >
                {isUnder20
                  ? "Under 20 seconds! Submit your details for review."
                  : "Good effort! Keep practising to beat under 20 seconds."}
              </p>
            )}
          </div>

          <div className="overflow-x-auto w-full max-w-screen-xl mx-auto px-2">
            <div className="inline-block w-full">
              <div
                className="grid gap-1 w-full"
                style={{ gridTemplateColumns: `repeat(6, minmax(0, 1fr))` }}
              >
                <div className="h-10"></div>

                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={`col-header-${i}`}
                    className="h-10 w-full text-center font-bold bg-yellow-300 text-black flex items-center justify-center text-xs sm:text-sm"
                  >
                    {i + 1}
                  </div>
                ))}

                {grid.map((row, rowIdx) => (
                  <React.Fragment key={`row-${rowIdx}`}>
                    <div className="h-10 w-full text-center font-bold bg-yellow-300 text-black flex items-center justify-center text-xs sm:text-sm">
                      {rowIdx + 1}
                    </div>

                    {row.map((cell, colIdx) => (
                      <input
                        key={`cell-${rowIdx}-${colIdx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={cell.value}
                        onChange={(e) =>
                          handleChange(e.target.value, rowIdx, colIdx)
                        }
                        onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                        ref={(el) => {
                          inputRefs.current[rowIdx][colIdx] = el;
                        }}
                        className={`h-10 w-full text-center border ${
                          cell.correct === null
                            ? "border-gray-400"
                            : cell.correct
                            ? "bg-green-200"
                            : "bg-red-200"
                        }`}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-screen-md mx-auto">
            <div className="bg-white rounded-lg shadow p-4 border border-yellow-300">
              <h2 className="text-center font-bold text-xl mb-1 text-blue-600">
                $50 Prize Tracker
              </h2>

              <p className="text-sm text-black font-semibold mb-2">
                First 5 students each month to beat under 20 seconds.
              </p>

              <p className="text-xs text-gray-600 mb-3">
                Updated: {lastUpdated ? lastUpdated.toLocaleString() : "Loading..."}
              </p>

              {prizeTracker.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-sm text-center">
                  {Array.from({ length: 5 }, (_, i) => {
                    const p = prizeTracker[i];

                    return (
                      <div
                        key={i}
                        className="bg-blue-100 px-3 py-2 rounded shadow"
                        style={{ minHeight: "auto" }}
                      >
                        <strong className="text-black block mb-1 text-sm">
                          {getPlaceLabel(i)}
                        </strong>

                        {p ? (
                          <>
                            <span className="text-black font-bold block text-sm leading-tight">
                              {p.publicDisplayName}
                            </span>

                            <span className="font-mono text-black block text-sm leading-tight">
                              ⏱ {p.time}
                            </span>

                            <span className="text-black block text-xs leading-tight">
                              {formatDate(p.timestamp)}
                            </span>

                            <span
                              className={`inline-block mt-1 px-2 py-1 rounded text-[10px] font-bold ${
                                norm(p.prizeTrackerStatus) ===
                                norm("Confirmed Winner")
                                  ? "status-confirmed"
                                  : "status-pending"
                              }`}
                            >
                              {p.prizeTrackerStatus}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-black block text-sm leading-tight">
                              Available
                            </span>

                            <span className="font-mono text-black block text-sm leading-tight">
                              --:--.--
                            </span>

                            <span className="text-black block text-xs leading-tight">
                              —
                            </span>

                            <span className="inline-block mt-1 px-2 py-1 rounded text-[10px] font-bold status-pending">
                              Open Spot
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-blue-100 px-4 py-3 rounded shadow text-center">
                  <p className="font-bold">No prize spots filled yet.</p>
                  <p className="text-sm mt-1">
                    Be one of the first 5 this month to beat under 20 seconds.
                  </p>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <Link
                  to="/styles-rules"
                  className="text-xs font-bold text-blue-700 underline"
                >
                  View Rules & Prize Eligibility
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div
          style={{
            maxWidth: 520,
            margin: "30px auto",
            background: "rgba(255,255,255,0.95)",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}
        >
          <h2 style={{ marginBottom: 10 }}>✅ Thanks for playing!</h2>

          <p style={{ marginBottom: 12 }}>
            Your time was submitted successfully.
          </p>

          <p style={{ color: "#555", lineHeight: 1.5 }}>
            Prize eligibility is confirmed after review. If you qualify,
            CountMeInTT / A&apos;s Online will contact the parent/guardian using
            the details submitted.
          </p>

          <div style={{ marginTop: 16 }}>
            <Link to="/styles-leaderboard">
              <button
                style={{
                  background: "#000",
                  color: "#fff",
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                View Styles Leaderboard
              </button>
            </Link>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "40px", marginBottom: "20px" }}>
        <a
          href="/about-us-contact.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#000",
            fontWeight: "bold",
            textDecoration: "underline",
            fontSize: "16px",
          }}
        >
          About Us/Contact
        </a>
      </div>

      <div className="w-full mt-8 flex justify-center">
        <p className="text-[11px] text-black text-center italic">
          © 2025 - 2026 <span className="font-semibold">Count Me In TT</span>.
          Developed by <span className="font-semibold">Andre Burton</span>.
          Powered by <span className="font-semibold">A’s Online</span>. All
          rights reserved.
        </p>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 px-4"
          style={{
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            paddingTop: 24,
            paddingBottom: 24,
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white text-black p-6 rounded shadow max-w-lg w-full space-y-4"
            style={{
              margin: "0 auto",
              maxHeight: "calc(100vh - 48px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 12,
                background: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <h2 className="text-xl font-bold text-center">
              🎉 Challenge Complete!
            </h2>

            <p className="text-center">
              Your time:{" "}
              <span className="font-mono font-semibold">{displayTime}</span>
            </p>

            <p className="text-center text-sm text-gray-600">
              Submit your details for review. Prize-eligible entries must be
              completed in-store at Styles Barber Salon.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Student First Name"
                className="w-full border px-3 py-2 rounded"
                value={formData.studentFirstName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    studentFirstName: e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Student Surname"
                className="w-full border px-3 py-2 rounded"
                value={formData.studentSurname}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    studentSurname: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="School"
                className="w-full border px-3 py-2 rounded"
                value={formData.school}
                onChange={(e) =>
                  setFormData({ ...formData, school: e.target.value })
                }
                required
              />

              <input
                type="text"
                placeholder="Class/Form"
                className="w-full border px-3 py-2 rounded"
                value={formData.classForm}
                onChange={(e) =>
                  setFormData({ ...formData, classForm: e.target.value })
                }
                required
              />
            </div>

            <input
              type="text"
              placeholder="Parent/Guardian Name"
              className="w-full border px-3 py-2 rounded"
              value={formData.parentGuardianName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parentGuardianName: e.target.value,
                })
              }
              required
            />

            <input
              type="tel"
              placeholder="Parent/Guardian Phone Number"
              className="w-full border px-3 py-2 rounded"
              value={formData.parentGuardianPhone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parentGuardianPhone: e.target.value,
                })
              }
              required
            />

            <input
              type="email"
              placeholder="Parent/Guardian Email (Optional)"
              className="w-full border px-3 py-2 rounded"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <div className="text-left">
              <label className="block text-sm font-semibold mb-1">
                Did you play this in-store at Styles Barber Salon?
              </label>

              <select
                className="w-full border px-3 py-2 rounded"
                value={formData.playedInStore}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    playedInStore: e.target.value,
                  })
                }
                required
              >
                <option value="">Select one</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <label className="flex items-start gap-2 text-left text-sm bg-yellow-50 border border-yellow-200 p-3 rounded">
              <input
                type="checkbox"
                checked={formData.permissionConfirmed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    permissionConfirmed: e.target.checked,
                  })
                }
                required
                style={{ marginTop: 3 }}
              />

              <span>
                I confirm that a parent/guardian has given permission for
                CountMeInTT / A’s Online Tutoring Services to contact us if this
                student wins or qualifies for challenge updates.
              </span>
            </label>

            <div className="flex justify-between gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded text-white ${
                  isSubmitting
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isSubmitting ? "Submitting..." : "✅ Submit Time"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                🔁 Reset Game
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

