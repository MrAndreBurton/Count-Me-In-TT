// src/utils/mathLanguage/shuffleArray.js

export function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}
