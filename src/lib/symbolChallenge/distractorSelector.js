import { OPTION_COUNT } from "./constants";
import { getAnswerSpec, normalizeAnswer } from "./answerResolver";
import { shuffleSeeded } from "./seededRandom";
function rankCandidates(target, records) {
  const sameClass = [], sameLevel = [], adjacentLevel = [], fallback = [];
  for (const record of records) {
    if (record.symbol_id === target.symbol_id) continue;
    if (target.symbol_class && record.symbol_class === target.symbol_class) sameClass.push(record);
    else if (Number(record.level) === Number(target.level)) sameLevel.push(record);
    else if (Math.abs(Number(record.level) - Number(target.level)) === 1) adjacentLevel.push(record);
    else fallback.push(record);
  }
  return [sameClass, sameLevel, adjacentLevel, fallback];
}
export function selectDistractors({ target, behaviour, records, random, count = OPTION_COUNT - 1 }) {
  const correctKey = normalizeAnswer(getAnswerSpec(target, behaviour).value);
  const excluded = new Set(Array.isArray(target.distractor_exclusions) ? target.distractor_exclusions.map(String) : []);
  const selected = [], selectedKeys = new Set([correctKey]);
  for (const bucket of rankCandidates(target, records)) {
    for (const record of shuffleSeeded(bucket, random)) {
      if (selected.length >= count) break;
      if (excluded.has(record.symbol_id)) continue;
      const answer = getAnswerSpec(record, behaviour);
      const key = normalizeAnswer(answer.value);
      if (!key || selectedKeys.has(key)) continue;
      selected.push({ record, answer });
      selectedKeys.add(key);
    }
    if (selected.length >= count) break;
  }
  if (selected.length < count) throw new Error(`Unable to build ${count} safe distractors for ${target.symbol_id} ${behaviour}.`);
  return selected.slice(0, count);
}
