import {
  BarChart3,
  Gamepad2,
  GraduationCap,
  School,
  Settings,
  WalletCards,
} from "lucide-react";

import ActionCard from "./ActionCard";

const actions = [
  {
    id: "students",
    title: "Students",
    description:
      "View learner profiles, registrations and account information.",
    to: "/admin/students",
    icon: <GraduationCap size={24} />,
  },
  {
    id: "memberships",
    title: "Memberships",
    description:
      "Review access requests, subscriptions and renewal activity.",
    to: "/admin/memberships",
    icon: <WalletCards size={24} />,
  },
  {
    id: "games",
    title: "Games",
    description:
      "Manage games, challenges, scores and leaderboard activity.",
    to: "/admin/games",
    icon: <Gamepad2 size={24} />,
  },
  {
    id: "reports",
    title: "Reports",
    description:
      "Explore platform performance, usage and learner engagement.",
    to: "/admin/reports",
    icon: <BarChart3 size={24} />,
  },
  {
    id: "schools",
    title: "Schools",
    description:
      "Manage school accounts, partnerships and learner groups.",
    to: "/admin/schools",
    icon: <School size={24} />,
  },
  {
    id: "settings",
    title: "Settings",
    description:
      "Update platform preferences, permissions and administrator controls.",
    to: "/admin/settings",
    icon: <Settings size={24} />,
  },
];

export default function ActionCentre() {
  return (
    <section className="mb-10">
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
          Action Centre
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          What would you like to manage?
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Jump directly into the areas that keep CountMeInTT
          operating each day.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            icon={action.icon}
            title={action.title}
            description={action.description}
            to={action.to}
          />
        ))}
      </div>
    </section>
  );
}

