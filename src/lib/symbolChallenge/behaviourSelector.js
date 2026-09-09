import { getEligibleBehaviours } from "./candidatePool";
import { shuffleSeeded } from "./seededRandom";
export function chooseBehaviour({ record, difficulty, random, avoid = [] }) {
  const eligible = getEligibleBehaviours(record, difficulty);
  if (!eligible.length) throw new Error(`No eligible question behaviour for ${record?.symbol_id || "symbol"}.`);
  const avoided = new Set(avoid);
  const preferred = eligible.filter((behaviour) => !avoided.has(behaviour));
  const source = preferred.length ? preferred : eligible;
  return shuffleSeeded(source, random)[0];
}
