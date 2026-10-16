export const CHAMPION_GRIDS = Object.freeze(["5x5", "5x12", "12x12", "15x15"]);
export const CHAMPION_CATEGORIES = Object.freeze(["Primary", "Secondary", "NoSchool"]);

export function championCategoryLabel(category) {
  return category === "NoSchool" ? "Open" : category === "all" ? "All learners" : category;
}

export function championMonths(months = []) {
  return [...new Set(months)].filter(m => /^\d{4}-(0[1-9]|1[0-2])-01$/.test(m)).sort().reverse();
}

export function championYears(months) {
  return [...new Set(championMonths(months).map(m => m.slice(0, 4)))];
}

export function championMonthInYear(months, value, year) {
  const available = championMonths(months).filter(m => m.startsWith(year + "-"));
  return available.find(m => m.slice(5) === value?.slice(5)) || available[0] || "";
}

export function sortChampions(rows) {
  // Grid/category ordering celebrates each competition equally; there is no overall rank.
  return [...rows].sort((a, b) => CHAMPION_GRIDS.indexOf(a.variant) - CHAMPION_GRIDS.indexOf(b.variant) ||
    CHAMPION_CATEGORIES.indexOf(a.category) - CHAMPION_CATEGORIES.indexOf(b.category) ||
    a.display_name.localeCompare(b.display_name));
}

export async function loadMonthlyChampions(service, board, month) {
  const categories = board.scope === "public" ? CHAMPION_CATEGORIES : ["all"];
  const requests = CHAMPION_GRIDS.flatMap(variant => categories.map(category =>
    service.getHallOfFame(board.id, { month, variant, category }).then(rows => rows.map(row => ({ ...row, variant, category })))
  ));
  // Any failed partition fails the whole month, avoiding an incomplete champions display.
  return sortChampions((await Promise.all(requests)).flat());
}

export async function loadArchivedMonthlyChampions(service, month) {
  const requests = CHAMPION_GRIDS.flatMap(variant => CHAMPION_CATEGORIES.map(category =>
    service.getAwards({ month, variant, category }).then(rows => rows.map(row => ({ ...row, variant, category })))
  ));
  return sortChampions((await Promise.all(requests)).flat());
}
