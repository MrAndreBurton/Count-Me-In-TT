import { MAX_UNIQUE_SYMBOLS, MIN_REPEAT_GAP, MIN_UNIQUE_SYMBOLS, OPTION_COUNT, QUESTION_BEHAVIOURS, ROUND_SIZE, SUPPORTED_RENDER_MODES } from "./constants";
function validateEncounter(encounter) {
  const errors = [];
  if (!encounter?.symbolId) errors.push("missing symbolId");
  if (!QUESTION_BEHAVIOURS.includes(encounter?.questionBehaviour)) errors.push("unsupported question behaviour");
  if (!encounter?.promptPayload?.stimulus) errors.push("missing prompt stimulus");
  if (!SUPPORTED_RENDER_MODES.includes(String(encounter?.promptPayload?.renderMode || "").toUpperCase())) errors.push("unsupported prompt render mode");
  if (!Array.isArray(encounter?.optionPayload)) errors.push("optionPayload must be an array");
  else {
    if (encounter.optionPayload.length !== OPTION_COUNT) errors.push(`expected ${OPTION_COUNT} options`);
    const ids = new Set(encounter.optionPayload.map((option) => option.id));
    const values = new Set(encounter.optionPayload.map((option) => String(option.value || "").normalize("NFKC").trim().toLowerCase()));
    if (ids.size !== encounter.optionPayload.length) errors.push("duplicate option ids");
    if (values.size !== encounter.optionPayload.length) errors.push("duplicate option values");
    if (!ids.has(encounter.correctOptionId)) errors.push("correct option is not present");
  }
  return errors;
}
export function validateRound(round) {
  const errors = [];
  if (!round || !Array.isArray(round.encounters)) return { valid: false, errors: ["Round encounters are missing."] };
  if (round.encounters.length !== ROUND_SIZE) errors.push(`Round must contain exactly ${ROUND_SIZE} encounters.`);
  const uniqueSymbols = new Set(round.encounters.map((encounter) => encounter.symbolId));
  if (uniqueSymbols.size < MIN_UNIQUE_SYMBOLS || uniqueSymbols.size > MAX_UNIQUE_SYMBOLS) errors.push(`Round must contain ${MIN_UNIQUE_SYMBOLS}–${MAX_UNIQUE_SYMBOLS} unique symbols.`);
  const positionsBySymbol = new Map();
  round.encounters.forEach((encounter, index) => {
    validateEncounter(encounter).forEach((message) => errors.push(`Q${index + 1}: ${message}.`));
    const positions = positionsBySymbol.get(encounter.symbolId) || [];
    positions.push(index);
    positionsBySymbol.set(encounter.symbolId, positions);
  });
  for (const [symbolId, positions] of positionsBySymbol.entries()) {
    if (positions.length > 2) errors.push(`${symbolId} appears more than twice in a normal B2 round.`);
    for (let i = 1; i < positions.length; i += 1) {
      const intervening = positions[i] - positions[i - 1] - 1;
      if (intervening < MIN_REPEAT_GAP) errors.push(`${symbolId} repeats with only ${intervening} intervening question(s).`);
    }
  }
  return { valid: errors.length === 0, errors };
}
export function assertValidRound(round) {
  const result = validateRound(round);
  if (!result.valid) throw new Error(`Invalid Symbol Challenge round:\n${result.errors.join("\n")}`);
  return round;
}
