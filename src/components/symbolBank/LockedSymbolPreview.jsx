import { Link } from "react-router-dom";
import SymbolRenderer from "./SymbolRenderer";

export default function LockedSymbolPreview({ record }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#d7e2f1] bg-white shadow-[0_20px_55px_rgba(18,43,84,0.1)]">
      <div className="relative flex min-h-64 items-center justify-center overflow-hidden border-b border-[#dce6f4] bg-gradient-to-br from-[#e6f1ff] via-[#f5f9ff] to-[#fff0ca] p-8 sm:min-h-72">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-16 h-64 w-64 rounded-full border-[28px] border-white/50" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full border-[25px] border-[#d9e7fa]/70" />
        <div className="relative z-10 text-[#173c70]"><SymbolRenderer record={record} large /></div>
        <span className="absolute left-5 top-5 rounded-full border border-[#e9cd93] bg-[#fff5df] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[#805813]">Member vault</span>
      </div>
      <div className="p-6 sm:p-9">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1c5799]">Level {record.level} · Symbol deposit box</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-[#142f54] sm:text-4xl">{record.canonical_name}</h1>
        <div className="mt-6 rounded-2xl border border-[#ead8ae] bg-gradient-to-r from-[#fff8e9] to-[#fffcf6] p-5">
          <h2 className="text-lg font-extrabold text-[#6f4c16]">More knowledge inside</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-700">This symbol is visible in the catalogue. Its meaning, readings, variants and full learning details are reserved for members of CountMeInTT.</p>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link to="/membership" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#164b89] px-6 py-3 text-center text-sm font-extrabold text-white transition hover:bg-[#103b6e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#164b89]">Explore membership</Link>
          <Link to="/symbol-bank/vault" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#c9d7e9] bg-white px-6 py-3 text-center text-sm font-extrabold text-[#244b7d] transition hover:bg-[#f2f7ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#164b89]">Back to the Vault</Link>
        </div>
      </div>
    </article>
  );
}
