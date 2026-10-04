import {
  FACTOR_BENCH_EVIDENCE_CONTEXTS,
  FACTOR_BENCH_EVIDENCE_PROFILE_TYPES,
  FACTOR_BENCH_MODES,
} from "../evidence/factorBenchEvidenceContract";


export const FACTOR_BENCH_SESSION_CONTRACT_VERSION =
  "FACTOR_BENCH_SESSION_V1";


export const FACTOR_BENCH_SESSION_LENGTH_TYPES =
  Object.freeze({
    QUICK: "QUICK",
    STANDARD: "STANDARD",
    EXTENDED: "EXTENDED",
    CONTINUOUS: "CONTINUOUS",
    STRUCTURED_ROUND: "STRUCTURED_ROUND",
  });


export const FACTOR_BENCH_ENGINE =
  "DIVISIBILITY_LAB";


export const FACTOR_BENCH_ACTIVITY =
  "FACTOR_BENCH";


export const FACTOR_BENCH_GENERATOR =
  "FACTOR_BENCH_TARGET_GENERATOR_V1";


export const FACTOR_BENCH_ROUND_GENERATOR =
  "FACTOR_BENCH_ROUND_GENERATOR_V1";


const PRACTICE_LENGTH_POLICY =
  Object.freeze({
    [FACTOR_BENCH_SESSION_LENGTH_TYPES.QUICK]: {
      challengeCount: 1,
      continuous: false,
    },

    [FACTOR_BENCH_SESSION_LENGTH_TYPES.STANDARD]: {
      challengeCount: 5,
      continuous: false,
    },

    [FACTOR_BENCH_SESSION_LENGTH_TYPES.EXTENDED]: {
      challengeCount: 10,
      continuous: false,
    },

    [FACTOR_BENCH_SESSION_LENGTH_TYPES.CONTINUOUS]: {
      challengeCount: null,
      continuous: true,
    },
  });


const MODE_POLICIES =
  Object.freeze({
    [FACTOR_BENCH_MODES.PAIR_PRACTICE]: {
      evidenceContext:
        FACTOR_BENCH_EVIDENCE_CONTEXTS.PRACTICE,

      taskRequirements: {
        factorPairs: true,
        factorSet: false,
        completenessJudgment: false,
      },

      evidenceEntitlements: {
        factorIdentification: true,
        factorPairStructure: true,
        factorSetCompleteness: false,
        completenessJudgment: false,
        squarePairHandling: false,
      },

      evidenceProfileType:
        FACTOR_BENCH_EVIDENCE_PROFILE_TYPES.PRACTICE_PROFILE,

      lengthPolicy:
        "CONFIGURABLE_PRACTICE",
    },


    [FACTOR_BENCH_MODES.FACTOR_SET_PRACTICE]: {
      evidenceContext:
        FACTOR_BENCH_EVIDENCE_CONTEXTS.PRACTICE,

      taskRequirements: {
        factorPairs: false,
        factorSet: true,
        completenessJudgment: false,
      },

      evidenceEntitlements: {
        factorIdentification: true,
        factorPairStructure: false,
        factorSetCompleteness: true,
        completenessJudgment: false,
        squarePairHandling: false,
      },

      evidenceProfileType:
        FACTOR_BENCH_EVIDENCE_PROFILE_TYPES.PRACTICE_PROFILE,

      lengthPolicy:
        "CONFIGURABLE_PRACTICE",
    },


    [FACTOR_BENCH_MODES.FULL_PRACTICE]: {
      evidenceContext:
        FACTOR_BENCH_EVIDENCE_CONTEXTS.PRACTICE,

      taskRequirements: {
        factorPairs: true,
        factorSet: true,
        completenessJudgment: true,
      },

      evidenceEntitlements: {
        factorIdentification: true,
        factorPairStructure: true,
        factorSetCompleteness: true,
        completenessJudgment: true,
        squarePairHandling: true,
      },

      evidenceProfileType:
        FACTOR_BENCH_EVIDENCE_PROFILE_TYPES.PRACTICE_PROFILE,

      lengthPolicy:
        "CONFIGURABLE_PRACTICE",
    },


    [FACTOR_BENCH_MODES.QUICK_CHALLENGE]: {
      evidenceContext:
        FACTOR_BENCH_EVIDENCE_CONTEXTS.QUICK_PROBE,

      taskRequirements: {
        factorPairs: true,
        factorSet: true,
        completenessJudgment: true,
      },

      evidenceEntitlements: {
        factorIdentification: true,
        factorPairStructure: true,
        factorSetCompleteness: true,
        completenessJudgment: true,
        squarePairHandling: true,
      },

      evidenceProfileType:
        FACTOR_BENCH_EVIDENCE_PROFILE_TYPES.QUICK_PROBE,

      lengthPolicy:
        "FIXED_QUICK",
    },


    [FACTOR_BENCH_MODES.EVIDENCE_ROUND]: {
      evidenceContext:
        FACTOR_BENCH_EVIDENCE_CONTEXTS.STRUCTURED_ROUND,

      taskRequirements: {
        factorPairs: true,
        factorSet: true,
        completenessJudgment: true,
      },

      evidenceEntitlements: {
        factorIdentification: true,
        factorPairStructure: true,
        factorSetCompleteness: true,
        completenessJudgment: true,
        squarePairHandling: true,
      },

      evidenceProfileType:
        FACTOR_BENCH_EVIDENCE_PROFILE_TYPES.EVIDENCE_ROUND_PROFILE,

      lengthPolicy:
        "FIXED_STRUCTURED_ROUND",
    },
  });


function createSessionEpisodeId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    `factor-bench-session-${Date.now()}-` +
    Math.random().toString(36).slice(2)
  );
}


function requireMode(
  mode
) {
  if (
    !mode ||
    !Object.prototype.hasOwnProperty.call(
      MODE_POLICIES,
      mode
    )
  ) {
    throw new Error(
      `Unsupported Factor Bench session mode: ${mode ?? "undefined"}.`
    );
  }

  return MODE_POLICIES[mode];
}


function resolveSessionPolicy({
  modePolicy,
  lengthType,
}) {
  if (
    modePolicy.lengthPolicy ===
    "FIXED_QUICK"
  ) {
    if (
      lengthType &&
      lengthType !==
        FACTOR_BENCH_SESSION_LENGTH_TYPES.QUICK
    ) {
      throw new Error(
        "Quick Challenge requires QUICK session length."
      );
    }

    return {
      lengthType:
        FACTOR_BENCH_SESSION_LENGTH_TYPES.QUICK,

      challengeCount: 1,

      continuous: false,
    };
  }


  if (
    modePolicy.lengthPolicy ===
    "FIXED_STRUCTURED_ROUND"
  ) {
    if (
      lengthType &&
      lengthType !==
        FACTOR_BENCH_SESSION_LENGTH_TYPES.STRUCTURED_ROUND
    ) {
      throw new Error(
        "Evidence Round requires STRUCTURED_ROUND session length."
      );
    }

    return {
      lengthType:
        FACTOR_BENCH_SESSION_LENGTH_TYPES.STRUCTURED_ROUND,

      challengeCount: 5,

      continuous: false,
    };
  }


  const resolvedLengthType =
    lengthType ??
    FACTOR_BENCH_SESSION_LENGTH_TYPES.STANDARD;

  const practicePolicy =
    PRACTICE_LENGTH_POLICY[
      resolvedLengthType
    ];

  if (!practicePolicy) {
    throw new Error(
      `Unsupported Factor Bench practice session length: ${resolvedLengthType}.`
    );
  }

  return {
    lengthType:
      resolvedLengthType,

    challengeCount:
      practicePolicy.challengeCount,

    continuous:
      practicePolicy.continuous,
  };
}


export function createFactorBenchSessionContract({
  mode,
  lengthType,
  sessionEpisodeId,
} = {}) {
  const modePolicy =
    requireMode(
      mode
    );

  const sessionPolicy =
    resolveSessionPolicy({
      modePolicy,
      lengthType,
    });

  const resolvedSessionEpisodeId =
    sessionEpisodeId ??
    createSessionEpisodeId();

  if (
    typeof resolvedSessionEpisodeId !== "string" ||
    resolvedSessionEpisodeId.trim().length === 0
  ) {
    throw new Error(
      "Factor Bench sessionEpisodeId must be a non-empty string."
    );
  }

  return structuredClone({
    sessionContractVersion:
      FACTOR_BENCH_SESSION_CONTRACT_VERSION,

    sessionEpisodeId:
      resolvedSessionEpisodeId,

    engine:
      FACTOR_BENCH_ENGINE,

    activity:
      FACTOR_BENCH_ACTIVITY,

    mode,

    evidenceContext:
      modePolicy.evidenceContext,

    taskRequirements:
      modePolicy.taskRequirements,

    evidenceEntitlements:
      modePolicy.evidenceEntitlements,

    sessionPolicy,

    generationPolicy: {
      generator:
        FACTOR_BENCH_GENERATOR,

      roundGenerator:
        FACTOR_BENCH_ROUND_GENERATOR,
    },

    completionPolicy: {
      maxMeaningfulAttemptsPerChallenge:
        3,
    },

    evidencePolicy: {
      profileType:
        modePolicy.evidenceProfileType,
    },
  });
}
