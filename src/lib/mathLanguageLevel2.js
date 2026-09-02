import { supabase } from "./supabase";

export const LEVEL2_RELEASE_ID =
  "LEVEL2-MATH-DICT-2026-09-FROZEN";

export const LEVEL2_MODES = [
  {
    id: "L2-M1 Which Word Fits?",
    shortName: "Which Word Fits?",
    description:
      "Choose the mathematical word that best matches the prompt.",
  },
  {
    id: "L2-M2 Spot the Example",
    shortName: "Spot the Example",
    description:
      "Identify the example that correctly shows the mathematical idea.",
  },
  {
    id: "L2-M3 Which Does Not Belong?",
    shortName: "Which Does Not Belong?",
    description:
      "Find the option that does not match the mathematical group.",
  },
  {
    id: "L2-M4 Make the Connection",
    shortName: "Make the Connection",
    description:
      "Connect the mathematical word or idea to the correct meaning or use.",
  },
];

function requireMode(modeId) {
  const mode = LEVEL2_MODES.find(
    (candidate) => candidate.id === modeId
  );

  if (!mode) {
    throw new Error(
      "Invalid Level 2 Math Language mode."
    );
  }

  return mode;
}

function hashSeed(seedText) {
  let hash = 2166136261;

  for (
    let i = 0;
    i < seedText.length;
    i += 1
  ) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;

    let t = value;

    t = Math.imul(
      t ^ (t >>> 15),
      t | 1
    );

    t ^=
      t +
      Math.imul(
        t ^ (t >>> 7),
        t | 61
      );

    return (
      ((t ^ (t >>> 14)) >>> 0) /
      4294967296
    );
  };
}

export function createShuffleSeed(
  questionId,
  roundNonce
) {
  return `L2V1:${roundNonce}:${questionId}`;
}

export function seededFisherYates(
  options,
  seedText
) {
  const shuffled = options.map(
    (option) => ({
      ...option,
    })
  );

  const random = mulberry32(
    hashSeed(seedText)
  );

  for (
    let i = shuffled.length - 1;
    i > 0;
    i -= 1
  ) {
    const j = Math.floor(
      random() * (i + 1)
    );

    [
      shuffled[i],
      shuffled[j],
    ] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled.map(
    (option, index) => ({
      ...option,
      displayed_position:
        String.fromCharCode(
          65 + index
        ),
    })
  );
}

export async function loadLevel2Round({
  modeId,
  questionCount = 10,
}) {
  requireMode(modeId);

  const { data, error } =
    await supabase.rpc(
      "get_math_language_level2_release",
      {
        p_release_id:
          LEVEL2_RELEASE_ID,
        p_question_count:
          questionCount,
        p_mode_id: modeId,
      }
    );

  if (error) {
    throw error;
  }

  if (
    !data?.release ||
    data.release.release_id !==
      LEVEL2_RELEASE_ID
  ) {
    throw new Error(
      "Unexpected Level 2 release payload."
    );
  }

  if (
    data.release.release_status !==
    "active"
  ) {
    throw new Error(
      "Level 2 production runtime requires an active release."
    );
  }

  return data;
}

export async function saveLevel2Round({
  modeId,
  durationMs,
  attemptItems,
}) {
  requireMode(modeId);

  if (
    !Array.isArray(attemptItems) ||
    attemptItems.length === 0
  ) {
    throw new Error(
      "Level 2 attempt items are required."
    );
  }

  const { data, error } =
    await supabase.rpc(
      "save_math_language_level2_round",
      {
        p_release_id:
          LEVEL2_RELEASE_ID,
        p_game_mode: modeId,
        p_duration_ms:
          Math.max(
            0,
            Math.round(
              Number(durationMs) || 0
            )
          ),
        p_attempt_items:
          attemptItems,
      }
    );

  if (error) {
    throw error;
  }

  if (
    !data ||
    data.release_id !==
      LEVEL2_RELEASE_ID
  ) {
    throw new Error(
      "Unexpected Level 2 save response."
    );
  }

  if (
    data.runtime_status !==
    "active"
  ) {
    throw new Error(
      "Level 2 production round was not saved against an active runtime."
    );
  }

  return data;
}


