import {
  generateFactorBenchTarget,
} from "../generators/factorBenchTargetGenerator";

const episodes = new Map();

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeNumbers(values) {
  return [...values]
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

function arraysEqual(left, right) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function normalizePairs(pairs) {
  return [...pairs]
    .map(([a, b]) => [Number(a), Number(b)])
    .filter(
      ([a, b]) =>
        Number.isFinite(a) && Number.isFinite(b)
    )
    .map(([a, b]) => (a <= b ? [a, b] : [b, a]))
    .sort((left, right) => {
      if (left[0] !== right[0]) {
        return left[0] - right[0];
      }

      return left[1] - right[1];
    });
}

function pairsEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (pair, index) =>
      pair[0] === right[index][0] &&
      pair[1] === right[index][1]
  );
}

function getFactors(target) {
  const factors = [];

  for (let value = 1; value <= target; value += 1) {
    if (target % value === 0) {
      factors.push(value);
    }
  }

  return factors;
}

function getFactorPairs(target) {
  const pairs = [];

  for (
    let value = 1;
    value <= Math.sqrt(target);
    value += 1
  ) {
    if (target % value === 0) {
      pairs.push([value, target / value]);
    }
  }

  return pairs;
}

function resolveTaskRequirements(taskRequirements) {
  return {
    factorPairs:
      taskRequirements?.factorPairs ?? true,
    factorSet:
      taskRequirements?.factorSet ?? true,
    completenessJudgment:
      taskRequirements?.completenessJudgment ?? true,
  };
}

export async function startDevelopmentChallenge({
  templateCode,
  learningNodeId,
  levelId,
  target,
  taskRequirements,
}) {
  const generatedTarget =
    target ??
    generateFactorBenchTarget({
      difficulty: "DEVELOPING",
    }).target;

  const resolvedTaskRequirements =
    resolveTaskRequirements(taskRequirements);

  const challengeEpisodeId = createId("episode");
  const challengeInstanceId = createId("instance");

  const episode = {
    challengeEpisodeId,
    challengeInstanceId,
    templateCode,
    learningNodeId,
    levelId,
    target: generatedTarget,
    taskRequirements: resolvedTaskRequirements,
    attemptNumber: 0,
    maxMeaningfulAttempts: 3,
    status: "IN_PROGRESS",
  };

  episodes.set(challengeEpisodeId, episode);

  const pairOnly =
    resolvedTaskRequirements.factorPairs &&
    !resolvedTaskRequirements.factorSet &&
    !resolvedTaskRequirements.completenessJudgment;

  return {
    ok: true,
    action: "start",
    challengeEpisodeId,
    challengeInstanceId,
    templateCode,
    engineId: "DIVISIBILITY_LAB",
    engineModeId: "LAB_FACTOR_BENCH",
    learningNodeId,
    levelId,
    maxMeaningfulAttempts: 3,
    taskRequirements: resolvedTaskRequirements,
    prompt: pairOnly
      ? `Build all the factor pairs for ${generatedTarget}.`
      : `Build the factor pairs for ${generatedTarget}, then use your discoveries to make the complete factor set.`,
    target: generatedTarget,
  };
}

export async function submitDevelopmentResponse({
  challengeEpisodeId,
  independenceState = "INDEPENDENT",
  response,
}) {
  const episode = episodes.get(challengeEpisodeId);

  if (!episode) {
    throw new Error(
      "The development challenge episode could not be found."
    );
  }

  if (episode.status !== "IN_PROGRESS") {
    throw new Error(
      "This development challenge is no longer in progress."
    );
  }

  episode.attemptNumber += 1;

  const effectiveIndependenceState =
    episode.attemptNumber === 1
      ? independenceState
      : independenceState === "INDEPENDENT"
        ? "RETRIED"
        : independenceState;

  const requirements =
    resolveTaskRequirements(
      episode.taskRequirements
    );

  const expectedFactors = getFactors(episode.target);
  const expectedPairs = getFactorPairs(episode.target);

  const submittedFactors = normalizeNumbers(
    response?.factorSet || []
  );

  const submittedPairs = normalizePairs(
    response?.factorPairs || []
  );

  const factorSetCorrect = arraysEqual(
    submittedFactors,
    expectedFactors
  );

  const factorPairsCorrect = pairsEqual(
    submittedPairs,
    expectedPairs
  );

  const completionClaimCorrect =
    response?.completionClaim === true;

  const requiredChecks = [];

  if (requirements.factorPairs) {
    requiredChecks.push(factorPairsCorrect);
  }

  if (requirements.factorSet) {
    requiredChecks.push(factorSetCorrect);
  }

  const requiredMathematicsComplete =
    requiredChecks.length > 0 &&
    requiredChecks.every(Boolean);

  const completionSatisfied =
    !requirements.completenessJudgment ||
    completionClaimCorrect;

  const completeSuccess =
    requiredMathematicsComplete &&
    completionSatisfied;

  const mathematicallyCompleteButUncertain =
    requirements.completenessJudgment &&
    requiredMathematicsComplete &&
    response?.completionClaim === false;

  const terminal =
    completeSuccess ||
    (!mathematicallyCompleteButUncertain &&
      episode.attemptNumber >=
        episode.maxMeaningfulAttempts);

  if (terminal) {
    episode.status = "COMPLETED";
  }

  const anyRequiredSuccess =
    (requirements.factorPairs &&
      factorPairsCorrect) ||
    (requirements.factorSet &&
      factorSetCorrect);

  const completionStatus = completeSuccess
    ? "COMPLETE_SUCCESS"
    : mathematicallyCompleteButUncertain
      ? "PARTIAL_SUCCESS"
      : anyRequiredSuccess
        ? "PARTIAL_SUCCESS"
        : "UNSUCCESSFUL";

  const feedbackCode =
    mathematicallyCompleteButUncertain
      ? "COMPLETE_BUT_UNCERTAIN"
      : completeSuccess
        ? "COMPLETE"
        : "KEEP_EXPLORING";

  const result = {
    ok: true,
    action: "submit",
    terminal,
    attemptNumber: episode.attemptNumber,
    challengeEpisodeId,
    completionStatus,
    feedbackCode,
  };

  if (terminal) {
    const strength =
      completeSuccess &&
      effectiveIndependenceState === "INDEPENDENT"
        ? 2
        : completeSuccess
          ? 1
          : 0;

    result.evidenceEventId = createId("evidence");
    result.observations = [];

    if (requirements.factorSet) {
      result.observations.push({
        dimension: "FACTOR_GENERATION",
        outcome: factorSetCorrect
          ? "SUCCESS"
          : "FAILURE",
        strength: factorSetCorrect ? strength : 0,
        independence: effectiveIndependenceState,
      });
    }

    if (requirements.factorPairs) {
      result.observations.push({
        dimension: "FACTOR_PAIR_CONSTRUCTION",
        outcome: factorPairsCorrect
          ? "SUCCESS"
          : "FAILURE",
        strength: factorPairsCorrect ? strength : 0,
        independence: effectiveIndependenceState,
      });
    }

    if (requirements.factorSet) {
      result.observations.push({
        dimension: "FACTOR_SET_COMPLETENESS",
        outcome: factorSetCorrect
          ? "SUCCESS"
          : "FAILURE",
        strength: factorSetCorrect ? strength : 0,
        independence: effectiveIndependenceState,
      });
    }
  }

  return result;
}



