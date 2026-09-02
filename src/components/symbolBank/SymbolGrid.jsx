import SymbolCard from "./SymbolCard";
export default function SymbolGrid({ records, memberAccess }) {
  if (!records.length) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h2 className="text-xl font-black">No symbols found.</h2><p className="mt-2 text-slate-600">Try another search or level.</p></div>;
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{records.map((record) => <SymbolCard key={record.symbol_id} record={record} memberAccess={memberAccess} />)}</div>;
}
