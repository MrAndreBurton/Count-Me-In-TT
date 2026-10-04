import {
  FACTOR_BENCH_SQUARE_CONSTRAINTS,
  generateFactorBenchTarget,
} from "./factorBenchTargetGenerator";

export const FACTOR_BENCH_ROUND_V1 = Object.freeze({
  challengesPerRound: 5,
  minPerfectSquaresPerRound: 1,
  maxPerfectSquaresPerRound: 2,

  slots: [
    {
      position: 1,
      difficulty: "ENTRY",
      squareConstraint:
        FACTOR_BENCH_SQUARE_CONSTRAINTS.EXCLUDED,
    },
    {
      position: 2,
      difficulty: "DEVELOPING",
      squareConstraint:
        FACTOR_BENCH_SQUARE_CONSTRAINTS.EXCLUDED,
    },
    {
      position: 3,
      difficulty: "DEVELOPING",
      squareConstraint:
        FACTOR_BENCH_SQUARE_CONSTRAINTS.REQUIRED,
    },
    {
      position: 4,
      difficulty: "SECURE",
      squareConstraint:
        FACTOR_BENCH_SQUARE_CONSTRAINTS.ALLOWED,
    },
    {
      position: 5,
      difficulty: "CHALLENGE",
      squareConstraint:
        FACTOR_BENCH_SQUARE_CONSTRAINTS.ALLOWED,
    },
  ],
});

export function generateFactorBenchRound({
  recentTargets = [],
} = {}) {
  const challenges = [];
  const usedTargets = [];

  let perfectSquareCount = 0;

  for (const slot of FACTOR_BENCH_ROUND_V1.slots) {
    /*
     * Once the round has reached the maximum
     * permitted number of perfect squares,
     * later ALLOWED slots must exclude squares.
     */
    const squareConstraint =
      slot.squareConstraint ===
        FACTOR_BENCH_SQUARE_CONSTRAINTS.ALLOWED &&
      perfectSquareCount >=
        FACTOR_BENCH_ROUND_V1.maxPerfectSquaresPerRound
        ? FACTOR_BENCH_SQUARE_CONSTRAINTS.EXCLUDED
        : slot.squareConstraint;

    const generated =
      generateFactorBenchTarget({
        difficulty: slot.difficulty,
        squareConstraint,
        excludeTargets: usedTargets,
        recentTargets,
      });

    usedTargets.push(generated.target);

    if (generated.isPerfectSquare) {
      perfectSquareCount += 1;
    }

    challenges.push({
      position: slot.position,
      difficulty: slot.difficulty,
      squareConstraint,

      target: generated.target,
      structure: generated.structure,
      factorCount: generated.factorCount,
      factorPairCount:
        generated.factorPairCount,
      isPerfectSquare:
        generated.isPerfectSquare,
    });
  }

  if (
    perfectSquareCount <
    FACTOR_BENCH_ROUND_V1.minPerfectSquaresPerRound
  ) {
    throw new Error(
      "Factor Bench round did not generate the required minimum number of perfect squares."
    );
  }

  if (
    perfectSquareCount >
    FACTOR_BENCH_ROUND_V1.maxPerfectSquaresPerRound
  ) {
    throw new Error(
      "Factor Bench round generated too many perfect squares."
    );
  }

  return {
    roundVersion: "FACTOR_BENCH_ROUND_V1",

    challengeCount:
      FACTOR_BENCH_ROUND_V1.challengesPerRound,

    perfectSquareCount,

    challenges,
  };
}




