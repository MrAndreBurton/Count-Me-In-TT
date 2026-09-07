import { supabase } from "./supabase";
import { getActiveSymbolBankRecords } from "./symbolBank";
import { getPlayableProfileMembership } from "./membership";
import { isPaidMembership } from "./membershipAccess";

export const VAULT_STATES = Object.freeze([
  "UNSEEN",
  "DISCOVERED",
  "LEARNING",
  "SECURE",
  "REVIEW",
]);

function normaliseStoredState(value) {
  const state = String(value || "").trim().toUpperCase();
  return VAULT_STATES.includes(state) && state !== "UNSEEN"
    ? state
    : "UNSEEN";
}

function buildStateMap(rows = []) {
  return new Map(
    rows.map((row) => [
      row.symbol_id,
      {
        state: normaliseStoredState(row.state),
        firstDiscoveredAt: row.first_discovered_at || null,
        lastViewedAt: row.last_viewed_at || null,
        stateChangedAt: row.state_changed_at || null,
      },
    ])
  );
}

function mergeRecordsWithState(records = [], rows = [], memberAccess = false) {
  const stateMap = buildStateMap(rows);

  return records.map((record) => {
    const learnerState = stateMap.get(record.symbol_id);
    return {
      ...record,
      vaultState: learnerState?.state || "UNSEEN",
      firstDiscoveredAt: learnerState?.firstDiscoveredAt || null,
      lastViewedAt: learnerState?.lastViewedAt || null,
      stateChangedAt: learnerState?.stateChangedAt || null,
      locked: record.access_tier === "member" && !memberAccess,
    };
  });
}

export function summariseVault(records = []) {
  const counts = {
    UNSEEN: 0,
    DISCOVERED: 0,
    LEARNING: 0,
    SECURE: 0,
    REVIEW: 0,
  };

  for (const record of records) {
    const state = VAULT_STATES.includes(record.vaultState)
      ? record.vaultState
      : "UNSEEN";
    counts[state] += 1;
  }

  return {
    total: records.length,
    counts,
    symbolBalance: counts.SECURE,
    discoveredOrBeyond:
      counts.DISCOVERED +
      counts.LEARNING +
      counts.SECURE +
      counts.REVIEW,
  };
}

export async function getMyVaultData() {
  const [bank, access] = await Promise.all([
    getActiveSymbolBankRecords(),
    getPlayableProfileMembership(),
  ]);

  const memberAccess = isPaidMembership(access.membership);

  if (!bank.release) {
    return {
      guest: Boolean(access.guest),
      profile: access.profile || null,
      membership: access.membership || null,
      memberAccess,
      release: null,
      records: [],
      summary: summariseVault([]),
    };
  }

  if (access.guest || !access.profile) {
    const records = mergeRecordsWithState(bank.records, [], memberAccess);
    return {
      guest: true,
      profile: null,
      membership: null,
      memberAccess,
      release: bank.release,
      records,
      summary: summariseVault(records),
    };
  }

  const { data: stateRows, error } = await supabase
    .from("symbol_bank_student_states")
    .select(`
      student_id,
      release_id,
      symbol_id,
      state,
      first_discovered_at,
      last_viewed_at,
      state_changed_at
    `)
    .eq("student_id", access.profile.id)
    .eq("release_id", bank.release.release_id);

  if (error) throw error;

  const records = mergeRecordsWithState(
    bank.records,
    stateRows || [],
    memberAccess
  );

  return {
    guest: false,
    profile: access.profile,
    membership: access.membership || null,
    memberAccess,
    release: bank.release,
    records,
    summary: summariseVault(records),
  };
}

export async function discoverSymbolForPlayableProfile(symbolId) {
  const cleanSymbolId = String(symbolId || "").trim();

  if (!cleanSymbolId) throw new Error("Symbol ID is required.");

  const access = await getPlayableProfileMembership();

  if (access.guest || !access.profile) {
    return {
      recorded: false,
      guest: true,
      profile: null,
      state: null,
    };
  }

  const { data, error } = await supabase.rpc(
    "discover_symbol_bank_symbol",
    {
      target_student_id: access.profile.id,
      target_symbol_id: cleanSymbolId,
    }
  );

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;

  return {
    recorded: Boolean(row),
    guest: false,
    profile: access.profile,
    state: row
      ? {
          studentId: row.student_id,
          releaseId: row.release_id,
          symbolId: row.symbol_id,
          state: normaliseStoredState(row.state),
          firstDiscoveredAt: row.first_discovered_at || null,
          lastViewedAt: row.last_viewed_at || null,
          stateChangedAt: row.state_changed_at || null,
        }
      : null,
  };
}
