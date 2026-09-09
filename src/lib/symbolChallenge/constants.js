export const QUESTION_BEHAVIOURS = Object.freeze([
  "QB-01",
  "QB-02",
  "QB-03",
  "QB-04",
  "QB-05",
]);

export const DIFFICULTY_BEHAVIOURS = Object.freeze({
  D1: Object.freeze([
    "QB-01",
    "QB-02",
    "QB-03",
  ]),

  D2: Object.freeze([
    "QB-01",
    "QB-02",
    "QB-03",
    "QB-04",
    "QB-05",
  ]),

  D3: Object.freeze([
    "QB-01",
    "QB-02",
    "QB-03",
    "QB-04",
    "QB-05",
  ]),
});

export const EXPERIENCE_MODES = Object.freeze({
  CHALLENGE: "CHALLENGE",
  FOCUS: "FOCUS",
});

export const EXPERIENCE_PROFILES = Object.freeze({
  [EXPERIENCE_MODES.CHALLENGE]: Object.freeze({
    roundSize: 10,
    optionCount: 4,
  }),

  [EXPERIENCE_MODES.FOCUS]: Object.freeze({
    roundSize: 5,
    optionCount: 2,
  }),
});

export const SUPPORTED_ROUND_SIZES = Object.freeze([
  EXPERIENCE_PROFILES.CHALLENGE.roundSize,
  EXPERIENCE_PROFILES.FOCUS.roundSize,
]);

export const SUPPORTED_OPTION_COUNTS = Object.freeze([
  EXPERIENCE_PROFILES.CHALLENGE.optionCount,
  EXPERIENCE_PROFILES.FOCUS.optionCount,
]);

/*
 * Legacy/default constants remain exported
 * for compatibility with code outside this
 * gate. They represent Challenge Mode.
 */
export const ROUND_SIZE =
  EXPERIENCE_PROFILES.CHALLENGE.roundSize;

export const OPTION_COUNT =
  EXPERIENCE_PROFILES.CHALLENGE.optionCount;

export const TARGET_UNIQUE_SYMBOLS = 6;

export const MIN_UNIQUE_SYMBOLS = 5;

export const MAX_UNIQUE_SYMBOLS = 7;

export const MIN_REPEAT_GAP = 2;

export const SUPPORTED_RENDER_MODES = Object.freeze([
  "TEXT",
  "MATH",
  "GRAPHIC",
]);

export const CONTEXT_CONSTRAINTS = Object.freeze({
  STANDALONE_OK: "standalone_ok",
  EXPRESSION_REQUIRED: "expression_required",
  GRAPHIC_REQUIRED: "graphic_required",
  CATEGORY_SCAFFOLD_REQUIRED:
    "category_scaffold_required",
});

export const CORE_CONTEXT_BLOCKERS = Object.freeze([
  CONTEXT_CONSTRAINTS.EXPRESSION_REQUIRED,
  CONTEXT_CONSTRAINTS.CATEGORY_SCAFFOLD_REQUIRED,
]);

export const GENERATOR_VERSION =
  "MSG-QG-1.0-2BA1";