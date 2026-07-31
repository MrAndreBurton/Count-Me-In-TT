export default function KPICard({
  icon,
  label,
  value,
  detail,
  detailLabel,
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
          {icon}
        </div>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-4">
        <p className="text-sm font-bold text-slate-700">
          {detail}
        </p>

        {detailLabel && (
          <p className="mt-1 text-sm text-slate-400">
            {detailLabel}
          </p>
        )}
      </div>
    </article>
  );
}

