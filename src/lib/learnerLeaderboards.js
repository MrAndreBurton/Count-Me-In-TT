import { createLeaderboardService } from "../services/leaderboardService.js";

// All board access is resolved by the protected API, never by a URL or profile picker.
export async function loadLearnerLeaderboards(client) {
  const { data: { user }, error } = await client.auth.getUser();
  if (error) throw error;
  if (!user) return { status: "signed_out", boards: [] };
  const boards = await createLeaderboardService(client).listBoards({ game_key: "multiplication" });
  return { status: "ready", userId: user.id, boards: visibleLearnerBoards(boards) };
}

export function visibleLearnerBoards(boards = []) {
  return boards.filter(b => b.game_key === "multiplication" && ["active", "paused"].includes(b.status))
    .sort((a, b) => (a.scope === "class") - (b.scope === "class") || a.name.localeCompare(b.name));
}

export function learnerBoardSelection(boards, params) {
  const audience = params.get("audience") === "public" ? "public" : "organisation";
  const available = visibleLearnerBoards(boards).filter(b => audience === "public" ? b.scope === "public" : b.scope !== "public");
  const board = available.find(b => b.id === params.get("board")) || available[0] || null;
  const grid = board?.variants.includes(params.get("grid")) ? params.get("grid") : board?.variants[0] || "";
  const category = audience === "public" && ["Primary", "Secondary", "NoSchool"].includes(params.get("category"))
    ? params.get("category") : audience === "public" ? "Primary" : "all";
  return { audience, available, board, grid, category, hall: params.get("view") === "hall-of-fame" };
}

export function learnerMonths(seasons, currentMonth) {
  return [...new Set([currentMonth, ...seasons.map(s => s.month)])]
    .filter(m => /^\d{4}-(0[1-9]|1[0-2])-01$/.test(m) && m <= currentMonth).sort().reverse();
}
