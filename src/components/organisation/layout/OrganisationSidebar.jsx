import {
  BookOpen,
  Gamepad2,
  Home,
  Layers3,
  LogOut,
  MenuSquare,
  UsersRound,
  X,
} from "lucide-react";
import {
  Link,
  useLocation,
} from "react-router-dom";

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

export default function OrganisationSidebar({
  organisation,
  profile,
  roles = [],
  isOpen,
  onClose,
  onSignOut,
  isSigningOut = false,
}) {
  const location = useLocation();

  const hasOrganisationAdminRole =
    roles.includes("organisation_admin");

  const organisationPath =
    `/organisation/${organisation.id}`;

  const isWorkspacePath =
    location.pathname === organisationPath;

  const activeHash =
    location.hash || "#overview";

  const navigation = [
    {
      label: "Overview",
      href: `${organisationPath}#overview`,
      icon: Home,
      visible: true,
    },
    {
      label: "Learners",
      href: `${organisationPath}#learners`,
      icon: UsersRound,
      visible: true,
    },
    {
      label: "Groups",
      href: `${organisationPath}#groups`,
      icon: Layers3,
      visible: true,
    },
    {
      label: "Staff",
      href: `${organisationPath}#staff`,
      icon: BookOpen,
      visible: hasOrganisationAdminRole,
    },
  ].filter((item) => item.visible);

  function handleNavigationClick() {
    onClose?.();
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close organisation navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0",
          isOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex min-h-20 items-center justify-between border-b border-slate-200 px-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-700">
              CountMeInTT
            </p>

            <p className="mt-1 truncate text-sm font-bold text-slate-950">
              {organisation.name}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close organisation navigation"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-5">
          <p className="px-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Organisation
          </p>

          <div className="mt-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const itemHash =
                new URL(
                  item.href,
                  window.location.origin
                ).hash;

              const isActive =
                isWorkspacePath &&
                activeHash === itemHash;

              return (

                <a
                  key={item.label}
                  href={item.href}
                  onClick={handleNavigationClick}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-yellow-100 text-yellow-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  ].join(" ")}
                >
                  <Icon size={19} />

                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          <div className="my-5 border-t border-slate-200" />

          <p className="px-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            CountMeInTT
          </p>

         <div className="mt-3 space-y-1">
           <Link
             to="/dashboard"
             onClick={handleNavigationClick}
             className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
           >
             <Gamepad2 size={19} />
             <span>Play / Dashboard</span>
           </Link>

           <Link
             to="/workspace"
             onClick={handleNavigationClick}
             className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
           >
             <MenuSquare size={19} />
             <span>Switch Workspace</span>
           </Link>

           <button
             type="button"
             onClick={onSignOut}
             disabled={isSigningOut}
             className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
           >
             <LogOut size={19} />
             <span>
               {isSigningOut
                 ? "Signing out..."
                 : "Sign Out"}
             </span>
           </button>
         </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="truncate text-sm font-black text-slate-950">
              {profile?.full_name ||
                "Organisation Staff"}
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {formatRoles(roles)}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
