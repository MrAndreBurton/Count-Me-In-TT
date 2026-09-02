import { supabase } from "./supabase";

const RELEASE_FIELDS = `
  release_id,
  symbol_bank_version,
  game_contract_version,
  question_generation_spec_version,
  free_catalogue_version,
  source_system,
  canonical_content_sha256,
  publication_version,
  publication_payload_sha256,
  record_count,
  status,
  activated_at
`;

export async function getActiveSymbolBankRelease() {
  const { data, error } = await supabase
    .from("symbol_bank_content_releases")
    .select(RELEASE_FIELDS)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getActiveSymbolBankRecords() {
  const release = await getActiveSymbolBankRelease();

  if (!release) {
    return { release: null, records: [] };
  }

  const { data, error } = await supabase
    .from("symbol_bank_records")
    .select("*")
    .eq("release_id", release.release_id)
    .order("symbol_id", { ascending: true });

  if (error) throw error;

  return {
    release,
    records: data || [],
  };
}

export async function getSymbolBankSymbol(symbolId) {
  const cleanSymbolId = String(symbolId || "").trim();

  if (!cleanSymbolId) {
    throw new Error("Symbol ID is required.");
  }

  const release = await getActiveSymbolBankRelease();

  if (!release) {
    return { release: null, record: null };
  }

  const { data, error } = await supabase
    .from("symbol_bank_records")
    .select("*")
    .eq("release_id", release.release_id)
    .eq("symbol_id", cleanSymbolId)
    .maybeSingle();

  if (error) throw error;

  return {
    release,
    record: data || null,
  };
}

export async function getActiveSymbolBankConfusionGroups() {
  const release = await getActiveSymbolBankRelease();

  if (!release) {
    return { release: null, confusionGroups: [] };
  }

  const { data, error } = await supabase
    .from("symbol_bank_confusion_groups")
    .select("*")
    .eq("release_id", release.release_id)
    .order("confusion_group_id", { ascending: true });

  if (error) throw error;

  return {
    release,
    confusionGroups: data || [],
  };
}
