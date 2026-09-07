const items = [
  ["Symbol Balance", "symbolBalance"],
  ["Unseen", "UNSEEN"],
  ["Discovered", "DISCOVERED"],
  ["Learning", "LEARNING"],
  ["Review", "REVIEW"],
];

export default function MyVaultSummary({ summary }) {
  const counts = summary?.counts || {};

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(([label, key]) => {
        const value =
          key === "symbolBalance"
            ? summary?.symbolBalance || 0
            : counts[key] || 0;

        return (
          <section
            key={key}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          </section>
        );
      })}
    </div>
  );
}
