import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const BOCAS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQxAcnRx9WwkC1kZzlnkgjHGTFuUbUBtVIsvE4RZpJ0TjC9a-YHq1q3r4O4Ez4Jb1nQuDmtND8t9R2r/pub?gid=0&single=true&output=csv";

const BOCAS_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbyCB5i38IRNP37AFzyD6Ni_8Y6R76iML1Y3OPaS_H8AXT5oqlBbIANylsApwWYJTL3fRg/exec";

const EVENT_END = new Date("2026-05-02T14:00:00-04:00");

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

export default function BocasChallenge() {
  const [grid, setGrid] = useState(generateGrid());
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [topThree, setTopThree] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const submissionsClosed = useMemo(() => new Date() > EVENT_END, []);
  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  const successTimeoutRef = useRef(null);

  const inputRefs = useRef([]);
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

  const loadTopThree = async () => {
    try {
      const res = await fetch(BOCAS_SHEET_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const rows = parseCSV(text);

      const filtered = rows
        .map((entry) => ({
          name: String(entry["Name"] ?? "").trim(),
          time: String(entry["Time"] ?? "").trim(),
          event: String(entry["Event"] ?? "").trim(),
          ms: toMillis(String(entry["Time"] ?? "").trim()),
          timestamp: String(entry["Timestamp"] ?? "").trim(),
          _row: entry.__row || 0,
        }))
        .filter((r) => r.name && r.time)
        .filter((r) => norm(r.event) === norm("Bocas Lit Fest 2026"))
        .sort((a, b) => {
          const d = a.ms - b.ms;
          if (d !== 0) return d;
          return (
            (a.timestamp || "").localeCompare(b.timestamp || "") ||
            a._row - b._row
          );
        })
        .slice(0, 3);

      setTopThree(filtered);
    } catch (e) {
      console.error("Bocas top three load error:", e);
      setTopThree([]);
    }
  };

  useEffect(() => {
    loadTopThree();

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

    if (!submissionsClosed) {
      setTimeout(() => setShowForm(true), 500);
    }
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

    if (new Date() > EVENT_END) {
      alert("Submissions for the Bocas Lit Fest 2026 Challenge are now closed.");
      return;
    }

    setIsSubmitting(true);

    const body = new URLSearchParams();
    body.append("name", formData.name);
    body.append("email", (formData.email || "").trim() || "N/A");
    body.append("event", "Bocas Lit Fest 2026");
    body.append("grid", "5x5");
    body.append("time", formatTime(elapsed));

    try {
      await fetch(BOCAS_WEBHOOK, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      setSubmitSuccess(true);
      setShowForm(false);

      setTimeout(() => {
        loadTopThree();
      }, 2000);

      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setSubmitSuccess(false);
      }, 8000);
    } catch (err) {
      alert("There was an error submitting your time.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayTime = formatTime(elapsed);

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
        .bocas-logo-wrap {
          display: flex;
          justify-content: center;
          gap: 0px;
          flex-wrap: wrap;
          align-items: center;
          background: rgba(0,0,0,0.20);
          padding: 14px 20px;
          border-radius: 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          backdrop-filter: blur(2px);
        }

        @media (min-width: 640px) {
          .bocas-logo-wrap {
            gap: 20px;
          }
        }
      `}</style>

      {showIntro ? (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded shadow max-w-md text-center space-y-4">
            <h2 className="text-xl font-bold">📚 Welcome to the Bocas Challenge!</h2>
            <p>Fill in the 5×5 times table grid as fast as you can.</p>

            <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
              <p className="font-semibold mb-2">5 × 5 Grid — Can You Beat 30 Seconds?</p>
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
                <li><strong>Enter</strong> – Move to next cell</li>
                <li><strong>← ↑ → ↓</strong> – Move around the grid</li>
                <li><strong>Backspace</strong> – Clear current cell</li>
                <li>Timer starts with your first input</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img
                src="/as-online-logo.svg"
                alt="A's Online"
                className="h-12 w-auto drop-shadow-md ring-1 ring-black/20 rounded"
              />
              <div className="text-left">
                <h1 className="text-3xl font-bold">Bocas Lit Fest 2026 Challenge</h1>
                <p className="text-sm text-black font-bold">
                  5×5 Grid — Count Me In TT Powered by A&apos;s Online
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <Link to="/bocaslitfest2026">
                <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow">
                  View Bocas Leaderboard
                </button>
              </Link>
              <button
                onClick={handleReset}
                className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 shadow"
              >
                Reset Game
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            <div className="bocas-logo-wrap">
              <img
                src="/logo-countmeintt.svg"
                alt="Count Me In TT"
                style={{ maxHeight: 200, width: "auto" }}
              />
              <img
                src="/logo-bocaslitfest2026.svg"
                alt="Bocas Lit Fest 2026"
                style={{ maxHeight: 200, width: "auto" }}
              />
            </div>
          </div>

          <div className="max-w-screen-md mx-auto">
            <div className="bg-white rounded-lg shadow p-4 border border-yellow-300">
              <h2 className="text-center font-bold text-xl mb-2 text-blue-600">
                🏆 Bocas Lit Fest 2026 Fastest Players 🏆
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
                {[0, 1, 2].map((i) => {
                  const p = topThree[i];
                  return (
                    <div key={i} className="bg-blue-100 px-4 py-3 rounded shadow">
                      <strong className="text-black block mb-1">
                        {i === 0 ? "🥇 1st" : i === 1 ? "🥈 2nd" : "🥉 3rd"}
                      </strong>
                      <span className="text-black block">{p?.name || "---"}</span>
                      <span className="font-mono text-black">
                        {p?.time || "--:--.--"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-4">
                <p className="text-black text-sm drop-shadow-[2px_2px_3px_rgba(0,0,0,0.75)] animate-shimmer bg-clip-text">
                  ⭐ Play and beat your fastest time. Compete to see your name on the Bocas Leaderboard! ⭐
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-black font-bold">Your Timer</p>
            <p className="text-2xl font-mono bg-yellow-300 text-black inline-block px-6 py-2 rounded shadow">
              ⏱️ {displayTime}
            </p>
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
                        onChange={(e) => handleChange(e.target.value, rowIdx, colIdx)}
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

          {completed && submissionsClosed && (
            <div className="max-w-md mx-auto bg-white text-black p-6 rounded shadow">
              <h2 className="text-xl font-bold text-center">Bocas Challenge Closed</h2>
              <p className="text-center mt-2">
                This challenge ended at 2:00 PM on May 2, 2026.
              </p>
              <p className="text-center text-sm text-gray-600 mt-2">
                The page remains available for archive purposes.
              </p>
            </div>
          )}
        </div>
      )}

      {submitSuccess && (
        <div
          style={{
            maxWidth: 500,
            margin: "0 auto 30px",
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
          <p style={{ color: "#555" }}>
            Check the leaderboard in a few seconds.
          </p>
          <div style={{ marginTop: 16 }}>
            <Link to="/bocaslitfest2026">
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
                View Bocas Leaderboard
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
          © 2025 - 2026 <span className="font-semibold">Count Me In TT</span>. Developed by{" "}
          <span className="font-semibold">Andre Burton</span>. Powered by{" "}
          <span className="font-semibold">A’s Online</span>. All rights reserved.
        </p>
      </div>

      {showForm && !submissionsClosed && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white text-black p-6 rounded shadow max-w-md w-full space-y-4"
          >
            <h2 className="text-xl font-bold text-center">🎉 Challenge Complete!</h2>
            <p className="text-center">
              Well done! Your time:{" "}
              <span className="font-mono font-semibold">{displayTime}</span>
            </p>
            <p className="text-center text-sm text-gray-600">
              Enter your info to appear on the Bocas leaderboard.
            </p>

            <input
              type="text"
              placeholder="Name"
              className="w-full border px-3 py-2 rounded"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <input
              type="email"
              placeholder="Email (Optional)"
              className="w-full border px-3 py-2 rounded"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

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

