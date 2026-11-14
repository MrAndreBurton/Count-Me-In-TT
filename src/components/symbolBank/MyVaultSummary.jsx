const items = [
  { label: "Symbol Balance", key: "symbolBalance", note: "Secured through verified evidence", featured: true },
  { label: "Unseen", key: "UNSEEN", note: "Not yet explored" },
  { label: "Discovered", key: "DISCOVERED", note: "Opened and explored" },
  { label: "Learning", key: "LEARNING", note: "Building understanding" },
  { label: "Review", key: "REVIEW", note: "Ready to revisit" },
];

export default function MyVaultSummary({ summary }) {
  const counts = summary?.counts || {};
  return (
    <section aria-label="My Vault learning summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(({ label, key, note, featured }) => {
        const value = key === "symbolBalance" ? (summary?.symbolBalance ?? 0) : (counts[key] ?? 0);
        return (
          <div key={key} className={`rounded-2xl border p-5 shadow-sm ${featured ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white" : "border-blue-100 bg-white"}`}>
            <p className={`text-xs font-black uppercase tracking-wider ${featured ? "text-amber-800" : "text-blue-700"}`}>{label}</p>
            <p className="mt-3 text-4xl font-black tabular-nums text-slate-950">{value}</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">{note}</p>
          </div>
        );
      })}
    </section>
  );
}
