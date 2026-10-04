import {
  FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION,
} from "./factorBenchEvidenceContract";


// -----------------------------------------------------------------------------
// Factor Bench Challenge Observation Builder V1
//
// Purpose:
//   Preserve the complete observable record of one Factor Bench challenge.
//
// This module does NOT:
//   - recompute mathematical truth
//   - interpret evidence strength
//   - infer mastery
//   - infer curriculum readiness
//   - decide whether the learner is "good" at factors
//
// It preserves:
//   challenge identity
//   task context
//   evidence entitlements
//   ordered attempt observations
//   terminal state
//   terminal outcome
//   provenance
//
// Interpretation belongs to factorBenchChallengeInterpreter.js.
// -----------------------------------------------------------------------------


export const FACTOR_BENCH_CHALLENGE_OBSERVATION_VERSION =
  "FACTOR_BENCH_CHALLENGE_OBSERVATION_V1";


// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return structuredClone(value);
}


function normalizeAttemptObservations(
  attempts = []
) {
  if (!Array.isArray(attempts)) {
    throw new Error(
      "Factor Bench challenge attempts must be an array."
    );
  }

  const normalizedAttempts =
    attempts.map((attempt) => {
      if (
        !attempt ||
        typeof attempt !== "object"
      ) {
        throw new Error(
          "Each Factor Bench attempt observation must be an object."
        );
      }

      if (
        !Number.isInteger(
          attempt.attemptNumber
        ) ||
        attempt.attemptNumber < 1
      ) {
        throw new Error(
          "Each Factor Bench attempt observation must have a positive integer attemptNumber."
        );
      }

      return cloneValue(attempt);
    });

  normalizedAttempts.sort(
    (left, right) =>
      left.attemptNumber -
      right.attemptNumber
  );

  const seenAttemptNumbers =
    new Set();

  for (
    const attempt of normalizedAttempts
  ) {
    if (
      seenAttemptNumbers.has(
        attempt.attemptNumber
      )
    ) {
      throw new Error(
        `Duplicate Factor Bench attemptNumber: ${attempt.attemptNumber}.`
      );
    }

    seenAttemptNumbers.add(
      attempt.attemptNumber
    );
  }

  return normalizedAttempts;
}


function validateTarget(target) {
  if (
    !Number.isInteger(target) ||
    target <= 0
  ) {
    throw new Error(
      "Factor Bench challenge target must be a positive integer."
    );
  }
}


function validateTerminalState({
  terminal,
  terminalOutcome,
}) {
  if (typeof terminal !== "boolean") {
    throw new Error(
      "Factor Bench challenge terminal must be boolean."
    );
  }

  if (
    terminal === false &&
    terminalOutcome != null
  ) {
    throw new Error(
      "A non-terminal Factor Bench challenge cannot have a terminalOutcome."
    );
  }
}


// -----------------------------------------------------------------------------
// Public builder
// -----------------------------------------------------------------------------

export function buildFactorBenchChallengeObservation({
  challengeEpisodeId,

  target,

  mode = null,
  evidenceContext = null,

  taskDefinition = null,

  entitlements = {},

  attempts = [],

  terminal = false,
  terminalOutcome = null,

  provenance = {},
} = {}) {
  if (
    typeof challengeEpisodeId !==
      "string" ||
    challengeEpisodeId.trim() === ""
  ) {
    throw new Error(
      "Factor Bench challengeEpisodeId is required."
    );
  }

  validateTarget(target);

  validateTerminalState({
    terminal,
    terminalOutcome,
  });

  const orderedAttempts =
    normalizeAttemptObservations(
      attempts
    );

  const attemptsUsed =
    orderedAttempts.length;

  const firstAttemptNumber =
    attemptsUsed > 0
      ? orderedAttempts[0].attemptNumber
      : null;

  const lastAttemptNumber =
    attemptsUsed > 0
      ? orderedAttempts[
          attemptsUsed - 1
        ].attemptNumber
      : null;

  return {
    observationVersion:
      FACTOR_BENCH_CHALLENGE_OBSERVATION_VERSION,

    contractVersion:
      FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION,

    challengeEpisodeId:
      challengeEpisodeId.trim(),

    target,

    taskContext: {
      mode,
      evidenceContext,

      taskDefinition:
        cloneValue(taskDefinition),

      entitlements:
        cloneValue(entitlements),
    },

    attemptHistory: {
      attemptsUsed,
      firstAttemptNumber,
      lastAttemptNumber,

      attempts:
        orderedAttempts,
    },

    terminalState: {
      terminal,

      terminalOutcome:
        terminal
          ? cloneValue(
              terminalOutcome
            )
          : null,
    },

    provenance:
      cloneValue(provenance),
  };
}
