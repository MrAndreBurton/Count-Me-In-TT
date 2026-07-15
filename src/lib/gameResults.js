import { supabase } from "./supabase";

const MULTIPLICATION_MODES = {
  "5x5": {
    gameMode: "5x5",
    modeLabel: "5 × 5 Quick",
    expectedAnswers: 25,
  },
  "5x12": {
    gameMode: "5x12",
    modeLabel: "5 × 12 Trainer",
    expectedAnswers: 60,
  },
  "12x12": {
    gameMode: "12x12",
    modeLabel: "12 × 12 Classic",
    expectedAnswers: 144,
  },
  "15x15": {
    gameMode: "15x15",
    modeLabel: "15 × 15 Pro",
    expectedAnswers: 225,
  },
};

function normaliseGameMode(gameMode = "") {
  return String(gameMode)
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/×/g, "x");
}

function validateDuration(durationMs) {
  const parsedDuration = Number(durationMs);

  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    throw new Error(
      "A valid game duration is required before saving the result."
    );
  }

  return Math.round(parsedDuration);
}

function validateAnswerCount(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return Math.round(parsedValue);
}

function calculateAccuracy(correctAnswers, incorrectAnswers) {
  const totalAnswers = correctAnswers + incorrectAnswers;

  if (totalAnswers <= 0) {
    return null;
  }

  return Number(
    ((correctAnswers / totalAnswers) * 100).toFixed(2)
  );
}

/**
 * Returns the authenticated user or null when playing as a guest.
 */
export async function getCurrentAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user || null;
}

/**
 * Finds the one learning profile that the logged-in account is allowed
 * to use for gameplay.
 *
 * Parent accounts receive their own playable account-holder profile.
 * Student accounts receive their independent-student profile.
 * Parent-managed child profiles are not returned because can_play is false.
 */
export async function getPlayableProfile() {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return null;
  }

  const { data: linkData, error: linkError } = await supabase
    .from("account_student_links")
    .select(
      `
        id,
        account_id,
        student_id,
        relationship_role,
        can_view,
        can_edit,
        can_manage_membership,
        can_play
      `
    )
    .eq("account_id", user.id)
    .eq("can_play", true)
    .maybeSingle();

  if (linkError) {
    throw linkError;
  }

  if (!linkData) {
    throw new Error(
      "No playable learning profile is linked to this account."
    );
  }

  const { data: studentData, error: studentError } = await supabase
    .from("student_profiles")
    .select(
      `
        id,
        account_id,
        first_name,
        last_name,
        public_display_name,
        avatar_key,
        profile_type,
        profile_status,
        current_school,
        current_level,
        academic_year,
        school_visible
      `
    )
    .eq("id", linkData.student_id)
    .eq("profile_status", "active")
    .maybeSingle();

  if (studentError) {
    throw studentError;
  }

  if (!studentData) {
    throw new Error(
      "The playable learning profile could not be found."
    );
  }

  return {
    user,
    link: linkData,
    profile: studentData,
  };
}

/**
 * Returns the fastest verified result previously saved for one
 * student and one exact game mode.
 */
export async function getPreviousBestResult({
  studentId,
  gameType,
  gameMode,
}) {
  if (!studentId) {
    throw new Error(
      "A student profile ID is required to check the personal best."
    );
  }

  const { data, error } = await supabase
    .from("game_results")
    .select(
      `
        id,
        student_id,
        game_type,
        game_mode,
        mode_label,
        duration_ms,
        verification_status,
        is_personal_best,
        played_at
      `
    )
    .eq("student_id", studentId)
    .eq("game_type", gameType)
    .eq("game_mode", gameMode)
    .eq("verification_status", "verified")
    .not("duration_ms", "is", null)
    .order("duration_ms", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/**
 * Saves a completed multiplication result for the authenticated
 * account's one playable learning profile.
 *
 * Logged-out visitors are returned as guests and no account result is
 * inserted. Their existing public/guest submission flow can continue.
 */
export async function saveMultiplicationResult({
  gameMode,
  durationMs,
  correctAnswers,
  incorrectAnswers = 0,
  antiCheatData = {},
  verificationStatus = "verified",
  publicEligible = true,
  submissionType = "practice",
  challengeKey = null,
  eventName = null,
  playedAt = new Date().toISOString(),
}) {
  const playableProfile = await getPlayableProfile();

  if (!playableProfile) {
    return {
      saved: false,
      guest: true,
      result: null,
      profile: null,
      isPersonalBest: false,
      previousBest: null,
    };
  }

  const normalisedMode = normaliseGameMode(gameMode);
  const modeConfig = MULTIPLICATION_MODES[normalisedMode];

  if (!modeConfig) {
    throw new Error(
      `Unsupported multiplication mode: ${gameMode}`
    );
  }

  const cleanDurationMs = validateDuration(durationMs);

  const cleanCorrectAnswers = validateAnswerCount(
    correctAnswers,
    modeConfig.expectedAnswers
  );

  const cleanIncorrectAnswers = validateAnswerCount(
    incorrectAnswers,
    0
  );

  const accuracyPercent = calculateAccuracy(
    cleanCorrectAnswers,
    cleanIncorrectAnswers
  );

  const { user, profile } = playableProfile;

  const previousBest = await getPreviousBestResult({
    studentId: profile.id,
    gameType: "multiplication",
    gameMode: modeConfig.gameMode,
  });

  const isPersonalBest =
    verificationStatus === "verified" &&
    (!previousBest ||
      cleanDurationMs < Number(previousBest.duration_ms));

  const resultPayload = {
    student_id: profile.id,
    account_id: user.id,

    game_type: "multiplication",
    game_mode: modeConfig.gameMode,
    mode_label: modeConfig.modeLabel,

    duration_ms: cleanDurationMs,

    score: null,
    max_score: null,

    correct_answers: cleanCorrectAnswers,
    incorrect_answers: cleanIncorrectAnswers,
    accuracy_percent: accuracyPercent,

    submission_type: submissionType,
    challenge_key: challengeKey,
    event_name: eventName,

    public_eligible: Boolean(publicEligible),
    verification_status: verificationStatus,

    anti_cheat_data: {
      ...antiCheatData,
      durationMs: cleanDurationMs,
      correctAnswers: cleanCorrectAnswers,
      incorrectAnswers: cleanIncorrectAnswers,
      expectedAnswers: modeConfig.expectedAnswers,
      savedFrom: "multiplication-game",
    },

    rejection_reason: null,
    is_personal_best: isPersonalBest,
    played_at: playedAt,
  };

  const { data: savedResult, error: insertError } =
    await supabase
      .from("game_results")
      .insert(resultPayload)
      .select()
      .single();

  if (insertError) {
    throw insertError;
  }

  return {
    saved: true,
    guest: false,
    result: savedResult,
    profile,
    isPersonalBest,
    previousBest,
  };
}

/**
 * General helper for future score-based CountMeInTT activities such
 * as Math Language, Fractions, Algebra and Word Problems.
 */
export async function saveScoreBasedResult({
  gameType,
  gameMode,
  modeLabel,
  score,
  maxScore,
  correctAnswers,
  incorrectAnswers,
  antiCheatData = {},
  verificationStatus = "verified",
  publicEligible = true,
  submissionType = "practice",
  challengeKey = null,
  eventName = null,
  playedAt = new Date().toISOString(),
}) {
  const playableProfile = await getPlayableProfile();

  if (!playableProfile) {
    return {
      saved: false,
      guest: true,
      result: null,
      profile: null,
    };
  }

  const cleanScore = validateAnswerCount(score);
  const cleanMaxScore = validateAnswerCount(maxScore);

  if (!gameType) {
    throw new Error("A game type is required.");
  }

  if (!gameMode) {
    throw new Error("A game mode is required.");
  }

  if (!modeLabel) {
    throw new Error("A mode label is required.");
  }

  if (cleanMaxScore <= 0) {
    throw new Error(
      "A score-based game must have a maximum score greater than zero."
    );
  }

  if (cleanScore > cleanMaxScore) {
    throw new Error(
      "The saved score cannot be greater than the maximum score."
    );
  }

  const cleanCorrectAnswers = validateAnswerCount(
    correctAnswers,
    cleanScore
  );

  const cleanIncorrectAnswers = validateAnswerCount(
    incorrectAnswers,
    Math.max(0, cleanMaxScore - cleanCorrectAnswers)
  );

  const accuracyPercent = calculateAccuracy(
    cleanCorrectAnswers,
    cleanIncorrectAnswers
  );

  const { user, profile } = playableProfile;

  const resultPayload = {
    student_id: profile.id,
    account_id: user.id,

    game_type: gameType,
    game_mode: gameMode,
    mode_label: modeLabel,

    duration_ms: null,

    score: cleanScore,
    max_score: cleanMaxScore,

    correct_answers: cleanCorrectAnswers,
    incorrect_answers: cleanIncorrectAnswers,
    accuracy_percent: accuracyPercent,

    submission_type: submissionType,
    challenge_key: challengeKey,
    event_name: eventName,

    public_eligible: Boolean(publicEligible),
    verification_status: verificationStatus,

    anti_cheat_data: {
      ...antiCheatData,
      score: cleanScore,
      maxScore: cleanMaxScore,
      correctAnswers: cleanCorrectAnswers,
      incorrectAnswers: cleanIncorrectAnswers,
      savedFrom: "score-based-game",
    },

    rejection_reason: null,
    is_personal_best: false,
    played_at: playedAt,
  };

  const { data: savedResult, error: insertError } =
    await supabase
      .from("game_results")
      .insert(resultPayload)
      .select()
      .single();

  if (insertError) {
    throw insertError;
  }

  return {
    saved: true,
    guest: false,
    result: savedResult,
    profile,
  };
}

export { MULTIPLICATION_MODES };

