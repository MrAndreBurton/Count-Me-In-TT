export function createPublicScoreSubmissionService(client) {
  async function call(action, resultId, displayName) {
    const { data, error } = await client.rpc("public_score_submission", {
      p_action: action, p_payload: { result_id: resultId, ...(action === "submit" ? { display_name: displayName } : {}) },
    });
    if (error) throw error;
    return data;
  }
  return Object.freeze({ status: resultId => call("status", resultId), submit: (resultId, name) => call("submit", resultId, name) });
}

export function publicResultDestination(result) {
  const params = new URLSearchParams({ audience: "public", game: "multiplication" });
  if (result.variant) params.set("grid", result.variant);
  if (result.category) params.set("category", result.category);
  if (result.month) params.set("month", result.month);
  return "/my-leaderboards?" + params;
}
