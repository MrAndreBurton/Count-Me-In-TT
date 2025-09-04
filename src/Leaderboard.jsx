import React, { useEffect, useState } from "react";

export default function Leaderboard() {
  const [topPlayers, setTopPlayers] = useState({
    Primary: [],
    Secondary: [],
    NoSchool: [],
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const sheetURLs = {
      Primary:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=0&single=true&output=csv",
      Secondary:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1127334724&single=true&output=csv",
      NoSchool:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1462166071&single=true&output=csv",
    };

    const parseCSV = (text) => {
      if (!text || typeof text !== "string" || text.trim() === "") return [];
      const lines = text.trim().split("\n");
      if (lines.length < 2) return [];
      const [headersLine, ...rows] = lines;
      const headers = headersLine
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, ""));

      const parsed = rows.map((line, index) => {
        const pattern = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
        const cols = [...line.matchAll(pattern)].map((m) =>
          m[0].replace(/^"|"$/g, "").trim()
        );

        if (cols.length < 1 || !cols[0]) return null;
        while (cols.length < headers.length) cols.push("N/A");

        const entry = Object.fromEntries(
          headers.map((header, i) => [header, (cols[i] || "N/A").trim()])
        );
        entry.__index = index + 1;
        return entry;
      });

      return parsed;
    };

    const loadTopPlayers = async () => {
      const results = await Promise.all(
        Object.entries(sheetURLs).map(async ([category, url]) => {
          if (!url) return [category, []];
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            const entries = parseCSV(text).filter((entry) => {
              return (
                entry &&
                typeof entry === "object" &&
                entry["Name"]?.trim() !== "" &&
                entry["Time"]?.trim() !== ""
              );
            });

            const topThree = entries
              .map((entry) => ({
                Name: String(entry["Name"] ?? "N/A"),
                Time: String(entry["Time"] ?? "--"),
                School:
                  category === "NoSchool"
                    ? ""
                    : String(entry["School"] ?? "N/A"),
              }))
              .sort((a, b) => a["Time"].localeCompare(b["Time"]))
              .slice(0, 3);

            return [category, topThree];
          } catch (err) {
            console.error(`❌ Error loading ${category}`, err);
            return [category, []];
          }
        })
      );
      setTopPlayers(Object.fromEntries(results));
      setLastUpdated(new Date());
    };

    loadTopPlayers();
  }, []);

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
<a
  href="/"
  style={{
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#000",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
    boxShadow: "2px 2px 6px rgba(0,0,0,0.3)",
    zIndex: 10,
  }}
>
  ⬅ Back to Game
</a>
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
              borderBottom: "4px solid #000", // adjusted from gold to black for contrast
              display: "inline-block",
              paddingBottom: 10,
              marginBottom: 10,
            }}
          >
            🏆 Leaderboard
          </h1>
          <p style={{ color: "#333", fontSize: 18 }}>
            Updated: {lastUpdated ? lastUpdated.toLocaleString() : "Loading..."}
          </p>
        </header>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 40,
          }}
        >
          {Object.entries(topPlayers).map(([category, players]) => (
            <div
              key={category}
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                color: "#000",
                padding: 20,
                borderRadius: 10,
                width: 300,
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                transition: "transform 0.3s",
              }}
            >
              <h2
                style={{
                  borderBottom: "2px solid #ccc",
                  paddingBottom: 10,
                  fontSize: 24,
                }}
              >
                {category}
              </h2>
              {players.length > 0 ? (
  <ol style={{ textAlign: "left", paddingLeft: 20 }}>
    {players.map((p, idx) => {
      const medalEmoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";

      return (
        <li key={idx} style={{ marginBottom: 10 }}>
          <strong>
            {medalEmoji} {p.Name}
          </strong>
          {p.School && <span> – {p.School}</span>}
          <br />⏱ {p.Time}
        </li>
      );
    })}
  </ol>
) : (
  <p>No entries yet</p>
)}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 80 }}>
          <h2
            style={{
              marginBottom: 30,
              fontSize: 32,
              textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
              color: "#000", // changed from yellow to black for contrast
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
  <img
    src="/sponsor1.svg"
    alt="Sponsor 1"
    style={{
      height: "120px",
      maxWidth: "250px",
      objectFit: "contain",
      padding: "10px",
      borderRadius: "12px",
      backdropFilter: "brightness(1.05)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
    }}
  />
  <img
    src="/sponsor2.svg"
    alt="Sponsor 2"
    style={{
      height: "120px",
      maxWidth: "250px",
      objectFit: "contain",
      padding: "10px",
      borderRadius: "12px",
      backdropFilter: "brightness(1.05)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
    }}
  />
  <img
    src="/sponsor3.svg"
    alt="Sponsor 3"
    style={{
      height: "120px",
      maxWidth: "250px",
      objectFit: "contain",
      padding: "10px",
      borderRadius: "12px",
      backdropFilter: "brightness(1.05)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
    }}
  />
</div>
          </div>
      <div style={{ width: "100%", marginTop: "60px", display: "flex", justifyContent: "center" }}>
        <p
          style={{
            fontSize: "11px",
            color: "gray",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          © 2025 <span style={{ fontWeight: 600 }}>Count Me In TT</span>. Developed by{" "}
          <span style={{ fontWeight: 600 }}>Andre Burton</span>. Powered by{" "}
          <span style={{ fontWeight: 600 }}>A’s Online</span>. All rights reserved.
        </p>
</div>
       </div>
    </div>
  );
}
