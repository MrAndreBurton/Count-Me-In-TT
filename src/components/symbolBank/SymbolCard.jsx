import { Link } from "react-router-dom";
import SymbolRenderer from "./SymbolRenderer";

export default function SymbolCard({ record, memberAccess }) {
  const locked = record.access_tier === "member" && !memberAccess;
  return (
    <article className="flex min-h-64 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <div className="flex min-h-32 items-center justify-center border-b border-slate-100 bg-slate-50 p-5"><SymbolRenderer record={record} /></div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-wide text-blue-600">Level {record.level}</p><h2 className="mt-1 text-lg font-black">{record.canonical_name}</h2></div>
          <span className={record.access_tier === "free" ? "rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase text-emerald-800" : "rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-black uppercase text-white"}>{record.access_tier === "free" ? "Free" : locked ? "Member · Locked" : "Member"}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{locked ? "Visible in the catalogue. Full learning detail is available with membership." : record.short_meaning}</p>
        <Link to={`/symbol-bank/vault/${record.symbol_id}`} className="mt-auto pt-5 text-sm font-black text-blue-700">{locked ? "Preview symbol →" : "Open deposit box →"}</Link>
      </div>
    </article>
  );
}
