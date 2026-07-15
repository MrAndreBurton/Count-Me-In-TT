export const ENABLE_TOP_PLAYERS = true;

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

export const WEBHOOKS = {
  "5x5":
    "https://script.google.com/macros/s/AKfycbxqc76ZwIAnrmZ8bwt7W2Leu8NtvSmbkurgzNkRN3lHhs0SeIeEdCnU58h63l0lWDMaAQ/exec",

  "5x12":
    "https://script.google.com/macros/s/AKfycbw5_-TS-qQcaAvzCl152XKngYKxVlrD5J7ZE7SeMjn12XY0vXhvqH75Kzp8eJvRfv0E/exec",

  "12x12":
    "https://script.google.com/macros/s/AKfycbyLBvT9IGpdm81NK9lR1D0LDfsaeWkHsiGIUhDMStZV8NpFPjG55q0GVgRfbX6qPo9K/exec",

  "15x15":
    "https://script.google.com/macros/s/AKfycbyGdG4O7BRgP9yGCuUFvD9dS1ZWEDvZnYhbNMhaEGcsSKH8QsyOgeOZzg7cdKnli0V9Sg/exec",
};

export const SHEET_URLS = {
  "5x5": {
    SmallTop:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXvvpwFIx6TuA-dB26pjW6K0w8oRhg0IDgMO-69ag19hMATBAzC2Wf-I6m4Q5fUjLgCFNnzuT_cQUn/pub?gid=0&single=true&output=csv",
  },

  "5x12": {
    SmallTop:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXvvpwFIx6TuA-dB26pjW6K0w8oRhg0IDgMO-69ag19hMATBAzC2Wf-I6m4Q5fUjLgCFNnzuT_cQUn/pub?gid=1665132778&single=true&output=csv",
  },

  "12x12": {
    Primary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=0&single=true&output=csv",

    Secondary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1127334724&single=true&output=csv",

    NoSchool:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQIm6uIsWGD3h7D9T27ReAL9IrFhNcaYmNsez4xLp5N7InbXL9OjbTCHD93e4VKsF0uOPx20c3WJC-b/pub?gid=1462166071&single=true&output=csv",
  },

  "15x15": {
    Primary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=0&single=true&output=csv",

    Secondary:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=1175275328&single=true&output=csv",

    NoSchool:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMNl9g61jMzOv_K8SH8ITlvGCOL8WNm3ED3vp6UoMoJArERRqthGkQNzN4bIBMs7t_uuYedtEHzXc0/pub?gid=800118807&single=true&output=csv",
  },
};

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


