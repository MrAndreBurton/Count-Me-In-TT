import {
  Bell,
  Menu,
  Search,
} from "lucide-react";

export default function AdminTopbar({
  onMenuClick,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-6 lg:px-8">

        {/* Left */}
        <div className="flex items-center gap-5">

          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-2xl p-3 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-600">
              CountMeInTT
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Control Centre
            </h1>
          </div>

        </div>

        {/* Centre (future search) */}
        <div className="hidden xl:block flex-1 max-w-xl px-10">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search students, parents, schools..."
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-400"
            />

          </div>

        </div>

        {/* Right */}
        <div className="flex items-center gap-5">

          <button
            type="button"
            className="relative rounded-2xl p-3 text-slate-600 transition hover:bg-slate-100"
          >
            <Bell size={21} />

            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-lg font-black text-slate-950">
              AB
            </div>

            <div className="hidden text-right sm:block">

              <p className="font-black text-slate-950">
                Andre Burton
              </p>

              <p className="text-sm font-medium text-slate-500">
                Super Administrator
              </p>

            </div>

          </div>

        </div>

      </div>
    </header>
  );
}

