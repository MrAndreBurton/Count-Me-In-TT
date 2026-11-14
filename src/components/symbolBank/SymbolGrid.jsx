import SymbolCard from "./SymbolCard";

export default function SymbolGrid({ records, memberAccess }) {
  if (!records.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-[#c5d6eb] bg-gradient-to-br from-white to-[#f2f7ff] px-6 py-14 text-center shadow-sm">
        <div aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8e5f4] bg-white text-3xl text-[#244b7d] shadow-sm">⌕</div>
        <h2 className="mt-5 text-xl font-extrabold text-[#142f54]">No symbols found in this vault</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Try a different search term or change the level and access filters to explore more symbols.</p>
      </div>
    );
  }

  return (
    <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {records.map((record) => (
        <SymbolCard key={record.symbol_id} record={record} memberAccess={memberAccess} />
      ))}
    </div>
  );
}
