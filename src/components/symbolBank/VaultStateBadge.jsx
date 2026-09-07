const classes = {
  UNSEEN: "border-slate-200 bg-slate-100 text-slate-700",
  DISCOVERED: "border-blue-200 bg-blue-50 text-blue-700",
  LEARNING: "border-amber-200 bg-amber-50 text-amber-800",
  SECURE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REVIEW: "border-violet-200 bg-violet-50 text-violet-800",
};

export default function VaultStateBadge({ state = "UNSEEN" }) {
  const safeState = classes[state] ? state : "UNSEEN";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${classes[safeState]}`}
    >
      {safeState}
    </span>
  );
}
