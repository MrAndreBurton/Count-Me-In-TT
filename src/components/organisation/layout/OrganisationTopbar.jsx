import {
  Menu,
  ShieldCheck,
} from "lucide-react";

const ROLE_LABELS = {
  organisation_admin: "Organisation Administrator",
  teacher: "Teacher",
  tutor: "Tutor",
};

function formatRoles(roles = []) {
  const labels = roles
    .map((role) => ROLE_LABELS[role])
    .filter(Boolean);

  return labels.length > 0
    ? labels.join(" | ")
    : "Organisation Staff";
}

export default function OrganisationTopbar({
  organisation,
  profile,
  roles = [],
  onMenuClick,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Open organisation navigation"
            onClick={onMenuClick}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Organisation Workspace
            </p>

            <p className="mt-1 truncate text-sm font-black text-slate-950 sm:text-base">
              {organisation.name}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-yellow-100 text-yellow-800">
            <ShieldCheck size={19} />
          </div>

          <div className="min-w-0 text-right">
            <p className="max-w-56 truncate text-sm font-black text-slate-950">
              {profile?.full_name ||
                "Organisation Staff"}
            </p>

            <p className="mt-0.5 max-w-56 truncate text-xs font-semibold text-slate-500">
              {formatRoles(roles)}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
