import { Link } from "react-router-dom";
import SymbolRenderer from "./SymbolRenderer";
import VaultStateBadge from "./VaultStateBadge";

export default function MyVaultSymbolCard({ record }) {
  const locked = Boolean(record.locked);
  return (
    <article className="group flex min-h-80 flex-col overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg focus-within:border-blue-400">
      <div className="relative flex min-h-40 items-center justify-center border-b border-blue-100 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 text-[#101B3D] [&_.katex]:!text-[#101B3D]">
        <div className="flex max-w-full items-center justify-center text-center text-5xl leading-tight text-[#101B3D]">
          <SymbolRenderer record={record} />
        </div>
        {locked && <span className="absolute right-3 top-3 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">Member · Locked</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-blue-700">Level {record.level}</span>
          <VaultStateBadge state={record.vaultState} />
        </div>
        <h2 className="mt-3 text-lg font-black leading-snug text-slate-950">{record.canonical_name}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {locked
            ? "Your learning state is preserved. Full learning detail remains inside the Member Vault."
            : record.short_meaning}
        </p>
        <Link to={`/symbol-bank/vault/${record.symbol_id}`} className="mt-auto inline-flex min-h-11 items-center pt-5 text-sm font-black text-blue-800 hover:text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          {locked ? "Preview symbol →" : "Open deposit box →"}
        </Link>
      </div>
    </article>
  );
}
