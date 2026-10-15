// Legacy published sheets must stay disconnected during the privacy migration.
export const ENABLE_TOP_PLAYERS = false;
export const ENABLE_PUBLIC_LEADERBOARD_SUBMISSIONS = false;

export const GRID_PRESETS = [
  {
    id: "5x5",
    rows: 5,
    cols: 5,
    label: "5 × 5 (Quick)",
  },
  {
    id: "5x12",
    rows: 5,
    cols: 12,
    label: "5 × 12 (Trainer)",
  },
  {
    id: "12x12",
    rows: 12,
    cols: 12,
    label: "12 × 12 (Classic)",
  },
  {
    id: "15x15",
    rows: 15,
    cols: 15,
    label: "15 × 15 (Pro)",
  },
];

export const CATEGORY_OPTIONS = [
  "Primary",
  "Secondary",
  "NoSchool",
];

export const PRIMARY_CLASS_OPTIONS = [
  "Prep 1",
  "Prep 2",
  "Prep 3",
  "Prep 4",
  "Prep 5",
  "Std 1",
  "Std 2",
  "Std 3",
  "Std 4",
  "Std 5",
];

export const SECONDARY_CLASS_OPTIONS = [
  "Form 1 (Grade 6)",
  "Form 2 (Grade 7)",
  "Form 3 (Grade 8)",
  "Form 4 (Grade 9)",
  "Form 5 (Grade 10)",
  "Lower Six (Grade 12)",
  "Upper Six (Grade 13)",
];

// Historical records remain in their source sheets. Do not republish them here.
export const WEBHOOKS = {};
export const SHEET_URLS = {};

export function isSmallGrid(gridId) {
  return gridId === "5x5" || gridId === "5x12";
}

export function getCategoryOptions() {
  return CATEGORY_OPTIONS;
}

export function getClassOptions(category) {
  return category === "Secondary"
    ? SECONDARY_CLASS_OPTIONS
    : PRIMARY_CLASS_OPTIONS;
}

export function getSheetUrls(gridId) {
  return SHEET_URLS[gridId] || {};
}

export function generateGrid(rows, cols) {
  const grid = [];

  for (let row = 1; row <= rows; row += 1) {
    const currentRow = [];

    for (
      let column = 1;
      column <= cols;
      column += 1
    ) {
      currentRow.push({
        value: "",
        correct: null,
        answer: row * column,
      });
    }

    grid.push(currentRow);
  }

  return grid;
}

export function formatTime(milliseconds) {
  const minutes = Math.floor(
    milliseconds / 60000
  );

  const seconds = Math.floor(
    (milliseconds % 60000) / 1000
  );

  const hundredths = Math.floor(
    (milliseconds % 1000) / 10
  );

  return `${minutes
    .toString()
    .padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${hundredths
    .toString()
    .padStart(2, "0")}`;
}

export function timeToMilliseconds(time) {
  const cleanTime = String(time || "").trim();

  const match =
    /^(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/.exec(
      cleanTime
    );

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fraction = match[3]
    ? Number(match[3])
    : 0;

  const milliseconds =
    match[3]?.length === 3
      ? fraction
      : fraction * (match[3] ? 10 : 0);

  return (
    minutes * 60000 +
    seconds * 1000 +
    milliseconds
  );
}


