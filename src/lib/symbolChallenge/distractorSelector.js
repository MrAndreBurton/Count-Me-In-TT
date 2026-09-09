import { OPTION_COUNT } from "./constants";

import {
  getAnswerSpec,
  getSemanticAnswerKeys,
} from "./answerResolver";

import { shuffleSeeded } from "./seededRandom";

const QB05 = "QB-05";

function getConfusionGroups(record) {
  return Array.isArray(record?.confusion_group_ids)
    ? record.confusion_group_ids.map(String)
    : [];
}

function getSharedConfusionGroupIds(
  target,
  candidate
) {
  const targetGroups = new Set(
    getConfusionGroups(target)
  );

  if (!targetGroups.size) {
    return [];
  }

  return getConfusionGroups(candidate).filter(
    (groupId) =>
      targetGroups.has(groupId)
  );
}

function sharesConfusionGroup(
  target,
  candidate
) {
  return (
    getSharedConfusionGroupIds(
      target,
      candidate
    ).length > 0
  );
}

function rankCandidates(target, records) {
  const sharedConfusion = [];
  const sameClass = [];
  const sameLevel = [];
  const adjacentLevel = [];
  const fallback = [];

  for (const record of records) {
    if (
      record.symbol_id ===
      target.symbol_id
    ) {
      continue;
    }

    if (
      sharesConfusionGroup(
        target,
        record
      )
    ) {
      sharedConfusion.push(record);
      continue;
    }

    if (
      target.symbol_class &&
      record.symbol_class ===
        target.symbol_class
    ) {
      sameClass.push(record);
      continue;
    }

    if (
      Number(record.level) ===
      Number(target.level)
    ) {
      sameLevel.push(record);
      continue;
    }

    if (
      Math.abs(
        Number(record.level) -
          Number(target.level)
      ) === 1
    ) {
      adjacentLevel.push(record);
      continue;
    }

    fallback.push(record);
  }

  return {
    sharedConfusion,
    remaining: [
      sameClass,
      sameLevel,
      adjacentLevel,
      fallback,
    ],
  };
}

function getDistractorExclusions(record) {
  return new Set(
    Array.isArray(
      record?.distractor_exclusions
    )
      ? record.distractor_exclusions.map(
          String
        )
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

function isSafeCandidate({
  target,
  candidate,
  behaviour,
  excluded,
  occupiedSemanticKeys,
}) {
  if (
    candidate.symbol_id ===
    target.symbol_id
  ) {
    return null;
  }

  if (
    excluded.has(
      String(candidate.symbol_id)
    )
  ) {
    return null;
  }

  const answer = getAnswerSpec(
    candidate,
    behaviour
  );

  if (!answer.value) {
    return null;
  }

  const candidateSemanticKeys =
    getSemanticAnswerKeys(
      candidate,
      behaviour
    );

  if (
    setsIntersect(
      occupiedSemanticKeys,
      candidateSemanticKeys
    )
  ) {
    return null;
  }

  return {
    answer,
    candidateSemanticKeys,
  };
}

function appendCandidate({
  target,
  candidate,
  behaviour,
  excluded,
  occupiedSemanticKeys,
  selected,
}) {
  const safe = isSafeCandidate({
    target,
    candidate,
    behaviour,
    excluded,
    occupiedSemanticKeys,
  });

  if (!safe) {
    return false;
  }

  const sharedConfusionGroupIds =
    getSharedConfusionGroupIds(
      target,
      candidate
    );

  selected.push({
    record: candidate,
    answer: safe.answer,
    sharedConfusionGroup:
      sharedConfusionGroupIds.length > 0,
    sharedConfusionGroupIds,
  });

  for (
    const key of
    safe.candidateSemanticKeys
  ) {
    occupiedSemanticKeys.add(key);
  }

  return true;
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
    getSemanticAnswerKeys(
      target,
      behaviour
    );

  const ranked =
    rankCandidates(
      target,
      records
    );

  /*
   * QB-05 is a confusion-pair behaviour.
   *
   * At least one approved same-group
   * confusable is mandatory.
   */
  if (behaviour === QB05) {
    const sharedCandidates =
      shuffleSeeded(
        ranked.sharedConfusion,
        random
      );

    let requiredConfusableAdded = false;

    for (
      const candidate of
      sharedCandidates
    ) {
      if (
        appendCandidate({
          target,
          candidate,
          behaviour,
          excluded,
          occupiedSemanticKeys,
          selected,
        })
      ) {
        requiredConfusableAdded = true;
        break;
      }
    }

    if (!requiredConfusableAdded) {
      throw new Error(
        `QB-05 requires an approved playable confusion-group distractor for ${target.symbol_id}.`
      );
    }
  }

  /*
   * After QB-05's mandatory confusable
   * is secured, continue through the
   * standard hardened hierarchy.
   *
   * For QB-01 through QB-04,
   * shared confusion remains a priority,
   * not a requirement.
   */
  const buckets =
    behaviour === QB05
      ? ranked.remaining
      : [
          ranked.sharedConfusion,
          ...ranked.remaining,
        ];

  for (const bucket of buckets) {
    const shuffledBucket =
      shuffleSeeded(
        bucket,
        random
      );

    for (
      const candidate of
      shuffledBucket
    ) {
      if (
        selected.length >= count
      ) {
        break;
      }

      if (
        selected.some(
          (item) =>
            item.record.symbol_id ===
            candidate.symbol_id
        )
      ) {
        continue;
      }

      appendCandidate({
        target,
        candidate,
        behaviour,
        excluded,
        occupiedSemanticKeys,
        selected,
      });
    }

    if (
      selected.length >= count
    ) {
      break;
    }
  }

  /*
   * A small confusion group may contain
   * more useful safe alternatives after
   * the mandatory QB-05 choice.
   *
   * Revisit unused approved confusables
   * before declaring failure.
   */
  if (
    behaviour === QB05 &&
    selected.length < count
  ) {
    const remainingShared =
      shuffleSeeded(
        ranked.sharedConfusion,
        random
      );

    for (
      const candidate of
      remainingShared
    ) {
      if (
        selected.length >= count
      ) {
        break;
      }

      if (
        selected.some(
          (item) =>
            item.record.symbol_id ===
            candidate.symbol_id
        )
      ) {
        continue;
      }

      appendCandidate({
        target,
        candidate,
        behaviour,
        excluded,
        occupiedSemanticKeys,
        selected,
      });
    }
  }

  if (selected.length < count) {
    throw new Error(
      `Unable to build ${count} safe distractors for ${target.symbol_id} ${behaviour}.`
    );
  }

  if (
    behaviour === QB05 &&
    !selected.some(
      (item) =>
        item.sharedConfusionGroup
    )
  ) {
    throw new Error(
      `QB-05 encounter for ${target.symbol_id} has no approved confusion-group distractor.`
    );
  }

  return selected.slice(
    0,
    count
  );
}