import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/** 1) Sources: keep categories separate per grid (unchanged) */
const HOF_SOURCES = {
  "5x5": {
    Primary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXvvpwFIx6TuA-dB26pjW6K0w8oRhg0IDgMO-69ag19hMATBAzC2Wf-I6m4Q5fUjLgCFNnzuT_cQUn/pub?gid=0&single=true&output=csv",
  },
  "5x12": {
    Primary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXvvpwFIx6TuA-dB26pjW6K0w8oRhg0IDgMO-69ag19hMATBAzC2Wf-I6m4Q5fUjLgCFNnzuT_cQUn/pub?gid=1665132778&single=true&output=csv",
  },
  "12x12": {
    Primary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=0&single=true&output=csv",
    Secondary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1127334724&single=true&output=csv",
    NoSchool:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1462166071&single=true&output=csv",
  },
  "15x15": {
    Primary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=0&single=true&output=csv",
    Secondary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=1175275328&single=true&output=csv",
    NoSchool:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=800118807&single=true&output=csv",
  },
};

const GRID_ORDER = ["5x5", "5x12", "12x12", "15x15"];
const CATEGORY_ORDER = ["Primary", "Secondary", "NoSchool"];

/** NEW: Month helpers (no more hard-coded list) */
function monthKeyOf(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // e.g. 2026-01
}
function monthLabelOf(key) {
  const [y, m] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, 1);
  return dt.toLocaleString("en-US", { month: "long", year: "numeric" });
}
function prevMonthKey(key) {
  const [y, m] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, 1);
  dt.setMonth(dt.getMonth() - 1);
  return monthKeyOf(dt);
}
function sortMonthKeysAsc(a, b) {
  return a.localeCompare(b); // YYYY-MM sorts lexicographically
}

/** 3) CSV helpers (unchanged) */
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

function pickName(row) {
  const options = ["Name", "Student Name", "Player", "Student"];
  for (const k of options) {
    if (row[k] && String(row[k]).trim()) return String(row[k]).trim();
  }
  for (const v of Object.values(row)) {
    const s = String(v || "").trim();
    if (!s || /\S+@\S+/.test(s)) continue;
    if (/^\d{1,2}:\d{2}(\.\d{1,3})?$/.test(s)) continue;
    return s;
  }
  return "";
}

function pickTime(row) {
  const keys = Object.keys(row);
  const lower = Object.fromEntries(keys.map((k) => [k.toLowerCase(), k]));
  const candidates = ["time", "best time", "final time", "your time", "result"];
  for (const c of candidates) {
    const k = lower[c];
    if (k) {
      const val = String(row[k] || "").trim();
      if (/^\d{1,2}:\d{2}(\.\d{1,3})?$/.test(val)) return val;
    }
  }
  for (const k of keys) {
    const val = String(row[k] || "").trim();
    if (/^\d{1,2}:\d{2}(\.\d{1,3})?$/.test(val)) return val;
  }
  return "";
}

function toMillis(t) {
  const s = String(t || "").trim();
  const m = /^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(s);
  if (!m) return Number.POSITIVE_INFINITY;
  const mm = +m[1], ss = +m[2], frac = +(m[3] || 0);
  const ms = m[3] ? (m[3].length === 3 ? frac : frac * 10) : 0;
  return mm * 60000 + ss * 1000 + ms;
}

function pickTimestamp(row) {
  const candidates = ["Timestamp", "Date", "Submitted At", "Submission Time"];
  for (const k of candidates) {
    if (row[k] && String(row[k]).trim()) return new Date(String(row[k]).trim());
  }
  for (const v of Object.values(row)) {
    const s = String(v || "").trim();
    const d = new Date(s);
    if (!isNaN(d)) return d;
  }
  return null;
}

function gridLabel(g) { return g.replace("x", "×"); }
function catLabel(c) { return c === "NoSchool" ? "No School" : c; }

/** 4) Main component (CHANGED) */
export default function HallOfFame() {
  const currentMonthKey = monthKeyOf(new Date());
  const [monthKey, setMonthKey] = useState(currentMonthKey); // default = CURRENT month
  const [rows, setRows] = useState([]);  // raw parsed rows with grid/category
  const [loading, setLoading] = useState(false);

  // load all CSVs once
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const tasks = [];
        for (const gridId of Object.keys(HOF_SOURCES)) {
          const catMap = HOF_SOURCES[gridId];
          for (const category of Object.keys(catMap)) {
            const url = catMap[category];
            tasks.push(
              fetch(url)
                .then((r) => {
                  if (!r.ok) throw new Error(`HTTP ${r.status}`);
                  return r.text();
                })
                .then((text) => ({ gridId, category, rows: parseCSV(text) }))
            );
          }
        }
        const results = await Promise.allSettled(tasks);
        if (cancelled) return;

        const all = [];
        results.forEach((res) => {
          if (res.status !== "fulfilled") return;
          const { gridId, category, rows } = res.value;
          rows.forEach((r) => {
            const name = pickName(r);
            const time = pickTime(r);
            const ts = pickTimestamp(r); // Date or null
            if (!name || !time || !ts) return;
            all.push({
              name,
              time,
              ms: toMillis(time),
              ts,
              gridId,
              category,
              _row: r.__row || 0,
            });
          });
        });
        setRows(all);
      } catch (e) {
        console.error("HOF load error:", e);
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  /** NEW: dynamic month list from data (+always include current & previous) */
  const months = useMemo(() => {
    const set = new Set();
    rows.forEach(r => {
      if (r.ts && !isNaN(r.ts)) set.add(monthKeyOf(r.ts));
    });
    // ensure current and previous months exist in the dropdown
    const cur = currentMonthKey;
    const prev = prevMonthKey(cur);
    set.add(cur);
    set.add(prev);

    return Array.from(set).sort(sortMonthKeysAsc);
  }, [rows, currentMonthKey]);

  // compute winners per (month, gridId, category)
  const winners = useMemo(() => {
    const byMonthGridCat = new Map(); // key = `${mKey}|${gridId}|${category}`

    const put = (k, row) => {
      const cur = byMonthGridCat.get(k);
      if (!cur) { byMonthGridCat.set(k, row); return; }
      // lowest time wins; tie-break: earlier timestamp; then earlier row
      const d = row.ms - cur.ms;
      if (d < 0) { byMonthGridCat.set(k, row); return; }
      if (d > 0) return;
      if ((row.ts?.getTime() || Infinity) < (cur.ts?.getTime() || Infinity)) {
        byMonthGridCat.set(k, row); return;
      }
      if ((row._row || Infinity) < (cur._row || Infinity)) {
        byMonthGridCat.set(k, row);
      }
    };

    rows.forEach((r) => {
      if (!r.ts) return;
      const mKey = monthKeyOf(r.ts);
      const key = `${mKey}|${r.gridId}|${r.category}`;
      put(key, r);
    });

    // flatten and sort (month asc → grid order → category order)
    const out = [];
    for (const [key, row] of byMonthGridCat.entries()) {
      const [mKey, gridId, category] = key.split("|");
      out.push({ monthKey: mKey, gridId, category, name: row.name, time: row.time, ms: row.ms });
    }
    return out.sort((a, b) => {
      const am = a.monthKey.localeCompare(b.monthKey);
      if (am !== 0) return am;
      const ag = GRID_ORDER.indexOf(a.gridId);
      const bg = GRID_ORDER.indexOf(b.gridId);
      if (ag !== bg) return ag - bg;
      const ac = CATEGORY_ORDER.indexOf(a.category);
      const bc = CATEGORY_ORDER.indexOf(b.category);
      return ac - bc;
    });
  }, [rows]);

  const filtered = useMemo(() => {
    if (!monthKey) return winners;
    return winners.filter((w) => w.monthKey === monthKey);
  }, [winners, monthKey]);

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
      {/* Top nav */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Link to="/leaderboard" className="lb-btn" style={{ position: "absolute", left: 16, top: 16 }}>
          ⬅ Leaderboard
        </Link>
        <Link to="/" className="lb-btn" style={{ position: "absolute", right: 16, top: 16 }}>
          Back to Game
        </Link>
      </div>

      <style>{`
        .lb-btn {
          background-color: #000; color: #fff; padding: 10px 14px; border-radius: 12px;
          text-decoration: none; font-weight: 700; box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
          line-height: 1; display: inline-block;
        }
        table.hof { width: 100%; max-width: 980px; margin: 0 auto; border-collapse: collapse; }
        table.hof th, table.hof td { padding: 10px 12px; border-bottom: 1px solid rgba(0,0,0,0.15); }
        table.hof th { text-align: center; background: rgba(255,255,255,0.8); }
        table.hof tbody tr:nth-child(odd) { background: rgba(255,255,255,0.6); }
        table.hof tbody tr:nth-child(even) { background: rgba(255,255,255,0.9); }
      `}</style>

      <header style={{ marginTop: 40, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          <img src="/logo-asonline.svg" alt="A's Online" />
          <img src="/logo-countmeintt.svg" alt="Count Me In TT" />
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
          🏅 Hall of Fame
        </h1>

        <div style={{ marginTop: 12 }}>
          <label style={{ fontWeight: 700, marginRight: 8 }}>Month:</label>
          <select
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #000" }}
          >
            {months.map((k) => (
              <option key={k} value={k}>
                {monthLabelOf(k)}{k === currentMonthKey ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <p style={{ fontSize: 16 }}>Loading…</p>
      ) : (
        <div style={{ marginTop: 10, marginBottom: 60 }}>
          {filtered.length === 0 ? (
            <p>— No winners found for {monthLabelOf(monthKey)} —</p>
          ) : (
            <div
              style={{
                width: "100%",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                paddingLeft: 12,
                paddingRight: 12,
              }}
            >
              <table
                className="hof"
                style={{
                  width: "100%",
                  minWidth: 450,
                  maxWidth: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                  backgroundColor: "white",
                  margin: "0 auto",
                }}
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Time</th>
                    <th>Grid</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w, i) => (
                    <tr key={`${w.monthKey}-${w.gridId}-${w.category}-${i}`}>
                      <td><strong>{w.name}</strong></td>
                      <td style={{ fontFamily: "monospace" }}>⏱ {w.time}</td>
                      <td>{gridLabel(w.gridId)}</td>
                      <td>{catLabel(w.category)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
          © {new Date().getFullYear()} <span style={{ fontWeight: 600 }}>Count Me In TT</span>. Developed by{" "}
          <span style={{ fontWeight: 600 }}>Andre Burton</span>. Powered by{" "}
          <span style={{ fontWeight: 600 }}>A’s Online</span>. All rights reserved.
        </p>
      </div>
    </div>
  );
}

