// Factor Bench Evidence Contract V1
//
// This module defines the vocabulary and structural contract for
// Factor Bench evidence.
//
// It intentionally contains NO interpretation logic.
//
// Raw observations are preserved before interpretation.
// Factor Bench reports evidence of demonstrated mathematical behaviour.
// Longitudinal inference, curriculum progression, and mastery belong to AEOS.

export const FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION =
  "FACTOR_BENCH_EVIDENCE_V1";

export const FACTOR_BENCH_INTERPRETER_VERSION =
  "FACTOR_BENCH_INTERPRETER_V1";


// -----------------------------------------------------------------------------
// Factor Bench modes
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_MODES = Object.freeze({
  PAIR_PRACTICE: "PAIR_PRACTICE",
  FACTOR_SET_PRACTICE: "FACTOR_SET_PRACTICE",
  FULL_PRACTICE: "FULL_PRACTICE",
  QUICK_CHALLENGE: "QUICK_CHALLENGE",
  EVIDENCE_ROUND: "EVIDENCE_ROUND",
});


// -----------------------------------------------------------------------------
// Evidence contexts
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_EVIDENCE_CONTEXTS =
  Object.freeze({
    PRACTICE: "PRACTICE",
    QUICK_PROBE: "QUICK_PROBE",
    STRUCTURED_ROUND: "STRUCTURED_ROUND",
  });


// -----------------------------------------------------------------------------
// Core observable dimensions
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_DIMENSIONS = Object.freeze({
  FACTOR_IDENTIFICATION: "FACTOR_IDENTIFICATION",
  FACTOR_PAIR_STRUCTURE: "FACTOR_PAIR_STRUCTURE",
  FACTOR_SET_COMPLETENESS: "FACTOR_SET_COMPLETENESS",
  COMPLETENESS_JUDGMENT: "COMPLETENESS_JUDGMENT",
});


// -----------------------------------------------------------------------------
// Conditional structural observations
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_STRUCTURAL_OBSERVATIONS =
  Object.freeze({
    SQUARE_PAIR_HANDLING: "SQUARE_PAIR_HANDLING",
  });


// -----------------------------------------------------------------------------
// Evidence opportunity / entitlement states
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES =
  Object.freeze({
    ENTITLED: "ENTITLED",
    NOT_ENTITLED: "NOT_ENTITLED",
    NOT_PRESENTED: "NOT_PRESENTED",
  });


// -----------------------------------------------------------------------------
// Evidence strengths
//
// MIXED is intended for aggregated session / round interpretation.
// It is not a valid challenge-level strength.
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_EVIDENCE_STRENGTHS =
  Object.freeze({
    STRONG: "STRONG",
    SUPPORTED: "SUPPORTED",
    EMERGING: "EMERGING",
    MIXED: "MIXED",
    INSUFFICIENT: "INSUFFICIENT",
  });

export const FACTOR_BENCH_CHALLENGE_EVIDENCE_STRENGTHS =
  Object.freeze({
    STRONG:
      FACTOR_BENCH_EVIDENCE_STRENGTHS.STRONG,

    SUPPORTED:
      FACTOR_BENCH_EVIDENCE_STRENGTHS.SUPPORTED,

    EMERGING:
      FACTOR_BENCH_EVIDENCE_STRENGTHS.EMERGING,

    INSUFFICIENT:
      FACTOR_BENCH_EVIDENCE_STRENGTHS.INSUFFICIENT,
  });


// -----------------------------------------------------------------------------
// Intervention types
//
// These preserve what kind of support occurred.
// Independence state remains a separate Numberverse-wide concept.
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_INTERVENTION_TYPES =
  Object.freeze({
    NONE: "NONE",

    GENERIC_RETRY: "GENERIC_RETRY",

    PROCESS_SCAFFOLD: "PROCESS_SCAFFOLD",

    MATHEMATICAL_HINT: "MATHEMATICAL_HINT",

    DIRECT_ASSISTANCE: "DIRECT_ASSISTANCE",

    REVEAL: "REVEAL",
  });


// -----------------------------------------------------------------------------
// Raw completeness-judgment observations
//
// These describe the relationship between the actual mathematical state
// and the learner's explicit completeness claim.
// They are observations, not evidence-strength judgments.
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_COMPLETENESS_JUDGMENTS =
  Object.freeze({
    COMPLETE_RECOGNISED: "COMPLETE_RECOGNISED",

    COMPLETE_UNCERTAIN: "COMPLETE_UNCERTAIN",

    INCOMPLETE_PREMATURE_CLOSURE:
      "INCOMPLETE_PREMATURE_CLOSURE",

    INCOMPLETE_UNCERTAIN: "INCOMPLETE_UNCERTAIN",
  });


// -----------------------------------------------------------------------------
// Practice trajectory states
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_TRAJECTORIES =
  Object.freeze({
    IMPROVING: "IMPROVING",
    STABLE: "STABLE",
    VARIABLE: "VARIABLE",
    POSSIBLE_DECLINE: "POSSIBLE_DECLINE",
    INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  });


// -----------------------------------------------------------------------------
// Structured Evidence Round completion states
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_ROUND_COMPLETION_STATES =
  Object.freeze({
    COMPLETE: "COMPLETE",
    INCOMPLETE: "INCOMPLETE",
  });


// -----------------------------------------------------------------------------
// Evidence profile types
// -----------------------------------------------------------------------------

export const FACTOR_BENCH_EVIDENCE_PROFILE_TYPES =
  Object.freeze({
    CHALLENGE: "CHALLENGE",
    PRACTICE_PROFILE: "PRACTICE_PROFILE",
    QUICK_PROBE: "QUICK_PROBE",
    EVIDENCE_ROUND_PROFILE:
      "EVIDENCE_ROUND_PROFILE",
  });


// -----------------------------------------------------------------------------
// Structural contract helpers
//
// These helpers create empty contract-shaped objects only.
// They DO NOT interpret learner performance.
// -----------------------------------------------------------------------------

export function createFactorBenchEntitlements({
  factorIdentification =
    FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES.NOT_ENTITLED,

  factorPairStructure =
    FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES.NOT_ENTITLED,

  factorSetCompleteness =
    FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES.NOT_ENTITLED,

  completenessJudgment =
    FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES.NOT_ENTITLED,

  squarePairHandling =
    FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES.NOT_ENTITLED,
} = {}) {
  return {
    [FACTOR_BENCH_DIMENSIONS.FACTOR_IDENTIFICATION]:
      factorIdentification,

    [FACTOR_BENCH_DIMENSIONS.FACTOR_PAIR_STRUCTURE]:
      factorPairStructure,

    [FACTOR_BENCH_DIMENSIONS.FACTOR_SET_COMPLETENESS]:
      factorSetCompleteness,

    [FACTOR_BENCH_DIMENSIONS.COMPLETENESS_JUDGMENT]:
      completenessJudgment,

    [FACTOR_BENCH_STRUCTURAL_OBSERVATIONS
      .SQUARE_PAIR_HANDLING]:
      squarePairHandling,
  };
}


export function createEmptyFactorBenchAttemptObservation({
  attemptNumber,
  independenceState = null,
  interventionType =
    FACTOR_BENCH_INTERVENTION_TYPES.NONE,
} = {}) {
  return {
    attemptNumber,

    independenceState,
    interventionType,

    response: {
      factorPairs: [],
      factorSet: [],
      completionClaim: null,
    },

    observations: {
      factorIdentification: {
        validFactors: [],
        invalidValues: [],
      },

      factorPairs: {
        validPairs: [],
        invalidPairs: [],
        missingPairs: [],
        duplicatePairs: [],
        complete: false,
      },

      factorSet: {
        validFactors: [],
        invalidValues: [],
        missingFactors: [],
        duplicateFactors: [],
        complete: false,
      },

      completenessJudgment: {
        mathematicalStructureComplete: false,
        learnerClaim: null,
        judgmentState: null,
      },

      squarePair: {
        applicable: false,
        expectedPair: null,
        constructed: null,
        distinctFactorHandledCorrectly: null,
      },
    },
  };
}


export function createEmptyFactorBenchChallengeInterpretation({
  challengeEpisodeId = null,
} = {}) {
  return {
    contractVersion:
      FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION,

    interpreterVersion: null,

    profileType:
      FACTOR_BENCH_EVIDENCE_PROFILE_TYPES.CHALLENGE,

    challengeEpisodeId,

    dimensions: {
      [FACTOR_BENCH_DIMENSIONS.FACTOR_IDENTIFICATION]:
        null,

      [FACTOR_BENCH_DIMENSIONS.FACTOR_PAIR_STRUCTURE]:
        null,

      [FACTOR_BENCH_DIMENSIONS.FACTOR_SET_COMPLETENESS]:
        null,

      [FACTOR_BENCH_DIMENSIONS.COMPLETENESS_JUDGMENT]:
        null,
    },

    structuralObservations: {
      [FACTOR_BENCH_STRUCTURAL_OBSERVATIONS
        .SQUARE_PAIR_HANDLING]: null,
    },
  };
}
