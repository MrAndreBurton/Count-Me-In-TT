// src/utils/mathLanguage/getPlayableQuestions.js

import { shuffleArray } from "./shuffleArray";
import { validateQuestion } from "./validateQuestion";
import { buildAnswerOptions } from "./buildAnswerOptions";

const MVP_GAME_MODES = ["Word Match", "Action Match"];

export function getPlayableQuestions(terms, questionCount = 10) {
  const validQuestions = terms.filter((term) => {
    return (
      term.accessLevel === "Free" &&
      MVP_GAME_MODES.includes(term.gameMode) &&
      validateQuestion(term)
    );
  });

  return shuffleArray(validQuestions)
    .slice(0, questionCount)
    .map((question) => ({
      ...question,
      answerOptions: buildAnswerOptions(question),
    }));
}

