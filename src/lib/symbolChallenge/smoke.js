import { getActiveSymbolBankRecords } from "../symbolBank";
import { generateSymbolChallengeRound } from "./index";

import {
  getSemanticAnswerKeys,
  normalizeAnswer,
} from "./answerResolver";

const BASE_CASES = [
  {
    label: "FREE / ALL / D1",
    config: {
      level: "all",
      difficulty: "D1",
      memberAccess: false,
      seed: "b3a-free-all-d1",
    },
  },
  {
    label: "FREE / L1 / D1",
    config: {
      level: 1,
      difficulty: "D1",
      memberAccess: false,
      seed: "b3a-free-l1-d1",
    },
  },
  {
    label: "FREE / L2 / D2",
    config: {
      level: 2,
      difficulty: "D2",
      memberAccess: false,
      seed: "b3a-free-l2-d2",
    },
  },
  {
    label: "FREE / L3 / D3",
    config: {
      level: 3,
      difficulty: "D3",
      memberAccess: false,
      seed: "b3a-free-l3-d3",
    },
  },
  {
    label: "MEMBER / ALL / D3",
    config: {
      level: "all",
      difficulty: "D3",
      memberAccess: true,
      seed: "b3a-member-all-d3",
    },
  },
];

function getOptions(encounter) {
  return Array.isArray(encounter.optionPayload)
    ? encounter.optionPayload
    : [];
}

function validateOptionIntegrity(encounter) {
  const options = getOptions(encounter);

  if (options.length !== 4) {
    throw new Error(
      `${encounter.symbolId}: expected 4 options; received ${options.length}.`
    );
  }

  const ids = options.map((option) => option.id);

  if (new Set(ids).size !== ids.length) {
    throw new Error(
      `${encounter.symbolId}: duplicate option IDs detected.`
    );
  }

  const values = options.map((option) =>
    normalizeAnswer(option.value)
  );

  if (new Set(values).size !== values.length) {
    throw new Error(
      `${encounter.symbolId}: duplicate normalized option values detected.`
    );
  }

  if (!ids.includes(encounter.correctOptionId)) {
    throw new Error(
      `${encounter.symbolId}: correct option is missing.`
    );
  }
}

function validateSemanticIsolation(
  encounter,
  recordsById
) {
  const target = recordsById.get(
    encounter.symbolId
  );

  if (!target) {
    throw new Error(
      `Missing target record ${encounter.symbolId}.`
    );
  }

  const occupied = new Set(
    getSemanticAnswerKeys(
      target,
      encounter.questionBehaviour
    )
  );

  for (const option of getOptions(encounter)) {
    if (option.id === encounter.correctOptionId) {
      continue;
    }

    const candidate = recordsById.get(
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

    for (const key of candidateKeys) {
      if (occupied.has(key)) {
        throw new Error(
          `${encounter.symbolId}: semantic collision with ${candidate.symbol_id} on "${key}".`
        );
      }
    }

    for (const key of candidateKeys) {
      occupied.add(key);
    }
  }
}

function sharesConfusionGroup(first, second) {
  const firstGroups = new Set(
    Array.isArray(first?.confusion_group_ids)
      ? first.confusion_group_ids
      : []
  );

  return (
    firstGroups.size > 0 &&
    Array.isArray(second?.confusion_group_ids) &&
    second.confusion_group_ids.some((groupId) =>
      firstGroups.has(groupId)
    )
  );
}

function countSharedConfusionDistractors(
  round,
  recordsById
) {
  let encountersWithSharedConfusion = 0;
  let sharedConfusionDistractors = 0;

  for (const encounter of round.encounters) {
    const target = recordsById.get(
      encounter.symbolId
    );

    if (!target) {
      continue;
    }

    let encounterHasShared = false;

    for (const option of getOptions(encounter)) {
      if (option.id === encounter.correctOptionId) {
        continue;
      }

      const candidate = recordsById.get(
        option.symbolId
      );

      if (
        candidate &&
        sharesConfusionGroup(target, candidate)
      ) {
        sharedConfusionDistractors += 1;
        encounterHasShared = true;
      }
    }

    if (encounterHasShared) {
      encountersWithSharedConfusion += 1;
    }
  }

  return {
    encountersWithSharedConfusion,
    sharedConfusionDistractors,
  };
}

function assertRound(
  round,
  recordsById
) {
  if (
    !round ||
    !Array.isArray(round.encounters)
  ) {
    throw new Error(
      "Generated round is invalid."
    );
  }

  if (round.encounters.length !== 10) {
    throw new Error(
      `Expected 10 encounters; received ${round.encounters.length}.`
    );
  }

  for (const encounter of round.encounters) {
    validateOptionIntegrity(encounter);

    validateSemanticIsolation(
      encounter,
      recordsById
    );
  }
}

function fingerprint(round) {
  return JSON.stringify(
    round.encounters.map((item) => ({
      symbolId: item.symbolId,
      questionBehaviour:
        item.questionBehaviour,
      correctOptionId:
        item.correctOptionId,
      options: item.optionPayload.map(
        (option) => ({
          id: option.id,
          symbolId: option.symbolId,
          value: option.value,
        })
      ),
    }))
  );
}

export async function runSymbolChallengeB3ASmoke() {
  console.group(
    "Gate 2A-B3-A — Distractor Hardening Smoke"
  );

  try {
    const { release, records } =
      await getActiveSymbolBankRecords();

    if (!release) {
      throw new Error(
        "No active Symbol Bank release."
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

    if (release.release_id !== "MSB-1.0") {
      throw new Error(
        `Expected MSB-1.0; received ${release.release_id}.`
      );
    }

    if (records.length !== 92) {
      throw new Error(
        `Expected 92 records; received ${records.length}.`
      );
    }

    const recordsById = new Map(
      records.map((record) => [
        record.symbol_id,
        record,
      ])
    );

    for (const testCase of BASE_CASES) {
      console.group(testCase.label);

      try {
        const round =
          generateSymbolChallengeRound({
            release,
            records,
            config: testCase.config,
          });

        assertRound(
          round,
          recordsById
        );

        const stats =
          countSharedConfusionDistractors(
            round,
            recordsById
          );

        console.log({
          encounters:
            round.encounters.length,
          uniqueSymbols:
            new Set(
              round.encounters.map(
                (item) => item.symbolId
              )
            ).size,
          ...stats,
        });

        console.log("PASS");
      } catch (error) {
        console.error(
          "FAIL",
          error
        );

        throw error;
      } finally {
        console.groupEnd();
      }
    }

    console.group("DETERMINISM");

    const deterministicConfig = {
      level: "all",
      difficulty: "D3",
      memberAccess: true,
      seed: "b3a-determinism",
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
        "B3-A deterministic generation failed."
      );
    }

    console.log("PASS");
    console.groupEnd();

    console.group(
      "SEED STRESS — 100 rounds"
    );

    let passed = 0;
    let failed = 0;
    let sharedEncounterCount = 0;
    let sharedDistractorCount = 0;

    for (
      let index = 1;
      index <= 100;
      index += 1
    ) {
      try {
        const round =
          generateSymbolChallengeRound({
            release,
            records,
            config: {
              level: "all",
              difficulty: "D3",
              memberAccess: true,
              seed: `b3a-stress-${index}`,
            },
          });

        assertRound(
          round,
          recordsById
        );

        const stats =
          countSharedConfusionDistractors(
            round,
            recordsById
          );

        sharedEncounterCount +=
          stats.encountersWithSharedConfusion;

        sharedDistractorCount +=
          stats.sharedConfusionDistractors;

        passed += 1;
      } catch (error) {
        failed += 1;

        console.error(
          `Seed b3a-stress-${index}`,
          error
        );
      }
    }

    console.log({
      passed,
      failed,
      total: passed + failed,
      sharedEncounterCount,
      sharedDistractorCount,
    });

    if (failed > 0) {
      throw new Error(
        `B3-A stress audit failed ${failed} seed(s).`
      );
    }

    if (
      sharedDistractorCount === 0
    ) {
      throw new Error(
        "Shared-confusion priority was never exercised."
      );
    }

    console.log(
      "100/100 STRESS PASS"
    );

    console.groupEnd();

    console.log(
      "B3-A RESULT: PASS"
    );

    return {
      release:
        release.release_id,
      records: records.length,
      deterministic,
      stress: {
        passed,
        failed,
        sharedEncounterCount,
        sharedDistractorCount,
      },
    };
  } finally {
    console.groupEnd();
  }
}


