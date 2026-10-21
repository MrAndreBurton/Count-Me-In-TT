import { supabase } from "./supabase";
import { getPlayableProfile } from "./gameResults";

// Membership and learner permissions are independently rechecked inside the RPC.
export async function saveSymbolChallengeEvidence(round, responses) {
  const playable = await getPlayableProfile();
  if (!playable?.profile?.id) throw new Error("A playable learner profile is required.");
  const { data, error } = await supabase.rpc("save_symbol_challenge_round_v1", {
    p_student_id: playable.profile.id,
    p_round: round,
    p_responses: responses,
  });
  if (error) throw error;
  return data;
}
