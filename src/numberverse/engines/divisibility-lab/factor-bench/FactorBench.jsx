import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  startChallenge,
  submitResponse,
} from "../../../api/numberverseClient";

import {
  NUMBERVERSE_INDEPENDENCE_STATES,
  NUMBERVERSE_TEMPLATES,
} from "../../../contracts/numberverseContract";

import {
  FACTOR_BENCH_MODES,
} from "../../../evidence/factorBenchEvidenceContract";

import {
  generateFactorBenchTarget,
} from "../../../generators/factorBenchTargetGenerator";

import {
  createFactorBenchRound,
  getCurrentFactorBenchChallenge,
  markFactorBenchChallengeStarted,
  completeFactorBenchChallenge,
  getFactorBenchRoundSummary,
  FACTOR_BENCH_ROUND_STATUSES,
} from "../../../rounds/factorBenchRoundController";

import {
  createFactorBenchSessionContract,
} from "../../../sessions/factorBenchSessionContract";

import FactorSetBuilder from "./FactorSetBuilder";
import FactorPairBuilder from "./FactorPairBuilder";
import FactorBenchFeedback from "./FactorBenchFeedback";
import CompletionClaim from "./CompletionClaim";
import FactorBenchSessionStart from "./FactorBenchSessionStart";
import FactorSetPracticeBuilder from "./FactorSetPracticeBuilder";

import {
  createFactorSetPracticeWorkspace,
  FACTOR_SET_SUPPORT_LEVELS,
} from "./factorSetPracticeSupport";

import {
  createPairPracticeWorkspace,
  FACTOR_PAIR_SUPPORT_LEVELS,
} from "./factorPairPracticeSupport";

import "./FactorBench.css";

const DEFAULT_PAIRS = [
  ["", ""],
  ["", ""],
];

const FULL_TASK_REQUIREMENTS = {
  factorPairs: true,
  factorSet: true,
  completenessJudgment: true,
};

const PAIR_TASK_REQUIREMENTS = {
  factorPairs: true,
  factorSet: false,
  completenessJudgment: false,
};

const FACTOR_SET_TASK_REQUIREMENTS = {
  factorPairs: false,
  factorSet: true,
  completenessJudgment: false,
};

export default function FactorBench() {
  const recentTargetsRef = useRef([]);

  const [session, setSession] = useState(null);
  const [pairSupportLevel, setPairSupportLevel] =
    useState(null);
  const [factorSetSupportLevel, setFactorSetSupportLevel] =
    useState(null);
  const [factorSetCandidateBank, setFactorSetCandidateBank] =
    useState([]);
  const [lockedFactors, setLockedFactors] = useState([]);
  const [factorSetUsesCandidateBank, setFactorSetUsesCandidateBank] =
    useState(false);

  const [round, setRound] = useState(null);
  const [challenge, setChallenge] = useState(null);

  const [practiceChallengeNumber, setPracticeChallengeNumber] =
    useState(1);
  const [practiceResults, setPracticeResults] = useState([]);
  const [practiceComplete, setPracticeComplete] = useState(false);

  const [factors, setFactors] = useState([]);
  const [pairs, setPairs] = useState(DEFAULT_PAIRS);
  const [lockedPairCells, setLockedPairCells] =
    useState([]);
  const [allowPairRowManagement, setAllowPairRowManagement] =
    useState(true);
  const [completionClaim, setCompletionClaim] = useState(null);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isEvidenceRound =
    session?.mode === FACTOR_BENCH_MODES.EVIDENCE_ROUND;

  const isQuickChallenge =
    session?.mode === FACTOR_BENCH_MODES.QUICK_CHALLENGE;

  const isFullPractice =
    session?.mode === FACTOR_BENCH_MODES.FULL_PRACTICE;

  const isPairPractice =
    session?.mode === FACTOR_BENCH_MODES.PAIR_PRACTICE;

  const isFactorSetPractice =
    session?.mode === FACTOR_BENCH_MODES.FACTOR_SET_PRACTICE;

  const isPracticeMode =
    isFullPractice || isPairPractice || isFactorSetPractice;

  const isContinuousPractice =
    isPracticeMode &&
    session?.sessionPolicy.continuous === true;

  function scrollToChallengeTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetChallengeWorkspace() {
    setFactors([]);
    setPairs(DEFAULT_PAIRS);
    setLockedPairCells([]);
    setAllowPairRowManagement(true);
    setFactorSetCandidateBank([]);
    setLockedFactors([]);
    setFactorSetUsesCandidateBank(false);
    setCompletionClaim(null);
    setResult(null);
    setError("");
  }

  function configurePairPracticeWorkspace(
    target,
    supportLevel = pairSupportLevel
  ) {
    const workspace =
      createPairPracticeWorkspace({
        target,
        supportLevel:
          supportLevel ||
          FACTOR_PAIR_SUPPORT_LEVELS.INDEPENDENT,
      });

    setPairs(workspace.pairs);
    setLockedPairCells(workspace.lockedCells);
    setAllowPairRowManagement(
      workspace.allowRowManagement
    );
  }

  function configureFactorSetPracticeWorkspace(
    target,
    supportLevel = factorSetSupportLevel
  ) {
    const workspace =
      createFactorSetPracticeWorkspace({
        target,
        supportLevel:
          supportLevel ||
          FACTOR_SET_SUPPORT_LEVELS.INDEPENDENT,
      });

    setFactors(workspace.selectedFactors);
    setLockedFactors(workspace.lockedFactors);
    setFactorSetCandidateBank(workspace.candidateBank);
    setFactorSetUsesCandidateBank(
      workspace.usesCandidateBank
    );
  }

  async function startTargetChallenge(
    target,
    {
      taskRequirements = FULL_TASK_REQUIREMENTS,
      supportLevel = pairSupportLevel,
    } = {}
  ) {
    setLoading(true);
    resetChallengeWorkspace();

    try {
      const data = await startChallenge({
        templateCode: NUMBERVERSE_TEMPLATES.FACTOR_COMPLETE_PAIR,
        learningNodeId: "LN-00133",
        levelId: "STD5",
        target,
        taskRequirements,
      });

      setChallenge(data);

      if (
        taskRequirements.factorPairs &&
        !taskRequirements.factorSet &&
        !taskRequirements.completenessJudgment
      ) {
        configurePairPracticeWorkspace(
          data.target,
          supportLevel
        );
      }

      if (
        !taskRequirements.factorPairs &&
        taskRequirements.factorSet &&
        !taskRequirements.completenessJudgment
      ) {
        configureFactorSetPracticeWorkspace(
          data.target,
          supportLevel
        );
      }

      requestAnimationFrame(() => {
        scrollToChallengeTop();
      });

      return data;
    } catch (launchError) {
      setError(
        launchError.message ||
          "The challenge could not be started."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function launchRoundChallenge(roundState) {
    const roundChallenge =
      getCurrentFactorBenchChallenge(roundState);

    if (!roundChallenge) {
      return;
    }

    const data =
      await startTargetChallenge(roundChallenge.target);

    if (!data) {
      return;
    }

    const updatedRound = {
      ...roundState,
      challenges: roundState.challenges.map(
        (item) => ({ ...item })
      ),
    };

    markFactorBenchChallengeStarted(
      updatedRound,
      {
        challengeEpisodeId: data.challengeEpisodeId,
        challengeInstanceId: data.challengeInstanceId,
      }
    );

    setRound(updatedRound);
  }

  async function launchRound(activeSession = session) {
    if (!activeSession) {
      return;
    }

    setLoading(true);
    setError("");

    const newRound = createFactorBenchRound({
      recentTargets: recentTargetsRef.current,
    });

    const generatedTargets =
      newRound.challenges.map((item) => item.target);

    recentTargetsRef.current = [
      ...recentTargetsRef.current,
      ...generatedTargets,
    ].slice(-10);

    console.table(
      newRound.challenges.map((item) => ({
        challenge: item.position,
        target: item.target,
        difficulty: item.difficulty,
        square: item.isPerfectSquare,
      }))
    );

    console.log(
      "Factor Bench session:",
      activeSession
    );

    setRound(newRound);
    await launchRoundChallenge(newRound);
  }

  function generatePracticeTarget() {
    const generated = generateFactorBenchTarget({
      difficulty: "DEVELOPING",
      recentTargets: recentTargetsRef.current,
    });

    recentTargetsRef.current = [
      ...recentTargetsRef.current,
      generated.target,
    ].slice(-10);

    return generated;
  }

  async function launchFullPracticeChallenge() {
    setRound(null);
    setLoading(true);
    setError("");

    const generated = generatePracticeTarget();

    await startTargetChallenge(generated.target);
  }

  async function launchPairPracticeChallenge(
    supportLevel = pairSupportLevel
  ) {
    setRound(null);
    setLoading(true);
    setError("");

    const generated = generatePracticeTarget();

    await startTargetChallenge(
      generated.target,
      {
        taskRequirements: PAIR_TASK_REQUIREMENTS,
        supportLevel,
      }
    );
  }

  async function launchFactorSetPracticeChallenge(
    supportLevel = factorSetSupportLevel
  ) {
    setRound(null);
    setLoading(true);
    setError("");

    const generated = generatePracticeTarget();

    await startTargetChallenge(
      generated.target,
      {
        taskRequirements:
          FACTOR_SET_TASK_REQUIREMENTS,
        supportLevel,
      }
    );
  }

  async function launchQuickChallenge(
    activeSession = session
  ) {
    if (!activeSession) {
      return;
    }

    setRound(null);
    setLoading(true);
    setError("");

    const generated = generateFactorBenchTarget({
      difficulty: "DEVELOPING",
      recentTargets: recentTargetsRef.current,
    });

    recentTargetsRef.current = [
      ...recentTargetsRef.current,
      generated.target,
    ].slice(-10);

    await startTargetChallenge(generated.target);
  }

  useEffect(() => {
    if (!session) {
      setLoading(false);
    }
  }, [session]);

  async function handleStartSession({
    mode,
    lengthType,
    supportLevel,
  }) {
    const nextSession =
      createFactorBenchSessionContract({
        mode,
        lengthType,
      });

    setSession(nextSession);

    if (
      mode === FACTOR_BENCH_MODES.PAIR_PRACTICE
    ) {
      const resolvedSupportLevel =
        supportLevel ||
        FACTOR_PAIR_SUPPORT_LEVELS.INDEPENDENT;

      setPairSupportLevel(resolvedSupportLevel);
      setPracticeChallengeNumber(1);
      setPracticeResults([]);
      setPracticeComplete(false);

      await launchPairPracticeChallenge(
        resolvedSupportLevel
      );
      return;
    }

    if (
      mode === FACTOR_BENCH_MODES.FACTOR_SET_PRACTICE
    ) {
      const resolvedSupportLevel =
        supportLevel ||
        FACTOR_SET_SUPPORT_LEVELS.INDEPENDENT;

      setPairSupportLevel(null);
      setFactorSetSupportLevel(
        resolvedSupportLevel
      );
      setPracticeChallengeNumber(1);
      setPracticeResults([]);
      setPracticeComplete(false);

      await launchFactorSetPracticeChallenge(
        resolvedSupportLevel
      );
      return;
    }

    setPairSupportLevel(null);
    setFactorSetSupportLevel(null);

    if (
      mode === FACTOR_BENCH_MODES.QUICK_CHALLENGE
    ) {
      await launchQuickChallenge(nextSession);
      return;
    }

    if (
      mode === FACTOR_BENCH_MODES.FULL_PRACTICE
    ) {
      setPracticeChallengeNumber(1);
      setPracticeResults([]);
      setPracticeComplete(false);
      await launchFullPracticeChallenge();
      return;
    }

    await launchRound(nextSession);
  }

  const roundComplete =
    isEvidenceRound &&
    round?.status ===
      FACTOR_BENCH_ROUND_STATUSES.COMPLETE;

  const isTerminal = Boolean(result?.terminal);

  const currentRoundPosition =
    round != null
      ? round.currentChallengeIndex + 1
      : 1;

  const sessionChallengeCount =
    session?.sessionPolicy.challengeCount ?? 0;

  const maxMeaningfulAttempts =
    session?.completionPolicy
      .maxMeaningfulAttemptsPerChallenge ?? 3;

  const currentAttempt =
    result?.attemptNumber != null
      ? Math.min(
          result.attemptNumber +
            (result.terminal ? 0 : 1),
          challenge?.maxMeaningfulAttempts ||
            maxMeaningfulAttempts
        )
      : 1;

  function preparePairsForSubmission() {
    return pairs
      .filter(
        ([left, right]) =>
          String(left).trim() !== "" &&
          String(right).trim() !== ""
      )
      .map(([left, right]) => [
        Number(left),
        Number(right),
      ])
      .filter(
        ([left, right]) =>
          Number.isFinite(left) &&
          Number.isFinite(right)
      );
  }

  async function handleSubmit() {
    if (
      !challenge ||
      isTerminal ||
      submitting ||
      (!isPairPractice &&
        !isFactorSetPractice &&
        completionClaim === null)
    ) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const independenceState =
        (isPairPractice &&
          pairSupportLevel !==
            FACTOR_PAIR_SUPPORT_LEVELS.INDEPENDENT) ||
        (isFactorSetPractice &&
          factorSetSupportLevel !==
            FACTOR_SET_SUPPORT_LEVELS.INDEPENDENT)
          ? NUMBERVERSE_INDEPENDENCE_STATES.SCAFFOLDED
          : NUMBERVERSE_INDEPENDENCE_STATES.INDEPENDENT;

      const response = isPairPractice
        ? {
            factorPairs:
              preparePairsForSubmission(),
          }
        : isFactorSetPractice
          ? {
              factorSet: factors,
            }
          : {
              factorSet: factors,
              factorPairs:
                preparePairsForSubmission(),
              completionClaim,
            };

      const data = await submitResponse({
        challengeEpisodeId:
          challenge.challengeEpisodeId,
        independenceState,
        response,
      });

      setResult(data);

      if (
        data.terminal &&
        isEvidenceRound &&
        round
      ) {
        const updatedRound = {
          ...round,
          challenges: round.challenges.map(
            (item) => ({ ...item })
          ),
        };

        completeFactorBenchChallenge(
          updatedRound,
          data
        );

        setRound(updatedRound);
      }

      if (data.terminal && isPracticeMode) {
        setPracticeResults((current) => [
          ...current,
          {
            challengeNumber: practiceChallengeNumber,
            target: challenge.target,
            completionStatus: data.completionStatus,
            attemptNumber: data.attemptNumber,
          },
        ]);
      }
    } catch (submitError) {
      setError(
        submitError.message ||
          "Your work could not be checked."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNextChallenge() {
    if (
      !isEvidenceRound ||
      !round ||
      !isTerminal
    ) {
      return;
    }

    await launchRoundChallenge(round);
  }

  async function handleTryAnotherQuickChallenge() {
    if (!isQuickChallenge || !isTerminal) {
      return;
    }

    await launchQuickChallenge(session);
  }

  async function handleNextPracticeChallenge() {
    if (!isPracticeMode || !isTerminal) {
      return;
    }

    const challengeCount =
      session?.sessionPolicy.challengeCount;

    if (
      !isContinuousPractice &&
      challengeCount != null &&
      practiceChallengeNumber >= challengeCount
    ) {
      setPracticeComplete(true);
      scrollToChallengeTop();
      return;
    }

    setPracticeChallengeNumber(
      (current) => current + 1
    );

    if (isPairPractice) {
      await launchPairPracticeChallenge();
      return;
    }

    if (isFactorSetPractice) {
      await launchFactorSetPracticeChallenge();
      return;
    }

    await launchFullPracticeChallenge();
  }

  function handleEndPractice() {
    if (!isPracticeMode) {
      return;
    }

    setPracticeComplete(true);
    scrollToChallengeTop();
  }

  async function handleStartAnotherPractice() {
    setPracticeChallengeNumber(1);
    setPracticeResults([]);
    setPracticeComplete(false);

    if (isPairPractice) {
      await launchPairPracticeChallenge();
      return;
    }

    if (isFactorSetPractice) {
      await launchFactorSetPracticeChallenge();
      return;
    }

    await launchFullPracticeChallenge();
  }

  function handleChangeMode() {
    setSession(null);
    setPairSupportLevel(null);
    setFactorSetSupportLevel(null);
    setRound(null);
    setChallenge(null);
    setPracticeChallengeNumber(1);
    setPracticeResults([]);
    setPracticeComplete(false);
    resetChallengeWorkspace();
    setLoading(false);
    scrollToChallengeTop();
  }

  function clearWork() {
    setFactors([]);
    setCompletionClaim(null);
    setResult(null);
    setError("");

    if (isPairPractice && challenge) {
      configurePairPracticeWorkspace(
        challenge.target
      );
      return;
    }

    if (isFactorSetPractice && challenge) {
      configureFactorSetPracticeWorkspace(
        challenge.target
      );
      return;
    }

    setPairs(DEFAULT_PAIRS);
  }

  if (!session) {
    return (
      <FactorBenchSessionStart
        onStartSession={handleStartSession}
      />
    );
  }

  if (loading) {
    return (
      <main className="numberverse-page">
        <div className="factor-bench-loading">
          Entering the Numberverse...
        </div>
      </main>
    );
  }

  if (roundComplete) {
    const summary =
      getFactorBenchRoundSummary(round);

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
              <h1>Round Complete</h1>
              <p className="numberverse-hero-copy">
                You completed all five Factor Bench
                challenges.
              </p>
            </div>
          </section>

          <section className="factor-bench-workspace factor-evidence-result-workspace">
            <header className="factor-bench-header">
              <div>
                <p className="factor-bench-engine">
                  🔬 Divisibility Lab
                </p>
                <p className="factor-evidence-kicker">
                  Structured Evidence • 5 Challenges
                </p>
                <h2>Evidence Round Complete</h2>
                <p>
                  Five challenges completed. Your work has
                  been preserved as evidence.
                </p>
              </div>
            </header>

            <div className="factor-bench-round-results factor-evidence-result-grid">
              {summary?.challenges.map((item) => {
                const challengeComplete =
                  item.terminalResult?.completionStatus ===
                  "COMPLETE_SUCCESS";

                return (
                  <div
                    key={item.position}
                    className={`factor-status-card factor-evidence-result-card${
                      challengeComplete
                        ? " factor-evidence-result-success"
                        : ""
                    }`}
                  >
                    <span>Challenge {item.position}</span>
                    <strong>{item.target}</strong>
                    <small>
                      {challengeComplete
                        ? "Complete ✓"
                        : "Completed"}
                    </small>
                  </div>
                );
              })}
            </div>

            <footer className="factor-bench-actions">
              <button
                type="button"
                className="factor-clear-button"
                onClick={handleChangeMode}
              >
                Change Mode
              </button>
              <button
                type="button"
                className="factor-new-button"
                onClick={() => launchRound(session)}
              >
                Start New Round
              </button>
            </footer>
          </section>
        </div>
      </main>
    );
  }

  if (isPracticeMode && practiceComplete) {
    const completedCount = practiceResults.length;
    const successfulCount = practiceResults.filter(
      (item) =>
        item.completionStatus === "COMPLETE_SUCCESS"
    ).length;

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
              <h1>Practice Complete</h1>
              <p className="numberverse-hero-copy">
                You completed {completedCount}{" "}
                {isPairPractice
                  ? "Factor Pair"
                  : isFactorSetPractice
                    ? "Factor Set"
                    : "Factor Bench"}{" "}
                {completedCount === 1
                  ? "challenge"
                  : "challenges"}.
              </p>
            </div>
          </section>

          <section className="factor-bench-workspace">
            <header className="factor-bench-header">
              <div>
                <p className="factor-bench-engine">
                  🔬 Divisibility Lab
                </p>
                <h2>
                  {isPairPractice
                    ? "Factor Pairs Practice"
                    : isFactorSetPractice
                      ? "Factor Sets Practice"
                      : "Full Practice"}
                </h2>
                <p>
                  Your practice results have been
                  preserved for this session.
                </p>
              </div>
            </header>

            <div className="factor-bench-round-results">
              <div className="factor-status-card">
                <span>Completed</span>
                <strong>{completedCount}</strong>
              </div>
              <div className="factor-status-card">
                <span>
                  {isPairPractice
                    ? "Complete Pair Structures"
                    : "Complete Structures"}
                </span>
                <strong>{successfulCount}</strong>
              </div>
            </div>

            <footer className="factor-bench-actions">
              <button
                type="button"
                className="factor-clear-button"
                onClick={handleChangeMode}
              >
                Change Mode
              </button>
              <button
                type="button"
                className="factor-new-button"
                onClick={handleStartAnotherPractice}
              >
                Practice Again
              </button>
            </footer>
          </section>
        </div>
      </main>
    );
  }

  if (isQuickChallenge && isTerminal) {
    const quickSuccess =
      result?.completionStatus ===
      "COMPLETE_SUCCESS";

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
              <h1>Quick Challenge Complete</h1>
              <p className="numberverse-hero-copy">
                {quickSuccess
                  ? "Factor structure complete. Nice work."
                  : "Challenge complete. Review the structure and try another when you're ready."}
              </p>
            </div>

            <div className="numberverse-target-orbit">
              <span className="numberverse-target-label">
                TARGET
              </span>
              <strong>{challenge?.target}</strong>
            </div>
          </section>

          <section className="factor-bench-workspace factor-quick-result-workspace">
            <header className="factor-bench-header">
              <div>
                <p className="factor-bench-engine">
                  🔬 Divisibility Lab
                </p>
                <h2>Quick Challenge</h2>
                <p>
                  Your result for this target has been
                  preserved.
                </p>
              </div>
            </header>

            <div className="factor-bench-round-results factor-quick-result-summary">
              <div className="factor-status-card factor-quick-result-target">
                <span>Target</span>
                <strong>{challenge?.target}</strong>
              </div>
              <div className="factor-status-card">
                <span>Attempts</span>
                <strong>
                  {result?.attemptNumber ?? currentAttempt}
                </strong>
              </div>
              <div
                className={`factor-status-card factor-quick-result-status${
                  quickSuccess ? " factor-quick-result-success" : ""
                }`}
              >
                <span>Result</span>
                <strong>
                  {quickSuccess
                    ? "Complete ✓"
                    : "Review"}
                </strong>
              </div>
            </div>

            <footer className="factor-bench-actions">
              <button
                type="button"
                className="factor-clear-button"
                onClick={handleChangeMode}
              >
                Change Mode
              </button>
              <button
                type="button"
                className="factor-new-button"
                onClick={
                  handleTryAnotherQuickChallenge
                }
              >
                Try Another
              </button>
            </footer>
          </section>
        </div>
      </main>
    );
  }

  const supportLabel =
    pairSupportLevel ===
    FACTOR_PAIR_SUPPORT_LEVELS.SUPPORTED
      ? "Supported"
      : pairSupportLevel ===
          FACTOR_PAIR_SUPPORT_LEVELS.GUIDED
        ? "Guided"
        : "Independent";

  const factorSetSupportLabel =
    factorSetSupportLevel === FACTOR_SET_SUPPORT_LEVELS.SUPPORTED
      ? "Supported"
      : factorSetSupportLevel === FACTOR_SET_SUPPORT_LEVELS.GUIDED
        ? "Guided"
        : "Independent";

  const pairSubmissionReady =
    preparePairsForSubmission().length > 0;

  return (
    <main className="numberverse-page">
      <div className="numberverse-overlay">
        <section className="numberverse-hero">
          <div>
            <p className="numberverse-eyebrow">
              NUMBERVERSE
            </p>

            <button
              type="button"
              className="numberverse-back-button"
              onClick={handleChangeMode}
            >
              <span aria-hidden="true">←</span>
              Factor Bench
            </button>

            <p className="numberverse-lab-label">
              Divisibility Lab
            </p>
            <h1>Factor Bench</h1>
            <p className="numberverse-hero-copy">
              {isPairPractice
                ? "Build the factor pairs. Discover how the number is structured."
                : isFactorSetPractice
                  ? "Build the complete factor set. Decide which numbers belong."
                  : "Build the pairs. Build the factor set. Discover the structure."}
            </p>
          </div>

          {challenge && (
            <div className="numberverse-target-orbit">
              <span className="numberverse-target-label">
                TARGET
              </span>
              <strong>{challenge.target}</strong>
            </div>
          )}
        </section>

        <section
          className={`factor-bench-workspace${
            isPairPractice ? " factor-pair-mode-workspace" : ""
          }${
            isFullPractice ? " factor-full-practice-workspace" : ""
          }${
            isQuickChallenge ? " factor-quick-challenge-workspace" : ""
          }${
            isEvidenceRound ? " factor-evidence-round-workspace" : ""
          }${
            result?.terminal &&
            result.completionStatus === "COMPLETE_SUCCESS"
              ? " factor-bench-success-state"
              : ""
          }`}
        >
          <header className="factor-bench-header">
            <div>
              <p className="factor-bench-engine">
                🔬 Divisibility Lab
              </p>

              {isEvidenceRound && (
                <p className="factor-evidence-kicker">
                  Structured Evidence • 5 Challenges
                </p>
              )}

              <h2>
                {isQuickChallenge
                  ? "Quick Challenge"
                  : isEvidenceRound
                    ? "Evidence Round"
                  : isPairPractice
                    ? `Factor Pairs • ${supportLabel}`
                    : isFactorSetPractice
                      ? `Factor Sets - ${factorSetSupportLabel}`
                    : isFullPractice
                      ? "Full Practice"
                      : "Factor Bench"}
              </h2>

              <p>{challenge?.prompt}</p>
            </div>

            <div className="factor-bench-status-grid">
              <div className="factor-status-card">
                <span>
                  {isQuickChallenge
                    ? "Mode"
                    : isPracticeMode
                      ? "Practice"
                      : "Challenge"}
                </span>

                <strong>
                  {isQuickChallenge
                    ? "Quick"
                    : isPracticeMode
                      ? isContinuousPractice
                        ? `${practiceChallengeNumber}`
                        : `${practiceChallengeNumber} of ${sessionChallengeCount}`
                      : `${currentRoundPosition} of ${sessionChallengeCount}`}
                </strong>
              </div>

              <div className="factor-status-card factor-status-target">
                <span>Target Number</span>
                <strong>{challenge?.target}</strong>
              </div>

              <div className="factor-status-card">
                <span>Attempt</span>
                <strong>
                  {currentAttempt} of{" "}
                  {challenge?.maxMeaningfulAttempts ||
                    maxMeaningfulAttempts}
                </strong>

                <div
                  className="factor-attempt-bar"
                  aria-hidden="true"
                >
                  {Array.from({
                    length:
                      challenge
                        ?.maxMeaningfulAttempts ||
                      maxMeaningfulAttempts,
                  }).map((_, index) => (
                    <span
                      key={index}
                      className={
                        index < currentAttempt
                          ? "factor-attempt-active"
                          : ""
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </header>

          {isEvidenceRound && (
            <div
              className="factor-evidence-progress"
              aria-label={`Evidence Round challenge ${currentRoundPosition} of ${sessionChallengeCount}`}
            >
              <div className="factor-evidence-progress-heading">
                <span>Round Progress</span>
                <strong>Challenge {currentRoundPosition} of {sessionChallengeCount}</strong>
              </div>

              <div className="factor-evidence-progress-track">
                {Array.from({ length: sessionChallengeCount }).map((_, index) => {
                  const position = index + 1;
                  const isComplete = position < currentRoundPosition;
                  const isCurrent = position === currentRoundPosition;

                  return (
                    <div
                      key={position}
                      className={`factor-evidence-progress-step${
                        isComplete ? " is-complete" : ""
                      }${isCurrent ? " is-current" : ""}`}
                    >
                      <span>{isComplete ? "✓" : position}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="factor-bench-reminder">
            <span className="factor-reminder-icon">
              💡
            </span>

            <div>
              <strong>Remember</strong>
              <p>
                Factor pairs multiply together to make{" "}
                <strong>{challenge?.target}</strong>.
                {!isPairPractice && (
                  <>
                    {" "}A factor divides the target exactly.
                  </>
                )}
              </p>
            </div>
          </div>

          {result?.terminal &&
          result.completionStatus === "COMPLETE_SUCCESS" ? (
            <div
              className="factor-bench-success-banner"
              role="status"
              aria-live="polite"
            >
              <span
                className="factor-success-icon"
                aria-hidden="true"
              >
                ✓
              </span>

              <div>
                <strong>Structure discovered!</strong>
                <p>
                  You found the complete factor structure
                  for <strong>{challenge?.target}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <FactorBenchFeedback
              result={result}
              error={error}
            />
          )}

          {isPairPractice ? (
            <div className="factor-pair-practice-workspace">
              <FactorPairBuilder
                target={challenge?.target}
                pairs={pairs}
                onChange={setPairs}
                disabled={
                  isTerminal || submitting
                }
                allowRowManagement={
                  allowPairRowManagement
                }
                lockedCells={lockedPairCells}
                standalone
              />
            </div>
          ) : isFactorSetPractice ? (
            <FactorSetPracticeBuilder
              target={challenge?.target}
              selectedFactors={factors}
              onChange={setFactors}
              candidateBank={factorSetCandidateBank}
              lockedFactors={lockedFactors}
              usesCandidateBank={
                factorSetUsesCandidateBank
              }
              disabled={
                isTerminal || submitting
              }
            />
          ) : (
            <>
              <div className="factor-bench-grid">
                <FactorPairBuilder
                  target={challenge?.target}
                  pairs={pairs}
                  onChange={setPairs}
                  disabled={
                    isTerminal || submitting
                  }
                />

                <FactorSetBuilder
                  pairs={pairs}
                  onChange={setFactors}
                  disabled={
                    isTerminal || submitting
                  }
                  resetKey={
                    challenge?.challengeEpisodeId
                  }
                />
              </div>

              <CompletionClaim
                value={completionClaim}
                onChange={setCompletionClaim}
                disabled={
                  isTerminal || submitting
                }
                isConfirmedCorrect={
                  isFullPractice &&
                  result?.terminal &&
                  result.completionStatus ===
                    "COMPLETE_SUCCESS"
                }
              />
            </>
          )}

          <footer className="factor-bench-actions">
            <button
              type="button"
              className="factor-clear-button"
              disabled={
                isTerminal || submitting
              }
              onClick={clearWork}
            >
              Clear My Work
            </button>

            {isPracticeMode &&
              isContinuousPractice && (
                <button
                  type="button"
                  className="factor-clear-button"
                  onClick={handleEndPractice}
                >
                  End Practice
                </button>
              )}

            <div
              className="factor-action-feedback"
              aria-live="polite"
            >
              {result &&
                !result.terminal &&
                result.feedbackCode ===
                  "COMPLETE_BUT_UNCERTAIN" && (
                  <span className="factor-action-feedback-uncertain">
                    Your factor structure looks
                    strong. Do you think you&apos;ve
                    found all the factors?
                  </span>
                )}

              {result &&
                !result.terminal &&
                result.feedbackCode !==
                  "COMPLETE_BUT_UNCERTAIN" && (
                  <span className="factor-action-feedback-retry">
                    Check again — there is more to
                    discover.
                  </span>
                )}

              {result?.terminal &&
                result.completionStatus ===
                  "COMPLETE_SUCCESS" && (
                  <span
                    className={`factor-action-feedback-success${
                      isEvidenceRound ||
                      isPairPractice ||
                      isFactorSetPractice
                        ? " factor-challenge-action-success"
                        : ""
                    }`}
                  >
                    {isEvidenceRound ||
                    isPairPractice ||
                    isFactorSetPractice ? (
                      <>
                        <strong>✓ Challenge complete</strong>
                        <small>
                          {isPairPractice
                            ? "Factor pairs confirmed."
                            : isFactorSetPractice
                              ? "Factor set confirmed."
                              : "Factor structure confirmed."}
                        </small>
                      </>
                    ) : (
                      <>
                        ✓ Correct! Factor structure complete.
                      </>
                    )}
                  </span>
                )}

              {result?.terminal &&
                result.completionStatus !==
                  "COMPLETE_SUCCESS" && (
                  <span className="factor-action-feedback-finished">
                    Challenge complete — review your{" "}
                    {isPairPractice
                      ? "factor pairs."
                      : "factor structure."}
                  </span>
                )}

              {error && (
                <span className="factor-action-feedback-error">
                  Your work could not be checked.
                </span>
              )}
            </div>

            {!isTerminal ? (
              <button
                type="button"
                className="factor-check-button"
                disabled={
                  submitting ||
                  (isPairPractice
                    ? !pairSubmissionReady
                    : isFactorSetPractice
                      ? factors.length === 0
                      : factors.length === 0 ||
                        completionClaim === null)
                }
                onClick={handleSubmit}
              >
                {submitting
                  ? "Checking..."
                  : "✓ Check My Work"}
              </button>
            ) : isQuickChallenge ? (
              <button
                type="button"
                className="factor-new-button"
                onClick={
                  handleTryAnotherQuickChallenge
                }
              >
                Try Another
              </button>
            ) : isPracticeMode ? (
              <button
                type="button"
                className="factor-new-button"
                onClick={handleNextPracticeChallenge}
              >
                {!isContinuousPractice &&
                practiceChallengeNumber >=
                  sessionChallengeCount
                  ? "Complete Practice"
                  : "Next Challenge"}
              </button>
            ) : (
              <button
                type="button"
                className="factor-new-button"
                onClick={handleNextChallenge}
              >
                {currentRoundPosition >=
                sessionChallengeCount
                  ? "Complete Round"
                  : "Next Challenge"}
              </button>
            )}
          </footer>
        </section>

        <section className="numberverse-footer-card">
          <span>🌐</span>
          <div>
            <strong>
              Every number has a structure.
            </strong>
            <p>
              Explore it. Test it. Discover how the
              pieces connect.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}



