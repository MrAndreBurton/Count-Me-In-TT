import MyVaultSymbolCard from "./MyVaultSymbolCard";

export default function MyVaultGrid({ records }) {
  if (!records.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-blue-200 bg-blue-50/50 p-10 text-center">
        <h2 className="text-xl font-black text-slate-950">No symbols match these filters</h2>
        <p className="mt-2 text-slate-600">Try another learning state, level or search term.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {records.map((record) => (
        <MyVaultSymbolCard key={`${record.release_id}:${record.symbol_id}`} record={record} />
      ))}
    </div>
  );
}
