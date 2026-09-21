export const PRACTICE_TABLES = Array.from(
  { length: 12 },
  (_, index) => index + 1
);

export const FREE_PRACTICE_TABLES = new Set([
  1, 2, 5, 10,
]);

export const PRACTICE_MODES = {
  build: {
    id: "build",
    label: "Build the Table",
    description: "Complete the facts in order.",
  },
  mix: {
    id: "mix",
    label: "Mix It Up",
    description: "Complete the facts in shuffled order.",
  },
};

export const PRACTICE_RANGES = [12, 15];

export function formatPracticeTime(milliseconds) {
  const safeMilliseconds = Math.max(
    0,
    Number(milliseconds) || 0
  );

  const minutes = Math.floor(
    safeMilliseconds / 60000
  );

  const seconds = Math.floor(
    (safeMilliseconds % 60000) / 1000
  );

  const hundredths = Math.floor(
    (safeMilliseconds % 1000) / 10
  );

  return `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}.${String(hundredths).padStart(
    2,
    "0"
  )}`;
}

export function shufflePracticeFacts(facts) {
  const shuffled = facts.map((fact) => ({ ...fact }));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  const unchanged = shuffled.every(
    (fact, index) => fact.factor === facts[index]?.factor
  );

  if (unchanged && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [
      shuffled[1],
      shuffled[0],
    ];
  }

  return shuffled;
}

export function createPracticeFacts({
  tableNumber,
  rangeMax,
  mode,
}) {
  const safeTableNumber = Number(tableNumber);
  const safeRangeMax = Number(rangeMax);

  if (!PRACTICE_TABLES.includes(safeTableNumber)) {
    throw new Error("Choose a times table from 1 to 12.");
  }

  if (!PRACTICE_RANGES.includes(safeRangeMax)) {
    throw new Error("Choose a practice length of 12 or 15.");
  }

  if (!PRACTICE_MODES[mode]) {
    throw new Error("Choose a valid practice mode.");
  }

  const facts = Array.from(
    { length: safeRangeMax },
    (_, index) => {
      const factor = index + 1;

      return {
        id: `${safeTableNumber}x${factor}`,
        tableNumber: safeTableNumber,
        factor,
        answer: safeTableNumber * factor,
      };
    }
  );

  return mode === "mix"
    ? shufflePracticeFacts(facts)
    : facts;
}

export function calculateFirstTryAccuracy({
  factCount,
  factsMissedFirstTry,
}) {
  const safeFactCount = Math.max(
    0,
    Number(factCount) || 0
  );

  if (safeFactCount === 0) return 0;

  const safeMissedCount = Math.min(
    safeFactCount,
    Math.max(0, Number(factsMissedFirstTry) || 0)
  );

  return Math.round(
    ((safeFactCount - safeMissedCount) /
      safeFactCount) *
      100
  );
}

export function createPracticeResult({
  tableNumber,
  mode,
  rangeMax,
  durationMs,
  incorrectAttempts,
  factsMissedFirstTry,
}) {
  const factCount = Number(rangeMax);

  return {
    gameType: "multiplication_practice",
    tableNumber: Number(tableNumber),
    mode,
    rangeMax: Number(rangeMax),
    factCount,
    durationMs: Math.max(0, Math.round(durationMs)),
    incorrectAttempts: Math.max(
      0,
      Math.round(incorrectAttempts)
    ),
    factsMissedFirstTry: Math.max(
      0,
      Math.round(factsMissedFirstTry)
    ),
    firstTryAccuracy: calculateFirstTryAccuracy({
      factCount,
      factsMissedFirstTry,
    }),
    completedAt: new Date().toISOString(),
  };
}
