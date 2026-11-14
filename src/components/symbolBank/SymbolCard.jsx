import { Link } from "react-router-dom";
import SymbolRenderer from "./SymbolRenderer";

const levelNames = { 1: "Primary / SEA", 2: "Forms 1–3", 3: "CSEC" };

export default function SymbolCard({ record, memberAccess }) {
  const isMemberSymbol = record.access_tier === "member";
  const locked = isMemberSymbol && !memberAccess;
  const levelName = levelNames[Number(record.level)] || `Level ${record.level}`;

  return (
    <article className="group relative flex h-full min-h-[290px] flex-col overflow-hidden rounded-[1.5rem] border border-[#d7e2f1] bg-white shadow-[0_8px_24px_rgba(18,43,84,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#d8ae58] hover:shadow-[0_16px_32px_rgba(18,43,84,0.13)] focus-within:border-[#d8ae58]">
      <div className="relative flex min-h-[132px] items-center justify-center overflow-hidden border-b border-[#e3eaf5] bg-gradient-to-br from-[#eaf3ff] via-[#f5f9ff] to-[#fff4d9] px-5 py-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-9 -top-12 h-36 w-36 rounded-full border-[18px] border-white/50" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full border-[14px] border-[#d6e6fa]/70" />
        <div className="relative z-10 max-w-full text-[#173c70] transition-transform duration-200 group-hover:scale-105">
          <SymbolRenderer record={record} />
        </div>
        <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#244b7d] shadow-sm">
          Level {record.level}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-500">{levelName}</span>
          <span className={isMemberSymbol
            ? "inline-flex items-center rounded-full border border-[#ead19b] bg-[#fff5df] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#805813]"
            : "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800"}>
            {isMemberSymbol ? (locked ? "Member · Locked" : "Member") : "Free"}
          </span>
        </div>
        <h2 className="mt-3 text-lg font-extrabold leading-snug text-[#142f54]">{record.canonical_name}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {locked
            ? "Discover this symbol. Its full meaning and learning details are available to members."
            : record.short_meaning}
        </p>
        <Link
          to={`/symbol-bank/vault/${record.symbol_id}`}
          aria-label={`${locked ? "Preview" : "Explore"} ${record.canonical_name}`}
          className="mt-auto inline-flex min-h-11 items-center justify-between gap-2 border-t border-[#e8eef7] pt-4 text-sm font-extrabold text-[#1c5799] underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c5799]"
        >
          <span>{locked ? "Preview deposit box" : "Open deposit box"}</span>
          <span aria-hidden="true" className="text-lg">→</span>
        </Link>
      </div>
    </article>
  );
}
