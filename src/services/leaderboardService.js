// The client chooses a view; the database decides scope and authority.
// No direct reads/writes of private competition tables or client-supplied roles.
export function createLeaderboardService(supabase) {
  if (typeof supabase?.rpc !== "function") {
    throw new Error("A Supabase client is required.");
  }
  async function call(action, payload = {}) {
    const { data, error } = await supabase.rpc("leaderboard_api", {
      p_action: action,
      p_payload: payload,
    });
    if (error) throw error;
    return data;
  }
  return Object.freeze({
    listGames: () => call("list_games"),
    listOrganisations: () => call("list_organisations"),
    listGroups: (organisationId) => call("list_groups", { organisation_id: organisationId }),
    listBoards: (filters = {}) => call("list_boards", Object.fromEntries(
      Object.entries(filters).filter(([key, value]) =>
        ["game_key", "organisation_id", "scope"].includes(key) && value != null && value !== "")
    )),
    createBoard: (configuration) => call("create_board", configuration),
    updateBoard: (boardId, changes) => call("update_board", { ...changes, board_id: boardId }),
    getClassEntitlement: (organisationId, gameKey = "multiplication") =>
      call("get_class_entitlement", { organisation_id: organisationId, game_key: gameKey }),
    setClassEntitlement: (configuration) => call("set_class_entitlement", configuration),
    listSeasons: (boardId) => call("list_seasons", { board_id: boardId }),
    ensureSeason: (boardId, month) => call("ensure_season", {
      board_id: boardId, ...(month ? { month } : {}),
    }),
    getStandings: (boardId, { month, variant, category } = {}) =>
      call("standings", { board_id: boardId, month, variant, ...(category ? { category } : {}) }),
    getHallOfFame: (boardId, { month, variant, category } = {}) =>
      call("hall_of_fame", { board_id: boardId, month, variant, ...(category ? { category } : {}) }),
    finaliseSeason: (boardId, month) => call("finalise_season", { board_id: boardId, month }),
    getAudit: (organisationId) => call("audit", { organisation_id: organisationId }),
  });
}
