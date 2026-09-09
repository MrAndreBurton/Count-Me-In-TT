import {
  EXPERIENCE_MODES,
  EXPERIENCE_PROFILES,
  MAX_UNIQUE_SYMBOLS,
  MIN_REPEAT_GAP,
  MIN_UNIQUE_SYMBOLS,
  QUESTION_BEHAVIOURS,
  SUPPORTED_RENDER_MODES,
} from "./constants";

const QB05 = "QB-05";

function normalizeValue(
  value
) {
  return String(
    value || ""
  )
    .normalize("NFKC")
    .trim()
    .toLowerCase();
}

function getExpectedProfile(
  round
) {
  const experienceMode =
    round?.config
      ?.experienceMode;

  if (
    !Object.values(
      EXPERIENCE_MODES
    ).includes(experienceMode)
  ) {
    return null;
  }

  return (
    EXPERIENCE_PROFILES[
      experienceMode
    ] || null
  );
}

function validateEncounter(
  encounter,
  expectedOptionCount
) {
  const errors = [];

  if (
    !encounter?.symbolId
  ) {
    errors.push(
      "missing symbolId"
    );
  }

  if (
    !QUESTION_BEHAVIOURS.includes(
      encounter
        ?.questionBehaviour
    )
  ) {
    errors.push(
      "unsupported question behaviour"
    );
  }

  if (
    !encounter
      ?.promptPayload
      ?.stimulus
  ) {
    errors.push(
      "missing prompt stimulus"
    );
  }

  if (
    !SUPPORTED_RENDER_MODES.includes(
      String(
        encounter
          ?.promptPayload
          ?.renderMode ||
          ""
      ).toUpperCase()
    )
  ) {
    errors.push(
      "unsupported prompt render mode"
    );
  }

  if (
    !Array.isArray(
      encounter
        ?.optionPayload
    )
  ) {
    errors.push(
      "optionPayload must be an array"
    );

    return errors;
  }

  if (
    encounter.optionPayload
      .length !==
    expectedOptionCount
  ) {
    errors.push(
      `expected ${expectedOptionCount} options`
    );
  }

  if (
    encounter
      ?.generationMetadata
      ?.optionCount !==
    expectedOptionCount
  ) {
    errors.push(
      "generation option count metadata does not match the experience profile"
    );
  }

  const ids =
    new Set(
      encounter.optionPayload.map(
        (option) =>
          option.id
      )
    );

  const values =
    new Set(
      encounter.optionPayload.map(
        (option) =>
          normalizeValue(
            option.value
          )
      )
    );

  if (
    ids.size !==
    encounter.optionPayload
      .length
  ) {
    errors.push(
      "duplicate option ids"
    );
  }

  if (
    values.size !==
    encounter.optionPayload
      .length
  ) {
    errors.push(
      "duplicate option values"
    );
  }

  if (
    !ids.has(
      encounter.correctOptionId
    )
  ) {
    errors.push(
      "correct option is not present"
    );
  }

  for (
    const option of
    encounter.optionPayload
  ) {
    if (
      !Array.isArray(
        option.confusionGroupIds
      )
    ) {
      errors.push(
        `option ${option.id || "?"} confusionGroupIds must be an array`
      );
    }
  }

  if (
    encounter
      .questionBehaviour ===
    QB05
  ) {
    const approvedConfusables =
      encounter.optionPayload.filter(
        (option) =>
          option.id !==
            encounter.correctOptionId &&
          Array.isArray(
            option
              .confusionGroupIds
          ) &&
          option
            .confusionGroupIds
            .length > 0
      );

    if (
      approvedConfusables
        .length === 0
    ) {
      errors.push(
        "QB-05 requires at least one approved confusion-group distractor"
      );
    }

    /*
     * Focus has only one distractor.
     * Therefore that sole distractor
     * must be the required approved
     * confusable.
     */
    if (
      expectedOptionCount ===
        2 &&
      approvedConfusables
        .length !== 1
    ) {
      errors.push(
        "two-option QB-05 requires its sole distractor to be an approved confusion-group distractor"
      );
    }

    if (
      encounter
        ?.generationMetadata
        ?.qb05ConfusionRequired !==
      true
    ) {
      errors.push(
        "QB-05 confusion requirement metadata is missing"
      );
    }
  }

  return errors;
}

export function validateRound(
  round
) {
  const errors = [];

  if (
    !round ||
    !Array.isArray(
      round.encounters
    )
  ) {
    return {
      valid: false,
      errors: [
        "Round encounters are missing.",
      ],
    };
  }

  const profile =
    getExpectedProfile(
      round
    );

  if (!profile) {
    return {
      valid: false,
      errors: [
        "Round has an unsupported or missing experience mode.",
      ],
    };
  }

  if (
    round.config
      .roundSize !==
    profile.roundSize
  ) {
    errors.push(
      `Experience mode requires roundSize ${profile.roundSize}.`
    );
  }

  if (
    round.config
      .optionCount !==
    profile.optionCount
  ) {
    errors.push(
      `Experience mode requires optionCount ${profile.optionCount}.`
    );
  }

  if (
    round.config
      .experienceMode ===
      EXPERIENCE_MODES.FOCUS &&
    round.config
      .memberAccess !==
      false
  ) {
    errors.push(
      "Focus Mode must use public free-catalogue access."
    );
  }

  if (
    round.encounters
      .length !==
    profile.roundSize
  ) {
    errors.push(
      `Round must contain exactly ${profile.roundSize} encounters.`
    );
  }

  const uniqueSymbols =
    new Set(
      round.encounters.map(
        (encounter) =>
          encounter.symbolId
      )
    );

  if (
    round.config
      .experienceMode ===
    EXPERIENCE_MODES.FOCUS
  ) {
    if (
      uniqueSymbols.size !==
      profile.roundSize
    ) {
      errors.push(
        `Focus Mode must contain ${profile.roundSize} unique symbols.`
      );
    }
  } else if (
    uniqueSymbols.size <
      MIN_UNIQUE_SYMBOLS ||
    uniqueSymbols.size >
      MAX_UNIQUE_SYMBOLS
  ) {
    errors.push(
      `Challenge Mode must contain ${MIN_UNIQUE_SYMBOLS}–${MAX_UNIQUE_SYMBOLS} unique symbols.`
    );
  }

  if (
    round.config
      .uniqueSymbols !==
    uniqueSymbols.size
  ) {
    errors.push(
      "Round uniqueSymbols metadata does not match the generated encounters."
    );
  }

  const positionsBySymbol =
    new Map();

  round.encounters.forEach(
    (encounter, index) => {
      validateEncounter(
        encounter,
        profile.optionCount
      ).forEach(
        (message) =>
          errors.push(
            `Q${index + 1}: ${message}.`
          )
      );

      const positions =
        positionsBySymbol.get(
          encounter.symbolId
        ) || [];

      positions.push(index);

      positionsBySymbol.set(
        encounter.symbolId,
        positions
      );
    }
  );

  for (
    const [
      symbolId,
      positions,
    ] of
    positionsBySymbol.entries()
  ) {
    if (
      positions.length > 2
    ) {
      errors.push(
        `${symbolId} appears more than twice in a normal round.`
      );
    }

    for (
      let index = 1;
      index <
      positions.length;
      index += 1
    ) {
      const intervening =
        positions[index] -
        positions[index - 1] -
        1;

      if (
        intervening <
        MIN_REPEAT_GAP
      ) {
        errors.push(
          `${symbolId} repeats with only ${intervening} intervening question(s).`
        );
      }
    }
  }

  return {
    valid:
      errors.length === 0,
    errors,
  };
}

export function assertValidRound(
  round
) {
  const result =
    validateRound(round);

  if (!result.valid) {
    throw new Error(
      `Invalid Symbol Challenge round:\n${result.errors.join(
        "\n"
      )}`
    );
  }

  return round;
}