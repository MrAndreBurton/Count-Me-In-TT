import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function SchoolsPicker() {
  const [openSchool, setOpenSchool] = useState(null);

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
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top-right back button */}
      <Link to="/leaderboard" className="lb-btn lb-right">
        ⬅ Back to Leaderboard
      </Link>

      {/* Optional: inject same CSS helper classes if not already global */}
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
          .lb-btn { font-size: 13px; padding: 8px 10px; border-radius: 10px; }
          .lb-left { top: 12px; left: 12px; right: 12px; }
          .lb-right { top: 56px; left: 12px; right: 12px; }
        }
      `}</style>

      {/* Brand header */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <header style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <img src="/logo-asonline.svg" alt="A's Online" />
            <img src="/logo-countmeintt.svg" alt="Count Me In TT" />
          </div>
          <h1
            style={{
              fontSize: 42,
              marginTop: 20,
              textShadow: "2px 2px 4px rgba(0,0,0,0.4)",
              borderBottom: "4px solid #000",
              display: "inline-block",
              paddingBottom: 10,
              marginBottom: 10,
            }}
          >
            🏫 Schools
          </h1>
        </header>

        {/* School list – for now just St Xavier’s */}
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid #000",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              textAlign: "left",
            }}
          >
            <div
              onClick={() => setOpenSchool(openSchool === "stx" ? null : "stx")}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20 }}>St Xavier’s Private School</h2>
              <span style={{ fontSize: 20 }}>{openSchool === "stx" ? "▴" : "▾"}</span>
            </div>

            {openSchool === "stx" && (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <Link
                  to="/stx/prep3"
                  style={btnStyle}
                >
                  View Prep 3 Leaderboard
                </Link>
                <Link
                  to="/stx/prep4"
                  style={btnStyle}
                >
                  View Prep 4 Leaderboard
                </Link>
                <Link
                  to="/stx/prep5"
                  style={btnStyle}
                >
                  View Prep 5 Leaderboard
                </Link>
              </div>
            )}
          </div>

          {/* Add more schools blocks the same way later */}
        </div>

        {/* Footer & sponsors to match brand */}
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

          <div style={{ width: "100%", marginTop: "60px", display: "flex", justifyContent: "center" }}>
            <p
              style={{
                fontSize: "11px",
                color: "black",
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
    </div>
  );
}

const btnStyle = {
  display: "inline-block",
  background: "#000",
  color: "#fff",
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
};


