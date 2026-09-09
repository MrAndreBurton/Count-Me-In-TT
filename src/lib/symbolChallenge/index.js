import {
  getActiveSymbolBankRecords,
} from "../symbolBank";

import {
  buildCandidatePool,
} from "./candidatePool";

import {
  createSeededRandom,
} from "./seededRandom";

import {
  planRound,
} from "./roundPlanner";

import {
  assertValidRound,
} from "./validator";

import {
  EXPERIENCE_MODES,
  EXPERIENCE_PROFILES,
  GENERATOR_VERSION,
} from "./constants";

function normalizeExperienceMode(
  experienceMode
) {
  const normalized = String(
    experienceMode ||
      EXPERIENCE_MODES.CHALLENGE
  ).toUpperCase();

  if (
    !Object.values(
      EXPERIENCE_MODES
    ).includes(normalized)
  ) {
    throw new Error(
      `Unsupported Symbol Challenge experience mode: ${experienceMode}.`
    );
  }

  return normalized;
}

function normalizeLevel(level) {
  if (
    level === null ||
    level === undefined ||
    level === "all"
  ) {
    return null;
  }

  const normalized = Number(level);

  if (
    !Number.isInteger(normalized) ||
    normalized < 1 ||
    normalized > 3
  ) {
    throw new Error(
      `Unsupported Symbol Challenge level: ${level}.`
    );
  }

  return normalized;
}

function normalizeDifficulty(
  difficulty
) {
  const normalized =
    String(
      difficulty || "D1"
    ).toUpperCase();

  if (
    ![
      "D1",
      "D2",
      "D3",
    ].includes(normalized)
  ) {
    throw new Error(
      `Unsupported Symbol Challenge difficulty: ${difficulty}.`
    );
  }

  return normalized;
}

function createSeed() {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto
      .randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function normalizeConfig(
  config = {}
) {
  const experienceMode =
    normalizeExperienceMode(
      config.experienceMode
    );

  const profile =
    EXPERIENCE_PROFILES[
      experienceMode
    ];

  /*
   * AEC-1.0:
   *
   * Focus Mode is always public and
   * consumes only the free candidate
   * catalogue. A caller cannot elevate
   * Focus by passing memberAccess=true.
   */
  const memberAccess =
    experienceMode ===
    EXPERIENCE_MODES.FOCUS
      ? false
      : config.memberAccess === true;

  return {
    experienceMode,
    difficulty:
      normalizeDifficulty(
        config.difficulty
      ),
    level:
      normalizeLevel(
        config.level
      ),
    memberAccess,
    roundSize:
      profile.roundSize,
    optionCount:
      profile.optionCount,
    seed:
      String(
        config.seed ||
          createSeed()
      ),
  };
}

export function generateSymbolChallengeRound({
  release,
  records,
  config = {},
}) {
  if (!release?.release_id) {
    throw new Error(
      "An active Symbol Bank release is required."
    );
  }

  const normalized =
    normalizeConfig(config);

  const random =
    createSeededRandom(
      [
        release.release_id,
        normalized.seed,
        normalized.experienceMode,
        normalized.level || "all",
        normalized.difficulty,
        normalized.memberAccess
          ? "member"
          : "free",
        `round-${normalized.roundSize}`,
        `options-${normalized.optionCount}`,
      ].join(":")
    );

  const pool =
    buildCandidatePool(
      records,
      normalized
    );

  const encounters =
    planRound({
      pool,
      difficulty:
        normalized.difficulty,
      random,
      seed:
        normalized.seed,
      roundSize:
        normalized.roundSize,
      optionCount:
        normalized.optionCount,
    });

  const uniqueSymbols =
    new Set(
      encounters.map(
        (item) =>
          item.symbolId
      )
    ).size;

  const round = {
    releaseId:
      release.release_id,

    symbolBankVersion:
      release.symbol_bank_version ||
      release.release_id,

    gameContractVersion:
      release.game_contract_version ||
      null,

    questionGenerationSpecVersion:
      release
        .question_generation_spec_version ||
      null,

    freeCatalogueVersion:
      release.free_catalogue_version ||
      null,

    generatorVersion:
      GENERATOR_VERSION,

    config: {
      experienceMode:
        normalized.experienceMode,
      level:
        normalized.level,
      difficulty:
        normalized.difficulty,
      memberAccess:
        normalized.memberAccess,
      seed:
        normalized.seed,
      roundSize:
        normalized.roundSize,
      optionCount:
        normalized.optionCount,
      uniqueSymbols,
    },

    encounters,
  };

  return assertValidRound(
    round
  );
}

export async function loadAndGenerateSymbolChallengeRound(
  config = {}
) {
  const {
    release,
    records,
  } =
    await getActiveSymbolBankRecords();

  if (!release) {
    throw new Error(
      "No active Mathematics Symbol Bank release is available."
    );
  }

  return generateSymbolChallengeRound({
    release,
    records,
    config,
  });
}

export {
  buildCandidatePool,
  getEligibleBehaviours,
} from "./candidatePool";

export {
  validateRound,
} from "./validator";