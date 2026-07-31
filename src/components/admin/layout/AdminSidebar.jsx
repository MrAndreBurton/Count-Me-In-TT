import {
  BarChart3,
  Gamepad2,
  GraduationCap,
  Home,
  School,
  Settings,
  Trophy,
  UsersRound,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
  {
    label: "Control Centre",
    to: "/workspace",
    icon: Home,
  },
  {
    label: "Students",
    to: "/admin/students",
    icon: GraduationCap,
  },
  {
    label: "Parents",
    to: "/admin/parents",
    icon: UsersRound,
  },
  {
    label: "Schools",
    to: "/admin/schools",
    icon: School,
  },
  {
    label: "Games",
    to: "/admin/games",
    icon: Gamepad2,
  },
  {
    label: "Leaderboards",
    to: "/admin/leaderboards",
    icon: Trophy,
  },
  {
    label: "Reports",
    to: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Settings",
    to: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar({
  isOpen,
  onClose,
}) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72
          border-r border-slate-200 bg-white
          transition-transform duration-200
          lg:translate-x-0
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <div className="flex h-full flex-col p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-black text-slate-950">
                CountMeInTT
              </p>

              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Control Centre
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 lg:hidden"
            >
              Close
            </button>
          </div>

          <nav className="mt-10 flex-1 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/workspace"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      isActive
                        ? "bg-yellow-400 text-slate-950"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`
                  }
                >
                  <Icon
                    size={20}
                    strokeWidth={2.2}
                  />

                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
              Admin Workspace
            </p>

            <p className="mt-3 text-sm font-bold">
              CountMeInTT Platform
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Manage students, parents, learning
              activity and platform operations.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}


