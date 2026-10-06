import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
} from "react-router-dom";

import {
  NUMBERVERSE_ACCESS_CLASSES,
  GUEST_NUMBERVERSE_ACCESS,
  canAccessNumberverseClass,
  getNumberverseAccessState,
  subscribeToNumberverseAuthChanges,
} from "../../../../services/numberverseAccess";

import {
  FACTOR_BENCH_MODES,
} from "../../../evidence/factorBenchEvidenceContract";

import {
  FACTOR_BENCH_SESSION_LENGTH_TYPES,
} from "../../../sessions/factorBenchSessionContract";

import {
  FACTOR_PAIR_SUPPORT_LEVELS,
} from "./factorPairPracticeSupport";

import {
  FACTOR_SET_SUPPORT_LEVELS,
} from "./factorSetPracticeSupport";

import "./factor-session-start.css";

const MODE_OPTIONS = [
  {
    mode: FACTOR_BENCH_MODES.PAIR_PRACTICE,
    accessClass: NUMBERVERSE_ACCESS_CLASSES.INTRO,
    title: "Factor Pairs",
    description:
      "Build factor pairs for different numbers.",
    detail: "Practice • choose support and session length",
    icon: "×",
    configurableLength: true,
  },
  {
    mode: FACTOR_BENCH_MODES.FACTOR_SET_PRACTICE,
    accessClass: NUMBERVERSE_ACCESS_CLASSES.CORE,
    title: "Factor Sets",
    description:
      "Build the complete set of factors.",
    detail: "Practice • choose session length",
    icon: "{ }",
    configurableLength: true,
  },
  {
    mode: FACTOR_BENCH_MODES.FULL_PRACTICE,
    accessClass: NUMBERVERSE_ACCESS_CLASSES.CORE,
    title: "Full Practice",
    description:
      "Build pairs, organise the factor set, and decide when the structure is complete.",
    detail: "Practice • choose session length",
    icon: "●",
    configurableLength: true,
  },
  {
    mode: FACTOR_BENCH_MODES.QUICK_CHALLENGE,
    accessClass: NUMBERVERSE_ACCESS_CLASSES.CORE,
    title: "Quick Challenge",
    description:
      "Take on one complete Factor Bench challenge.",
    detail: "1 challenge",
    icon: "⚡",
    configurableLength: false,
  },
  {
    mode: FACTOR_BENCH_MODES.EVIDENCE_ROUND,
    accessClass: NUMBERVERSE_ACCESS_CLASSES.EVIDENCE,
    title: "Evidence Round",
    description:
      "Complete a structured five-challenge Factor Bench round.",
    detail: "5 challenges",
    icon: "■",
    configurableLength: false,
  },
];

const SUPPORT_OPTIONS = [
  {
    supportLevel: FACTOR_PAIR_SUPPORT_LEVELS.SUPPORTED,
    title: "Supported",
    description:
      "Some factor entries are already supplied. Complete the missing partners.",
    detail: "About 50% of entries supplied",
  },
  {
    supportLevel: FACTOR_PAIR_SUPPORT_LEVELS.GUIDED,
    title: "Guided",
    description:
      "The correct number of factor-pair rows is shown. Find every pair.",
    detail: "Row count supplied",
  },
  {
    supportLevel: FACTOR_PAIR_SUPPORT_LEVELS.INDEPENDENT,
    title: "Independent",
    description:
      "Build the pair structure yourself and add rows when you need them.",
    detail: "Learner-managed rows",
  },
];

const FACTOR_SET_SUPPORT_OPTIONS = [
  {
    supportLevel: FACTOR_SET_SUPPORT_LEVELS.SUPPORTED,
    title: "Supported",
    description:
      "Start with anchor factors and choose the remaining factors from a number bank.",
    detail: "Anchors + candidate bank",
  },
  {
    supportLevel: FACTOR_SET_SUPPORT_LEVELS.GUIDED,
    title: "Guided",
    description:
      "Choose every factor from a number bank that also contains distractors.",
    detail: "Candidate bank supplied",
  },
  {
    supportLevel: FACTOR_SET_SUPPORT_LEVELS.INDEPENDENT,
    title: "Independent",
    description:
      "Generate and manage the complete factor set yourself.",
    detail: "Learner-generated factors",
  },
];

const LENGTH_OPTIONS = [
  {
    lengthType:
      FACTOR_BENCH_SESSION_LENGTH_TYPES.QUICK,
    title: "Quick",
    description: "1 challenge",
  },
  {
    lengthType:
      FACTOR_BENCH_SESSION_LENGTH_TYPES.STANDARD,
    title: "Standard",
    description: "5 challenges",
  },
  {
    lengthType:
      FACTOR_BENCH_SESSION_LENGTH_TYPES.EXTENDED,
    title: "Extended",
    description: "10 challenges",
  },
  {
    lengthType:
      FACTOR_BENCH_SESSION_LENGTH_TYPES.CONTINUOUS,
    title: "Continuous",
    description: "Keep going",
  },
];

export default function FactorBenchSessionStart({
  onStartSession,
}) {
  const navigate = useNavigate();

  const [selectedMode, setSelectedMode] =
    useState(null);

  const [selectedSupportLevel, setSelectedSupportLevel] =
    useState(null);

  const [accessState, setAccessState] =
    useState(GUEST_NUMBERVERSE_ACCESS);

  const [accessLoading, setAccessLoading] =
    useState(true);

  const [accessPrompt, setAccessPrompt] =
    useState(null);

  const factorBenchPath =
    "/games/numberverse/divisibility-lab/factor-bench";

  useEffect(() => {
    let active = true;

    async function loadAccess() {
      setAccessLoading(true);

      try {
        const nextAccess =
          await getNumberverseAccessState();

        if (active) {
          setAccessState(nextAccess);
        }
      } catch (accessError) {
        console.error(
          "Numberverse access could not be resolved.",
          accessError
        );

        if (active) {
          setAccessState(
            GUEST_NUMBERVERSE_ACCESS
          );
        }
      } finally {
        if (active) {
          setAccessLoading(false);
        }
      }
    }

    loadAccess();

    const unsubscribe =
      subscribeToNumberverseAuthChanges(
        loadAccess
      );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const selectedModeOption =
    MODE_OPTIONS.find(
      (option) =>
        option.mode === selectedMode
    ) ?? null;

  const needsPairSupport =
    selectedMode === FACTOR_BENCH_MODES.PAIR_PRACTICE;

  const needsFactorSetSupport =
    selectedMode === FACTOR_BENCH_MODES.FACTOR_SET_PRACTICE;

  const needsSupportSelection =
    needsPairSupport || needsFactorSetSupport;

  const activeSupportOptions =
    needsPairSupport
      ? SUPPORT_OPTIONS
      : FACTOR_SET_SUPPORT_OPTIONS;

  function canUseMode(option) {
    if (accessLoading) {
      return (
        option.accessClass ===
        NUMBERVERSE_ACCESS_CLASSES.INTRO
      );
    }

    return canAccessNumberverseClass(
      accessState,
      option.accessClass
    );
  }

  function getAccessLabel(option) {
    if (canUseMode(option)) {
      return null;
    }

    if (!accessState.authenticated) {
      if (
        option.accessClass ===
        NUMBERVERSE_ACCESS_CLASSES.EVIDENCE
      ) {
        return "Full Membership";
      }

      return "Free Account";
    }

    return "Full Membership";
  }

  function handleCreateFreeAccount() {
    navigate("/register", {
      state: {
        from: {
          pathname: factorBenchPath,
        },
      },
    });
  }

  function handleSignIn() {
    navigate("/login", {
      state: {
        from: {
          pathname: factorBenchPath,
        },
      },
    });
  }

  function handleExploreMembership() {
    navigate("/membership");
  }

  function handleModeSelect(option) {
    if (!canUseMode(option)) {
      setAccessPrompt({
        option,
        authenticated:
          accessState.authenticated,
      });
      return;
    }

    setAccessPrompt(null);

    if (!option.configurableLength) {
      onStartSession({
        mode: option.mode,
      });
      return;
    }

    setSelectedMode(option.mode);
    setSelectedSupportLevel(null);
  }

  function handleSupportSelect(supportLevel) {
    setSelectedSupportLevel(supportLevel);
  }

  function handleLengthSelect(lengthType) {
    if (!selectedMode) {
      return;
    }

    onStartSession({
      mode: selectedMode,
      lengthType,
      supportLevel:
        needsSupportSelection
          ? selectedSupportLevel
          : undefined,
    });
  }

  function handleBackFromLength() {
    if (needsSupportSelection) {
      setSelectedSupportLevel(null);
      return;
    }

    setSelectedMode(null);
  }

  if (
    needsSupportSelection &&
    !selectedSupportLevel
  ) {
    return (
      <main className="numberverse-page">
        <div className="numberverse-overlay">
          <section className="numberverse-hero">
            <div>
              <p className="numberverse-eyebrow">
                NUMBERVERSE
              </p>

              <p className="numberverse-lab-label">
                Divisibility Lab
              </p>

              <h1>
                {needsPairSupport
                  ? "Factor Pairs"
                  : "Factor Sets"}
              </h1>

              <p className="numberverse-hero-copy">
                {needsPairSupport
                  ? "Choose how much structure you want while practising factor pairs."
                  : "Choose how much support you want while building complete factor sets."}
              </p>
            </div>
          </section>

          <section className="factor-bench-workspace factor-session-start">
            <header className="factor-bench-header">
              <div>
                <p className="factor-bench-engine">
                  Factor Bench
                </p>

                <h2>Choose your support</h2>

                <p>
                  {needsPairSupport
                    ? "The mathematics stays focused on factor pairs. What changes is how much of the pair structure is provided."
                    : "The mathematics stays focused on factor sets. What changes is how the possible factors are presented."}
                </p>
              </div>
            </header>

            <div className="factor-session-mode-grid">
              {activeSupportOptions.map((option) => (
                <button
                  key={option.supportLevel}
                  type="button"
                  className="factor-session-mode-card"
                  onClick={() =>
                    handleSupportSelect(
                      option.supportLevel
                    )
                  }
                >
                  <span className="factor-session-mode-copy">
                    <strong>
                      {option.title}
                    </strong>

                    <span>
                      {option.description}
                    </span>

                    <small>
                      {option.detail}
                    </small>
                  </span>
                </button>
              ))}
            </div>

            <footer className="factor-bench-actions">
              <button
                type="button"
                className="factor-clear-button"
                onClick={() =>
                  setSelectedMode(null)
                }
              >
                ← Back to Modes
              </button>
            </footer>
          </section>
        </div>
      </main>
    );
  }

  if (
    selectedModeOption?.configurableLength &&
    (!needsSupportSelection || selectedSupportLevel)
  ) {
    return (
      <main className="numberverse-page">
        <div className="numberverse-overlay">
          <section className="numberverse-hero">
            <div>
              <p className="numberverse-eyebrow">
                NUMBERVERSE
              </p>

              <p className="numberverse-lab-label">
                Divisibility Lab
              </p>

              <h1>
                {selectedModeOption.title}
              </h1>

              <p className="numberverse-hero-copy">
                Choose how long you want to
                practise.
              </p>
            </div>
          </section>

          <section className="factor-bench-workspace factor-session-start">
            <header className="factor-bench-header">
              <div>
                <p className="factor-bench-engine">
                  Factor Bench
                </p>

                <h2>How long?</h2>

                <p>
                  You can choose a short practice,
                  a standard set, an extended
                  session, or keep going
                  continuously.
                </p>
              </div>
            </header>

            <div className="factor-session-length-grid">
              {LENGTH_OPTIONS.map(
                (option) => (
                  <button
                    key={option.lengthType}
                    type="button"
                    className="factor-session-length-card"
                    onClick={() =>
                      handleLengthSelect(
                        option.lengthType
                      )
                    }
                  >
                    <strong>
                      {option.title}
                    </strong>

                    <span>
                      {option.description}
                    </span>
                  </button>
                )
              )}
            </div>

            <footer className="factor-bench-actions">
              <button
                type="button"
                className="factor-clear-button"
                onClick={handleBackFromLength}
              >
                ← Back
              </button>
            </footer>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="numberverse-page">
      <div className="numberverse-overlay">
        <section className="numberverse-hero">
          <div>
            <p className="numberverse-eyebrow">
              NUMBERVERSE
            </p>

            <p className="numberverse-lab-label">
              Divisibility Lab
            </p>

            <h1>Factor Bench</h1>

            <p className="numberverse-hero-copy">
              Break numbers apart. Find their pairs.
              Reveal their structure.
            </p>
          </div>
        </section>

        <section className="factor-bench-workspace factor-session-start">
          <header className="factor-bench-header">
            <div>
              <p className="factor-bench-engine">
                Choose a Mode
              </p>

              <h2>
                What do you want to work on?
              </h2>

              <p>
                Practise one part of factor
                structure, take a quick challenge,
                or complete a full Evidence Round.
              </p>
            </div>
          </header>

          <div className="factor-session-mode-grid">
            {MODE_OPTIONS.map((option) => {
              const accessible =
                canUseMode(option);

              const accessLabel =
                getAccessLabel(option);

              return (
                <button
                  key={option.mode}
                  type="button"
                  className={`factor-session-mode-card${
                    accessible
                      ? ""
                      : " factor-session-mode-card-locked"
                  }`}
                  aria-disabled={!accessible}
                  onClick={() =>
                    handleModeSelect(option)
                  }
                >
                  <span className="factor-session-mode-icon">
                    {option.icon}
                  </span>

                  <span className="factor-session-mode-copy">
                    <strong>
                      {option.title}
                    </strong>

                    <span>
                      {option.description}
                    </span>

                    <small>
                      {option.detail}
                    </small>

                    {accessLabel && (
                      <span className="factor-session-access-label">
                        <span aria-hidden="true">
                          🔒
                        </span>
                        {accessLabel}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {accessPrompt && (
            <div
              className="factor-session-access-prompt"
              role="status"
              aria-live="polite"
            >
              <div className="factor-session-access-prompt-icon">
                <span aria-hidden="true">
                  🔒
                </span>
              </div>

              <div className="factor-session-access-prompt-copy">
                <strong>
                  {accessPrompt.authenticated
                    ? "Go further with Numberverse"
                    : "Keep exploring Numberverse"}
                </strong>

                <p>
                  {accessPrompt.authenticated
                    ? "Full membership unlocks Evidence Rounds and the complete Numberverse learning experience."
                    : accessPrompt.option.accessClass ===
                        NUMBERVERSE_ACCESS_CLASSES.EVIDENCE
                      ? "Evidence Rounds are part of the full Numberverse experience. Start with a free Count Me In TT account to keep exploring Numberverse."
                      : "Create your free Count Me In TT account to unlock Factor Sets, Full Practice and Quick Challenge."}
                </p>

                <div className="factor-session-access-actions">
                  {accessPrompt.authenticated ? (
                    <button
                      type="button"
                      className="factor-session-access-primary"
                      onClick={
                        handleExploreMembership
                      }
                    >
                      Explore Membership
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="factor-session-access-primary"
                        onClick={
                          handleCreateFreeAccount
                        }
                      >
                        Create Free Account
                      </button>

                      <button
                        type="button"
                        className="factor-session-access-secondary"
                        onClick={handleSignIn}
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="factor-session-access-dismiss"
                aria-label="Close access message"
                onClick={() =>
                  setAccessPrompt(null)
                }
              >
                ×
              </button>
            </div>
          )}
        </section>

        <section className="numberverse-footer-card">
          <span>🌐</span>

          <div>
            <strong>
              Every number has a structure.
            </strong>

            <p>
              Choose a way to explore it.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
