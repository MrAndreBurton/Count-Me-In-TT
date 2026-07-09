// src/utils/mathLanguage/getBadgeResult.js

export function getBadgeResult(score, totalQuestions) {
  if (score === totalQuestions) {
    return {
      badge: "Math Language Master",
      message: "Excellent work. You understood every word in this round.",
    };
  }

  if (score >= 8) {
    return {
      badge: "SEA Word Star",
      message: "Great job. You are getting stronger at decoding math questions.",
    };
  }

  if (score >= 6) {
    return {
      badge: "Question Decoder",
      message: "Good effort. Review the words you missed and try again.",
    };
  }

  return {
    badge: "Keep Practising",
    message:
      "Every word you learn makes math questions easier to understand. Try again and build your confidence.",
  };
}

