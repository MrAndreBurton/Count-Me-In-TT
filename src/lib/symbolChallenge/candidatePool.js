import { CORE_CONTEXT_BLOCKERS, DIFFICULTY_BEHAVIOURS, SUPPORTED_RENDER_MODES } from "./constants";
function hasBlockedCoreContext(record) {
  const constraints = Array.isArray(record?.context_constraints) ? record.context_constraints : [];
  return CORE_CONTEXT_BLOCKERS.some((constraint) => constraints.includes(constraint));
}
export function getEligibleBehaviours(record, difficulty = "D1") {
  const allowed = DIFFICULTY_BEHAVIOURS[difficulty];
  if (!allowed) throw new Error(`Unsupported Symbol Challenge difficulty: ${difficulty}`);
  const capabilities = record?.game_capabilities || {};
  return allowed.filter((behaviour) => capabilities?.[behaviour] === true);
}
export function isCoreGeneratorRecordEligible(record, config = {}) {
  if (!record?.symbol_id || record.is_game_active !== true) return false;
  const renderMode = String(record.render_mode || "").toUpperCase();
  if (!SUPPORTED_RENDER_MODES.includes(renderMode)) return false;
  if (config.level && Number(record.level) !== Number(config.level)) return false;
  if (config.memberAccess !== true) {
    if (record.access_tier !== "free" || record.challenge_free_eligible !== true) return false;
  }
  if (hasBlockedCoreContext(record)) return false;
  return getEligibleBehaviours(record, config.difficulty).length > 0;
}
export function buildCandidatePool(records, config = {}) {
  return (records || []).filter((record) => isCoreGeneratorRecordEligible(record, config));
}
