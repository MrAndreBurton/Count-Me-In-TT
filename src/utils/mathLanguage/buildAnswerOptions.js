// src/utils/mathLanguage/buildAnswerOptions.js

import { shuffleArray } from "./shuffleArray";

export function buildAnswerOptions(question) {
  const options = [
    {
      label: question.correctAnswer,
      isCorrect: true,
    },
    {
      label: question.wrongOption1,
      isCorrect: false,
    },
    {
      label: question.wrongOption2,
      isCorrect: false,
    },
    {
      label: question.wrongOption3,
      isCorrect: false,
    },
  ];

  return shuffleArray(options);
}

