import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const btnStyle = {
  display: "inline-block",
  background: "#000",
  color: "#fff",
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  textAlign: "center",
};

const cardStyle = {
  background: "rgba(255,255,255,0.95)",
  border: "1px solid #000",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
};

export default function Challenges() {
  useEffect(() => {
    document.title = "Challenges | CountMeInTT";

    let meta = document.querySelector('meta[name="description"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.content =
      "Explore CountMeInTT challenges, event leaderboards, hall of fame archives, and community math competitions across Trinidad and Tobago.";
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
        minHeight: "100vh",
        padding: "30px 20px",
        textAlign: "center",
        color: "#000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Link to="/leaderboard" className="lb-btn lb-right">
        ⬅ Back to Leaderboard
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

      <div style={{ position: "relative", zIndex: 2 }}>
        <header style={{ marginBottom: 40 }}>
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
              src="/logo-asonline.svg"
              alt="A's Online"
              style={{ maxHeight: 90, width: "auto" }}
            />
            <img
              src="/logo-countmeintt.svg"
              alt="Count Me In TT"
              style={{ maxHeight: 120, width: "auto" }}
            />
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
            🏁 Challenges
          </h1>

          <p style={{ fontSize: 18, color: "#222" }}>
            Special event leaderboards and archives
          </p>
        </header>

        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "left" }}>
          {/* Bocas */}
          <div style={cardStyle}>
            <div
              style={{
                width: "100%",
                background: "#000",
                color: "#fff",
                padding: "12px 16px",
                borderRadius: 10,
                fontWeight: 700,
                textAlign: "left",
                marginBottom: 12,
              }}
            >
              Bocas Lit Fest 2026
            </div>

            <p style={{ marginTop: 0, marginBottom: 14, color: "#222" }}>
              Archived 5×5 challenge leaderboard and event results.
            </p>

            <div style={{ display: "grid", gap: 10 }}>
              <Link to="/bocaslitfest2026" style={btnStyle}>
                View Bocas Leaderboard
              </Link>
              <Link to="/bocas-hall-of-fame" style={btnStyle}>
                View Bocas Hall of Fame
              </Link>
            </div>
          </div>

          {/* Youthopia 2 */}
          <div style={cardStyle}>
            <div
              style={{
                width: "100%",
                background: "#000",
                color: "#fff",
                padding: "12px 16px",
                borderRadius: 10,
                fontWeight: 700,
                textAlign: "left",
                marginBottom: 12,
              }}
            >
              Youthopia 2
            </div>

            <p style={{ marginTop: 0, marginBottom: 14, color: "#222" }}>
              Youthopia Grid Challenge leaderboard and event activity.
            </p>

            <div style={{ display: "grid", gap: 10 }}>
              <Link to="/youthopia-leaderboard" style={btnStyle}>
                View Youthopia Leaderboard
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 80 }}>
          <h2
            style={{
              marginBottom: 30,
              fontSize: 32,
              textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
              color: "#000",
              textAlign: "center",
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
            <p className="text-[11px] text-black text-center italic">
              © 2025 - 2026 <span className="font-semibold">Count Me In TT</span>. Developed by{" "}
              <span className="font-semibold">Andre Burton</span>. Powered by{" "}
              <span className="font-semibold">A’s Online</span>. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

