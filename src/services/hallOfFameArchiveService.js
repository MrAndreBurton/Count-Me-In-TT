export function createHallOfFameArchiveService(client) {
  async function call(endpoint, action, payload = {}) {
    const { data, error } = await client.rpc(endpoint, { p_action: action, p_payload: payload });
    if (error) throw error;
    return data;
  }
  return Object.freeze({
    listMonths: () => call("hall_of_fame_archive_api", "list_months"),
    getAwards: ({ month, variant, category }) => call("hall_of_fame_archive_api", "awards", { month, variant, category }),
    listReview: () => call("hall_of_fame_archive_admin", "list_review"),
    review: ({ candidateId, status, displayName, reason }) => call("hall_of_fame_archive_admin", "review", {
      candidate_id: candidateId, status, display_name: displayName, reason,
    }),
  });
}
