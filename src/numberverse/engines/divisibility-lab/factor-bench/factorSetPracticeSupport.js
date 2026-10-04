export const FACTOR_SET_SUPPORT_LEVELS = {
  SUPPORTED: "SUPPORTED",
  GUIDED: "GUIDED",
  INDEPENDENT: "INDEPENDENT",
};

export function getPositiveFactors(target) {
  const factors = [];
  for (let value = 1; value <= target; value += 1) {
    if (target % value === 0) factors.push(value);
  }
  return factors;
}

function shuffle(values, target) {
  return [...values].sort((a, b) => {
    const ak = (a * 37 + target * 11) % 101;
    const bk = (b * 37 + target * 11) % 101;
    return ak === bk ? a - b : ak - bk;
  });
}

function distractors(target, factors, count) {
  const truth = new Set(factors);
  const values = [];
  const add = (v) => {
    if (Number.isInteger(v) && v > 0 && v <= target &&
        !truth.has(v) && !values.includes(v)) values.push(v);
  };
  factors.forEach((f) => { add(f - 1); add(f + 1); });
  [4,6,8,9,10,12,14,15,16,18,20,21,24,25,27,30,32,36,40,42,45,48,50,54,60,64,72,81,90,96,100,108,120,125,144].forEach(add);
  for (let v = 2; values.length < count && v <= target; v += 1) add(v);
  return shuffle(values, target).slice(0, count);
}

function anchors(factors) {
  if (factors.length <= 2) return [...factors];
  const values = [factors[0], factors[factors.length - 1]];
  if (factors.length >= 6) values.push(factors[Math.floor(factors.length / 2)]);
  return [...new Set(values)].sort((a, b) => a - b);
}

export function createFactorSetPracticeWorkspace({ target, supportLevel }) {
  const factors = getPositiveFactors(target);

  if (supportLevel === FACTOR_SET_SUPPORT_LEVELS.INDEPENDENT) {
    return {
      selectedFactors: [],
      lockedFactors: [],
      candidateBank: [],
      usesCandidateBank: false,
    };
  }

  const lockedFactors =
    supportLevel === FACTOR_SET_SUPPORT_LEVELS.SUPPORTED ? anchors(factors) : [];
  const locked = new Set(lockedFactors);
  const available = factors.filter((f) => !locked.has(f));
  const wrong = distractors(target, factors, Math.max(2, Math.ceil(available.length / 2)));

  return {
    selectedFactors: [...lockedFactors],
    lockedFactors,
    candidateBank: shuffle([...available, ...wrong], target),
    usesCandidateBank: true,
  };
}
