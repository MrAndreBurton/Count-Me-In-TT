import {
  GENERATOR_VERSION,
  OPTION_COUNT,
} from "./constants";

import {
  getAnswerSpec,
  getPromptSpec,
} from "./answerResolver";

import { chooseBehaviour } from "./behaviourSelector";

import { selectDistractors } from "./distractorSelector";

import { shuffleSeeded } from "./seededRandom";

const OPTION_IDS = [
  "A",
  "B",
  "C",
  "D",
];

export function buildEncounter({
  record,
  pool,
  difficulty,
  random,
  answerSequence,
  seed,
  avoidBehaviours = [],
}) {
  const behaviour =
    chooseBehaviour({
      record,
      difficulty,
      random,
      avoid: avoidBehaviours,
    });

  const correctAnswer =
    getAnswerSpec(
      record,
      behaviour
    );

  const prompt =
    getPromptSpec(
      record,
      behaviour
    );

  if (
    !correctAnswer.value ||
    !prompt.stimulus
  ) {
    throw new Error(
      `Incomplete encounter source for ${record.symbol_id} ${behaviour}.`
    );
  }

  const distractors =
    selectDistractors({
      target: record,
      behaviour,
      records: pool,
      random,
    });

  const rawOptions = [
    {
      symbolId:
        record.symbol_id,
      value:
        correctAnswer.value,
      renderMode:
        correctAnswer.renderMode,
      isCorrect: true,
      confusionGroupIds: [],
    },

    ...distractors.map(
      ({
        record: distractor,
        answer,
        sharedConfusionGroupIds,
      }) => ({
        symbolId:
          distractor.symbol_id,
        value:
          answer.value,
        renderMode:
          answer.renderMode,
        isCorrect: false,
        confusionGroupIds:
          Array.isArray(
            sharedConfusionGroupIds
          )
            ? [
                ...sharedConfusionGroupIds,
              ]
            : [],
      })
    ),
  ];

  const shuffledOptions =
    shuffleSeeded(
      rawOptions,
      random
    ).map(
      (option, index) => ({
        id: OPTION_IDS[index],
        ...option,
      })
    );

  if (
    shuffledOptions.length !==
    OPTION_COUNT
  ) {
    throw new Error(
      "Symbol Challenge encounters require four options."
    );
  }

  const correctOption =
    shuffledOptions.find(
      (option) =>
        option.isCorrect
    );

  if (!correctOption) {
    throw new Error(
      `Correct option missing for ${record.symbol_id} ${behaviour}.`
    );
  }

  return {
    encounterId:
      `${seed}:${answerSequence}`,

    symbolId:
      record.symbol_id,

    level:
      Number(record.level),

    questionBehaviour:
      behaviour,

    difficulty,

    answerSequence,

    encounterRole:
      "INITIAL",

    promptPayload: {
      instruction:
        prompt.instruction,
      stimulus:
        prompt.stimulus,
      stimulusType:
        prompt.stimulusType,
      renderMode:
        prompt.renderMode,
      accessibilityName:
        record.accessibility_name ||
        record.canonical_name,
    },

    optionPayload:
      shuffledOptions.map(
        (option) => ({
          id:
            option.id,
          symbolId:
            option.symbolId,
          value:
            option.value,
          renderMode:
            option.renderMode,

          /*
           * Intersection between the
           * target's approved live
           * confusion groups and this
           * option's groups.
           *
           * Empty for the correct answer
           * and ordinary distractors.
           */
          confusionGroupIds:
            option.confusionGroupIds,
        })
      ),

    correctOptionId:
      correctOption.id,

    generationMetadata: {
      generatorVersion:
        GENERATOR_VERSION,

      symbolClass:
        record.symbol_class ||
        null,

      contextConstraints:
        Array.isArray(
          record.context_constraints
        )
          ? record.context_constraints
          : [],

      qb05ConfusionRequired:
        behaviour === "QB-05",
    },
  };
}