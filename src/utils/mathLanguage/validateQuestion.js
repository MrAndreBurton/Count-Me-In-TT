// src/utils/mathLanguage/validateQuestion.js

export function validateQuestion(row) {
  const requiredFields = [
    "id",
    "term",
    "accessLevel",
    "gameMode",
    "gameQuestion",
    "correctAnswer",
    "wrongOption1",
    "wrongOption2",
    "wrongOption3",
    "feedback",
  ];

  const hasRequiredFields = requiredFields.every((field) => {
    return row[field] && String(row[field]).trim() !== "";
  });

  if (!hasRequiredFields) {
    return false;
  }

  const answers = [
    row.correctAnswer,
    row.wrongOption1,
    row.wrongOption2,
    row.wrongOption3,
  ].map((answer) => String(answer).trim().toLowerCase());

  const uniqueAnswers = new Set(answers);

  return uniqueAnswers.size === answers.length;
}

