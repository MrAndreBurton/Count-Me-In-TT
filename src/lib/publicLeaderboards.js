// Only public, supported boards returned by the released API can be selected.
export function visiblePublicBoards(boards = []) {
  return boards.filter(board => board.scope === "public" && board.game_key === "multiplication" &&
    ["active", "paused"].includes(board.status));
}

export async function loadPublicLeaderboards(service) {
  return visiblePublicBoards(await service.listBoards());
}

export function publicLeaderboardParams(params, defaultHall = false) {
  const next = new URLSearchParams(params);
  next.set("audience", "public");
  if (!next.has("view") && defaultHall) next.set("view", "hall-of-fame");
  return next;
}
