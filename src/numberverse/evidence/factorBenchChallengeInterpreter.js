import {
  FACTOR_BENCH_DIMENSIONS,
  FACTOR_BENCH_STRUCTURAL_OBSERVATIONS,
  FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES,
  FACTOR_BENCH_EVIDENCE_STRENGTHS,
  FACTOR_BENCH_INTERVENTION_TYPES,
  FACTOR_BENCH_COMPLETENESS_JUDGMENTS,
  FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION,
  FACTOR_BENCH_INTERPRETER_VERSION,
  FACTOR_BENCH_EVIDENCE_PROFILE_TYPES,
} from "./factorBenchEvidenceContract";


// -----------------------------------------------------------------------------
// Factor Bench Challenge Interpreter V1
//
// Input:
//   - preserved raw attempt observations
//   - task entitlements
//
// Output:
//   - dimension-specific challenge evidence
//
// This module does NOT:
//   - recompute mathematical truth
//   - produce an overall challenge score
//   - infer mastery
//   - infer curriculum readiness
//   - infer longitudinal learner ability
// -----------------------------------------------------------------------------


// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

function createDimensionResult({
  opportunity,
  strength = null,
  evidenceAttemptNumbers = [],
}) {
  return {
    opportunity,
    strength,
    evidenceAttemptNumbers,
  };
}


function getOpportunity(
  entitlements,
  dimension
) {
  return (
    entitlements?.[dimension] ??
    FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES
      .NOT_ENTITLED
  );
}


function isObservableOpportunity(
  opportunity
) {
  return (
    opportunity ===
    FACTOR_BENCH_EVIDENCE_OPPORTUNITY_STATES
      .ENTITLED
  );
}


function getAttemptNumber(attempt) {
  return attempt?.attemptNumber ?? null;
}


function getInterventionType(attempt) {
  return (
    attempt?.interventionType ??
    FACTOR_BENCH_INTERVENTION_TYPES.NONE
  );
}


function getStrengthCeilingForIntervention(
  interventionType
) {
  switch (interventionType) {
    case FACTOR_BENCH_INTERVENTION_TYPES.NONE:
      return FACTOR_BENCH_EVIDENCE_STRENGTHS
        .STRONG;

    case FACTOR_BENCH_INTERVENTION_TYPES
      .GENERIC_RETRY:

    case FACTOR_BENCH_INTERVENTION_TYPES
      .PROCESS_SCAFFOLD:

    case FACTOR_BENCH_INTERVENTION_TYPES
      .MATHEMATICAL_HINT:
      return FACTOR_BENCH_EVIDENCE_STRENGTHS
        .SUPPORTED;

    case FACTOR_BENCH_INTERVENTION_TYPES
      .DIRECT_ASSISTANCE:
      return FACTOR_BENCH_EVIDENCE_STRENGTHS
        .EMERGING;

    case FACTOR_BENCH_INTERVENTION_TYPES.REVEAL:
      return FACTOR_BENCH_EVIDENCE_STRENGTHS
        .INSUFFICIENT;

    default:
      return FACTOR_BENCH_EVIDENCE_STRENGTHS
        .INSUFFICIENT;
  }
}


function getStrengthRank(strength) {
  switch (strength) {
    case FACTOR_BENCH_EVIDENCE_STRENGTHS.STRONG:
      return 4;

    case FACTOR_BENCH_EVIDENCE_STRENGTHS.SUPPORTED:
      return 3;

    case FACTOR_BENCH_EVIDENCE_STRENGTHS.EMERGING:
      return 2;

    case FACTOR_BENCH_EVIDENCE_STRENGTHS
      .INSUFFICIENT:
      return 1;

    default:
      return 0;
  }
}


function strongerStrength(
  currentStrength,
  candidateStrength
) {
  return getStrengthRank(candidateStrength) >
    getStrengthRank(currentStrength)
    ? candidateStrength
    : currentStrength;
}


function collectEvidenceAttemptNumbers(
  attempts,
  predicate
) {
  return attempts
    .filter(predicate)
    .map(getAttemptNumber)
    .filter(
      (attemptNumber) =>
        Number.isInteger(attemptNumber)
    );
}


function createUnavailableResult(
  opportunity
) {
  return createDimensionResult({
    opportunity,
    strength: null,
    evidenceAttemptNumbers: [],
  });
}


// -----------------------------------------------------------------------------
// D1 — Factor Identification
// -----------------------------------------------------------------------------

function interpretFactorIdentification({
  attempts,
  opportunity,
}) {
  if (!isObservableOpportunity(opportunity)) {
    return createUnavailableResult(opportunity);
  }

  let strength =
    FACTOR_BENCH_EVIDENCE_STRENGTHS
      .INSUFFICIENT;

  const evidenceAttemptNumbers = [];

  for (const attempt of attempts) {
    const observation =
      attempt?.observations
        ?.factorIdentification;

    if (!observation) {
      continue;
    }

    const validFactors =
      observation.validFactors ?? [];

    const invalidValues =
      observation.invalidValues ?? [];

    const hasMeaningfulIdentification =
      validFactors.length > 0;

    if (!hasMeaningfulIdentification) {
      continue;
    }

    evidenceAttemptNumbers.push(
      getAttemptNumber(attempt)
    );

    const fullyValid =
      invalidValues.length === 0;

    if (!fullyValid) {
      strength = strongerStrength(
        strength,
        FACTOR_BENCH_EVIDENCE_STRENGTHS
          .EMERGING
      );

      continue;
    }

    const interventionCeiling =
      getStrengthCeilingForIntervention(
        getInterventionType(attempt)
      );

    let candidateStrength =
      interventionCeiling;

    const previousAttempts =
      attempts.filter(
        (previousAttempt) =>
          getAttemptNumber(previousAttempt) <
          getAttemptNumber(attempt)
      );

    const previousInvalidIdentification =
      previousAttempts.some(
        (previousAttempt) =>
          (
            previousAttempt?.observations
              ?.factorIdentification
              ?.invalidValues ?? []
          ).length > 0
      );

    if (
      previousInvalidIdentification &&
      candidateStrength ===
        FACTOR_BENCH_EVIDENCE_STRENGTHS
          .STRONG
    ) {
      candidateStrength =
        FACTOR_BENCH_EVIDENCE_STRENGTHS
          .SUPPORTED;
    }

    strength = strongerStrength(
      strength,
      candidateStrength
    );
  }

  return createDimensionResult({
    opportunity,
    strength,
    evidenceAttemptNumbers:
      [...new Set(evidenceAttemptNumbers)],
  });
}


// -----------------------------------------------------------------------------
// D2 — Factor-Pair Structure
// -----------------------------------------------------------------------------

function interpretFactorPairStructure({
  attempts,
  opportunity,
}) {
  if (!isObservableOpportunity(opportunity)) {
    return createUnavailableResult(opportunity);
  }

  let strength =
    FACTOR_BENCH_EVIDENCE_STRENGTHS
      .INSUFFICIENT;

  const evidenceAttemptNumbers = [];

  for (const attempt of attempts) {
    const observation =
      attempt?.observations?.factorPairs;

    if (!observation) {
      continue;
    }

    const validPairs =
      observation.validPairs ?? [];

    if (validPairs.length > 0) {
      evidenceAttemptNumbers.push(
        getAttemptNumber(attempt)
      );
    }

    if (observation.complete === true) {
      let candidateStrength =
        getStrengthCeilingForIntervention(
          getInterventionType(attempt)
        );

      const previousAttempts =
        attempts.filter(
          (previousAttempt) =>
            getAttemptNumber(previousAttempt) <
            getAttemptNumber(attempt)
        );

      const previouslyIncomplete =
        previousAttempts.some(
          (previousAttempt) =>
            previousAttempt?.observations
              ?.factorPairs &&
            previousAttempt.observations
              .factorPairs.complete !== true
        );

      if (
        previouslyIncomplete &&
        candidateStrength ===
          FACTOR_BENCH_EVIDENCE_STRENGTHS
            .STRONG
      ) {
        candidateStrength =
          FACTOR_BENCH_EVIDENCE_STRENGTHS
            .SUPPORTED;
      }

      strength = strongerStrength(
        strength,
        candidateStrength
      );

      continue;
    }

    if (validPairs.length > 0) {
      strength = strongerStrength(
        strength,
        FACTOR_BENCH_EVIDENCE_STRENGTHS
          .EMERGING
      );
    }
  }

  return createDimensionResult({
    opportunity,
    strength,
    evidenceAttemptNumbers:
      [...new Set(evidenceAttemptNumbers)],
  });
}


// -----------------------------------------------------------------------------
// D3 — Factor-Set Completeness
// -----------------------------------------------------------------------------

function interpretFactorSetCompleteness({
  attempts,
  opportunity,
}) {
  if (!isObservableOpportunity(opportunity)) {
    return createUnavailableResult(opportunity);
  }

  let strength =
    FACTOR_BENCH_EVIDENCE_STRENGTHS
      .INSUFFICIENT;

  const evidenceAttemptNumbers = [];

  for (const attempt of attempts) {
    const observation =
      attempt?.observations?.factorSet;

    if (!observation) {
      continue;
    }

    const validFactors =
      observation.validFactors ?? [];

    if (validFactors.length > 0) {
      evidenceAttemptNumbers.push(
        getAttemptNumber(attempt)
      );
    }

    if (observation.complete === true) {
      let candidateStrength =
        getStrengthCeilingForIntervention(
          getInterventionType(attempt)
        );

      const previousAttempts =
        attempts.filter(
          (previousAttempt) =>
            getAttemptNumber(previousAttempt) <
            getAttemptNumber(attempt)
        );

      const previouslyIncomplete =
        previousAttempts.some(
          (previousAttempt) =>
            previousAttempt?.observations
              ?.factorSet &&
            previousAttempt.observations
              .factorSet.complete !== true
        );

      if (
        previouslyIncomplete &&
        candidateStrength ===
          FACTOR_BENCH_EVIDENCE_STRENGTHS
            .STRONG
      ) {
        candidateStrength =
          FACTOR_BENCH_EVIDENCE_STRENGTHS
            .SUPPORTED;
      }

      strength = strongerStrength(
        strength,
        candidateStrength
      );

      continue;
    }

    if (validFactors.length > 0) {
      strength = strongerStrength(
        strength,
        FACTOR_BENCH_EVIDENCE_STRENGTHS
          .EMERGING
      );
    }
  }

  return createDimensionResult({
    opportunity,
    strength,
    evidenceAttemptNumbers:
      [...new Set(evidenceAttemptNumbers)],
  });
}


// -----------------------------------------------------------------------------
// D4 — Completeness Judgment
// -----------------------------------------------------------------------------

function interpretCompletenessJudgment({
  attempts,
  opportunity,
}) {
  if (!isObservableOpportunity(opportunity)) {
    return createUnavailableResult(opportunity);
  }

  let strength =
    FACTOR_BENCH_EVIDENCE_STRENGTHS
      .INSUFFICIENT;

  const evidenceAttemptNumbers = [];

  for (const attempt of attempts) {
    const observation =
      attempt?.observations
        ?.completenessJudgment;

    if (!observation) {
      continue;
    }

    const judgmentState =
      observation.judgmentState;

    if (!judgmentState) {
      continue;
    }

    evidenceAttemptNumbers.push(
      getAttemptNumber(attempt)
    );

    if (
      judgmentState ===
      FACTOR_BENCH_COMPLETENESS_JUDGMENTS
        .COMPLETE_RECOGNISED
    ) {
      let candidateStrength =
        getStrengthCeilingForIntervention(
          getInterventionType(attempt)
        );

      const previousAttempts =
        attempts.filter(
          (previousAttempt) =>
            getAttemptNumber(previousAttempt) <
            getAttemptNumber(attempt)
        );

      const previousPrematureClosure =
        previousAttempts.some(
          (previousAttempt) =>
            previousAttempt?.observations
              ?.completenessJudgment
              ?.judgmentState ===
            FACTOR_BENCH_COMPLETENESS_JUDGMENTS
              .INCOMPLETE_PREMATURE_CLOSURE
        );

      const previousCompleteUncertain =
        previousAttempts.some(
          (previousAttempt) =>
            previousAttempt?.observations
              ?.completenessJudgment
              ?.judgmentState ===
            FACTOR_BENCH_COMPLETENESS_JUDGMENTS
              .COMPLETE_UNCERTAIN
        );

      if (
        (
          previousPrematureClosure ||
          previousCompleteUncertain
        ) &&
        candidateStrength ===
          FACTOR_BENCH_EVIDENCE_STRENGTHS
            .STRONG
      ) {
        candidateStrength =
          FACTOR_BENCH_EVIDENCE_STRENGTHS
            .SUPPORTED;
      }

      // Deliberate V1 exception:
      //
      // INCOMPLETE_UNCERTAIN followed by COMPLETE_RECOGNISED
      // may remain STRONG when no corrective intervention occurred.
      // The learner's earlier uncertainty was mathematically appropriate.

      strength = strongerStrength(
        strength,
        candidateStrength
      );

      continue;
    }

    if (
      judgmentState ===
      FACTOR_BENCH_COMPLETENESS_JUDGMENTS
        .COMPLETE_UNCERTAIN
    ) {
      strength = strongerStrength(
        strength,
        FACTOR_BENCH_EVIDENCE_STRENGTHS
          .EMERGING
      );

      continue;
    }

    if (
      judgmentState ===
      FACTOR_BENCH_COMPLETENESS_JUDGMENTS
        .INCOMPLETE_UNCERTAIN
    ) {
      strength = strongerStrength(
        strength,
        FACTOR_BENCH_EVIDENCE_STRENGTHS
          .EMERGING
      );

      continue;
    }

    // INCOMPLETE_PREMATURE_CLOSURE contributes no
    // positive evidence by itself. If it is later
    // corrected, that later attempt can establish
    // SUPPORTED evidence.
  }

  return createDimensionResult({
    opportunity,
    strength,
    evidenceAttemptNumbers:
      [...new Set(evidenceAttemptNumbers)],
  });
}


// -----------------------------------------------------------------------------
// S1 — Square-Pair Handling
// -----------------------------------------------------------------------------

function interpretSquarePairHandling({
  attempts,
  opportunity,
}) {
  if (!isObservableOpportunity(opportunity)) {
    return createUnavailableResult(opportunity);
  }

  let strength =
    FACTOR_BENCH_EVIDENCE_STRENGTHS
      .INSUFFICIENT;

  const evidenceAttemptNumbers = [];

  for (const attempt of attempts) {
    const observation =
      attempt?.observations?.squarePair;

    if (
      !observation ||
      observation.applicable !== true
    ) {
      continue;
    }

    const constructed =
      observation.constructed === true;

    const handledDistinctly =
      observation
        .distinctFactorHandledCorrectly ===
      true;

    if (constructed || handledDistinctly) {
      evidenceAttemptNumbers.push(
        getAttemptNumber(attempt)
      );
    }

    const fullyDemonstrated =
      constructed && handledDistinctly;

    if (fullyDemonstrated) {
      let candidateStrength =
        getStrengthCeilingForIntervention(
          getInterventionType(attempt)
        );

      const previousAttempts =
        attempts.filter(
          (previousAttempt) =>
            getAttemptNumber(previousAttempt) <
            getAttemptNumber(attempt)
        );

      const previouslyMishandled =
        previousAttempts.some(
          (previousAttempt) => {
            const previousObservation =
              previousAttempt?.observations
                ?.squarePair;

            if (
              !previousObservation ||
              previousObservation.applicable !==
                true
            ) {
              return false;
            }

            return !(
              previousObservation.constructed ===
                true &&
              previousObservation
                .distinctFactorHandledCorrectly ===
                true
            );
          }
        );

      if (
        previouslyMishandled &&
        candidateStrength ===
          FACTOR_BENCH_EVIDENCE_STRENGTHS
            .STRONG
      ) {
        candidateStrength =
          FACTOR_BENCH_EVIDENCE_STRENGTHS
            .SUPPORTED;
      }

      strength = strongerStrength(
        strength,
        candidateStrength
      );

      continue;
    }

    if (constructed || handledDistinctly) {
      strength = strongerStrength(
        strength,
        FACTOR_BENCH_EVIDENCE_STRENGTHS
          .EMERGING
      );
    }
  }

  return createDimensionResult({
    opportunity,
    strength,
    evidenceAttemptNumbers:
      [...new Set(evidenceAttemptNumbers)],
  });
}


// -----------------------------------------------------------------------------
// Public challenge interpreter
// -----------------------------------------------------------------------------

export function interpretFactorBenchChallenge(
  challengeObservation
) {
  if (
    !challengeObservation ||
    typeof challengeObservation !== "object"
  ) {
    throw new Error(
      "A Factor Bench challenge observation record is required."
    );
  }

  const {
    challengeEpisodeId = null,
    taskContext = {},
    attemptHistory = {},
  } = challengeObservation;

  const {
    entitlements = {},
  } = taskContext;

  const {
    attempts = [],
  } = attemptHistory;

  if (!Array.isArray(attempts)) {
    throw new Error(
      "Factor Bench challenge observation attempt history must contain an attempts array."
    );
  }

  const orderedAttempts = [...attempts].sort(
    (left, right) =>
      (left?.attemptNumber ?? 0) -
      (right?.attemptNumber ?? 0)
  );

  const factorIdentificationOpportunity =
    getOpportunity(
      entitlements,
      FACTOR_BENCH_DIMENSIONS
        .FACTOR_IDENTIFICATION
    );

  const factorPairOpportunity =
    getOpportunity(
      entitlements,
      FACTOR_BENCH_DIMENSIONS
        .FACTOR_PAIR_STRUCTURE
    );

  const factorSetOpportunity =
    getOpportunity(
      entitlements,
      FACTOR_BENCH_DIMENSIONS
        .FACTOR_SET_COMPLETENESS
    );

  const completenessJudgmentOpportunity =
    getOpportunity(
      entitlements,
      FACTOR_BENCH_DIMENSIONS
        .COMPLETENESS_JUDGMENT
    );

  const squarePairOpportunity =
    getOpportunity(
      entitlements,
      FACTOR_BENCH_STRUCTURAL_OBSERVATIONS
        .SQUARE_PAIR_HANDLING
    );

  return {
    contractVersion:
      FACTOR_BENCH_EVIDENCE_CONTRACT_VERSION,

    interpreterVersion:
      FACTOR_BENCH_INTERPRETER_VERSION,

    profileType:
      FACTOR_BENCH_EVIDENCE_PROFILE_TYPES
        .CHALLENGE,

    challengeEpisodeId,

    dimensions: {
      [FACTOR_BENCH_DIMENSIONS
        .FACTOR_IDENTIFICATION]:
        interpretFactorIdentification({
          attempts: orderedAttempts,
          opportunity:
            factorIdentificationOpportunity,
        }),

      [FACTOR_BENCH_DIMENSIONS
        .FACTOR_PAIR_STRUCTURE]:
        interpretFactorPairStructure({
          attempts: orderedAttempts,
          opportunity:
            factorPairOpportunity,
        }),

      [FACTOR_BENCH_DIMENSIONS
        .FACTOR_SET_COMPLETENESS]:
        interpretFactorSetCompleteness({
          attempts: orderedAttempts,
          opportunity:
            factorSetOpportunity,
        }),

      [FACTOR_BENCH_DIMENSIONS
        .COMPLETENESS_JUDGMENT]:
        interpretCompletenessJudgment({
          attempts: orderedAttempts,
          opportunity:
            completenessJudgmentOpportunity,
        }),
    },

    structuralObservations: {
      [FACTOR_BENCH_STRUCTURAL_OBSERVATIONS
        .SQUARE_PAIR_HANDLING]:
        interpretSquarePairHandling({
          attempts: orderedAttempts,
          opportunity:
            squarePairOpportunity,
        }),
    },
  };
}



