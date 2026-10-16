import { currentLeaderboardMonth } from "./leaderboardPresentation.js";
import { loadArchivedMonthlyChampions, loadMonthlyChampions, championMonths } from "./monthlyChampions.js";

export function featuredChampionMonth(now = new Date()) {
  const current = currentLeaderboardMonth(now);
  const date = new Date(current + "T12:00:00Z");
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 10);
}

export async function loadChampionCatalogue(publicService, archiveService, now = new Date()) {
  const featured = featuredChampionMonth(now);
  const [boards, historical] = await Promise.all([publicService.listBoards(), archiveService.listMonths()]);
  const board = boards.find(b => b.scope === "public" && b.game_key === "multiplication" && ["active", "paused"].includes(b.status));
  const seasons = board ? await publicService.listSeasons(board.id) : [];
  const confirmed = seasons.filter(s => s.finalised_at && s.month <= featured).map(s => s.month);
  return { featured, board, confirmed, historical: championMonths(historical),
    // The featured month stays on the main page until the next Trinidad month.
    archiveMonths: championMonths([...confirmed, ...historical]).filter(m => m < featured) };
}

export async function loadPublicChampionMonth(publicService, archiveService, catalogue, month) {
  if (catalogue.confirmed.includes(month) && catalogue.board) {
    return { rows: await loadMonthlyChampions(publicService, catalogue.board, month), legacy: false, pending: false };
  }
  if (catalogue.historical.includes(month)) {
    return { rows: await loadArchivedMonthlyChampions(archiveService, month), legacy: true, pending: false };
  }
  return { rows: [], legacy: false, pending: month === catalogue.featured };
}

export function legacyHallDestination(params) {
  const next = new URLSearchParams(params);
  next.delete("view"); next.delete("grid"); next.delete("category"); next.delete("month");
  if (params.get("audience") === "public") return "/hall-of-fame";
  next.set("audience", "organisation");
  return "/hall-of-fame?" + next.toString();
}
