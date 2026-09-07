import { supabase } from "./supabase";

export const LEVEL2_DICTIONARY_RELEASE_ID = "LEVEL2-MATH-DICT-2026-09-FROZEN";

export async function loadLevel2Dictionary() {
  const { data, error } = await supabase.rpc(
    "get_math_language_level2_dictionary",
    { p_release_id: LEVEL2_DICTIONARY_RELEASE_ID }
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
    connection: row.connection_text,
    connectionExplanation: row.connection_explanation,
    connectionQuestionId: row.connection_question_id,
    difference: row.difference_text,
    differenceExplanation: row.difference_explanation,
    differenceQuestionId: row.difference_question_id,
    sourceQuestionCount: Number(row.source_question_count || 0),
  }));
}
