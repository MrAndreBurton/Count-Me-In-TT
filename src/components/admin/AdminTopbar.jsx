export default function AdminTopbar({
  onOpenSidebar,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
          >
            Menu
          </button>

          <div>
            <p className="text-sm font-semibold text-slate-400">
              CountMeInTT
            </p>

            <p className="text-lg font-black text-slate-950">
              Control Centre
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">
            Andre Burton
          </p>

          <p className="text-xs font-medium text-slate-500">
            Super Administrator
          </p>
        </div>
      </div>
    </header>
  );
}

