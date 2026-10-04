import {
  FACTOR_BENCH_CHALLENGE_EVIDENCE_STRENGTHS,
  FACTOR_BENCH_EVIDENCE_STRENGTHS,
  FACTOR_BENCH_TRAJECTORIES,
} from "./factorBenchEvidenceContract";


const {
  STRONG,
  SUPPORTED,
  EMERGING,
  INSUFFICIENT,
} = FACTOR_BENCH_CHALLENGE_EVIDENCE_STRENGTHS;

const {
  MIXED,
} = FACTOR_BENCH_EVIDENCE_STRENGTHS;

const {
  IMPROVING,
  STABLE,
  VARIABLE,
  POSSIBLE_DECLINE,
  INSUFFICIENT_DATA,
} = FACTOR_BENCH_TRAJECTORIES;


// -----------------------------------------------------------------------------
// Ordinal evidence structure
//
// This ordering is used only to reason about adjacency, separation,
// direction, and coherent evidence bands.
//
// It is NOT a numerical evidence score.
// -----------------------------------------------------------------------------

const STRENGTH_ORDER = Object.freeze([
  INSUFFICIENT,
  EMERGING,
  SUPPORTED,
  STRONG,
]);

const VALID_CHALLENGE_STRENGTHS =
  new Set(STRENGTH_ORDER);


function validateChallengeStrengths(
  challengeStrengths
) {
  if (!Array.isArray(challengeStrengths)) {
    throw new Error(
      "Factor Bench round aggregation requires an array of challenge strengths."
    );
  }

  for (const strength of challengeStrengths) {
    if (!VALID_CHALLENGE_STRENGTHS.has(strength)) {
      throw new Error(
        `Invalid Factor Bench challenge evidence strength: ${String(
          strength
        )}`
      );
    }
  }
}


function strengthIndex(strength) {
  return STRENGTH_ORDER.indexOf(strength);
}


function ordinalDistance(left, right) {
  return Math.abs(
    strengthIndex(left) -
      strengthIndex(right)
  );
}


function isAdjacent(left, right) {
  return ordinalDistance(left, right) === 1;
}


function isMateriallySeparated(left, right) {
  return ordinalDistance(left, right) >= 2;
}


function buildDistribution(
  challengeStrengths
) {
  return {
    [STRONG]: 0,
    [SUPPORTED]: 0,
    [EMERGING]: 0,
    [INSUFFICIENT]: 0,
  };
}


function populateDistribution(
  challengeStrengths
) {
  const distribution =
    buildDistribution(challengeStrengths);

  for (const strength of challengeStrengths) {
    distribution[strength] += 1;
  }

  return distribution;
}


function presentStrengths(distribution) {
  return STRENGTH_ORDER.filter(
    (strength) =>
      distribution[strength] > 0
  );
}


function strongestPresentStrength(
  distribution
) {
  for (
    let index = STRENGTH_ORDER.length - 1;
    index >= 0;
    index -= 1
  ) {
    const strength =
      STRENGTH_ORDER[index];

    if (distribution[strength] > 0) {
      return strength;
    }
  }

  return null;
}


function lowerStrength(left, right) {
  return strengthIndex(left) <
    strengthIndex(right)
    ? left
    : right;
}


// -----------------------------------------------------------------------------
// Round strength
// -----------------------------------------------------------------------------

export function aggregateFactorBenchRoundStrength(
  challengeStrengths
) {
  validateChallengeStrengths(
    challengeStrengths
  );

  if (challengeStrengths.length === 0) {
    return null;
  }

  if (challengeStrengths.length === 1) {
    return challengeStrengths[0];
  }

  const distribution =
    populateDistribution(
      challengeStrengths
    );

  const present =
    presentStrengths(distribution);

  if (present.length === 1) {
    return present[0];
  }

  // ---------------------------------------------------------------------------
  // Two observed strengths
  //
  // Adjacent variation forms one coherent band.
  // The dominant strength is retained.
  // A tie resolves conservatively to the lower strength.
  //
  // Non-adjacent evidence is contradictory unless one result can legitimately
  // be treated as an isolated exception inside a larger round.
  // ---------------------------------------------------------------------------

  if (present.length === 2) {
    const [lower, upper] = present;

    const lowerCount =
      distribution[lower];

    const upperCount =
      distribution[upper];

    if (isAdjacent(lower, upper)) {
      if (lowerCount === upperCount) {
        return lower;
      }

      return lowerCount > upperCount
        ? lower
        : upper;
    }

    // Materially separated strengths.
    //
    // With only two total observations, neither can be treated as an
    // isolated exception.
    if (challengeStrengths.length === 2) {
      return MIXED;
    }

    // One isolated result outside an otherwise coherent dominant pattern
    // does not control the round-level strength.
    if (lowerCount === 1 && upperCount >= 2) {
      return upper;
    }

    if (upperCount === 1 && lowerCount >= 2) {
      return lower;
    }

    // Repeated materially separated evidence must remain visible.
    return MIXED;
  }

  // ---------------------------------------------------------------------------
  // Three or four strength bands are present.
  //
  // Look for a coherent adjacent cluster that accounts for all but one
  // observed result. If such a cluster exists, aggregate that cluster using
  // the normal adjacent-band rule and treat the remaining result as an
  // isolated exception.
  //
  // Otherwise the round is genuinely mixed.
  // ---------------------------------------------------------------------------

  const total =
    challengeStrengths.length;

// A complete contiguous three-band chain has a natural centre.
// Example:
// EMERGING + SUPPORTED + STRONG -> SUPPORTED.
//
// This is not numerical averaging. The middle ordinal band is the
// narrowest coherent strength that represents the complete chain.
if (
  present.length === 3 &&
  distribution[present[0]] === 1 &&
  distribution[present[1]] === 1 &&
  distribution[present[2]] === 1 &&
  isAdjacent(present[0], present[1]) &&
  isAdjacent(present[1], present[2])
) {
  return present[1];
}

// When all four bands appear, one interior band may still form the
// defensible dominant pattern.
//
// Example:
// INSUFFICIENT 1
// EMERGING     1
// SUPPORTED    2
// STRONG       1
//
// -> SUPPORTED
//
// Order does not participate in this decision. Trajectory handles order.
if (present.length === 4) {
  const emergingCount =
    distribution[EMERGING];

  const supportedCount =
    distribution[SUPPORTED];

  const insufficientCount =
    distribution[INSUFFICIENT];

  const strongCount =
    distribution[STRONG];

  if (
    supportedCount >= 2 &&
    emergingCount <= 1 &&
    insufficientCount <= 1 &&
    strongCount <= 1
  ) {
    return SUPPORTED;
  }

  if (
    emergingCount >= 2 &&
    supportedCount <= 1 &&
    insufficientCount <= 1 &&
    strongCount <= 1
  ) {
    return EMERGING;
  }
}

  let bestCluster = null;

  for (
    let index = 0;
    index < STRENGTH_ORDER.length - 1;
    index += 1
  ) {
    const lower =
      STRENGTH_ORDER[index];

    const upper =
      STRENGTH_ORDER[index + 1];

    const clusterCount =
      distribution[lower] +
      distribution[upper];

    if (
      clusterCount >= total - 1 &&
      distribution[lower] > 0 &&
      distribution[upper] > 0
    ) {
      if (
        !bestCluster ||
        clusterCount >
          bestCluster.clusterCount
      ) {
        bestCluster = {
          lower,
          upper,
          clusterCount,
        };
      }
    }
  }

  if (bestCluster) {
    const {
      lower,
      upper,
    } = bestCluster;

    const lowerCount =
      distribution[lower];

    const upperCount =
      distribution[upper];

    if (lowerCount === upperCount) {
      return lower;
    }

    return lowerCount > upperCount
      ? lower
      : upper;
  }

  // No coherent dominant band explains the round.
  return MIXED;
}


// -----------------------------------------------------------------------------
// Trajectory helpers
// -----------------------------------------------------------------------------

function movementDirection(
  fromStrength,
  toStrength
) {
  const difference =
    strengthIndex(toStrength) -
    strengthIndex(fromStrength);

  if (difference > 0) {
    return 1;
  }

  if (difference < 0) {
    return -1;
  }

  return 0;
}


function hasExtremeReversal(
  challengeStrengths
) {
  for (
    let index = 1;
    index < challengeStrengths.length - 1;
    index += 1
  ) {
    const previous =
      challengeStrengths[index - 1];

    const current =
      challengeStrengths[index];

    const next =
      challengeStrengths[index + 1];

    if (
      ordinalDistance(
        previous,
        current
      ) === 3 &&
      ordinalDistance(
        current,
        next
      ) === 3 &&
      previous === next
    ) {
      return true;
    }
  }

  return false;
}


function getNonZeroMovements(
  challengeStrengths
) {
  const movements = [];

  for (
    let index = 1;
    index < challengeStrengths.length;
    index += 1
  ) {
    const direction =
      movementDirection(
        challengeStrengths[index - 1],
        challengeStrengths[index]
      );

    if (direction !== 0) {
      movements.push(direction);
    }
  }

  return movements;
}


function hasMeaningfulReversal(
  challengeStrengths
) {
  const movements =
    getNonZeroMovements(
      challengeStrengths
    );

  if (movements.length < 2) {
    return false;
  }

  for (
    let index = 1;
    index < movements.length;
    index += 1
  ) {
    if (
      movements[index] !==
      movements[index - 1]
    ) {
      return true;
    }
  }

  return false;
}


// -----------------------------------------------------------------------------
// Round trajectory
// -----------------------------------------------------------------------------

export function interpretFactorBenchRoundTrajectory(
  challengeStrengths
) {
  validateChallengeStrengths(
    challengeStrengths
  );

  if (challengeStrengths.length < 3) {
    return INSUFFICIENT_DATA;
  }

  const first =
    challengeStrengths[0];

  const last =
    challengeStrengths[
      challengeStrengths.length - 1
    ];

  const allIdentical =
    challengeStrengths.every(
      (strength) => strength === first
    );

  if (allIdentical) {
    return STABLE;
  }

  // Extreme disruption with recovery is meaningful instability.
  // Example: STRONG → INSUFFICIENT → STRONG.
  if (
    hasExtremeReversal(
      challengeStrengths
    )
  ) {
    return VARIABLE;
  }

  const movements =
    getNonZeroMovements(
      challengeStrengths
    );

  const hasUp =
    movements.includes(1);

  const hasDown =
    movements.includes(-1);

  const netDirection =
    movementDirection(first, last);

  // Sustained improvement:
  // higher ending evidence with no downward reversal.
  if (
    netDirection > 0 &&
    !hasDown
  ) {
    return IMPROVING;
  }

  // Sustained possible decline:
  // lower ending evidence with no upward recovery.
  if (
    netDirection < 0 &&
    !hasUp
  ) {
    return POSSIBLE_DECLINE;
  }

  // Meaningful movement in both directions can be variable,
  // but ordinary bounded variation with recovery remains stable.
  if (hasUp && hasDown) {
    const reversal =
      hasMeaningfulReversal(
        challengeStrengths
      );

    if (!reversal) {
      return STABLE;
    }

    const indexes =
      challengeStrengths.map(
        strengthIndex
      );

    const range =
      Math.max(...indexes) -
      Math.min(...indexes);

     // A single material excursion followed by recovery remains stable.
     // Example:
     // STRONG → EMERGING → STRONG
     // EMERGING → STRONG → EMERGING
     //
     // Repeated movement across a material range is variable.
     // Extreme STRONG ↔ INSUFFICIENT reversals were already handled above.
     if (
       range >= 2 &&
       challengeStrengths.length >= 4
     ) {
       return VARIABLE;
     }

    // Adjacent-band oscillation can still be variable when it remains
    // unresolved across a longer sequence.
    if (
      challengeStrengths.length >= 4
    ) {
      let directionChanges = 0;

      for (
        let index = 1;
        index < movements.length;
        index += 1
      ) {
        if (
          movements[index] !==
          movements[index - 1]
        ) {
          directionChanges += 1;
        }
      }

      if (directionChanges >= 2) {
        return VARIABLE;
      }
    }
  }

  // A higher ending pattern with a meaningful downward reversal is not
  // automatically improving. A lower ending pattern with meaningful recovery
  // is not automatically decline. Unless instability is strong enough to be
  // VARIABLE, bounded variation remains STABLE.
  return STABLE;
}
