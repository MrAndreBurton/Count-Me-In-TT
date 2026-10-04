import {
  FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION,
  FACTOR_BENCH_EVIDENCE_CONTEXTS,
  FACTOR_BENCH_MODES,
  FACTOR_BENCH_EVIDENCE_PROFILE_TYPES,
} from "./factorBenchEvidenceContract";


export const FACTOR_BENCH_ROUND_OBSERVATION_VERSION =
  "FACTOR_BENCH_ROUND_OBSERVATION_V1";

export const FACTOR_BENCH_ROUND_OBSERVATION_STATES =
  Object.freeze({
    COMPLETE: "COMPLETE",
    INCOMPLETE: "INCOMPLETE",
  });


const FACTOR_BENCH_EVIDENCE_ROUND_CHALLENGE_COUNT =
  5;


function requireNonEmptyString(
  value,
  label
) {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${label} must be a non-empty string.`
    );
  }

  return value;
}


function requirePositiveInteger(
  value,
  label
) {
  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(
      `${label} must be a positive integer.`
    );
  }

  return value;
}


function clonePreservedValue(
  value
) {
  return structuredClone(value);
}


function validateRoundContext(
  roundContext
) {
  if (
    !roundContext ||
    typeof roundContext !== "object" ||
    Array.isArray(roundContext)
  ) {
    throw new Error(
      "Factor Bench round context is required."
    );
  }

  const {
    mode,
    evidenceContext,
    plannedChallengeCount,
  } = roundContext;

  if (
    mode !==
    FACTOR_BENCH_MODES.EVIDENCE_ROUND
  ) {
    throw new Error(
      "Factor Bench Round Observation V1 requires EVIDENCE_ROUND mode."
    );
  }

  if (
    evidenceContext !==
    FACTOR_BENCH_EVIDENCE_CONTEXTS.STRUCTURED_ROUND
  ) {
    throw new Error(
      "Factor Bench Round Observation V1 requires STRUCTURED_ROUND evidence context."
    );
  }

  if (
    plannedChallengeCount !==
    FACTOR_BENCH_EVIDENCE_ROUND_CHALLENGE_COUNT
  ) {
    throw new Error(
      "Factor Bench Evidence Round V1 requires exactly 5 planned challenges."
    );
  }

  return {
    mode,
    evidenceContext,
    plannedChallengeCount,
  };
}


function validateChallengeEvidenceProfile(
  challengeEvidenceProfile,
  challengeEpisodeId
) {
  if (
    !challengeEvidenceProfile ||
    typeof challengeEvidenceProfile !==
      "object" ||
    Array.isArray(
      challengeEvidenceProfile
    )
  ) {
    throw new Error(
      "A Factor Bench challenge evidence profile is required."
    );
  }

  if (
    challengeEvidenceProfile.profileType !==
    FACTOR_BENCH_EVIDENCE_PROFILE_TYPES.CHALLENGE
  ) {
    throw new Error(
      "Factor Bench round challenges must contain CHALLENGE evidence profiles."
    );
  }

  if (
    challengeEvidenceProfile.contractVersion !==
    FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION
  ) {
    throw new Error(
      "Factor Bench challenge evidence profile contract version does not match the round evidence contract."
    );
  }

  requireNonEmptyString(
    challengeEvidenceProfile.challengeEpisodeId,
    "Challenge evidence profile episode ID"
  );

  if (
    challengeEvidenceProfile.challengeEpisodeId !==
    challengeEpisodeId
  ) {
    throw new Error(
      "Challenge wrapper episode ID must match the challenge evidence profile episode ID."
    );
  }
}


function normaliseChallenge(
  challenge
) {
  if (
    !challenge ||
    typeof challenge !== "object" ||
    Array.isArray(challenge)
  ) {
    throw new Error(
      "Each Factor Bench round challenge must be an object."
    );
  }

  const challengeIndex =
    requirePositiveInteger(
      challenge.challengeIndex,
      "Challenge index"
    );

  const challengeEpisodeId =
    requireNonEmptyString(
      challenge.challengeEpisodeId,
      "Challenge episode ID"
    );

  const target =
    requirePositiveInteger(
      challenge.target,
      "Challenge target"
    );

  const difficulty =
    requireNonEmptyString(
      challenge.difficulty,
      "Challenge difficulty"
    );

  const structure =
    requireNonEmptyString(
      challenge.structure,
      "Challenge structure"
    );

  validateChallengeEvidenceProfile(
    challenge.challengeEvidenceProfile,
    challengeEpisodeId
  );

  return {
    challengeIndex,
    challengeEpisodeId,
    target,
    difficulty,
    structure,

    challengeEvidenceProfile:
      clonePreservedValue(
        challenge.challengeEvidenceProfile
      ),
  };
}


function validateUniqueChallenges(
  challenges
) {
  const indexes =
    new Set();

  const episodeIds =
    new Set();

  for (const challenge of challenges) {
    if (
      indexes.has(
        challenge.challengeIndex
      )
    ) {
      throw new Error(
        "Factor Bench round challenge indexes must be unique."
      );
    }

    if (
      episodeIds.has(
        challenge.challengeEpisodeId
      )
    ) {
      throw new Error(
        "Factor Bench round challenge episode IDs must be unique."
      );
    }

    indexes.add(
      challenge.challengeIndex
    );

    episodeIds.add(
      challenge.challengeEpisodeId
    );
  }
}


function validateContiguousPrefix(
  challenges,
  plannedChallengeCount
) {
  if (
    challenges.length >
    plannedChallengeCount
  ) {
    throw new Error(
      "Factor Bench round cannot contain more completed challenges than were planned."
    );
  }

  for (
    let index = 0;
    index < challenges.length;
    index += 1
  ) {
    const expectedChallengeIndex =
      index + 1;

    if (
      challenges[index]
        .challengeIndex !==
      expectedChallengeIndex
    ) {
      throw new Error(
        "Completed Factor Bench Evidence Round challenges must form a contiguous prefix beginning at challenge 1."
      );
    }
  }
}


export function buildFactorBenchRoundObservation(
  input
) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new Error(
      "Factor Bench round observation input is required."
    );
  }

  const roundEpisodeId =
    requireNonEmptyString(
      input.roundEpisodeId,
      "Round episode ID"
    );

  const roundContext =
    validateRoundContext(
      input.roundContext
    );

  if (
    !Array.isArray(input.challenges)
  ) {
    throw new Error(
      "Factor Bench round challenges must be an array."
    );
  }

  const challenges =
    input.challenges
      .map(normaliseChallenge)
      .sort(
        (left, right) =>
          left.challengeIndex -
          right.challengeIndex
      );

  validateUniqueChallenges(
    challenges
  );

  validateContiguousPrefix(
    challenges,
    roundContext.plannedChallengeCount
  );

  const completedChallengeCount =
    challenges.length;

  const roundState =
    completedChallengeCount ===
    roundContext.plannedChallengeCount
      ? FACTOR_BENCH_ROUND_OBSERVATION_STATES.COMPLETE
      : FACTOR_BENCH_ROUND_OBSERVATION_STATES.INCOMPLETE;

  return {
    observationVersion:
      FACTOR_BENCH_ROUND_OBSERVATION_VERSION,

    contractVersion:
      FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION,

    roundEpisodeId,

    roundContext:
      clonePreservedValue(
        roundContext
      ),

    challengeHistory: {
      completedChallengeCount,

      challenges:
        clonePreservedValue(
          challenges
        ),
    },

    roundState,

    provenance: {
      source: "FACTOR_BENCH",
      generatedFrom:
        "CHALLENGE_EVIDENCE_PROFILES",
    },
  };
}



