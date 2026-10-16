export function ordinalRank(value) {
  const rank = Number(value);
  if (!Number.isSafeInteger(rank) || rank < 1) return "—";
  const lastTwo = rank % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return rank + "th";
  return rank + ({ 1: "st", 2: "nd", 3: "rd" }[rank % 10] || "th");
}
