export function currentLeaderboardMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Port_of_Spain", year: "numeric", month: "2-digit",
  }).formatToParts(now);
  return parts.find(p => p.type === "year").value + "-" +
    parts.find(p => p.type === "month").value + "-01";
}

export function monthLabel(value) {
  if (!/^\d{4}-\d{2}-01$/.test(value || "")) return "";
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(value + "T12:00:00Z"));
}

export function formatLeaderboardTime(value) {
  if (value == null || !Number.isFinite(Number(value)) || Number(value) <= 0) return "—";
  const ms = Math.round(Number(value));
  return Math.floor(ms / 60000) + ":" + String(Math.floor(ms % 60000 / 1000)).padStart(2, "0") +
    "." + String(Math.floor(ms % 1000 / 10)).padStart(2, "0");
}

export function trinidadDateTime(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Port_of_Spain", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = type => parts.find(p => p.type === type).value;
  return get("year") + "-" + get("month") + "-" + get("day") + "T" + get("hour") + ":" + get("minute");
}

export function trinidadInputToISO(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value || "")) throw new Error("Enter a valid date and time.");
  const date = new Date(value + ":00-04:00");
  if (!Number.isFinite(date.getTime()) || trinidadDateTime(date) !== value) throw new Error("Enter a valid date and time.");
  return date.toISOString();
}

export function leaderboardError(error) {
  if (error?.code === "23505") return "This leaderboard already exists. Select it from the leaderboard list.";
  if (error?.code === "42501") return "You do not have access to this action, or access has changed. Refresh to check your permissions.";
  if (["PGRST202", "42883"].includes(error?.code)) return "Leaderboard management is not available yet. Please contact CountMeInTT.";
  if (["23502", "23514", "22P02"].includes(error?.code)) return "Check the required fields and dates, then try again.";
  return error?.message || "The request could not be completed. Please try again.";
}

export function filterLeaderboardBoards(boards, filters, organisationId) {
  return boards.filter(b =>
    b.game_key === filters.gameKey &&
    (!organisationId || b.organisation_id === organisationId) &&
    (filters.audience !== "public" || b.scope === "public") &&
    (filters.audience !== "organisation" || b.scope !== "public") &&
    (!filters.organisationId || b.organisation_id === filters.organisationId) &&
    (filters.boardType === "all" || b.scope === filters.boardType)
  );
}

export function boardTypeLabel(scope) {
  return scope === "class" ? "Class" : scope === "public" ? "Public" : "Whole organisation";
}

export function canManageLeaderboard(context, board, classEntitlement) {
  if (context.isSuperadmin) return true;
  if (!context.roles?.includes("organisation_admin") ||
      board.organisation_id !== context.organisation?.id || !board.can_manage) return false;
  if (board.scope === "class") return classEntitlement?.effective_status === "active";
  return board.scope === "organisation" && board.status !== "draft";
}
