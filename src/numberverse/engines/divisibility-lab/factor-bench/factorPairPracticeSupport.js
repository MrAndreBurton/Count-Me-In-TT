export const FACTOR_PAIR_SUPPORT_LEVELS = Object.freeze({
  SUPPORTED: "SUPPORTED",
  GUIDED: "GUIDED",
  INDEPENDENT: "INDEPENDENT",
});

export function getPositiveFactorPairs(target) {
  const numericTarget = Number(target);

  if (
    !Number.isInteger(numericTarget) ||
    numericTarget <= 0
  ) {
    return [];
  }

  const pairs = [];

  for (
    let left = 1;
    left * left <= numericTarget;
    left += 1
  ) {
    if (numericTarget % left !== 0) {
      continue;
    }

    pairs.push([
      left,
      numericTarget / left,
    ]);
  }

  return pairs;
}

export function createPairPracticeWorkspace({
  target,
  supportLevel,
}) {
  const correctPairs = getPositiveFactorPairs(target);

  if (
    supportLevel ===
    FACTOR_PAIR_SUPPORT_LEVELS.INDEPENDENT
  ) {
    return {
      pairs: [
        ["", ""],
        ["", ""],
      ],
      lockedCells: [],
      allowRowManagement: true,
    };
  }

  if (
    supportLevel ===
    FACTOR_PAIR_SUPPORT_LEVELS.GUIDED
  ) {
    return {
      pairs: correctPairs.map(() => ["", ""]),
      lockedCells: correctPairs.map(() => [
        false,
        false,
      ]),
      allowRowManagement: false,
    };
  }

  // Supported: exactly one clue per pair. This supplies 50% of
  // the individual factor entries while varying the clue side.
  const pairs = correctPairs.map(
    ([left, right], index) =>
      index % 2 === 0
        ? [String(left), ""]
        : ["", String(right)]
  );

  const lockedCells = correctPairs.map(
    (_, index) =>
      index % 2 === 0
        ? [true, false]
        : [false, true]
  );

  return {
    pairs,
    lockedCells,
    allowRowManagement: false,
  };
}
