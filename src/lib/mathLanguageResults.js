import { supabase } from "./supabase";

const MODE_MAP = {
  quick: "quick_10",
  challenge: "challenge_25",
  mastery: "mastery_40",
};

function normalizeMode(mode) {
  const normalizedMode = String(mode || "").trim();

  if (MODE_MAP[normalizedMode]) {
    return MODE_MAP[normalizedMode];
  }

  if (
    normalizedMode === "quick_10" ||
    normalizedMode === "challenge_25" ||
    normalizedMode === "mastery_40"
  ) {
    return normalizedMode;
  }

  throw new Error("Invalid Math Language game mode.");
}

function isMissingSessionError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("auth session missing") ||
    message.includes("session missing") ||
    message.includes("not authenticated") ||
    message.includes("jwt")
  );
}

export async function saveMathLanguageResult({
  gameMode,
  score,
}) {
  const normalizedMode = normalizeMode(gameMode);
  const numericScore = Number(score);

  if (!Number.isInteger(numericScore)) {
    throw new Error(
      "The Math Language score must be a whole number."
    );
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    return {
      guest: true,
      saved: false,
      result: null,
    };
  }

  const { data, error } = await supabase.rpc(
    "save_math_language_result",
    {
      p_game_mode: normalizedMode,
      p_score: numericScore,
    }
  );

  if (error) {
    if (isMissingSessionError(error)) {
      return {
        guest: true,
        saved: false,
        result: null,
      };
    }

    throw error;
  }

  return {
    guest: false,
    saved: true,
    result: data,
  };
}

