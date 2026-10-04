import {
  generateFactorBenchRound,
} from "../generators/factorBenchRoundGenerator";

export const FACTOR_BENCH_ROUND_STATUSES =
  Object.freeze({
    READY: "READY",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETE: "COMPLETE",
  });

function createRoundId() {
  return `factor-bench-round-${crypto.randomUUID()}`;
}

export function createFactorBenchRound({
  recentTargets = [],
} = {}) {
  const generated =
    generateFactorBenchRound({
      recentTargets,
    });

  return {
    roundId: createRoundId(),
    roundVersion: generated.roundVersion,

    status:
      FACTOR_BENCH_ROUND_STATUSES.READY,

    challengeCount: generated.challengeCount,
    currentChallengeIndex: 0,

    perfectSquareCount:
      generated.perfectSquareCount,

    challenges: generated.challenges.map(
      (challenge) => ({
        ...challenge,

        status: "PENDING",

        challengeEpisodeId: null,
        challengeInstanceId: null,

        terminalResult: null,
      })
    ),
  };
}

export function getCurrentFactorBenchChallenge(
  round
) {
  if (
    !round ||
    round.status ===
      FACTOR_BENCH_ROUND_STATUSES.COMPLETE
  ) {
    return null;
  }

  return (
    round.challenges[
      round.currentChallengeIndex
    ] ?? null
  );
}

export function markFactorBenchChallengeStarted(
  round,
  {
    challengeEpisodeId,
    challengeInstanceId,
  }
) {
  const challenge =
    getCurrentFactorBenchChallenge(round);

  if (!challenge) {
    throw new Error(
      "No Factor Bench challenge is available to start."
    );
  }

  if (challenge.status !== "PENDING") {
    throw new Error(
      "The current Factor Bench challenge has already been started."
    );
  }

  challenge.status = "IN_PROGRESS";
  challenge.challengeEpisodeId =
    challengeEpisodeId;
  challenge.challengeInstanceId =
    challengeInstanceId;

  round.status =
    FACTOR_BENCH_ROUND_STATUSES.IN_PROGRESS;

  return round;
}

export function completeFactorBenchChallenge(
  round,
  terminalResult
) {
  const challenge =
    getCurrentFactorBenchChallenge(round);

  if (!challenge) {
    throw new Error(
      "No Factor Bench challenge is available to complete."
    );
  }

  if (challenge.status !== "IN_PROGRESS") {
    throw new Error(
      "The current Factor Bench challenge is not in progress."
    );
  }

  if (!terminalResult?.terminal) {
    throw new Error(
      "A Factor Bench challenge may advance only after a terminal result."
    );
  }

  challenge.status = "COMPLETE";

  challenge.terminalResult = {
    ...terminalResult,
  };

  const isFinalChallenge =
    round.currentChallengeIndex ===
    round.challengeCount - 1;

  if (isFinalChallenge) {
    round.status =
      FACTOR_BENCH_ROUND_STATUSES.COMPLETE;

    return round;
  }

  round.currentChallengeIndex += 1;

  return round;
}

export function getFactorBenchRoundSummary(
  round
) {
  if (
    !round ||
    round.status !==
      FACTOR_BENCH_ROUND_STATUSES.COMPLETE
  ) {
    return null;
  }

  return {
    roundId: round.roundId,
    roundVersion: round.roundVersion,
    status: round.status,
    challengeCount: round.challengeCount,

    challenges: round.challenges.map(
      (challenge) => ({
        position: challenge.position,
        target: challenge.target,
        difficulty: challenge.difficulty,
        structure: challenge.structure,

        challengeEpisodeId:
          challenge.challengeEpisodeId,

        challengeInstanceId:
          challenge.challengeInstanceId,

        terminalResult:
          challenge.terminalResult,
      })
    ),
  };
}


