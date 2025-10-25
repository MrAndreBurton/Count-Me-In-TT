import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Leaderboard({
  schoolFilter = null,
  classFilter = null,
  titleOverride = null,
  onlyFromToday = false,
}) {
  const [podium, setPodium] = useState({ 1: [], 2: [], 3: [] });
  const [others, setOthers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/scool/g, "school")
      .replace(/\bst\.?\b/g, "st")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const matchLoose = (value, filter) => {
    if (!filter) return true;
    const a = norm(value);
    const b = norm(filter);
    return a.includes(b) || b.includes(a);
  };

  const rowPassesFilters = (rowSchool, rowClass, schoolFilter, classFilter) => {
    if (!matchLoose(rowSchool, schoolFilter)) return false;
    if (!matchLoose(rowClass, classFilter)) return false;
    return true;
  };

  const START_OF_TODAY = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const SHEET_URLS = {
    "5x5": {
      SmallTop:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXvvpwFIx6TuA-dB26pjW6K0w8oRhg0IDgMO-69ag19hMATBAzC2Wf-I6m4Q5fUjLgCFNnzuT_cQUn/pub?gid=0&single=true&output=csv",
    },
    "5x12": {
      SmallTop:
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

  const toMillis = (t) => {
    const m = /^(\d+):(\d{2})\.(\d{2})$/.exec(String(t || ""));
    if (!m) return Number.POSITIVE_INFINITY;
    const [, MM, SS, cs] = m;
    return (+MM) * 60000 + (+SS) * 1000 + (+cs) * 10;
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
        const cols = [...line.matchAll(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)].map((m) =>
          (m[0] || "").replace(/^"|"$/g, "").trim()
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

  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const badge = (label, title) => (
    <span
      key={label}
      title={title || label}
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "999px",
        background: "#000",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        marginRight: 6,
      }}
    >
      {label}
    </span>
  );

  // Card now accepts `subtitle` instead of raw school and only renders it if given.
  const WinnerCard = ({ name, subtitle, time, gridId, category }) => (
    <div
      style={{
        background: "rgba(255,255,255,0.95)",
        color: "#000",
        padding: 12,
        borderRadius: 10,
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
        minWidth: 260,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong style={{ fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
          {name || "—"}
        </strong>
        <span style={{ fontFamily: "monospace" }}>⏱ {time || "--:--.--"}</span>
      </div>

      {subtitle ? (
        <div style={{ marginTop: 6, minHeight: 18, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {subtitle}
        </div>
      ) : null}

      <div style={{ marginTop: 8 }}>
        {badge(gridId.replace("x", "×"), `Grid: ${gridId.replace("x", "×")}`)}
        {category ? badge(category === "NoSchool" ? "No School" : category, `Category: ${category}`) : null}
      </div>
    </div>
  );

  useEffect(() => {
    const loadAll = async () => {
      try {
        const fetchText = async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        };

        const tasks = [];

        for (const gid of ["5x5", "5x12"]) {
          const url = SHEET_URLS[gid]?.SmallTop;
          if (url) {
            tasks.push(
              fetchText(url).then((text) => ({
                gridId: gid,
                category: "Primary",
                rows: parseCSV(text),
              }))
            );
          }
        }

        for (const gid of ["12x12", "15x15"]) {
          for (const cat of ["Primary", "Secondary", "NoSchool"]) {
            const url = SHEET_URLS[gid]?.[cat];
            if (url) {
              tasks.push(
                fetchText(url).then((text) => ({
                  gridId: gid,
                  category: cat,
                  rows: parseCSV(text),
                }))
              );
            }
          }
        }

        const datasets = await Promise.allSettled(tasks);

        const buckets = new Map();
        const pushRow = (key, obj) => {
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key).push(obj);
        };

        const norm = (s) =>
          String(s || "")
            .toLowerCase()
            .replace(/scool/g, "school")
            .replace(/\bst\.?\b/g, "st")
            .replace(/[^\p{L}\p{N}]+/gu, " ")
            .replace(/\s+/g, " ")
            .trim();

        const matchLoose = (value, filter) => {
          if (!filter) return true;
          const a = norm(value);
          const b = norm(filter);
          return a.includes(b) || b.includes(a);
        };

        const rowPassesFiltersLocal = (rowSchool, rowClass) =>
          matchLoose(rowSchool, schoolFilter) && matchLoose(rowClass, classFilter);

        datasets.forEach((res) => {
          if (res.status !== "fulfilled") return;
          const { gridId, category, rows } = res.value;
          const key = `${gridId}|${category}`;

          rows.forEach((entry) => {
            const Name = String(entry["Name"] ?? "").trim();
            const Time = String(entry["Time"] ?? "").trim();
            const School = String(entry["School"] ?? "").trim();
            const ClassLevel = String(
              entry["Class"] ??
              entry["class"] ??
              entry["Class Level"] ??
              entry["classLevel"] ??
              ""
            ).trim();

            if (!Name || !Time) return;
            if (!rowPassesFiltersLocal(School, ClassLevel)) return;

            pushRow(key, {
              name: Name,
              school: School,
              classLevel: ClassLevel,
              category,
              time: Time,
              ms: toMillis(Time),
              gridId,
              timestamp: String(entry["Timestamp"] ?? "").trim(),
              _row: entry.__row || 0,
            });
          });
        });

        const podiumAgg = { 1: [], 2: [], 3: [] };
        const othersAgg = [];

        buckets.forEach((arr) => {
          const sorted = arr
            .sort((a, b) => {
              const d = a.ms - b.ms;
              if (d !== 0) return d;
              return (a.timestamp || "").localeCompare(b.timestamp || "") || (a._row - b._row);
            })
            .slice(0, 10);

          sorted.slice(0, 3).forEach((row, i) => {
            podiumAgg[i + 1].push(row);
          });

          sorted.slice(3, 10).forEach((row, i) => {
            othersAgg.push({ ...row, rank: i + 4 });
          });
        });

        setPodium(podiumAgg);
        setOthers(othersAgg);
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Leaderboard load error:", e);
        setPodium({ 1: [], 2: [], 3: [] });
        setOthers([]);
        setLastUpdated(new Date());
      }
    };

    loadAll();
  }, [schoolFilter, classFilter, onlyFromToday]);

  // ===== subtitle helpers (inserted here) =====
  const isWholeSchool = !!schoolFilter && !classFilter; // e.g., /stx/all
  const isClassPage = !!classFilter;                    // e.g., /stx/prep4

  const makeSubtitle = (p) => {
    if (isWholeSchool) return p.classLevel || "";
    if (isClassPage) return "";
    return p.school || "";
  };
  // ============================================

  const PodiumSection = ({ place, emoji }) => (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontSize: 28,
          marginBottom: 16,
          textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
          color: "#000",
          display: "inline-block",
          borderBottom: "3px solid #000",
          paddingBottom: 6,
        }}
      >
        {emoji} {ordinal(place)} Place
      </h2>
      {podium[place]?.length ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {podium[place].map((p, idx) => (
            <WinnerCard
              key={`${place}-${p.gridId}-${p.category}-${idx}`}
              name={p.name}
              subtitle={makeSubtitle(p)}
              time={p.time}
              gridId={p.gridId}
              category={p.gridId === "5x5" || p.gridId === "5x12" ? null : p.category}
            />
          ))}
        </div>
      ) : (
        <p style={{ color: "#333" }}>— not set yet —</p>
      )}
    </section>
  );

  const OtherTimesByGrid = ({ items = [] }) => {
    const byGrid = items.reduce((acc, r) => {
      (acc[r.gridId] ||= []).push(r);
      return acc;
    }, {});

    const gridLabel = (g) => g.replace("x", "×");

    return (
      <div style={{ marginTop: 32 }}>
        {Object.entries(byGrid).map(([gridId, arr]) => (
          <section key={gridId} style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: 22,
                marginBottom: 12,
                textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
                color: "#000",
                display: "inline-block",
                borderBottom: "2px solid #000",
                paddingBottom: 4,
              }}
            >
              Other Times — {gridLabel(gridId)}
            </h2>

            {arr?.length ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.95)",
                  color: "#000",
                  padding: 12,
                  borderRadius: 10,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                  maxWidth: 720,
                  margin: "0 auto",
                  textAlign: "left",
                }}
              >
                <ol start={4} style={{ margin: 0, paddingLeft: 24 }}>
                  {arr
                    .sort((a, b) => a.rank - b.rank)
                    .map((p, idx) => (
                      <li key={`${gridId}-${p.category}-${p.name}-${idx}`} style={{ margin: "6px 0" }}>
                        <strong style={{ marginRight: 6 }}>{ordinal(p.rank)}</strong>
                        <strong style={{ marginRight: 6 }}>{p.name}</strong>
                        <span style={{ fontFamily: "monospace" }}>⏱ {p.time}</span>
                        {(gridId === "12x12" || gridId === "15x15") && (
                          <span style={{ opacity: 0.75 }}>
                            {" "}· {p.category === "NoSchool" ? "No School" : p.category}
                          </span>
                        )}
                      </li>
                    ))}
                </ol>
              </div>
            ) : (
              <p style={{ color: "#333" }}>— not set yet —</p>
            )}
          </section>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        backgroundColor: "#fce500",
        backgroundImage: `url("/math-bg.svg")`,
        backgroundRepeat: "repeat",
        backgroundSize: "300px",
        backgroundAttachment: "fixed",
        padding: "30px 20px",
        minHeight: "100vh",
        textAlign: "center",
        color: "#000",
        position: "relative",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* Top nav buttons */}
      {!schoolFilter ? (
        <Link to="/schools" className="lb-btn lb-left">
          🏫 Schools
        </Link>
      ) : (
        <Link to="/leaderboard" className="lb-btn lb-left">
          🌍 Global Leaderboard
        </Link>
      )}

      <Link to="/" className="lb-btn lb-right">
        ⬅ Back to Game
      </Link>

      <style>{`
        .lb-btn {
          position: absolute;
          background-color: #000;
          color: #fff;
          padding: 10px 14px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
          z-index: 10;
          line-height: 1;
          display: inline-block;
        }
        .lb-left { top: 16px; left: 16px; }
        .lb-right { top: 16px; right: 16px; }
        @media (max-width: 480px) {
          .lb-btn {
            font-size: 13px;
            padding: 8px 10px;
            border-radius: 10px;
          }
          .lb-left { top: 12px; left: 12px; right: 12px; }
          .lb-right { top: 56px; left: 12px; right: 12px; }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#fce500",
          opacity: 0.7,
          zIndex: 1,
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <header style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <img src="/logo-asonline.svg" alt="A's Online" />
            <img src="/logo-countmeintt.svg" alt="Count Me In TT" />
          </div>
          <h1
            style={{
              fontSize: 48,
              marginTop: 20,
              textShadow: "2px 2px 4px rgba(0,0,0,0.4)",
              borderBottom: "4px solid #000",
              display: "inline-block",
              paddingBottom: 10,
              marginBottom: 10,
            }}
          >
            {titleOverride || "🏆 Leaderboard"}
          </h1>
          <p style={{ color: "#333", fontSize: 18 }}>
            Updated: {lastUpdated ? lastUpdated.toLocaleString() : "Loading..."}
          </p>
        </header>

        <PodiumSection place={1} emoji="🥇" />
        <PodiumSection place={2} emoji="🥈" />
        <PodiumSection place={3} emoji="🥉" />

        {classFilter ? <OtherTimesByGrid items={others} /> : null}

        <div style={{ marginTop: 80 }}>
          <h2
            style={{
              marginBottom: 30,
              fontSize: 32,
              textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
              color: "#000",
            }}
          >
            🚀 Thanks for Playing
          </h2>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "50px",
              flexWrap: "wrap",
              marginTop: "30px",
            }}
          >
            <img src="/sponsor1.svg" alt="Sponsor 1" style={{ height: "120px", maxWidth: "250px", objectFit: "contain", padding: "10px", borderRadius: "12px", backdropFilter: "brightness(1.05)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)" }} />
            <img src="/sponsor2.svg" alt="Sponsor 2" style={{ height: "120px", maxWidth: "250px", objectFit: "contain", padding: "10px", borderRadius: "12px", backdropFilter: "brightness(1.05)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)" }} />
            <img src="/sponsor3.svg" alt="Sponsor 3" style={{ height: "120px", maxWidth: "250px", objectFit: "contain", padding: "10px", borderRadius: "12px", backdropFilter: "brightness(1.05)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)" }} />
          </div>

          <div style={{ textAlign: "center", marginTop: "40px", marginBottom: "20px" }}>
            <a href="/about-us-contact.pdf" target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontWeight: "bold", textDecoration: "underline", fontSize: "16px" }}>
              About Us/Contact
            </a>
          </div>

          <div style={{ width: "100%", marginTop: "60px", display: "flex", justifyContent: "center" }}>
            <p style={{ fontSize: "11px", color: "black", textAlign: "center", fontStyle: "italic" }}>
              © 2025 <span style={{ fontWeight: 600 }}>Count Me In TT</span>. Developed by <span style={{ fontWeight: 600 }}>Andre Burton</span>. Powered by <span style={{ fontWeight: 600 }}>A’s Online</span>. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



