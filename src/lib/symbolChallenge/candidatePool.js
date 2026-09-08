import {
  CORE_CONTEXT_BLOCKERS,
  DIFFICULTY_BEHAVIOURS,
  SUPPORTED_RENDER_MODES,
} from "./constants";

const QB05 = "QB-05";

const RUNTIME_BEHAVIOURS_FIELD =
  "__symbolChallengeEligibleBehaviours";

function getContextConstraints(record) {
  return Array.isArray(record?.context_constraints)
    ? record.context_constraints
    : [];
}

function hasBlockedCoreContext(record) {
  const constraints =
    getContextConstraints(record);

  return CORE_CONTEXT_BLOCKERS.some(
    (constraint) =>
      constraints.includes(constraint)
  );
}

function getConfusionGroups(record) {
  return Array.isArray(
    record?.confusion_group_ids
  )
    ? record.confusion_group_ids.map(String)
    : [];
}

function sharesConfusionGroup(
  target,
  candidate
) {
  const targetGroups = new Set(
    getConfusionGroups(target)
  );

  if (!targetGroups.size) {
    return false;
  }

  return getConfusionGroups(
    candidate
  ).some((groupId) =>
    targetGroups.has(groupId)
  );
}

function getDistractorExclusions(record) {
  return new Set(
    Array.isArray(
      record?.distractor_exclusions
    )
      ? record.distractor_exclusions.map(
          String
        )
      : []
  );
}

function getCanonicalEligibleBehaviours(
  record,
  difficulty = "D1"
) {
  const allowed =
    DIFFICULTY_BEHAVIOURS[difficulty];

  if (!allowed) {
    throw new Error(
      `Unsupported Symbol Challenge difficulty: ${difficulty}`
    );
  }

  const capabilities =
    record?.game_capabilities || {};

  return allowed.filter(
    (behaviour) =>
      capabilities?.[behaviour] === true
  );
}

function hasPlayableQB05Confusable(
  target,
  pool
) {
  if (
    target?.game_capabilities?.[QB05] !== true
  ) {
    return false;
  }

  const targetGroups =
    getConfusionGroups(target);

  if (!targetGroups.length) {
    return false;
  }

  const exclusions =
    getDistractorExclusions(target);

  return pool.some((candidate) => {
    if (
      candidate.symbol_id ===
      target.symbol_id
    ) {
      return false;
    }

    if (
      exclusions.has(
        String(candidate.symbol_id)
      )
    ) {
      return false;
    }

    return sharesConfusionGroup(
      target,
      candidate
    );
  });
}

export function getEligibleBehaviours(
  record,
  difficulty = "D1"
) {
  const canonical =
    getCanonicalEligibleBehaviours(
      record,
      difficulty
    );

  const runtime =
    record?.[
      RUNTIME_BEHAVIOURS_FIELD
    ];

  /*
   * QB-05 requires knowledge of the
   * current playable pool.
   *
   * A raw canonical record therefore
   * does not automatically become
   * QB-05 playable simply because
   * MSB-1.0 authorizes QB-05.
   */
  if (!Array.isArray(runtime)) {
    return canonical.filter(
      (behaviour) =>
        behaviour !== QB05
    );
  }

  const runtimeSet =
    new Set(runtime);

  return canonical.filter(
    (behaviour) =>
      runtimeSet.has(behaviour)
  );
}

function passesCoreRecordFilters(
  record,
  config = {}
) {
  if (
    !record?.symbol_id ||
    record.is_game_active !== true
  ) {
    return false;
  }

  const renderMode = String(
    record.render_mode || ""
  ).toUpperCase();

  if (
    !SUPPORTED_RENDER_MODES.includes(
      renderMode
    )
  ) {
    return false;
  }

  if (
    config.level &&
    Number(record.level) !==
      Number(config.level)
  ) {
    return false;
  }

  if (
    config.memberAccess !== true
  ) {
    if (
      record.access_tier !== "free" ||
      record.challenge_free_eligible !== true
    ) {
      return false;
    }
  }

  if (
    hasBlockedCoreContext(record)
  ) {
    return false;
  }

  return true;
}

export function isCoreGeneratorRecordEligible(
  record,
  config = {}
) {
  if (
    !passesCoreRecordFilters(
      record,
      config
    )
  ) {
    return false;
  }

  return (
    getCanonicalEligibleBehaviours(
      record,
      config.difficulty
    ).length > 0
  );
}

export function buildCandidatePool(
  records,
  config = {}
) {
  const basePool = (
    records || []
  ).filter((record) =>
    isCoreGeneratorRecordEligible(
      record,
      config
    )
  );

  return basePool
    .map((record) => {
      const canonicalBehaviours =
        getCanonicalEligibleBehaviours(
          record,
          config.difficulty
        );

      const runtimeBehaviours =
        canonicalBehaviours.filter(
          (behaviour) => {
            if (
              behaviour !== QB05
            ) {
              return true;
            }

            return hasPlayableQB05Confusable(
              record,
              basePool
            );
          }
        );

      return {
        ...record,

        /*
         * Runtime-only generator metadata.
         *
         * This does not alter or replace
         * canonical Symbol Bank capability.
         * It is never written back to
         * CountMeInTT or AEOS.
         */
        [RUNTIME_BEHAVIOURS_FIELD]:
          runtimeBehaviours,
      };
    })
    .filter(
      (record) =>
        getEligibleBehaviours(
          record,
          config.difficulty
        ).length > 0
    );
}