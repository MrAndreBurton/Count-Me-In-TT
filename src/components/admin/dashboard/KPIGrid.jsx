import {
  Activity,
  Gamepad2,
  GraduationCap,
  UsersRound,
} from "lucide-react";

import KPICard from "./KPICard";

const kpis = [
  {
    id: "students",
    label: "Students",
    value: "1,248",
    detail: "+18 today",
    detailLabel: "New learner profiles",
    icon: <GraduationCap size={24} />,
  },
  {
    id: "games",
    label: "Games Played",
    value: "2,714",
    detail: "Today",
    detailLabel: "Across all game modes",
    icon: <Gamepad2 size={24} />,
  },
  {
    id: "memberships",
    label: "Active Memberships",
    value: "486",
    detail: "92% renewal rate",
    detailLabel: "Current paid access",
    icon: <UsersRound size={24} />,
  },
  {
    id: "platform",
    label: "Platform Status",
    value: "Operational",
    detail: "99.98% uptime",
    detailLabel: "All systems functioning",
    icon: <Activity size={24} />,
  },
];

export default function KPIGrid() {
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
            detailLabel={kpi.detailLabel}
          />
        ))}
      </div>
    </section>
  );
}

