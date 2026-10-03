export const PRIMARY_LEVELS = [
  "Prep 1",
  "Prep 2",
  "Prep 3",
  "Prep 4",
  "Prep 5",
  "Standard 1",
  "Standard 2",
  "Standard 3",
  "Standard 4",
  "Standard 5",
];

export const SECONDARY_LEVELS = [
  "Form 1 (Grade 6)",
  "Form 2 (Grade 7)",
  "Form 3 (Grade 8)",
  "Form 4 (Grade 9)",
  "Form 5 (Grade 10)",
  "Lower Six (Grade 12)",
  "Upper Six (Grade 13)",
];

export const ACADEMIC_YEARS = [
  "2026–2027",
  "2027–2028",
  "2028–2029",
];

export function getLevelOptions(schoolType) {
  if (schoolType === "secondary") {
    return SECONDARY_LEVELS;
  }

  if (schoolType === "primary") {
    return PRIMARY_LEVELS;
  }

  return [];
}
