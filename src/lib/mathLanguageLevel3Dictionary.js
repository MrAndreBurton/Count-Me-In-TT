import { supabase } from "./supabase";

export const LEVEL3_DICTIONARY_RELEASE_ID = "LEVEL3-MATH-DICT-2026-08-FROZEN";

export async function loadLevel3Dictionary() {
  const { data, error } = await supabase.rpc(
    "get_math_language_level3_dictionary",
    { p_release_id: LEVEL3_DICTIONARY_RELEASE_ID }
  );

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];

  return rows.map((row) => ({
    termId: row.term_id,
    term: row.term,
    canonicalCategory: row.canonical_category,
    category: row.presentation_category,

    meaning: row.meaning_text,
    meaningQuestionId: row.meaning_question_id,

    example: row.example_text,
    exampleExplanation: row.example_explanation,
    exampleQuestionId: row.example_question_id,

    difference: row.difference_text,
    differenceExplanation: row.difference_explanation,
    differenceQuestionId: row.difference_question_id,

    clue: row.clue_text,
    clueExplanation: row.clue_explanation,
    clueQuestionId: row.clue_question_id,

    mistakePrompt: row.mistake_prompt,
    mistakeCorrection: row.mistake_correction,
    mistakeExplanation: row.mistake_explanation,
    mistakeQuestionId: row.mistake_question_id,

    completionPrompt: row.completion_prompt,
    completionAnswer: row.completion_answer,
    completionExplanation: row.completion_explanation,
    completionQuestionId: row.completion_question_id,

    sourceQuestionCount: Number(row.source_question_count || 0),
  }));
}
