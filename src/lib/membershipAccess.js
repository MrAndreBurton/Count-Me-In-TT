import {
  getEntitlement,
  hasEntitlement,
} from "../utils/accessControl";

const DEFAULT_ENTITLEMENTS = {
  multiplication_game: true,
  public_leaderboard: true,
  hall_of_fame: true,

  saved_personal_best: true,
  stored_results_limit: 10,
  full_result_history: false,
  result_filters: "basic",

  multiplication_badges: "basic",

  math_language_10: true,
  math_language_10_word_bank: "top_50",

  math_language_25: true,
  math_language_25_word_bank: "top_50",

  math_language_40: false,
  math_language_40_word_bank: "top_50",

  dictionary_access: "top_50",

  missed_word_review: "basic",
  progress_reports: "basic",

  student_login: true,
  child_profile_limit: 5,
  academic_history: "current",

  symbols_factory: "limited",
  math_thesaurus: "limited",
  rules_and_laws: "limited",

  downloadable_reports: false,
  premium_games: false,
};

export function isPaidMembership(membership) {
  return Boolean(
    membership?.isPaid ||
      membership?.plan?.isPaid
  );
}

export function isFreeMembership(membership) {
  return !isPaidMembership(membership);
}

export function getMembershipPlanKey(membership) {
  return membership?.planKey || membership?.plan?.key || "free";
}

export function getMembershipPlanName(membership) {
  return (
    membership?.planName ||
    membership?.plan?.name ||
    "Free Account"
  );
}

export function canPlayMultiplication(membership) {
  return hasEntitlement(
    membership,
    "multiplication_game"
  );
}

export function canUsePublicLeaderboard(membership) {
  return hasEntitlement(
    membership,
    "public_leaderboard"
  );
}

export function canUseHallOfFame(membership) {
  return hasEntitlement(
    membership,
    "hall_of_fame"
  );
}

export function canSavePersonalBest(membership) {
  return hasEntitlement(
    membership,
    "saved_personal_best"
  );
}

export function getStoredResultsLimit(membership) {
  const value = getEntitlement(
    membership,
    "stored_results_limit",
    10
  );

  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return 10;
  }

  return parsedValue;
}

export function hasUnlimitedResultHistory(membership) {
  return (
    hasEntitlement(
      membership,
      "full_result_history"
    ) ||
    getStoredResultsLimit(membership) === null
  );
}

export function getResultFilterAccess(membership) {
  return getEntitlement(
    membership,
    "result_filters",
    "basic"
  );
}

export function getMultiplicationBadgeAccess(
  membership
) {
  return getEntitlement(
    membership,
    "multiplication_badges",
    "basic"
  );
}

export function canPlayMathLanguageLevel(
  membership,
  questionCount
) {
  const count = Number(questionCount);

  if (![10, 25, 40].includes(count)) {
    return false;
  }

  return hasEntitlement(
    membership,
    `math_language_${count}`
  );
}

export function getMathLanguageWordBank(
  membership,
  questionCount
) {
  const count = Number(questionCount);

  if (![10, 25, 40].includes(count)) {
    return "top_50";
  }

  return getEntitlement(
    membership,
    `math_language_${count}_word_bank`,
    "top_50"
  );
}

export function hasFullMathLanguageAccess(
  membership
) {
  return (
    canPlayMathLanguageLevel(membership, 10) &&
    canPlayMathLanguageLevel(membership, 25) &&
    canPlayMathLanguageLevel(membership, 40) &&
    getMathLanguageWordBank(membership, 40) ===
      "full_200"
  );
}

export function getDictionaryAccess(membership) {
  return getEntitlement(
    membership,
    "dictionary_access",
    "top_50"
  );
}

export function canAccessFullDictionary(membership) {
  return (
    getDictionaryAccess(membership) ===
    "full_200"
  );
}

export function getMissedWordReviewAccess(
  membership
) {
  return getEntitlement(
    membership,
    "missed_word_review",
    "basic"
  );
}

export function getProgressReportAccess(
  membership
) {
  return getEntitlement(
    membership,
    "progress_reports",
    "basic"
  );
}

export function canUseStudentLogin(membership) {
  return hasEntitlement(
    membership,
    "student_login"
  );
}

export function getChildProfileLimit(membership) {
  const value = getEntitlement(
    membership,
    "child_profile_limit",
    5
  );

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return 5;
  }

  return parsedValue;
}

export function getAcademicHistoryAccess(
  membership
) {
  return getEntitlement(
    membership,
    "academic_history",
    "current"
  );
}

export function getSymbolsFactoryAccess(
  membership
) {
  return getEntitlement(
    membership,
    "symbols_factory",
    "limited"
  );
}

export function canAccessFullSymbolsFactory(
  membership
) {
  return (
    getSymbolsFactoryAccess(membership) ===
    "full"
  );
}

export function getMathThesaurusAccess(
  membership
) {
  return getEntitlement(
    membership,
    "math_thesaurus",
    "limited"
  );
}

export function canAccessFullMathThesaurus(
  membership
) {
  return (
    getMathThesaurusAccess(membership) ===
    "full"
  );
}

export function getRulesAndLawsAccess(
  membership
) {
  return getEntitlement(
    membership,
    "rules_and_laws",
    "limited"
  );
}

export function canAccessFullRulesAndLaws(
  membership
) {
  return (
    getRulesAndLawsAccess(membership) ===
    "full"
  );
}

export function canDownloadReports(membership) {
  return hasEntitlement(
    membership,
    "downloadable_reports"
  );
}

export function canAccessPremiumGames(membership) {
  return hasEntitlement(
    membership,
    "premium_games"
  );
}

export function getMathLanguageAccessSummary(
  membership
) {
  return {
    canPlay10: canPlayMathLanguageLevel(
      membership,
      10
    ),

    canPlay25: canPlayMathLanguageLevel(
      membership,
      25
    ),

    canPlay40: canPlayMathLanguageLevel(
      membership,
      40
    ),

    wordBank10: getMathLanguageWordBank(
      membership,
      10
    ),

    wordBank25: getMathLanguageWordBank(
      membership,
      25
    ),

    wordBank40: getMathLanguageWordBank(
      membership,
      40
    ),

    dictionaryAccess:
      getDictionaryAccess(membership),

    hasFullDictionary:
      canAccessFullDictionary(membership),
  };
}


