import { championMonths, loadMonthlyChampions } from "./monthlyChampions.js";
import { featuredChampionMonth, loadChampionCatalogue, loadPublicChampionMonth } from "./publicChampions.js";

export function privateChampionBoards(boards = []) {
  return boards.filter(b => ["organisation", "class"].includes(b.scope) && b.game_key === "multiplication" &&
    ["active", "paused"].includes(b.status)).sort((a, b) =>
    (a.organisation_name || "").localeCompare(b.organisation_name || "") ||
    (a.scope === "class") - (b.scope === "class") || a.name.localeCompare(b.name));
}

export async function loadChampionAccess(client, publicService, privateService) {
  const publicRequest = publicService.listBoards().then(boards => ({ publicBoards: boards, publicError: false }))
    .catch(() => ({ publicBoards: [], publicError: true }));
  const privateRequest = (async () => {
    try {
      const { data: { session } = {}, error } = await client.auth.getSession();
      if (error) throw error;
      if (!session || session.user?.is_anonymous) return { privateStatus: "signed_out", privateBoards: [] };
      const { data: { user } = {}, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user || user.is_anonymous) return { privateStatus: "signed_out", privateBoards: [] };
      const boards = await privateService.listBoards({ game_key: "multiplication" });
      return { privateStatus: "ready", privateBoards: privateChampionBoards(boards), userId: user.id };
    } catch { return { privateStatus: "error", privateBoards: [] }; }
  })();
  const [publicAccess, privateAccess] = await Promise.all([publicRequest, privateRequest]);
  return { ...publicAccess, ...privateAccess };
}

export function championCollectionSelection(access, params) {
  const audience = params.get("audience") === "organisation" ? "organisation" : "public";
  if (audience === "public") return { audience, board: null, permitted: !access.publicError };
  const boards = access.privateBoards || [];
  const requested = params.get("board");
  // An explicit inaccessible board never falls back to another organisation.
  const board = requested ? boards.find(b => b.id === requested) : boards[0];
  return { audience, board: board || null, permitted: access.privateStatus === "ready" && !!board };
}

export function championCollectionPath(archive, selection) {
  const base = archive ? "/hall-of-fame/archive" : "/hall-of-fame";
  return selection.audience === "organisation" && selection.board
    ? base + "?" + new URLSearchParams({ audience: "organisation", board: selection.board.id }) : base;
}

export async function loadCollectionCatalogue(services, access, selection, now = new Date()) {
  if (!selection.permitted) throw new Error("Collection access is unavailable.");
  if (selection.audience === "public") {
    return loadChampionCatalogue({ ...services.publicService, listBoards: async () => access.publicBoards }, services.archiveService, now);
  }
  const seasons = await services.privateService.listSeasons(selection.board.id);
  const featured = featuredChampionMonth(now);
  const confirmed = championMonths(seasons.filter(s => s.finalised_at).map(s => s.month)).filter(m => m <= featured);
  return { featured, board: selection.board, confirmed, historical: [],
    pending: seasons.some(s => s.month === featured && !s.finalised_at),
    archiveMonths: confirmed.filter(m => m < featured) };
}

export async function loadCollectionMonth(services, selection, catalogue, month) {
  if (!selection.permitted) throw new Error("Collection access is unavailable.");
  if (selection.audience === "public") return loadPublicChampionMonth(services.publicService, services.archiveService, catalogue, month);
  if (!catalogue.confirmed.includes(month)) return { rows: [], legacy: false, pending: month === catalogue.featured && catalogue.pending };
  return { rows: await loadMonthlyChampions(services.privateService, selection.board, month), legacy: false, pending: false };
}
