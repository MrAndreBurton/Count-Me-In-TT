import { supabase } from "./supabase";

export const LEVEL3_RELEASE_ID =
  "LEVEL3-MATH-DICT-2026-08-FROZEN";

const DISPLAY_LABELS = ["A", "B", "C", "D"];

/*
 * IMPORTANT:
 * `id` is the canonical database mode_id.
 * `code` is the short human/internal code.
 * Never shorten `id` when sending it to Supabase.
 */
export const LEVEL3_MODES = [
  {
    id: "L3-M1 Name the Mathematics",
    code: "L3-M1",
    name: "Name the Mathematics",
    tier: "CORE",
    description:
      "Identify the precise mathematical concept being described.",
  },
  {
    id: "L3-M2 Know the Difference",
    code: "L3-M2",
    name: "Know the Difference",
    tier: "CORE",
    description:
      "Distinguish between closely related mathematical ideas.",
  },
  {
    id: "L3-M3 Find It in the Mathematics",
    code: "L3-M3",
    name: "Find It in the Mathematics",
    tier: "CORE",
    description:
      "Recognise the concept inside a mathematical situation.",
  },
  {
    id: "L3-M4 Complete the Mathematics",
    code: "L3-M4",
    name: "Complete the Mathematics",
    tier: "SUPPORTING",
    description:
      "Complete a mathematical statement using the correct concept.",
  },
  {
    id: "L3-M5 Which Clue Gives It Away?",
    code: "L3-M5",
    name: "Which Clue Gives It Away?",
    tier: "SUPPORTING",
    description:
      "Use the strongest clue to identify the concept.",
  },
  {
    id: "L3-M6 Catch the Mistake",
    code: "L3-M6",
    name: "Catch the Mistake",
    tier: "CHALLENGE",
    description:
      "Spot the mathematical misconception or incorrect distinction.",
  },
];

export function getLevel3Mode(modeId) {
  return (
    LEVEL3_MODES.find(
      (mode) => mode.id === modeId
    ) || null
  );
}

/*
 * True Fisher-Yates shuffle.
 *
 * Stable option IDs remain attached to their option objects.
 * Visible A/B/C/D positions are assigned only AFTER this shuffle.
 */
export function fisherYatesShuffle(
  items,
  random = Math.random
) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function makeShuffleSeed() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function assignDisplayedLabels(options) {
  return options.map((option, index) => ({
    ...option,
    displayedPosition: DISPLAY_LABELS[index],
  }));
}

/*
 * Loads one pinned Level 3 release and one selected
 * canonical Level 3 mode.
 *
 * The release may remain STAGED during controlled testing.
 */
export async function loadLevel3Release({
  releaseId = LEVEL3_RELEASE_ID,
  questionCount = 10,
  modeId = null,
} = {}) {
  const numericCount = Math.max(
    1,
    Math.min(Number(questionCount) || 10, 40)
  );

  /*
   * Confirm that this browser origin actually has
   * a Supabase Auth session before invoking the RPC.
   */
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error(
      "You must sign in on this browser session before running Level 3."
    );
  }

  /*
   * p_mode_id must receive the FULL canonical mode_id:
   *
   * e.g.
   * "L3-M6 Catch the Mistake"
   *
   * NOT merely:
   * "L3-M6"
   */
  const { data, error } = await supabase.rpc(
  "get_math_language_level3_release",
  {
    p_release_id: releaseId,
    p_question_count: numericCount,
    p_mode_id: modeId,
  }
);

  if (error) {
    throw error;
  }

  if (
    !data?.release?.release_id ||
    !Array.isArray(data?.questions)
  ) {
    throw new Error(
      "Level 3 release payload is incomplete."
    );
  }

  if (data.questions.length === 0) {
    throw new Error(
      "No Level 3 questions are available for the requested mode."
    );
  }

  const pinnedReleaseId =
    data.release.release_id;

  const questions = data.questions.map(
    (question) => {
      /*
       * Generate one shuffle identifier for this
       * question presentation.
       *
       * The database attempt log requires this value.
       */
      const shuffleSeed = makeShuffleSeed();

      const stableOptions = Array.isArray(
        question.options
      )
        ? question.options
        : [];

      if (stableOptions.length !== 4) {
        throw new Error(
          `Question ${question.question_id} does not have four options.`
        );
      }

      /*
       * Shuffle complete stable option objects.
       *
       * option_id
       * option_text
       * feedback_text
       * is_correct
       *
       * all remain together.
       */
      const shuffledOptions =
        assignDisplayedLabels(
          fisherYatesShuffle(stableOptions)
        );

      return {
        ...question,
        release_id: pinnedReleaseId,
        shuffleSeed,
        answerOptions: shuffledOptions,
      };
    }
  );

  return {
    release: data.release,
    modeId: data.mode_id || modeId,
    questions,
  };
}

/*
 * Evaluate by stable canonical option ID.
 *
 * Visible A/B/C/D is NEVER used as the scoring key.
 */
export function evaluateLevel3Answer(
  question,
  selectedOption,
  responseMs = null
) {
  if (!question) {
    throw new Error(
      "A Level 3 question is required."
    );
  }

  if (!selectedOption?.option_id) {
    throw new Error(
      "A stable selected option ID is required."
    );
  }

  const isCorrect =
    selectedOption.option_id ===
    question.canonical_correct_option_id;

  return {
    releaseId: question.release_id,
    questionId: question.question_id,
    termId: question.term_id,

    selectedOptionId:
      selectedOption.option_id,

    displayedPosition:
      selectedOption.displayedPosition,

    shuffleSeed: question.shuffleSeed,

    isCorrect,

    /*
     * Feedback remains attached to the stable
     * option object selected by the player.
     */
    feedbackText:
      selectedOption.feedback_text || "",

    responseMs,
  };
}

/*
 * Save one aggregate game result plus its item-level
 * evidence through the existing Level 3 transactional RPC.
 */
export async function saveLevel3Round({
  releaseId,
  gameMode,
  answers,
  durationMs = null,
}) {
  if (!releaseId) {
    throw new Error(
      "A pinned release ID is required."
    );
  }

  if (
    !Array.isArray(answers) ||
    answers.length === 0
  ) {
    throw new Error(
      "At least one answer is required."
    );
  }

  /*
   * Protect against accidentally mixing releases
   * within a single round.
   */
  const mixedRelease = answers.some(
    (answer) =>
      answer.releaseId &&
      answer.releaseId !== releaseId
  );

  if (mixedRelease) {
    throw new Error(
      "A Level 3 round cannot contain questions from multiple releases."
    );
  }

  const payload = answers.map(
    (answer, index) => ({
      release_id: releaseId,

      question_id:
        answer.questionId,

      term_id:
        answer.termId,

      selected_option_id:
        answer.selectedOptionId,

      displayed_position:
        answer.displayedPosition,

      shuffle_seed:
        answer.shuffleSeed,

      is_correct:
        Boolean(answer.isCorrect),

      response_ms:
        answer.responseMs ?? null,

      answer_sequence:
        index + 1,

      /*
       * Keep student-facing UX clean while retaining
       * a place for future runtime metadata.
       */
      attempt_metadata: {},
    })
  );

  const { data, error } = await supabase.rpc(
    "save_math_language_level3_round",
    {
      p_release_id: releaseId,

      /*
       * The full canonical mode ID is deliberately
       * retained here for release-aware analytics.
       */
      p_game_mode: String(
        gameMode ||
          "level3_controlled_test"
      ),

      p_duration_ms: durationMs,

      p_attempt_items: payload,
    }
  );

  if (error) {
    throw error;
  }

  return data;
}

