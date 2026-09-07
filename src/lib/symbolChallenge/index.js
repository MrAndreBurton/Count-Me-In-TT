import { getActiveSymbolBankRecords } from "../symbolBank";
import { buildCandidatePool } from "./candidatePool";
import { createSeededRandom } from "./seededRandom";
import { planRound } from "./roundPlanner";
import { assertValidRound } from "./validator";
import { GENERATOR_VERSION } from "./constants";
function normalizeConfig(config = {}) {
  const level = config.level === null || config.level === undefined || config.level === "all" ? null : Number(config.level);
  return { difficulty: config.difficulty || "D1", level, memberAccess: config.memberAccess === true, seed: String(config.seed || crypto.randomUUID()) };
}
export function generateSymbolChallengeRound({ release, records, config = {} }) {
  if (!release?.release_id) throw new Error("An active Symbol Bank release is required.");
  const normalized = normalizeConfig(config);
  const random = createSeededRandom(`${release.release_id}:${normalized.seed}:${normalized.level || "all"}:${normalized.difficulty}:${normalized.memberAccess ? "member" : "free"}`);
  const pool = buildCandidatePool(records, normalized);
  const encounters = planRound({ pool, difficulty: normalized.difficulty, random, seed: normalized.seed });
  const round = {
    releaseId: release.release_id,
    symbolBankVersion: release.symbol_bank_version || release.release_id,
    gameContractVersion: release.game_contract_version || null,
    questionGenerationSpecVersion: release.question_generation_spec_version || null,
    freeCatalogueVersion: release.free_catalogue_version || null,
    generatorVersion: GENERATOR_VERSION,
    config: { level: normalized.level, difficulty: normalized.difficulty, memberAccess: normalized.memberAccess, seed: normalized.seed, roundSize: encounters.length, uniqueSymbols: new Set(encounters.map((item) => item.symbolId).size) },
    encounters,
  };
  round.config.uniqueSymbols = new Set(encounters.map((item) => item.symbolId)).size;
  return assertValidRound(round);
}
export async function loadAndGenerateSymbolChallengeRound(config = {}) {
  const { release, records } = await getActiveSymbolBankRecords();
  if (!release) throw new Error("No active Mathematics Symbol Bank release is available.");
  return generateSymbolChallengeRound({ release, records, config });
}
export { buildCandidatePool, getEligibleBehaviours } from "./candidatePool";
export { validateRound } from "./validator";
