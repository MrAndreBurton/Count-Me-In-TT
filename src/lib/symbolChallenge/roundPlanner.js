import {
  MAX_UNIQUE_SYMBOLS,
  MIN_REPEAT_GAP,
  MIN_UNIQUE_SYMBOLS,
  ROUND_SIZE,
  TARGET_UNIQUE_SYMBOLS,
} from "./constants";
import { buildEncounter } from "./encounterBuilder";
import { shuffleSeeded } from "./seededRandom";

function chooseUniqueCount(poolLength) {
  if (poolLength < MIN_UNIQUE_SYMBOLS) {
    throw new Error(
      `Symbol Challenge requires at least ${MIN_UNIQUE_SYMBOLS} eligible symbols; received ${poolLength}.`
    );
  }

  return Math.max(
    MIN_UNIQUE_SYMBOLS,
    Math.min(TARGET_UNIQUE_SYMBOLS, MAX_UNIQUE_SYMBOLS, poolLength)
  );
}

function canPlaceSymbol(schedule, symbolId) {
  const lastIndex = schedule
    .map((record) => record.symbol_id)
    .lastIndexOf(symbolId);

  if (lastIndex === -1) {
    return true;
  }

  const nextIndex = schedule.length;
  const intervening = nextIndex - lastIndex - 1;

  return intervening >= MIN_REPEAT_GAP;
}

function buildSchedule(selectedSymbols, random) {
  const opening = shuffleSeeded(selectedSymbols, random);
  const schedule = [...opening];

  while (schedule.length < ROUND_SIZE) {
    const eligibleRepeats = selectedSymbols.filter((record) => {
      const appearances = schedule.filter(
        (item) => item.symbol_id === record.symbol_id
      ).length;

      return (
        appearances < 2 &&
        canPlaceSymbol(schedule, record.symbol_id)
      );
    });

    if (!eligibleRepeats.length) {
      throw new Error(
        "Unable to construct a valid Symbol Challenge schedule with the required repeat spacing."
      );
    }

    const next = shuffleSeeded(eligibleRepeats, random)[0];
    schedule.push(next);
  }

  return schedule;
}

export function planRound({
  pool,
  difficulty,
  random,
  seed,
}) {
  const uniqueCount = chooseUniqueCount(pool.length);

  const selectedSymbols = shuffleSeeded(pool, random).slice(
    0,
    uniqueCount
  );

  const schedule = buildSchedule(selectedSymbols, random);

  const previousBehaviours = new Map();

  return schedule.map((record, index) => {
    const usedBehaviours =
      previousBehaviours.get(record.symbol_id) || [];

    const encounter = buildEncounter({
      record,
      pool,
      difficulty,
      random,
      answerSequence: index + 1,
      seed,
      avoidBehaviours: usedBehaviours,
    });

    previousBehaviours.set(record.symbol_id, [
      ...usedBehaviours,
      encounter.questionBehaviour,
    ]);

    return encounter;
  });
}

