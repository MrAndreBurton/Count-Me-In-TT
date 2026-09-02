import {
  Award,
  Gamepad2,
  GraduationCap,
  UsersRound,
} from "lucide-react";

import KPICard from "./KPICard";

export default function KPIGrid({
  stats,
  isLoading = false,
}) {
  const kpis = [
    {
      id: "students",

      label: "Students",

      value: isLoading
        ? "—"
        : stats.students.toLocaleString(),

      detail: "Learner profiles",

      detailLabel:
        "Registered on CountMeInTT",

      icon: (
        <GraduationCap size={24} />
      ),
    },

    {
      id: "rounds",

      label: "Verified Rounds",

      value: isLoading
        ? "—"
        : stats.verifiedRounds.toLocaleString(),

      detail: "Learning activity",

      detailLabel:
        "Across all verified game modes",

      icon: (
        <Gamepad2 size={24} />
      ),
    },

    {
      id: "memberships",

      label: "Current Memberships",

      value: isLoading
        ? "—"
        : stats.activeMemberships.toLocaleString(),

      detail: "Current access",

      detailLabel:
        "Current student memberships",

      icon: (
        <UsersRound size={24} />
      ),
    },

    {
      id: "badges",

      label: "Badges Awarded",

      value: isLoading
        ? "—"
        : stats.badgesAwarded.toLocaleString(),

      detail: "Achievements earned",

      detailLabel:
        "Across all learning activities",

      icon: <Award size={24} />,
    },
  ];

  return (
    <section className="mb-10">
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-600">
          Platform Overview
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          CountMeInTT at a glance
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.id}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            detail={kpi.detail}
            detailLabel={
              kpi.detailLabel
            }
          />
        ))}
      </div>
    </section>
  );
}


