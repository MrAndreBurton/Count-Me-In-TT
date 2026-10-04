import {
  FACTOR_BENCH_DIMENSIONS,
  FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION,
  FACTOR_BENCH_EVIDENCE_PROFILE_TYPES,
  FACTOR_BENCH_EVIDENCE_STRENGTHS,
  FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES,
  FACTOR_BENCH_STRUCTURAL_OBSERVATIONS,
} from "./factorBenchEvidenceContract";

import {
  aggregateFactorBenchRoundStrength,
  interpretFactorBenchRoundTrajectory,
} from "./factorBenchRoundAggregation";

import {
  FACTOR_BENCH_ROUND_OBSERVATION_VERSION,
} from "./factorBenchRoundObservationBuilder";


export const FACTOR_BENCH_ROUND_INTERPRETER_VERSION =
  "FACTOR_BENCH_ROUND_INTERPRETER_V1";


const CORE_DIMENSIONS = Object.freeze([
  FACTOR_BENCH_DIMENSIONS.FACTOR_IDENTIFICATION,
  FACTOR_BENCH_DIMENSIONS.FACTOR_PAIR_STRUCTURE,
  FACTOR_BENCH_DIMENSIONS.FACTOR_SET_COMPLETENESS,
  FACTOR_BENCH_DIMENSIONS.COMPLETENESS_JUDGMENT,
]);


const STRUCTURAL_OBSERVATIONS = Object.freeze([
  FACTOR_BENCH_STRUCTURAL_OBSERVATIONS.SQUARE_PAIR_HANDLING,
]);


const DISTRIBUTION_STRENGTHS = Object.freeze([
  FACTOR_BENCH_EVIDENCE_STRENGTHS.STRONG,
  FACTOR_BENCH_EVIDENCE_STRENGTHS.SUPPORTED,
  FACTOR_BENCH_EVIDENCE_STRENGTHS.EMERGING,
  FACTOR_BENCH_EVIDENCE_STRENGTHS.INSUFFICIENT,
]);


function requireRoundObservation(
  roundObservation
) {
  if (
    !roundObservation ||
    typeof roundObservation !== "object" ||
    Array.isArray(roundObservation)
  ) {
    throw new Error(
      "A canonical Factor Bench round observation is required."
    );
  }

  if (
    roundObservation.observationVersion !==
    FACTOR_BENCH_ROUND_OBSERVATION_VERSION
  ) {
    throw new Error(
      "Factor Bench Round Interpreter V1 requires a Factor Bench Round Observation V1 record."
    );
  }

  if (
    roundObservation.contractVersion !==
    FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION
  ) {
    throw new Error(
      "Factor Bench round observation contract version does not match the evidence contract."
    );
  }

  if (
    !roundObservation.roundContext ||
    typeof roundObservation.roundContext !== "object"
  ) {
    throw new Error(
      "Factor Bench round observation context is required."
    );
  }

  if (
    !roundObservation.challengeHistory ||
    typeof roundObservation.challengeHistory !== "object" ||
    !Array.isArray(
      roundObservation.challengeHistory.challenges
    )
  ) {
    throw new Error(
      "Factor Bench round observation challenge history is required."
    );
  }
}


function createEmptyDistribution() {
  return {
    [FACTOR_BENCH_EVIDENCE_STRENGTHS.STRONG]:
      0,

    [FACTOR_BENCH_EVIDENCE_STRENGTHS.SUPPORTED]:
      0,

    [FACTOR_BENCH_EVIDENCE_STRENGTHS.EMERGING]:
      0,

    [FACTOR_BENCH_EVIDENCE_STRENGTHS.INSUFFICIENT]:
      0,
  };
}


function isObservedStrength(
  strength
) {
  return DISTRIBUTION_STRENGTHS.includes(
    strength
  );
}


function readEvidenceResult(
  challengeEvidenceProfile,
  collectionName,
  evidenceKey
) {
  const collection =
    challengeEvidenceProfile?.[
      collectionName
    ];

  if (
    !collection ||
    typeof collection !== "object"
  ) {
    throw new Error(
      `Factor Bench challenge evidence profile is missing ${collectionName}.`
    );
  }

  const result =
    collection[evidenceKey];

  if (
    !result ||
    typeof result !== "object"
  ) {
    throw new Error(
      `Factor Bench challenge evidence profile is missing evidence result ${evidenceKey}.`
    );
  }

  return result;
}


function buildChallengeEvidence(
  challenges,
  collectionName,
  evidenceKey
) {
  return challenges.map(
    (challenge) => {
      const result =
        readEvidenceResult(
          challenge.challengeEvidenceProfile,
          collectionName,
          evidenceKey
        );

      return {
        challengeIndex:
          challenge.challengeIndex,

        challengeEpisodeId:
          challenge.challengeEpisodeId,

        opportunity:
          result.opportunity,

        strength:
          result.strength ?? null,
      };
    }
  );
}


function countEntitled(
  challengeEvidence
) {
  return challengeEvidence.filter(
    (item) =>
      item.opportunity ===
      FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES.ENTITLED
  ).length;
}


function countPresented(
  challengeEvidence
) {
  return challengeEvidence.filter(
    (item) =>
      item.opportunity ===
        FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES.ENTITLED &&
      item.opportunity !==
        FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES.NOT_PRESENTED
  ).length;
}


function observedStrengths(
  challengeEvidence
) {
  return challengeEvidence
    .filter(
      (item) =>
        isObservedStrength(
          item.strength
        )
    )
    .map(
      (item) =>
        item.strength
    );
}


function buildDistribution(
  strengths
) {
  const distribution =
    createEmptyDistribution();

  for (const strength of strengths) {
    distribution[strength] += 1;
  }

  return distribution;
}


function buildEvidenceResult({
  challengeEvidence,
  planned,
}) {
  const strengths =
    observedStrengths(
      challengeEvidence
    );

  return {
    strength:
      aggregateFactorBenchRoundStrength(
        strengths
      ),

    trajectory:
      interpretFactorBenchRoundTrajectory(
        strengths
      ),

    opportunity: {
      planned,

      entitled:
        countEntitled(
          challengeEvidence
        ),

      presented:
        countPresented(
          challengeEvidence
        ),

      observed:
        strengths.length,
    },

    distribution:
      buildDistribution(
        strengths
      ),

    challengeEvidence:
      structuredClone(
        challengeEvidence
      ),
  };
}


function buildCoreDimensionResult(
  challenges,
  dimension,
  plannedChallengeCount
) {
  const challengeEvidence =
    buildChallengeEvidence(
      challenges,
      "dimensions",
      dimension
    );

  return buildEvidenceResult({
    challengeEvidence,
    planned:
      plannedChallengeCount,
  });
}


function buildStructuralObservationResult(
  challenges,
  structuralObservation
) {
  const challengeEvidence =
    buildChallengeEvidence(
      challenges,
      "structuralObservations",
      structuralObservation
    );

  const planned =
    challengeEvidence.filter(
      (item) =>
        item.opportunity !==
        FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES.NOT_ENTITLED
    ).length;

  return buildEvidenceResult({
    challengeEvidence,
    planned,
  });
}


function buildChallengeSummary(
  challenges
) {
  return challenges.map(
    (challenge) => ({
      challengeIndex:
        challenge.challengeIndex,

      challengeEpisodeId:
        challenge.challengeEpisodeId,

      target:
        challenge.target,

      difficulty:
        challenge.difficulty,

      structure:
        challenge.structure,
    })
  );
}


export function interpretFactorBenchRound(
  roundObservation
) {
  requireRoundObservation(
    roundObservation
  );

  const {
    roundEpisodeId,
    roundState,
    roundContext,
    challengeHistory,
  } = roundObservation;

  const {
    plannedChallengeCount,
  } = roundContext;

  const {
    completedChallengeCount,
    challenges,
  } = challengeHistory;

  const dimensions = {};

  for (const dimension of CORE_DIMENSIONS) {
    dimensions[dimension] =
      buildCoreDimensionResult(
        challenges,
        dimension,
        plannedChallengeCount
      );
  }

  const structuralObservations = {};

  for (
    const structuralObservation
    of STRUCTURAL_OBSERVATIONS
  ) {
    structuralObservations[
      structuralObservation
    ] =
      buildStructuralObservationResult(
        challenges,
        structuralObservation
      );
  }

  return {
    contractVersion:
      FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION,

    roundInterpreterVersion:
      FACTOR_BENCH_ROUND_INTERPRETER_VERSION,

    profileType:
      FACTOR_BENCH_EVIDENCE_PROFILE_TYPES
        .EVIDENCE_ROUND_PROFILE,

    roundEpisodeId,

    roundState,

    roundContext: {
      mode:
        roundContext.mode,

      evidenceContext:
        roundContext.evidenceContext,

      plannedChallengeCount,

      completedChallengeCount,
    },

    challengeSummary:
      buildChallengeSummary(
        challenges
      ),

    dimensions,

    structuralObservations,

    provenance: {
      source: "FACTOR_BENCH",
      generatedFrom:
        "CHALLENGE_EVIDENCE_PROFILES",
    },
  };
}
