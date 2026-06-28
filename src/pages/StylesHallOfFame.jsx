import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STYLES_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQahm0Nbt9w45e2XHEfOvjuwDb6LMd8Z4hS-1OW-4tSugjOtETC3w1AoRg8IJmonRkgGbGtbw5TTJ_K/pub?gid=0&single=true&output=csv";

const CHALLENGE_ID = "styles-barbershop";

const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const getMonthLabel = (monthKey) => {
  if (!monthKey || !monthKey.includes("-")) return monthKey || "";

  const [year, month] = monthKey.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(d.getTime())) return monthKey;

  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const formatDate = (value) => {
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
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

export default function StylesHallOfFame() {
  const [entries, setEntries] = useState([]);
  const [monthOptions, setMonthOptions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [lastUpdated, setLastUpdated] = useState(null);

  const selectedMonthLabel = useMemo(
    () => getMonthLabel(selectedMonth),
    [selectedMonth]
  );

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

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(STYLES_SHEET_URL, { cache: "no-store" });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        const rows = parseCSV(text);

        const cleaned = rows
          .map((entry) => ({
            submissionId: String(entry["Submission ID"] ?? "").trim(),
            timestamp: String(entry["Timestamp"] ?? "").trim(),
            challengeId: String(entry["Challenge ID"] ?? "").trim(),
            monthKey: String(entry["Month Key"] ?? "").trim(),
            publicDisplayName: String(entry["Public Display Name"] ?? "").trim(),
            time: String(entry["Time"] ?? "").trim(),
            cashPrizeWinner: String(entry["Cash Prize Winner"] ?? "").trim(),
            freeHaircutWinner: String(entry["Free Haircut Winner"] ?? "").trim(),
            confirmedWinner: String(entry["Confirmed Winner"] ?? "").trim(),
            hallOfFame: String(entry["Hall of Fame"] ?? "").trim(),
            ms: toMillis(String(entry["Time"] ?? "").trim()),
            _row: entry.__row || 0,
          }))
          .filter((r) => norm(r.challengeId) === norm(CHALLENGE_ID))
          .filter((r) => r.publicDisplayName && r.time);

        const availableMonths = Array.from(
          new Set(cleaned.map((r) => r.monthKey).filter(Boolean))
        ).sort((a, b) => b.localeCompare(a));

        const hofEntries = cleaned
          .filter((r) => norm(r.hallOfFame) === norm("Yes"))
          .sort((a, b) => {
            const d = a.ms - b.ms;
            if (d !== 0) return d;

            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();

            if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
              return timeA - timeB;
            }

            return a._row - b._row;
          });

        if (cancelled) return;

        setEntries(hofEntries);
        setMonthOptions(availableMonths);

        if (availableMonths.length && !availableMonths.includes(selectedMonth)) {
          setSelectedMonth(availableMonths[0]);
        }

        setLastUpdated(new Date());
      } catch (e) {
        console.error("Styles Hall of Fame load error:", e);

        if (cancelled) return;

        setEntries([]);
        setMonthOptions([]);
        setLastUpdated(new Date());
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const monthEntries = entries.filter((entry) => entry.monthKey === selectedMonth);

  const cashWinners = monthEntries
    .filter((entry) => norm(entry.cashPrizeWinner) === norm("Yes"))
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();

      if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
        return timeA - timeB;
      }

      return a._row - b._row;
    });

  const haircutWinner =
    monthEntries
      .filter((entry) => norm(entry.freeHaircutWinner) === norm("Yes"))
      .sort((a, b) => {
        const d = a.ms - b.ms;
        if (d !== 0) return d;
        return a._row - b._row;
      })[0] || null;

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        backgroundColor: "#fce500",
        backgroundImage: `url("/math-bg.svg")`,
        backgroundRepeat: "repeat",
        backgroundSize: "300px",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        padding: "30px 20px",
        textAlign: "center",
        color: "#000",
      }}
    >
      <style>{`
        .styles-hof-btn {
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

        .styles-hof-card {
          background: rgba(255,255,255,0.95);
          color: #000;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.22);
          padding: 18px;
          text-align: center;
        }

        @media (max-width: 640px) {
          .styles-hof-nav {
            position: static !important;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;
          }

          .styles-hof-btn {
            position: static !important;
            margin: 4px;
          }
        }
      `}</style>

      <div
        className="styles-hof-nav"
        style={{ position: "relative", marginBottom: 16, minHeight: 50 }}
      >
        <Link
          to="/styles-leaderboard"
          className="styles-hof-btn"
          style={{ position: "absolute", left: 16, top: 16 }}
        >
          ⬅ Leaderboard
        </Link>

        <Link
          to="/styles-challenge"
          className="styles-hof-btn"
          style={{ position: "absolute", right: 16, top: 16 }}
        >
          Back to Game
        </Link>
      </div>

      <header style={{ marginTop: 50, marginBottom: 40 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
>
          <img
            src="/logo-countmeintt.svg"
            alt="Count Me In TT"
            style={{ maxHeight: 180, width: "auto" }}
          />

            <img
            src="/logo-styles-barber-salon.svg"
            alt="Styles Barber Salon"
            style={{ maxHeight: 180, width: "auto" }}
          />
        </div>

        <h1
          style={{
            fontSize: 34,
            marginTop: 20,
            textShadow: "2px 2px 4px rgba(0,0,0,0.35)",
            borderBottom: "4px solid #000",
            display: "inline-block",
            paddingBottom: 8,
          }}
        >
          🌟 Styles Barbershop Challenge Hall of Fame 🌟
        </h1>

        <p
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginTop: 10,
            maxWidth: 760,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.5,
          }}
        >
          Verified monthly winners from the CountMeInTT Styles Barbershop
          Challenge.
        </p>

        <p style={{ color: "#333", fontSize: 16 }}>
          Updated: {lastUpdated ? lastUpdated.toLocaleString() : "Loading..."}
        </p>

        <div style={{ marginTop: 20 }}>
          <label
            htmlFor="styles-month-select"
            style={{
              fontWeight: 700,
              marginRight: 10,
              fontSize: 16,
            }}
          >
            Select Month:
          </label>

          <select
            id="styles-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "2px solid #000",
              fontWeight: 700,
              background: "#fff",
              color: "#000",
            }}
          >
            {monthOptions.length ? (
              monthOptions.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {getMonthLabel(monthKey)}
                </option>
              ))
            ) : (
              <option value={selectedMonth}>{selectedMonthLabel}</option>
            )}
          </select>
        </div>
      </header>

      <section
        style={{
          maxWidth: 900,
          margin: "0 auto 40px",
          background: "rgba(255,255,255,0.95)",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
        }}
      >
        <h2
          style={{
            fontSize: 30,
            marginBottom: 8,
            borderBottom: "3px solid #000",
            display: "inline-block",
            paddingBottom: 6,
          }}
        >
          {selectedMonthLabel} Hall of Fame
        </h2>

        <p
          style={{
            fontSize: 15,
            color: "#333",
            fontWeight: 700,
            marginTop: 8,
          }}
        >
          Only verified winners approved by CountMeInTT / A’s Online appear here.
        </p>
      </section>

      <section
        style={{
          maxWidth: 900,
          margin: "0 auto 40px",
          textAlign: "left",
        }}
      >
        <div className="styles-hof-card">
          <h2
            style={{
              fontSize: 28,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            💵 $50 Cash Prize Winners
          </h2>

          {cashWinners.length ? (
            <ol style={{ margin: 0, paddingLeft: 28 }}>
              {cashWinners.map((winner, idx) => (
                <li
                  key={`${winner.submissionId}-${idx}`}
                  style={{
                    margin: "12px 0",
                    fontSize: 18,
                    lineHeight: 1.4,
                  }}
                >
                  <strong style={{ marginRight: 8 }}>
                    {winner.publicDisplayName}
                  </strong>

                  <span style={{ marginRight: 8, fontFamily: "monospace" }}>
                    ⏱ {winner.time}
                  </span>

                  <span>— {formatDate(winner.timestamp)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ textAlign: "center", margin: 0 }}>
              Winners for this month are being verified.
            </p>
          )}
        </div>
      </section>

      <section
        style={{
          maxWidth: 900,
          margin: "0 auto 50px",
        }}
      >
        <div
          className="styles-hof-card"
          style={{
            border: "4px solid #000",
          }}
        >
          <h2
            style={{
              fontSize: 28,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            💈 Fastest Student of the Month
          </h2>

          {haircutWinner ? (
            <>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                {haircutWinner.publicDisplayName}
              </div>

              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 24,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                ⏱ {haircutWinner.time}
              </div>

              <div style={{ fontSize: 16 }}>
                Free haircut winner from Styles Barber Salon
              </div>

              <div style={{ fontSize: 14, marginTop: 8 }}>
                {formatDate(haircutWinner.timestamp)}
              </div>
            </>
          ) : (
            <p style={{ textAlign: "center", margin: 0 }}>
              Fastest student winner for this month is being verified.
            </p>
          )}
        </div>
      </section>

      <section
        style={{
          maxWidth: 760,
          margin: "0 auto 60px",
          background: "rgba(255,255,255,0.95)",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
        }}
      >
        <h2 style={{ fontSize: 24, marginBottom: 10 }}>
          Community Prize Sponsor
        </h2>

        <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>
          Prize support provided by CountMeInTT / A’s Online.
        </p>

        {/* Add sponsor logo/name here later if needed */}
      </section>

      <div style={{ marginTop: 80 }}>
        <h2
          style={{
            marginBottom: 20,
            fontSize: 32,
            textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
            color: "#000",
          }}
        >
          💈 CountMeInTT x Styles Barber Salon
        </h2>

        <p
          style={{
            maxWidth: 680,
            margin: "0 auto",
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          Celebrating students who build speed, confidence, and accuracy through
          mathematics.
        </p>

<Link
  to="/styles-rules"
  className="text-xs font-bold text-blue-700 underline block mb-3"
>
  View Rules & Prize Eligibility
</Link>

        <div
          style={{
            textAlign: "center",
            marginTop: "40px",
            marginBottom: "20px",
          }}
        >
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

        <div
          style={{
            width: "100%",
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "black",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            © 2025 - 2026{" "}
            <span style={{ fontWeight: 600 }}>Count Me In TT</span>. Developed
            by <span style={{ fontWeight: 600 }}>Andre Burton</span>. Powered
            by <span style={{ fontWeight: 600 }}>A’s Online</span>. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

