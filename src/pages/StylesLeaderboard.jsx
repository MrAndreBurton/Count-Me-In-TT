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
  const [year, month] = monthKey.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);

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

export default function StylesLeaderboard() {
  const [podium, setPodium] = useState({ 1: null, 2: null, 3: null });
  const [others, setOthers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const currentMonthLabel = useMemo(
    () => getMonthLabel(currentMonthKey),
    [currentMonthKey]
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

        const bestByStudent = new Map();

        rows
          .map((entry) => ({
            submissionId: String(entry["Submission ID"] ?? "").trim(),
            timestamp: String(entry["Timestamp"] ?? "").trim(),
            challengeId: String(entry["Challenge ID"] ?? "").trim(),
            monthKey: String(entry["Month Key"] ?? "").trim(),
            publicDisplayName: String(entry["Public Display Name"] ?? "").trim(),
            time: String(entry["Time"] ?? "").trim(),
            ms: toMillis(String(entry["Time"] ?? "").trim()),
            _row: entry.__row || 0,
          }))
          .filter((r) => norm(r.challengeId) === norm(CHALLENGE_ID))
          .filter((r) => r.monthKey === currentMonthKey)
          .filter((r) => r.publicDisplayName && r.time)
          .forEach((r) => {
            const key = norm(r.publicDisplayName);
            const existing = bestByStudent.get(key);

            if (!existing || r.ms < existing.ms) {
              bestByStudent.set(key, r);
            }
          });

        const filtered = Array.from(bestByStudent.values())
          .sort((a, b) => {
            const d = a.ms - b.ms;
            if (d !== 0) return d;

            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();

            if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
              return timeA - timeB;
            }

            return a._row - b._row;
          })
          .slice(0, 10);

        if (cancelled) return;

        setPodium({
          1: filtered[0] || null,
          2: filtered[1] || null,
          3: filtered[2] || null,
        });

        setOthers(filtered.slice(3));
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Styles leaderboard load error:", e);

        if (cancelled) return;

        setPodium({ 1: null, 2: null, 3: null });
        setOthers([]);
        setLastUpdated(new Date());
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [currentMonthKey]);

  const WinnerCard = ({ place, player }) => (
    <div
      style={{
        background: "rgba(255,255,255,0.95)",
        color: "#000",
        padding: 16,
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
        minWidth: 250,
      }}
    >
      <h2 style={{ fontSize: 24, marginBottom: 10 }}>
        {place === 1 ? "🥇 1st" : place === 2 ? "🥈 2nd" : "🥉 3rd"} Place
      </h2>

      {player ? (
        <>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {player.publicDisplayName}
          </div>

          <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 18 }}>
            ⏱ {player.time}
          </div>

          <div style={{ marginTop: 8, fontSize: 14 }}>
            {formatDate(player.timestamp)}
          </div>
        </>
      ) : (
        <div>— not set yet —</div>
      )}
    </div>
  );

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
        .styles-lb-btn {
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

        @media (max-width: 640px) {
          .styles-lb-nav {
            position: static !important;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;
          }

          .styles-lb-btn {
            position: static !important;
            margin: 4px;
          }
        }
      `}</style>

      <div
        className="styles-lb-nav"
        style={{ position: "relative", marginBottom: 16, minHeight: 50 }}
      >
        <Link
          to="/styles-challenge"
          className="styles-lb-btn"
          style={{ position: "absolute", left: 16, top: 16 }}
        >
          ⬅ Back to Game
        </Link>

        <Link
          to="/styles-hall-of-fame"
          className="styles-lb-btn"
          style={{ position: "absolute", right: 16, top: 16 }}
        >
          Hall of Fame
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

          {/* Add sponsor/logo later when ready */}
          {/* <img
            src="/logo-styles-barber-salon.svg"
            alt="Styles Barber Salon"
            style={{ maxHeight: 180, width: "auto" }}
          /> */}
        </div>

        <h1
          style={{
            fontSize: 30,
            marginTop: 20,
            textShadow: "2px 2px 4px rgba(0,0,0,0.35)",
            borderBottom: "4px solid #000",
            display: "inline-block",
            paddingBottom: 8,
          }}
        >
          🏆 Styles Barbershop Challenge Leaderboard 🏆
        </h1>

        <p style={{ fontSize: 22, fontWeight: "bold", marginTop: 10 }}>
          {currentMonthLabel}
        </p>

        <p
          style={{
            color: "#333",
            fontSize: 15,
            maxWidth: 720,
            margin: "10px auto 0",
            lineHeight: 1.5,
          }}
        >
          Leaderboard ranking does not guarantee prize eligibility. Winners are
          confirmed after review and contacted by CountMeInTT / A’s Online.
        </p>

        <p style={{ color: "#333", fontSize: 16, marginTop: 12 }}>
          Updated: {lastUpdated ? lastUpdated.toLocaleString() : "Loading..."}
        </p>
      </header>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 40,
        }}
      >
        <WinnerCard place={1} player={podium[1]} />
        <WinnerCard place={2} player={podium[2]} />
        <WinnerCard place={3} player={podium[3]} />
      </div>

      <section style={{ maxWidth: 720, margin: "0 auto 60px", textAlign: "left" }}>
        <h2
          style={{
            fontSize: 28,
            marginBottom: 16,
            textAlign: "center",
            borderBottom: "3px solid #000",
            display: "inline-block",
            paddingBottom: 6,
          }}
        >
          Other Times
        </h2>

        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}
        >
          {others.length ? (
            <ol start={4} style={{ margin: 0, paddingLeft: 24 }}>
              {others.map((p, idx) => {
                const rank = idx + 4;

                const suffix =
                  rank % 10 === 1 && rank % 100 !== 11
                    ? "st"
                    : rank % 10 === 2 && rank % 100 !== 12
                    ? "nd"
                    : rank % 10 === 3 && rank % 100 !== 13
                    ? "rd"
                    : "th";

                return (
                  <li
                    key={`${p.publicDisplayName}-${p.time}-${idx}`}
                    style={{ margin: "8px 0" }}
                  >
                    <strong style={{ marginRight: 8 }}>
                      {rank}
                      {suffix}
                    </strong>

                    <strong style={{ marginRight: 8 }}>
                      {p.publicDisplayName}
                    </strong>

                    <span style={{ marginRight: 8, fontFamily: "monospace" }}>
                      ⏱ {p.time}
                    </span>

                    <span>— {formatDate(p.timestamp)}</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p style={{ textAlign: "center", margin: 0 }}>— not set yet —</p>
          )}
        </div>
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
          💈 Thanks for Playing
        </h2>

        <p
          style={{
            maxWidth: 620,
            margin: "0 auto",
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          Scan. Play in-store. Beat under 20 seconds. Submit your time. Win.
        </p>

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

