// Use official, locally hosted logo assets. No remote tracking or guessed logos.
// Add the supplied Spectrum logo at this path; the name is shown until it exists.
const organisations = {
  "f1de88b7-17b7-4703-a3e7-83f520732211": {
    logo: "/organisation-logos/spectrum-academy.png",
    name: "Spectrum Academy",
  },
};

export function organisationLeaderboardBranding(board) {
  if (!board || board.scope === "public") return null;
  return organisations[board.organisation_id] || { name: board.organisation_name, logo: null };
}
