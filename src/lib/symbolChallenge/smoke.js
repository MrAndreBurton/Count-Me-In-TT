import { getActiveSymbolBankRecords } from "../symbolBank";
import { generateSymbolChallengeRound } from "./index";
import { validateRound } from "./validator";

function compactRound(round) {
  return round.encounters.map((item) => ({
    q: item.answerSequence,
    symbol: item.symbolId,
    qb: item.questionBehaviour,
    level: item.level,
    correct: item.correctOptionId,
    options: item.optionPayload.map((option) => option.value),
  }));
}

function fingerprint(round) {
  return JSON.stringify(
    round.encounters.map((item) => ({
      symbolId: item.symbolId,
      questionBehaviour: item.questionBehaviour,
      correctOptionId: item.correctOptionId,
      options: item.optionPayload.map((option) => ({
        id: option.id,
        symbolId: option.symbolId,
        value: option.value,
      })),
    }))
  );
}

async function generateCase(release, records, test) {
  const round = generateSymbolChallengeRound({
    release,
    records,
    config: test.config,
  });

  const validation = validateRound(round);

  return {
    name: test.name,
    round,
    validation,
  };
}

export async function runSymbolChallengeB2Smoke() {
  console.group("Gate 2A-B2 — Generator Runtime Smoke");

  try {
    const { release, records } = await getActiveSymbolBankRecords();

    if (!release) {
      throw new Error("No active Symbol Bank release.");
    }

    console.log("Active release:", release.release_id);
    console.log("Records received:", records.length);

    const tests = [
      {
        name: "FREE / ALL / D1",
        config: {
          level: "all",
          difficulty: "D1",
          memberAccess: false,
          seed: "b2-free-all-d1",
        },
      },
      {
        name: "FREE / L1 / D1",
        config: {
          level: 1,
          difficulty: "D1",
          memberAccess: false,
          seed: "b2-free-l1-d1",
        },
      },
      {
        name: "FREE / L2 / D2",
        config: {
          level: 2,
          difficulty: "D2",
          memberAccess: false,
          seed: "b2-free-l2-d2",
        },
      },
      {
        name: "FREE / L3 / D3",
        config: {
          level: 3,
          difficulty: "D3",
          memberAccess: false,
          seed: "b2-free-l3-d3",
        },
      },
      {
        name: "MEMBER / ALL / D3",
        config: {
          level: "all",
          difficulty: "D3",
          memberAccess: true,
          seed: "b2-member-all-d3",
        },
      },
    ];

    for (const test of tests) {
      console.group(test.name);

      try {
        const result = await generateCase(release, records, test);

        console.table(compactRound(result.round));

        console.log("Round config:", result.round.config);
        console.log(
          "Unique symbols:",
          new Set(result.round.encounters.map((item) => item.symbolId)).size
        );
        console.log("Validation:", result.validation);

        if (!result.validation.valid) {
          console.error("❌ FAIL", result.validation.errors);
        } else {
          console.log("✅ PASS");
        }
      } catch (error) {
        console.error("❌ GENERATION FAILED", error);
      }

      console.groupEnd();
    }

    console.group("DETERMINISM");

    const deterministicConfig = {
      level: "all",
      difficulty: "D2",
      memberAccess: false,
      seed: "b2-determinism-001",
    };

    const roundA = generateSymbolChallengeRound({
      release,
      records,
      config: deterministicConfig,
    });

    const roundB = generateSymbolChallengeRound({
      release,
      records,
      config: deterministicConfig,
    });

    const same = fingerprint(roundA) === fingerprint(roundB);

    console.log("Same-seed identical:", same);

    if (same) {
      console.log("✅ DETERMINISM PASS");
    } else {
      console.error("❌ DETERMINISM FAIL");
    }

    console.groupEnd();

    console.group("SEED STRESS — 50 rounds");

    let passed = 0;
    let failed = 0;

    for (let index = 1; index <= 50; index += 1) {
      try {
        const round = generateSymbolChallengeRound({
          release,
          records,
          config: {
            level: "all",
            difficulty: "D3",
            memberAccess: true,
            seed: `b2-stress-${index}`,
          },
        });

        const result = validateRound(round);

        if (result.valid) {
          passed += 1;
        } else {
          failed += 1;
          console.error(`Seed b2-stress-${index}`, result.errors);
        }
      } catch (error) {
        failed += 1;
        console.error(`Seed b2-stress-${index}`, error.message);
      }
    }

    console.log({
      passed,
      failed,
      total: passed + failed,
    });

    if (failed === 0) {
      console.log("✅ 50/50 STRESS PASS");
    } else {
      console.error(`❌ STRESS FAIL — ${failed} invalid round(s)`);
    }

    console.groupEnd();
  } finally {
    console.groupEnd();
  }
}


