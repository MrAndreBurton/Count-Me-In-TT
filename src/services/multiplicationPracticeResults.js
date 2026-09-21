import { supabase } from "../lib/supabase";

export const GUEST_PRACTICE_ACCESS = {
  authenticated: false,
  profile: null,
  hasMemberAccess: false,
  freeTables: [1, 2, 5, 10],
};

function practiceError(error, fallbackMessage) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");

  if (message.includes("MEMBERSHIP_REQUIRED")) {
    return new Error(
      "This times table requires an active membership."
    );
  }

  if (message.includes("PLAYABLE_PROFILE_REQUIRED")) {
    return new Error(
      "Complete your learning profile before saving practice rounds."
    );
  }

  if (message.includes("MULTIPLE_PLAYABLE_PROFILES")) {
    return new Error(
      "This account has more than one playable profile. Please contact support."
    );
  }

  if (message.includes("SIGN_IN_REQUIRED") || code === "28000") {
    return new Error("Sign in to save practice rounds.");
  }

  return new Error(message || fallbackMessage);
}

export async function getMultiplicationPracticeAccess() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw practiceError(
      sessionError,
      "Your sign-in status could not be checked."
    );
  }

  if (!session) {
    return GUEST_PRACTICE_ACCESS;
  }

  const { data, error } = await supabase.rpc(
    "get_multiplication_practice_access"
  );

  if (error) {
    throw practiceError(
      error,
      "Your practice access could not be loaded."
    );
  }

  return {
    authenticated: true,
    profile: data?.profile || null,
    hasMemberAccess: Boolean(data?.hasMemberAccess),
    freeTables: Array.isArray(data?.freeTables)
      ? data.freeTables.map(Number)
      : [1, 2, 5, 10],
  };
}

export function subscribeToPracticeAuthChanges(callback) {
  const { data } = supabase.auth.onAuthStateChange(() => {
    window.setTimeout(callback, 0);
  });

  return () => data.subscription.unsubscribe();
}

export async function getMultiplicationPracticeBest({
  tableNumber,
  mode,
  rangeMax,
}) {
  const { data, error } = await supabase.rpc(
    "get_multiplication_practice_best",
    {
      p_table_number: Number(tableNumber),
      p_practice_mode: mode,
      p_range_max: Number(rangeMax),
    }
  );

  if (error) {
    throw practiceError(
      error,
      "Your personal best could not be loaded."
    );
  }

  return {
    gameMode: data?.gameMode || null,
    bestDurationMs:
      data?.bestDurationMs === null ||
      data?.bestDurationMs === undefined
        ? null
        : Number(data.bestDurationMs),
    playedAt: data?.playedAt || null,
  };
}

export async function saveMultiplicationPracticeRound(result) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw practiceError(
      sessionError,
      "Your sign-in status could not be checked."
    );
  }

  // This guard is deliberate: guests never make a result write request.
  if (!session) {
    return {
      saved: false,
      guest: true,
      result: null,
    };
  }

  const { data, error } = await supabase.rpc(
    "save_multiplication_practice_round",
    {
      p_table_number: Number(result.tableNumber),
      p_practice_mode: result.mode,
      p_range_max: Number(result.rangeMax),
      p_duration_ms: Number(result.durationMs),
      p_incorrect_attempts: Number(
        result.incorrectAttempts
      ),
      p_facts_missed_first_try: Number(
        result.factsMissedFirstTry
      ),
    }
  );

  if (error) {
    throw practiceError(
      error,
      "This completed round could not be saved."
    );
  }

  return {
    ...data,
    guest: false,
    saved: Boolean(data?.saved),
    durationMs: Number(data?.durationMs),
    previousBestDurationMs:
      data?.previousBestDurationMs === null ||
      data?.previousBestDurationMs === undefined
        ? null
        : Number(data.previousBestDurationMs),
    bestDurationMs: Number(data?.bestDurationMs),
    isPersonalBest: Boolean(data?.isPersonalBest),
  };
}
