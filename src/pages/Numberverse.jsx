import React from "react";
import { Link } from "react-router-dom";
import GameHeader from "../components/layout/GameHeader";
import "../numberverse/numberverse-hub.css";

const engines = [
  {
    title: "Number Forge",
    eyebrow: "BUILD",
    symbol: "+",
    description:
      "Construct numbers that satisfy mathematical rules and constraints.",
    status: "Coming Soon",
  },
  {
    title: "Badge It!",
    eyebrow: "CLASSIFY",
    symbol: "#",
    description:
      "Recognise number properties and classify numbers by what makes them special.",
    status: "Coming Soon",
  },
  {
    title: "Divisibility Lab",
    eyebrow: "INVESTIGATE",
    symbol: "÷",
    description:
      "Break numbers apart, test their structure and discover how their factors fit together.",
    status: "Available Now",
    active: true,
    to: "/games/numberverse/divisibility-lab/factor-bench",
  },
  {
    title: "Number Detective",
    eyebrow: "DEDUCE",
    symbol: "?",
    description:
      "Use mathematical clues to identify mystery numbers and explain your reasoning.",
    status: "Coming Soon",
  },
  {
    title: "Fix It!",
    eyebrow: "DIAGNOSE",
    symbol: "!",
    description:
      "Find mathematical mistakes, diagnose what went wrong and repair the reasoning.",
    status: "Coming Soon",
  },
  {
    title: "Number Mapper",
    eyebrow: "CONNECT",
    symbol: "↔",
    description:
      "Explore relationships between numbers, sets and mathematical structures.",
    status: "Coming Soon",
  },
];

export default function Numberverse() {
  return (
    <div className="numberverse-hub-page">
      <GameHeader />

      <main>
        <section className="numberverse-hub-hero">
          <div className="numberverse-hub-hero-inner">
            <Link
              to="/games"
              className="numberverse-hub-back"
            >
              <span aria-hidden="true">←</span>
              All Games
            </Link>

            <p className="numberverse-hub-kicker">
              COUNTMEINTT PRESENTS
            </p>

            <h1>NUMBERVERSE</h1>

            <p className="numberverse-hub-tagline">
              Every Number Has an Identity
            </p>

            <p className="numberverse-hub-intro">
              Enter a universe where numbers can be built,
              classified, investigated, repaired and connected.
              Choose a lab and start exploring.
            </p>
          </div>
        </section>

        <section className="numberverse-hub-content">
          <div className="numberverse-hub-content-inner">
            <div className="numberverse-hub-section-heading">
              <p>CHOOSE YOUR LAB</p>

              <h2>
                How will you explore numbers today?
              </h2>
            </div>

            <div className="numberverse-engine-grid">
              {engines.map((engine) => {
                const content = (
                  <>
                    <div className="numberverse-engine-topline">
                      <div
                        className="numberverse-engine-symbol"
                        aria-hidden="true"
                      >
                        {engine.symbol}
                      </div>

                      <span
                        className={[
                          "numberverse-engine-status",
                          engine.active
                            ? "numberverse-engine-status-live"
                            : "",
                        ].join(" ")}
                      >
                        {engine.status}
                      </span>
                    </div>

                    <p className="numberverse-engine-eyebrow">
                      {engine.eyebrow}
                    </p>

                    <h3>{engine.title}</h3>

                    <p className="numberverse-engine-description">
                      {engine.description}
                    </p>

                    {engine.active && (
                      <div className="numberverse-engine-live-content">
                        <div>
                          <span>LIVE EXPERIENCE</span>
                          <strong>Factor Bench</strong>
                        </div>

                        <span
                          className="numberverse-engine-arrow"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </div>
                    )}
                  </>
                );

                if (engine.active) {
                  return (
                    <Link
                      key={engine.title}
                      to={engine.to}
                      className="numberverse-engine-card numberverse-engine-card-live"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <article
                    key={engine.title}
                    className="numberverse-engine-card"
                  >
                    {content}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
