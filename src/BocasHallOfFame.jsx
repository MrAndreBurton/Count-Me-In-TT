import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const BOCAS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQxAcnRx9WwkC1kZzlnkgjHGTFuUbUBtVIsvE4RZpJ0TjC9a-YHq1q3r4O4Ez4Jb1nQuDmtND8t9R2r/pub?gid=0&single=true&output=csv";

const EVENT_NAME = "Bocas Lit Fest 2026";
const QUALIFYING_MS = 30000; // under 30 seconds

function parseCSV(text) {
  if (!text || typeof text !== "string" || text.trim() === "") return [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const [headersLine, ...rows] = lines;

  const headers = [...headersLine.matchAll(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)]
    .map((m) => (m[0] || "").replace(/^"|"$/g, "").trim());

  return rows
    .map((line, index) => {
      const cols = [...line.matchAll(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)].map((m) =>
        (m[0] || "").replace(/^"|"$/g, "").trim()
      );
      if (cols.length === 0 || !cols[0]) return null;
      while (cols.length < headers.length) cols.push("N/A");
      const obj = Object.fromEntries(headers.map((h, i) => [h, (cols[i] ?? "N/A").trim()]));
      obj.__row = index + 1;
      return obj;
    })
    .filter(Boolean);
}

function toMillis(t) {
  const s = String(t || "").trim();
  const m = /^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(s);
  if (!m) return Number.POSITIVE_INFINITY;
  const mm = +m[1];
  const ss = +m[2];
  const frac = +(m[3] || 0);
  const ms = m[3] ? (m[3].length === 3 ? frac : frac * 10) : 0;
  return mm * 60000 + ss * 1000 + ms;
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function BocasHallOfFame() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(BOCAS_SHEET_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const parsed = parseCSV(text);

        const filtered = parsed
          .map((entry) => ({
            name: String(entry["Name"] ?? "").trim(),
            time: String(entry["Time"] ?? "").trim(),
            event: String(entry["Event"] ?? "").trim(),
            grid: String(entry["Grid"] ?? "").trim() || "5×5",
            timestamp: String(entry["Timestamp"] ?? "").trim(),
            ms: toMillis(String(entry["Time"] ?? "").trim()),
            _row: entry.__row || 0,
          }))
          .filter((r) => r.name && r.time)
          .filter((r) => norm(r.event) === norm(EVENT_NAME))
          .filter((r) => r.ms < QUALIFYING_MS)
          .sort((a, b) => {
            const d = a.ms - b.ms;
            if (d !== 0) return d;
            return (a.timestamp || "").localeCompare(b.timestamp || "") || (a._row - b._row);
          });

        if (!cancelled) setRows(filtered);
      } catch (e) {
        console.error("Bocas Hall of Fame load error:", e);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalQualified = useMemo(() => rows.length, [rows]);

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        background: "#fce500",
        minHeight: "100vh",
        padding: "30px 20px",
        textAlign: "center",
        color: "#000",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Link to="/bocaslitfest2026" className="lb-btn" style={{ position: "absolute", left: 16, top: 16 }}>
          ⬅ Bocas Leaderboard
        </Link>
        <Link to="/" className="lb-btn" style={{ position: "absolute", right: 16, top: 16 }}>
          Back to Game
        </Link>
      </div>

      <style>{`
        .lb-btn {
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
        table.hof {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          border-collapse: collapse;
        }
        table.hof th, table.hof td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(0,0,0,0.15);
        }
        table.hof th {
          text-align: center;
          background: rgba(255,255,255,0.8);
        }
        table.hof tbody tr:nth-child(odd) {
          background: rgba(255,255,255,0.6);
        }
        table.hof tbody tr:nth-child(even) {
          background: rgba(255,255,255,0.9);
        }
      `}</style>

      <header style={{ marginTop: 40, marginBottom: 24 }}>
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
            style={{ maxHeight: 120, width: "auto" }}
          />
          <img
            src="/logo-bocaslitfest2026.svg"
            alt="Bocas Lit Fest 2026"
            style={{ maxHeight: 180, width: "auto" }}
          />
        </div>

        <h1
          style={{
            fontSize: 42,
            marginTop: 18,
            textShadow: "2px 2px 4px rgba(0,0,0,0.35)",
            borderBottom: "4px solid #000",
            display: "inline-block",
            paddingBottom: 8,
          }}
        >
          🏅 Bocas 2026 Hall of Fame
        </h1>

        <p style={{ marginTop: 12, fontSize: 18 }}>
          Players who completed the 5×5 challenge in under 30 seconds
        </p>

        <p style={{ marginTop: 8, fontWeight: 700 }}>
          Total Qualified: {totalQualified}
        </p>
      </header>

      {loading ? (
        <p style={{ fontSize: 16 }}>Loading…</p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: 16 }}>— No players under 30 seconds yet —</p>
      ) : (
        <div
          style={{
            width: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            paddingLeft: 12,
            paddingRight: 12,
            marginBottom: 60,
          }}
        >
          <table
            className="hof"
            style={{
              width: "100%",
              minWidth: 420,
              maxWidth: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              backgroundColor: "white",
              margin: "0 auto",
            }}
          >
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Time</th>
                <th>Grid</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.name}-${r.time}-${i}`}>
                  <td><strong>{i + 1}</strong></td>
                  <td><strong>{r.name}</strong></td>
                  <td style={{ fontFamily: "monospace" }}>⏱ {r.time}</td>
                  <td>{r.grid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: "black",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          © 2026 <span style={{ fontWeight: 600 }}>Count Me In TT</span>. Developed by{" "}
          <span style={{ fontWeight: 600 }}>Andre Burton</span>. Powered by{" "}
          <span style={{ fontWeight: 600 }}>A’s Online</span>. All rights reserved.
        </p>
      </div>
    </div>
  );
}

