import {
  getActiveSymbolBankRecords,
} from "../symbolBank";

import {
  generateSymbolChallengeRound,
} from "./index";

import {
  EXPERIENCE_MODES,
  EXPERIENCE_PROFILES,
} from "./constants";

import {
  validateRound,
} from "./validator";

const QB05 = "QB-05";

const BASE_CASES = [
  {
    label:
      "CHALLENGE / FREE / ALL / D2",
    config: {
      experienceMode:
        EXPERIENCE_MODES.CHALLENGE,
      level: "all",
      difficulty: "D2",
      memberAccess: false,
      seed:
        "2ba1-challenge-free-all-d2",
    },
    expected: {
      roundSize: 10,
      optionCount: 4,
      memberAccess: false,
    },
  },

  {
    label:
      "CHALLENGE / MEMBER / ALL / D3",
    config: {
      experienceMode:
        EXPERIENCE_MODES.CHALLENGE,
      level: "all",
      difficulty: "D3",
      memberAccess: true,
      seed:
        "2ba1-challenge-member-all-d3",
    },
    expected: {
      roundSize: 10,
      optionCount: 4,
      memberAccess: true,
    },
  },

  {
    label:
      "FOCUS / ALL / D1",
    config: {
      experienceMode:
        EXPERIENCE_MODES.FOCUS,
      level: "all",
      difficulty: "D1",
      memberAccess: false,
      seed:
        "2ba1-focus-all-d1",
    },
    expected: {
      roundSize: 5,
      optionCount: 2,
      memberAccess: false,
    },
  },

  {
    label:
      "FOCUS / ALL / D2",
    config: {
      experienceMode:
        EXPERIENCE_MODES.FOCUS,
      level: "all",
      difficulty: "D2",
      memberAccess: false,
      seed:
        "2ba1-focus-all-d2",
    },
    expected: {
      roundSize: 5,
      optionCount: 2,
      memberAccess: false,
    },
  },

  {
    label:
      "FOCUS / L1 / D2",
    config: {
      experienceMode:
        EXPERIENCE_MODES.FOCUS,
      level: 1,
      difficulty: "D2",
      memberAccess: false,
      seed:
        "2ba1-focus-l1-d2",
    },
    expected: {
      roundSize: 5,
      optionCount: 2,
      memberAccess: false,
    },
  },

  {
    label:
      "FOCUS / FORCED FREE",
    config: {
      experienceMode:
        EXPERIENCE_MODES.FOCUS,
      level: "all",
      difficulty: "D2",
      memberAccess: true,
      seed:
        "2ba1-focus-forced-free",
    },
    expected: {
      roundSize: 5,
      optionCount: 2,
      memberAccess: false,
    },
  },
];

function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(message);
  }
}

function getOptions(
  encounter
) {
  return Array.isArray(
    encounter.optionPayload
  )
    ? encounter.optionPayload
    : [];
}

function getRecordMap(
  records
) {
  return new Map(
    records.map(
      (record) => [
        String(
          record.symbol_id
        ),
        record,
      ]
    )
  );
}

function getConfusionGroups(
  record
) {
  return Array.isArray(
    record
      ?.confusion_group_ids
  )
    ? record
        .confusion_group_ids
        .map(String)
    : [];
}

function getSharedGroups(
  first,
  second
) {
  const firstGroups =
    new Set(
      getConfusionGroups(
        first
      )
    );

  return getConfusionGroups(
    second
  ).filter(
    (groupId) =>
      firstGroups.has(
        groupId
      )
  );
}

function isFreeRecord(
  record
) {
  return (
    record?.access_tier ===
    "free"
  );
}

function validateBaseCase({
  round,
  expected,
  recordMap,
}) {
  assert(
    round.config
      .roundSize ===
      expected.roundSize,
    `Expected roundSize ${expected.roundSize}; received ${round.config.roundSize}.`
  );

  assert(
    round.config
      .optionCount ===
      expected.optionCount,
    `Expected optionCount ${expected.optionCount}; received ${round.config.optionCount}.`
  );

  assert(
    round.config
      .memberAccess ===
      expected.memberAccess,
    `Expected memberAccess ${expected.memberAccess}; received ${round.config.memberAccess}.`
  );

  assert(
    round.encounters
      .length ===
      expected.roundSize,
    `Expected ${expected.roundSize} encounters; received ${round.encounters.length}.`
  );

  for (
    const encounter of
    round.encounters
  ) {
    assert(
      getOptions(
        encounter
      ).length ===
        expected.optionCount,
      `${encounter.encounterId} expected ${expected.optionCount} options.`
    );

    assert(
      encounter
        ?.generationMetadata
        ?.optionCount ===
        expected.optionCount,
      `${encounter.encounterId} has incorrect optionCount metadata.`
    );
  }

  const validation =
    validateRound(round);

  assert(
    validation.valid,
    validation.errors.join(
      "\n"
    )
  );

  if (
    round.config
      .experienceMode ===
    EXPERIENCE_MODES.FOCUS
  ) {
    const unique =
      new Set(
        round.encounters.map(
          (encounter) =>
            encounter.symbolId
        )
      );

    assert(
      unique.size === 5,
      `Focus round expected 5 unique symbols; received ${unique.size}.`
    );

    for (
      const encounter of
      round.encounters
    ) {
      const target =
        recordMap.get(
          String(
            encounter.symbolId
          )
        );

      assert(
        isFreeRecord(target),
        `Focus target ${encounter.symbolId} is not free.`
      );

      for (
        const option of
        getOptions(encounter)
      ) {
        const optionRecord =
          recordMap.get(
            String(
              option.symbolId
            )
          );

        assert(
          isFreeRecord(
            optionRecord
          ),
          `Focus option ${option.symbolId} is not free.`
        );
      }
    }
  }
}

function validateQB05Integrity({
  round,
  recordMap,
}) {
  let qb05Count = 0;

  for (
    const encounter of
    round.encounters
  ) {
    if (
      encounter
        .questionBehaviour !==
      QB05
    ) {
      continue;
    }

    qb05Count += 1;

    const target =
      recordMap.get(
        String(
          encounter.symbolId
        )
      );

    const distractors =
      getOptions(
        encounter
      ).filter(
        (option) =>
          option.id !==
          encounter.correctOptionId
      );

    assert(
      distractors.length ===
        round.config
          .optionCount -
          1,
      `${encounter.encounterId} has incorrect distractor count.`
    );

    const approved =
      distractors.filter(
        (option) => {
          const candidate =
            recordMap.get(
              String(
                option.symbolId
              )
            );

          const liveShared =
            getSharedGroups(
              target,
              candidate
            );

          const declared =
            Array.isArray(
              option
                .confusionGroupIds
            )
              ? option
                  .confusionGroupIds
                  .map(String)
              : [];

          return (
            liveShared.length >
              0 &&
            declared.some(
              (groupId) =>
                liveShared.includes(
                  groupId
                )
            )
          );
        }
      );

    assert(
      approved.length >= 1,
      `${encounter.encounterId} QB-05 has no approved live confusion distractor.`
    );

    if (
      round.config
        .experienceMode ===
      EXPERIENCE_MODES.FOCUS
    ) {
      assert(
        distractors.length === 1,
        `${encounter.encounterId} Focus QB-05 must have exactly one distractor.`
      );

      assert(
        approved.length === 1,
        `${encounter.encounterId} Focus QB-05 sole distractor is not the approved confusable.`
      );
    }
  }

  return qb05Count;
}

function runDeterminismTest({
  release,
  records,
}) {
  const config = {
    experienceMode:
      EXPERIENCE_MODES.FOCUS,
    level: "all",
    difficulty: "D2",
    memberAccess: false,
    seed:
      "2ba1-determinism",
  };

  const first =
    generateSymbolChallengeRound({
      release,
      records,
      config,
    });

  const second =
    generateSymbolChallengeRound({
      release,
      records,
      config,
    });

  const identical =
    JSON.stringify(first) ===
    JSON.stringify(second);

  assert(
    identical,
    "Same seed and configuration did not produce an identical round."
  );

  return identical;
}

function runTamperTest({
  release,
  records,
}) {
  const round =
    generateSymbolChallengeRound({
      release,
      records,
      config: {
        experienceMode:
          EXPERIENCE_MODES.FOCUS,
        difficulty: "D1",
        level: "all",
        memberAccess: false,
        seed:
          "2ba1-tamper",
      },
    });

  const tampered =
    structuredClone(round);

  tampered.config.optionCount =
    EXPERIENCE_PROFILES
      .CHALLENGE
      .optionCount;

  const result =
    validateRound(tampered);

  assert(
    result.valid === false,
    "Tampered Focus optionCount unexpectedly passed validation."
  );

  return result;
}

function runStress({
  release,
  records,
  recordMap,
}) {
  const summary = {
    passed: 0,
    failed: 0,
    challengeRounds: 0,
    focusRounds: 0,
    qb05Encounters: 0,
    focusQB05Encounters: 0,
    failures: [],
  };

  const modes = [
    EXPERIENCE_MODES.CHALLENGE,
    EXPERIENCE_MODES.FOCUS,
  ];

  for (
    const experienceMode of
    modes
  ) {
    for (
      let index = 0;
      index < 100;
      index += 1
    ) {
      const isFocus =
        experienceMode ===
        EXPERIENCE_MODES.FOCUS;

      const config = {
        experienceMode,
        level: "all",
        difficulty:
          index % 3 === 0
            ? "D1"
            : index % 3 === 1
              ? "D2"
              : "D3",
        memberAccess:
          isFocus
            ? index % 2 === 0
            : index % 2 === 0,
        seed:
          `2ba1-stress-${experienceMode}-${index}`,
      };

      try {
        const round =
          generateSymbolChallengeRound({
            release,
            records,
            config,
          });

        validateBaseCase({
          round,
          expected: {
            roundSize:
              isFocus
                ? 5
                : 10,
            optionCount:
              isFocus
                ? 2
                : 4,
            memberAccess:
              isFocus
                ? false
                : config.memberAccess,
          },
          recordMap,
        });

        const qb05Count =
          validateQB05Integrity({
            round,
            recordMap,
          });

        summary
          .qb05Encounters +=
          qb05Count;

        if (isFocus) {
          summary
            .focusRounds += 1;

          summary
            .focusQB05Encounters +=
            qb05Count;
        } else {
          summary
            .challengeRounds += 1;
        }

        summary.passed += 1;
      } catch (error) {
        summary.failed += 1;

        summary.failures.push({
          experienceMode,
          index,
          message:
            error?.message ||
            String(error),
        });
      }
    }
  }

  return summary;
}

export async function runSymbolChallenge2BA1Smoke() {
  console.group(
    "Gate 2B-A1 — Generator Experience Parameters"
  );

  try {
    const {
      release,
      records,
    } =
      await getActiveSymbolBankRecords();

    assert(
      release,
      "No active Symbol Bank release."
    );

    assert(
      Array.isArray(records),
      "Symbol Bank records were not returned."
    );

    const recordMap =
      getRecordMap(records);

    console.log(
      "Active release:",
      release.release_id
    );

    console.log(
      "Records received:",
      records.length
    );

    console.group(
      "BASE CASES"
    );

    for (
      const testCase of
      BASE_CASES
    ) {
      const round =
        generateSymbolChallengeRound({
          release,
          records,
          config:
            testCase.config,
        });

      validateBaseCase({
        round,
        expected:
          testCase.expected,
        recordMap,
      });

      const qb05Count =
        validateQB05Integrity({
          round,
          recordMap,
        });

      console.log(
        testCase.label,
        {
          experienceMode:
            round.config
              .experienceMode,
          encounters:
            round.encounters
              .length,
          options:
            round.config
              .optionCount,
          uniqueSymbols:
            round.config
              .uniqueSymbols,
          memberAccess:
            round.config
              .memberAccess,
          qb05Count,
          status:
            "PASS",
        }
      );
    }

    console.groupEnd();

    console.group(
      "DETERMINISM"
    );

    const deterministic =
      runDeterminismTest({
        release,
        records,
      });

    console.log(
      "Same-seed identical:",
      deterministic
    );

    console.log("PASS");

    console.groupEnd();

    console.group(
      "VALIDATOR TAMPER TEST"
    );

    const tamper =
      runTamperTest({
        release,
        records,
      });

    console.log(
      "Tampered round valid:",
      tamper.valid
    );

    console.log(
      "Tampered errors:",
      tamper.errors
    );

    console.log("PASS");

    console.groupEnd();

    console.group(
      "SEED STRESS — 200 rounds"
    );

    const stress =
      runStress({
        release,
        records,
        recordMap,
      });

    console.log(
      "passed",
      stress.passed
    );

    console.log(
      "failed",
      stress.failed
    );

    console.log(
      "challengeRounds",
      stress.challengeRounds
    );

    console.log(
      "focusRounds",
      stress.focusRounds
    );

    console.log(
      "qb05Encounters",
      stress.qb05Encounters
    );

    console.log(
      "focusQB05Encounters",
      stress.focusQB05Encounters
    );

    if (
      stress.failures.length
    ) {
      console.error(
        "failures",
        stress.failures
      );
    }

    assert(
      stress.passed === 200 &&
        stress.failed === 0,
      `Stress failed: ${stress.passed}/200 passed, ${stress.failed} failed.`
    );

    /*
     * D2/D3 are exercised repeatedly
     * in both experience modes, so the
     * stress run must prove QB-05 is
     * actually generated rather than
     * merely theoretically available.
     */
    assert(
      stress.qb05Encounters > 0,
      "Stress run produced no QB-05 encounters."
    );

    assert(
      stress
        .focusQB05Encounters >
        0,
      "Focus stress run produced no QB-05 encounters."
    );

    console.log(
      "200/200 STRESS PASS"
    );

    console.groupEnd();

    const result = {
      gate:
        "2B-A1",
      release:
        release.release_id,
      records:
        records.length,
      deterministic,
      stress,
      status:
        "PASS",
    };

    console.log(
      "2B-A1 RESULT: PASS"
    );

    return result;
  } finally {
    console.groupEnd();
  }
}