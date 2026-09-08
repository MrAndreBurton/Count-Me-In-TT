import {
  getActiveSymbolBankRecords,
} from "../symbolBank";

import {
  generateSymbolChallengeRound,
} from "./index";

import {
  getSemanticAnswerKeys,
  normalizeAnswer,
} from "./answerResolver";

import {
  validateRound,
} from "./validator";

const QB05 = "QB-05";

const BASE_CASES = [
  {
    label:
      "FREE / ALL / D1",
    config: {
      level: "all",
      difficulty: "D1",
      memberAccess: false,
      seed:
        "b3b2-free-all-d1",
    },
  },

  {
    label:
      "FREE / ALL / D2",
    config: {
      level: "all",
      difficulty: "D2",
      memberAccess: false,
      seed:
        "b3b2-free-all-d2",
    },
  },

  {
    label:
      "FREE / L1 / D2",
    config: {
      level: 1,
      difficulty: "D2",
      memberAccess: false,
      seed:
        "b3b2-free-l1-d2",
    },
  },

  {
    label:
      "MEMBER / ALL / D3",
    config: {
      level: "all",
      difficulty: "D3",
      memberAccess: true,
      seed:
        "b3b2-member-all-d3",
    },
  },

  {
    label:
      "MEMBER / L2 / D3",
    config: {
      level: 2,
      difficulty: "D3",
      memberAccess: true,
      seed:
        "b3b2-member-l2-d3",
    },
  },

  {
    label:
      "MEMBER / L3 / D3",
    config: {
      level: 3,
      difficulty: "D3",
      memberAccess: true,
      seed:
        "b3b2-member-l3-d3",
    },
  },
];

function getOptions(
  encounter
) {
  return Array.isArray(
    encounter.optionPayload
  )
    ? encounter.optionPayload
    : [];
}

function getConfusionGroups(
  record
) {
  return Array.isArray(
    record?.confusion_group_ids
  )
    ? record.confusion_group_ids.map(
        String
      )
    : [];
}

function sharedGroups(
  first,
  second
) {
  const firstGroups =
    new Set(
      getConfusionGroups(first)
    );

  return getConfusionGroups(
    second
  ).filter(
    (groupId) =>
      firstGroups.has(groupId)
  );
}

function setsIntersect(
  first,
  second
) {
  for (
    const value of first
  ) {
    if (second.has(value)) {
      return true;
    }
  }

  return false;
}

function assertOptionIntegrity(
  encounter
) {
  const options =
    getOptions(encounter);

  if (options.length !== 4) {
    throw new Error(
      `${encounter.symbolId}: expected 4 options; received ${options.length}.`
    );
  }

  const ids =
    options.map(
      (option) =>
        option.id
    );

  if (
    new Set(ids).size !==
    ids.length
  ) {
    throw new Error(
      `${encounter.symbolId}: duplicate option IDs detected.`
    );
  }

  const values =
    options.map(
      (option) =>
        normalizeAnswer(
          option.value
        )
    );

  if (
    new Set(values).size !==
    values.length
  ) {
    throw new Error(
      `${encounter.symbolId}: duplicate normalized option values detected.`
    );
  }

  if (
    !ids.includes(
      encounter.correctOptionId
    )
  ) {
    throw new Error(
      `${encounter.symbolId}: correct option is missing.`
    );
  }
}

function assertSemanticIsolation(
  encounter,
  recordsById
) {
  const target =
    recordsById.get(
      encounter.symbolId
    );

  if (!target) {
    throw new Error(
      `Missing target record ${encounter.symbolId}.`
    );
  }

  const occupied =
    new Set(
      getSemanticAnswerKeys(
        target,
        encounter.questionBehaviour
      )
    );

  for (
    const option of
    getOptions(encounter)
  ) {
    if (
      option.id ===
      encounter.correctOptionId
    ) {
      continue;
    }

    const candidate =
      recordsById.get(
        option.symbolId
      );

    if (!candidate) {
      throw new Error(
        `${encounter.symbolId}: missing distractor record ${option.symbolId}.`
      );
    }

    const candidateKeys =
      getSemanticAnswerKeys(
        candidate,
        encounter.questionBehaviour
      );

    if (
      setsIntersect(
        occupied,
        candidateKeys
      )
    ) {
      throw new Error(
        `${encounter.symbolId}: semantic collision with ${candidate.symbol_id}.`
      );
    }

    for (
      const key of
      candidateKeys
    ) {
      occupied.add(key);
    }
  }
}

function assertQB05Provenance(
  encounter,
  recordsById
) {
  if (
    encounter.questionBehaviour !==
    QB05
  ) {
    return false;
  }

  const target =
    recordsById.get(
      encounter.symbolId
    );

  if (!target) {
    throw new Error(
      `QB-05 target ${encounter.symbolId} is missing from live records.`
    );
  }

  const approved =
    getOptions(encounter).filter(
      (option) =>
        option.id !==
        encounter.correctOptionId &&
        Array.isArray(
          option.confusionGroupIds
        ) &&
        option.confusionGroupIds
          .length > 0
    );

  if (!approved.length) {
    throw new Error(
      `${encounter.symbolId}: QB-05 has no declared approved confusable.`
    );
  }

  for (
    const option of
    approved
  ) {
    const candidate =
      recordsById.get(
        option.symbolId
      );

    if (!candidate) {
      throw new Error(
        `${encounter.symbolId}: QB-05 confusable ${option.symbolId} is missing from live records.`
      );
    }

    const actualShared =
      sharedGroups(
        target,
        candidate
      );

    if (!actualShared.length) {
      throw new Error(
        `${encounter.symbolId}: ${candidate.symbol_id} is falsely labelled as an approved confusable.`
      );
    }

    const declared =
      new Set(
        option.confusionGroupIds.map(
          String
        )
      );

    if (
      !actualShared.some(
        (groupId) =>
          declared.has(groupId)
      )
    ) {
      throw new Error(
        `${encounter.symbolId}: confusion provenance does not match live Symbol Bank groups for ${candidate.symbol_id}.`
      );
    }
  }

  return true;
}

function assertAccessBoundary(
  round,
  recordsById
) {
  if (
    round.config
      ?.memberAccess === true
  ) {
    return;
  }

  for (
    const encounter of
    round.encounters
  ) {
    const target =
      recordsById.get(
        encounter.symbolId
      );

    if (
      !target ||
      target.access_tier !==
        "free" ||
      target.challenge_free_eligible !==
        true
    ) {
      throw new Error(
        `Free round target access leak: ${encounter.symbolId}.`
      );
    }

    for (
      const option of
      getOptions(encounter)
    ) {
      const record =
        recordsById.get(
          option.symbolId
        );

      if (
        !record ||
        record.access_tier !==
          "free" ||
        record.challenge_free_eligible !==
          true
      ) {
        throw new Error(
          `Free round option access leak: ${option.symbolId}.`
        );
      }
    }
  }
}

function assertRound(
  round,
  recordsById
) {
  const validation =
    validateRound(round);

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(
        "\n"
      )
    );
  }

  for (
    const encounter of
    round.encounters
  ) {
    assertOptionIntegrity(
      encounter
    );

    assertSemanticIsolation(
      encounter,
      recordsById
    );

    assertQB05Provenance(
      encounter,
      recordsById
    );
  }

  assertAccessBoundary(
    round,
    recordsById
  );
}

function fingerprint(round) {
  return JSON.stringify(
    round.encounters.map(
      (encounter) => ({
        symbolId:
          encounter.symbolId,

        questionBehaviour:
          encounter.questionBehaviour,

        correctOptionId:
          encounter.correctOptionId,

        options:
          encounter.optionPayload.map(
            (option) => ({
              id:
                option.id,
              symbolId:
                option.symbolId,
              value:
                option.value,
              confusionGroupIds:
                option.confusionGroupIds,
            })
          ),
      })
    )
  );
}

function countQB05(
  round
) {
  return round.encounters.filter(
    (encounter) =>
      encounter.questionBehaviour ===
      QB05
  ).length;
}

function makeTamperedQB05Round(
  round
) {
  const clone =
    structuredClone(round);

  const encounter =
    clone.encounters.find(
      (item) =>
        item.questionBehaviour ===
        QB05
    );

  if (!encounter) {
    return null;
  }

  for (
    const option of
    encounter.optionPayload
  ) {
    option.confusionGroupIds = [];
  }

  return clone;
}

export async function runSymbolChallengeB3B2Smoke() {
  console.group(
    "Gate 2A-B3-B2 — QB-05 Confusion Pair Enforcement"
  );

  try {
    const {
      release,
      records,
    } =
      await getActiveSymbolBankRecords();

    if (!release) {
      throw new Error(
        "No active Symbol Bank release."
      );
    }

    if (
      release.release_id !==
      "MSB-1.0"
    ) {
      throw new Error(
        `Expected MSB-1.0; received ${release.release_id}.`
      );
    }

    if (
      records.length !== 92
    ) {
      throw new Error(
        `Expected 92 records; received ${records.length}.`
      );
    }

    console.log(
      "Active release:",
      release.release_id
    );

    console.log(
      "Records received:",
      records.length
    );

    const recordsById =
      new Map(
        records.map(
          (record) => [
            record.symbol_id,
            record,
          ]
        )
      );

    let baseQB05Count = 0;

    for (
      const testCase of
      BASE_CASES
    ) {
      console.group(
        testCase.label
      );

      try {
        const round =
          generateSymbolChallengeRound({
            release,
            records,
            config:
              testCase.config,
          });

        assertRound(
          round,
          recordsById
        );

        const qb05Count =
          countQB05(round);

        baseQB05Count +=
          qb05Count;

        console.log({
          encounters:
            round.encounters.length,

          uniqueSymbols:
            new Set(
              round.encounters.map(
                (item) =>
                  item.symbolId
              )
            ).size,

          qb05Count,
        });

        console.log("PASS");
      } finally {
        console.groupEnd();
      }
    }

    console.group(
      "DETERMINISM"
    );

    const deterministicConfig = {
      level: "all",
      difficulty: "D3",
      memberAccess: true,
      seed:
        "b3b2-determinism",
    };

    const first =
      generateSymbolChallengeRound({
        release,
        records,
        config:
          deterministicConfig,
      });

    const second =
      generateSymbolChallengeRound({
        release,
        records,
        config:
          deterministicConfig,
      });

    const deterministic =
      fingerprint(first) ===
      fingerprint(second);

    console.log(
      "Same-seed identical:",
      deterministic
    );

    if (!deterministic) {
      throw new Error(
        "B3-B2 deterministic generation failed."
      );
    }

    console.log("PASS");
    console.groupEnd();

    console.group(
      "VALIDATOR TAMPER TEST"
    );

    let tamperSource = null;

    for (
      let index = 1;
      index <= 100;
      index += 1
    ) {
      const candidate =
        generateSymbolChallengeRound({
          release,
          records,
          config: {
            level: "all",
            difficulty: "D3",
            memberAccess: true,
            seed:
              `b3b2-tamper-source-${index}`,
          },
        });

      if (
        countQB05(candidate) > 0
      ) {
        tamperSource =
          candidate;
        break;
      }
    }

    if (!tamperSource) {
      throw new Error(
        "Could not generate a QB-05 encounter for validator tamper test."
      );
    }

    const tampered =
      makeTamperedQB05Round(
        tamperSource
      );

    const tamperedValidation =
      validateRound(tampered);

    console.log(
      "Tampered round valid:",
      tamperedValidation.valid
    );

    console.log(
      "Tampered errors:",
      tamperedValidation.errors
    );

    if (
      tamperedValidation.valid
    ) {
      throw new Error(
        "Validator failed to reject QB-05 without approved confusion provenance."
      );
    }

    if (
      !tamperedValidation.errors.some(
        (error) =>
          error.includes(
            "QB-05 requires at least one approved confusion-group distractor"
          )
      )
    ) {
      throw new Error(
        "Validator rejected tampered QB-05 for the wrong reason."
      );
    }

    console.log("PASS");
    console.groupEnd();

    console.group(
      "SEED STRESS — 200 rounds"
    );

    let passed = 0;
    let failed = 0;
    let qb05Encounters = 0;
    let freeQB05Encounters = 0;
    let memberQB05Encounters = 0;

    for (
      let index = 1;
      index <= 100;
      index += 1
    ) {
      for (
        const memberAccess of
        [false, true]
      ) {
        try {
          const round =
            generateSymbolChallengeRound({
              release,
              records,
              config: {
                level: "all",
                difficulty: "D3",
                memberAccess,
                seed:
                  `b3b2-stress-${memberAccess ? "member" : "free"}-${index}`,
              },
            });

          assertRound(
            round,
            recordsById
          );

          const count =
            countQB05(round);

          qb05Encounters +=
            count;

          if (memberAccess) {
            memberQB05Encounters +=
              count;
          } else {
            freeQB05Encounters +=
              count;
          }

          passed += 1;
        } catch (error) {
          failed += 1;

          console.error(
            `Stress ${memberAccess ? "MEMBER" : "FREE"} ${index}`,
            error
          );
        }
      }
    }

    console.log({
      passed,
      failed,
      total:
        passed + failed,
      qb05Encounters,
      freeQB05Encounters,
      memberQB05Encounters,
      baseQB05Count,
    });

    if (failed > 0) {
      throw new Error(
        `B3-B2 stress audit failed ${failed} round(s).`
      );
    }

    if (
      passed !== 200
    ) {
      throw new Error(
        `Expected 200 stress rounds; received ${passed}.`
      );
    }

    if (
      qb05Encounters === 0
    ) {
      throw new Error(
        "QB-05 was never exercised during stress testing."
      );
    }

    if (
      freeQB05Encounters === 0
    ) {
      throw new Error(
        "Free QB-05 path was never exercised."
      );
    }

    if (
      memberQB05Encounters === 0
    ) {
      throw new Error(
        "Member QB-05 path was never exercised."
      );
    }

    console.log(
      "200/200 STRESS PASS"
    );

    console.groupEnd();

    console.log(
      "B3-B2 RESULT: PASS"
    );

    return {
      release:
        release.release_id,

      records:
        records.length,

      deterministic,

      stress: {
        passed,
        failed,
        qb05Encounters,
        freeQB05Encounters,
        memberQB05Encounters,
      },
    };
  } finally {
    console.groupEnd();
  }
}