// Only the released, public read API is used here, including for signed-in viewers.
// Board access and publication are enforced by the database.
export function createPublicLeaderboardService(client) {
  if (typeof client?.rpc !== "function") throw new Error("A Supabase client is required.");
  async function call(action, payload = {}) {
    const { data, error } = await client.rpc("public_leaderboard_api", {
      p_action: action, p_payload: payload,
    });
    if (error) throw error;
    return data;
  }
  const selection = (boardId, { month, variant, category } = {}) => ({
    board_id: boardId, month, variant, category,
  });
  return Object.freeze({
    listBoards: () => call("list_boards", { game_key: "multiplication" }),
    listSeasons: boardId => call("list_seasons", { board_id: boardId }),
    getStandings: (boardId, filters) => call("standings", selection(boardId, filters)),
    getHallOfFame: (boardId, filters) => call("hall_of_fame", selection(boardId, filters)),
  });
}
