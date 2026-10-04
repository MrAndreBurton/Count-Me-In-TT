const FACTOR_BENCH_GENERATION_V1 = Object.freeze({
  minTarget: 4,
  maxTarget: 144,

  allowPrimeTargets: false,

  perfectSquares: {
    minPerRound: 1,
    maxPerRound: 2,
  },

  difficultyBands: {
  ENTRY: {
    minTarget: 4,
    maxTarget: 30,
    minFactorPairs: 1,
    maxFactorPairs: 2,
  },

  DEVELOPING: {
    minTarget: 12,
    maxTarget: 60,
    minFactorPairs: 2,
    maxFactorPairs: 3,
  },

  SECURE: {
    minTarget: 18,
    maxTarget: 100,
    minFactorPairs: 3,
    maxFactorPairs: 4,
  },

  CHALLENGE: {
    minTarget: 24,
    maxTarget: 144,
    minFactorPairs: 4,
    maxFactorPairs: 6,
  },

  EXTENSION: {
    minTarget: 36,
    maxTarget: 144,
    minFactorPairs: 6,
    maxFactorPairs: null,
  },
},

  repeatAvoidance: {
    recentTargetWindow: 10,
  },
});

export const FACTOR_BENCH_SQUARE_CONSTRAINTS =
  Object.freeze({
    REQUIRED: "REQUIRED",
    EXCLUDED: "EXCLUDED",
    ALLOWED: "ALLOWED",
  });

function getFactors(target) {
  const factors = [];

  for (let value = 1; value <= target; value += 1) {
    if (target % value === 0) {
      factors.push(value);
    }
  }

  return factors;
}

function getFactorPairs(target) {
  const pairs = [];

  for (
    let value = 1;
    value <= Math.sqrt(target);
    value += 1
  ) {
    if (target % value === 0) {
      pairs.push([value, target / value]);
    }
  }

  return pairs;
}

function isPrime(target) {
  return getFactors(target).length === 2;
}

function isPerfectSquare(target) {
  return Number.isInteger(Math.sqrt(target));
}

function getStructure({
  prime,
  perfectSquare,
  factorPairCount,
}) {
  if (prime) {
    return "PRIME";
  }

  if (perfectSquare) {
    return "PERFECT_SQUARE_COMPOSITE";
  }

  if (factorPairCount <= 2) {
    return "SIMPLE_COMPOSITE";
  }

  if (factorPairCount >= 4) {
    return "RICH_COMPOSITE";
  }

  return "COMPOSITE";
}

export function analyseFactorBenchTarget(target) {
  const factors = getFactors(target);
  const factorPairs = getFactorPairs(target);

  const prime = isPrime(target);
  const perfectSquare = isPerfectSquare(target);

  return {
    target,
    structure: getStructure({
      prime,
      perfectSquare,
      factorPairCount: factorPairs.length,
    }),
    factorCount: factors.length,
    factorPairCount: factorPairs.length,
    isPrime: prime,
    isPerfectSquare: perfectSquare,
  };
}

function matchesDifficulty(metadata, difficulty) {
  const band =
    FACTOR_BENCH_GENERATION_V1.difficultyBands[
      difficulty
    ];

  if (!band) {
    throw new Error(
      `Unknown Factor Bench difficulty: ${difficulty}`
    );
  }

  if (metadata.target < band.minTarget) {
    return false;
  }

  if (metadata.target > band.maxTarget) {
    return false;
  }

  if (
    metadata.factorPairCount <
    band.minFactorPairs
  ) {
    return false;
  }

  if (
    band.maxFactorPairs !== null &&
    metadata.factorPairCount >
      band.maxFactorPairs
  ) {
    return false;
  }

  return true;
}

export function getEligibleFactorBenchTargets({
  difficulty = "DEVELOPING",
  squareConstraint = "ALLOWED",
} = {}) {
  const eligible = [];

  if (
    !Object.values(
      FACTOR_BENCH_SQUARE_CONSTRAINTS
    ).includes(squareConstraint)
  ) {
    throw new Error(
      `Unknown Factor Bench square constraint: ${squareConstraint}`
    );
  }

  for (
    let target = FACTOR_BENCH_GENERATION_V1.minTarget;
    target <= FACTOR_BENCH_GENERATION_V1.maxTarget;
    target += 1
  ) {
    const metadata =
      analyseFactorBenchTarget(target);

    if (
      !FACTOR_BENCH_GENERATION_V1.allowPrimeTargets &&
      metadata.isPrime
    ) {
      continue;
    }

    if (
      squareConstraint ===
        FACTOR_BENCH_SQUARE_CONSTRAINTS.REQUIRED &&
      !metadata.isPerfectSquare
    ) {
      continue;
    }

    if (
      squareConstraint ===
        FACTOR_BENCH_SQUARE_CONSTRAINTS.EXCLUDED &&
      metadata.isPerfectSquare
    ) {
      continue;
    }

    if (
      !matchesDifficulty(metadata, difficulty)
    ) {
      continue;
    }

    eligible.push(metadata);
  }

  return eligible;
}

function randomItem(items) {
  if (items.length === 0) {
    return null;
  }

  return items[
    Math.floor(Math.random() * items.length)
  ];
}

export function generateFactorBenchTarget({
  difficulty = "DEVELOPING",
  squareConstraint = "ALLOWED",
  excludeTargets = [],
  recentTargets = [],
} = {}) {
  const eligible = getEligibleFactorBenchTargets({
    difficulty,
    squareConstraint,
  });

  /*
   * Targets already used in the current round are
   * hard exclusions.
   */
  const withoutCurrentRoundTargets = eligible.filter(
    ({ target }) => !excludeTargets.includes(target)
  );

  /*
   * Recent targets are soft exclusions. Prefer not
   * to repeat them, but relax this restriction if
   * the eligible pool becomes exhausted.
   */
  const recentWindow = recentTargets.slice(
    -FACTOR_BENCH_GENERATION_V1.repeatAvoidance
      .recentTargetWindow
  );

  const withoutRecentTargets =
    withoutCurrentRoundTargets.filter(
      ({ target }) => !recentWindow.includes(target)
    );

  const selectionPool =
    withoutRecentTargets.length > 0
      ? withoutRecentTargets
      : withoutCurrentRoundTargets;

  const selected = randomItem(selectionPool);

  if (!selected) {
    throw new Error(
      "No eligible Factor Bench target could be generated."
    );
  }

  return selected;
}

export {
  FACTOR_BENCH_GENERATION_V1,
};


