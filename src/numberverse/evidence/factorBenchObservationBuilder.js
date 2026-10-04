import {
  FACTOR_BENCH_COMPLETENESS_JUDGMENTS,
  FACTOR_BENCH_INTERVENTION_TYPES,
  createEmptyFactorBenchAttemptObservation,
} from "./factorBenchEvidenceContract";


// -----------------------------------------------------------------------------
// Normalisation helpers
// -----------------------------------------------------------------------------

function normalizeNumberArray(values = []) {
  return values
    .map(Number)
    .filter(Number.isFinite);
}


function normalizePair(pair) {
  if (!Array.isArray(pair) || pair.length !== 2) {
    return null;
  }

  const left = Number(pair[0]);
  const right = Number(pair[1]);

  if (
    !Number.isFinite(left) ||
    !Number.isFinite(right)
  ) {
    return null;
  }

  return [left, right];
}


function normalizePairs(pairs = []) {
  return pairs
    .map(normalizePair)
    .filter(Boolean);
}


function canonicalPair(pair) {
  const [left, right] = pair;

  return left <= right
    ? [left, right]
    : [right, left];
}


function pairKey(pair) {
  const [left, right] =
    canonicalPair(pair);

  return `${left}:${right}`;
}


function uniqueNumbers(values = []) {
  return [...new Set(values)];
}


// -----------------------------------------------------------------------------
// Mathematical truth helpers
//
// These determine mathematical truth only.
// They do NOT interpret evidence strength.
// -----------------------------------------------------------------------------

function getExpectedFactors(target) {
  const factors = [];

  for (
    let candidate = 1;
    candidate <= target;
    candidate += 1
  ) {
    if (target % candidate === 0) {
      factors.push(candidate);
    }
  }

  return factors;
}


function getExpectedFactorPairs(target) {
  const pairs = [];

  for (
    let candidate = 1;
    candidate <= Math.sqrt(target);
    candidate += 1
  ) {
    if (target % candidate === 0) {
      pairs.push([
        candidate,
        target / candidate,
      ]);
    }
  }

  return pairs;
}


function isPerfectSquare(target) {
  return (
    Number.isInteger(target) &&
    target > 0 &&
    Number.isInteger(Math.sqrt(target))
  );
}


// -----------------------------------------------------------------------------
// Observation helpers
// -----------------------------------------------------------------------------

function observeFactorIdentification({
  submittedFactorSet,
  submittedFactorPairs,
  expectedFactors,
}) {
  const pairValues =
    submittedFactorPairs.flat();

  const identifiedValues =
    uniqueNumbers([
      ...submittedFactorSet,
      ...pairValues,
    ]);

  const expectedSet =
    new Set(expectedFactors);

  return {
    validFactors:
      identifiedValues.filter(
        (value) => expectedSet.has(value)
      ),

    invalidValues:
      identifiedValues.filter(
        (value) => !expectedSet.has(value)
      ),
  };
}


function observeFactorPairs({
  submittedFactorPairs,
  expectedFactorPairs,
}) {
  const expectedKeys =
    new Set(
      expectedFactorPairs.map(pairKey)
    );

  const seenValidKeys = new Set();
  const validPairs = [];
  const invalidPairs = [];
  const duplicatePairs = [];

  for (const pair of submittedFactorPairs) {
    const canonical =
      canonicalPair(pair);

    const key = pairKey(canonical);

    if (!expectedKeys.has(key)) {
      invalidPairs.push(pair);
      continue;
    }

    if (seenValidKeys.has(key)) {
      duplicatePairs.push(pair);
      continue;
    }

    seenValidKeys.add(key);
    validPairs.push(pair);
  }

  const missingPairs =
    expectedFactorPairs.filter(
      (pair) =>
        !seenValidKeys.has(pairKey(pair))
    );

  const complete =
    missingPairs.length === 0 &&
    invalidPairs.length === 0;

  return {
    validPairs,
    invalidPairs,
    missingPairs,
    duplicatePairs,
    complete,
  };
}


function observeFactorSet({
  submittedFactorSet,
  expectedFactors,
}) {
  const expectedSet =
    new Set(expectedFactors);

  const seen = new Set();
  const validFactors = [];
  const invalidValues = [];
  const duplicateFactors = [];

  for (const value of submittedFactorSet) {
    if (seen.has(value)) {
      duplicateFactors.push(value);
      continue;
    }

    seen.add(value);

    if (expectedSet.has(value)) {
      validFactors.push(value);
    } else {
      invalidValues.push(value);
    }
  }

  const submittedUniqueSet =
    new Set(submittedFactorSet);

  const missingFactors =
    expectedFactors.filter(
      (factor) =>
        !submittedUniqueSet.has(factor)
    );

  const complete =
    missingFactors.length === 0 &&
    invalidValues.length === 0 &&
    duplicateFactors.length === 0;

  return {
    validFactors,
    invalidValues,
    missingFactors,
    duplicateFactors,
    complete,
  };
}


function getCompletenessJudgment({
  mathematicalStructureComplete,
  completionClaim,
}) {
  if (
    mathematicalStructureComplete &&
    completionClaim === true
  ) {
    return FACTOR_BENCH_COMPLETENESS_JUDGMENTS
      .COMPLETE_RECOGNISED;
  }

  if (
    mathematicalStructureComplete &&
    completionClaim === false
  ) {
    return FACTOR_BENCH_COMPLETENESS_JUDGMENTS
      .COMPLETE_UNCERTAIN;
  }

  if (
    !mathematicalStructureComplete &&
    completionClaim === true
  ) {
    return FACTOR_BENCH_COMPLETENESS_JUDGMENTS
      .INCOMPLETE_PREMATURE_CLOSURE;
  }

  if (
    !mathematicalStructureComplete &&
    completionClaim === false
  ) {
    return FACTOR_BENCH_COMPLETENESS_JUDGMENTS
      .INCOMPLETE_UNCERTAIN;
  }

  return null;
}


function observeSquarePair({
  target,
  factorPairObservation,
  factorSetObservation,
}) {
  const applicable =
    isPerfectSquare(target);

  if (!applicable) {
    return {
      applicable: false,
      expectedPair: null,
      constructed: null,
      distinctFactorHandledCorrectly: null,
    };
  }

  const squareFactor =
    Math.sqrt(target);

  const expectedPair = [
    squareFactor,
    squareFactor,
  ];

  const expectedKey =
    pairKey(expectedPair);

  const constructed =
    factorPairObservation.validPairs.some(
      (pair) =>
        pairKey(pair) === expectedKey
    );

  const squareFactorOccurrences =
    factorSetObservation.validFactors.filter(
      (factor) =>
        factor === squareFactor
    ).length;

  const squareFactorDuplicates =
    factorSetObservation.duplicateFactors.filter(
      (factor) =>
        factor === squareFactor
    ).length;

  const distinctFactorHandledCorrectly =
    squareFactorOccurrences === 1 &&
    squareFactorDuplicates === 0;

  return {
    applicable: true,
    expectedPair,
    constructed,
    distinctFactorHandledCorrectly,
  };
}


// -----------------------------------------------------------------------------
// Public builder
// -----------------------------------------------------------------------------

export function buildFactorBenchAttemptObservation({
  target,

  attemptNumber,

  independenceState = null,

  interventionType =
    FACTOR_BENCH_INTERVENTION_TYPES.NONE,

  response = {},
} = {}) {
  if (
    !Number.isInteger(target) ||
    target <= 0
  ) {
    throw new Error(
      "Factor Bench observation requires a positive integer target."
    );
  }

  if (
    !Number.isInteger(attemptNumber) ||
    attemptNumber < 1
  ) {
    throw new Error(
      "Factor Bench observation requires a positive attempt number."
    );
  }

  const submittedFactorPairs =
    normalizePairs(
      response.factorPairs ?? []
    );

  const submittedFactorSet =
    normalizeNumberArray(
      response.factorSet ?? []
    );

  const completionClaim =
    typeof response.completionClaim ===
    "boolean"
      ? response.completionClaim
      : null;

  const expectedFactors =
    getExpectedFactors(target);

  const expectedFactorPairs =
    getExpectedFactorPairs(target);

  const factorIdentification =
    observeFactorIdentification({
      submittedFactorSet,
      submittedFactorPairs,
      expectedFactors,
    });

  const factorPairs =
    observeFactorPairs({
      submittedFactorPairs,
      expectedFactorPairs,
    });

  const factorSet =
    observeFactorSet({
      submittedFactorSet,
      expectedFactors,
    });

  const mathematicalStructureComplete =
    factorPairs.complete &&
    factorSet.complete;

  const judgmentState =
    getCompletenessJudgment({
      mathematicalStructureComplete,
      completionClaim,
    });

  const squarePair =
    observeSquarePair({
      target,
      factorPairObservation:
        factorPairs,
      factorSetObservation:
        factorSet,
    });

  const observation =
    createEmptyFactorBenchAttemptObservation({
      attemptNumber,
      independenceState,
      interventionType,
    });

  observation.response = {
    factorPairs:
      submittedFactorPairs.map(
        (pair) => [...pair]
      ),

    factorSet: [
      ...submittedFactorSet,
    ],

    completionClaim,
  };

  observation.observations = {
    factorIdentification,

    factorPairs,

    factorSet,

    completenessJudgment: {
      mathematicalStructureComplete,
      learnerClaim: completionClaim,
      judgmentState,
    },

    squarePair,
  };

  return observation;
}


