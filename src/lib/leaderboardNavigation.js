// Navigation chooses the entry page; the protected API still authorises boards.
export function leaderboardNavigationTarget(destination, signedIn) {
  if (!signedIn) return destination;
  if (destination === "/leaderboard") return "/my-leaderboards";
  return destination;
}
