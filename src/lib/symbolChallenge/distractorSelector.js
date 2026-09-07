import { OPTION_COUNT } from "./constants";

import {
  getAnswerSpec,
  getSemanticAnswerKeys,
} from "./answerResolver";

import { shuffleSeeded } from "./seededRandom";

function getConfusionGroups(record) {
  return Array.isArray(record?.confusion_group_ids)
    ? record.confusion_group_ids.map(String)
    : [];
}

function sharesConfusionGroup(target, candidate) {
  const targetGroups = new Set(
    getConfusionGroups(target)
  );

  if (!targetGroups.size) return false;

  return getConfusionGroups(candidate).some((groupId) =>
    targetGroups.has(groupId)
  );
}

function rankCandidates(target, records) {
  const sharedConfusion = [];
  const sameClass = [];
  const sameLevel = [];
  const adjacentLevel = [];
  const fallback = [];

  for (const record of records) {
    if (record.symbol_id === target.symbol_id) {
      continue;
    }

    if (sharesConfusionGroup(target, record)) {
      sharedConfusion.push(record);
      continue;
    }

    if (
      target.symbol_class &&
      record.symbol_class === target.symbol_class
    ) {
      sameClass.push(record);
      continue;
    }

    if (
      Number(record.level) === Number(target.level)
    ) {
      sameLevel.push(record);
      continue;
    }

    if (
      Math.abs(
        Number(record.level) - Number(target.level)
      ) === 1
    ) {
      adjacentLevel.push(record);
      continue;
    }

    fallback.push(record);
  }

  return [
    sharedConfusion,
    sameClass,
    sameLevel,
    adjacentLevel,
    fallback,
  ];
}

function getDistractorExclusions(record) {
  return new Set(
    Array.isArray(record?.distractor_exclusions)
      ? record.distractor_exclusions.map(String)
      : []
  );
}

function setsIntersect(first, second) {
  for (const value of first) {
    if (second.has(value)) {
      return true;
    }
  }

  return false;
}

export function selectDistractors({
  target,
  behaviour,
  records,
  random,
  count = OPTION_COUNT - 1,
}) {
  const excluded =
    getDistractorExclusions(target);

  const selected = [];

  const occupiedSemanticKeys =
    getSemanticAnswerKeys(target, behaviour);

  for (const bucket of rankCandidates(
    target,
    records
  )) {
    const shuffledBucket = shuffleSeeded(
      bucket,
      random
    );

    for (const record of shuffledBucket) {
      if (selected.length >= count) {
        break;
      }

      if (excluded.has(record.symbol_id)) {
        continue;
      }

      const answer = getAnswerSpec(
        record,
        behaviour
      );

      if (!answer.value) {
        continue;
      }

      const candidateSemanticKeys =
        getSemanticAnswerKeys(
          record,
          behaviour
        );

      if (
        setsIntersect(
          occupiedSemanticKeys,
          candidateSemanticKeys
        )
      ) {
        continue;
      }

      selected.push({
        record,
        answer,
        sharedConfusionGroup:
          sharesConfusionGroup(target, record),
      });

      for (const key of candidateSemanticKeys) {
        occupiedSemanticKeys.add(key);
      }
    }

    if (selected.length >= count) {
      break;
    }
  }

  if (selected.length < count) {
    throw new Error(
      `Unable to build ${count} safe distractors for ${target.symbol_id} ${behaviour}.`
    );
  }

  return selected.slice(0, count);
}