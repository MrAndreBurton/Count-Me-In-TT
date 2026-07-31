import {
  ArrowRight,
  CalendarDays,
  Gamepad2,
  GraduationCap,
  School,
} from "lucide-react";

import { Link } from "react-router-dom";

const membershipStyles = {
  Annual:
    "bg-emerald-100 text-emerald-700",
  Term:
    "bg-blue-100 text-blue-700",
  Free:
    "bg-slate-100 text-slate-600",
};

const statusStyles = {
  Active:
    "bg-emerald-500",
  Inactive:
    "bg-slate-300",
  Pending:
    "bg-amber-400",
};

export default function StudentCard({ student }) {
  const membershipClass =
    membershipStyles[student.membership] ||
    membershipStyles.Free;

  const statusClass =
    statusStyles[student.status] ||
    statusStyles.Inactive;

  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-yellow-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-lg font-black text-yellow-700">
            {student.initials}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                {student.name}
              </h2>

              <span
                className={`h-2.5 w-2.5 rounded-full ${statusClass}`}
                title={student.status}
              />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {student.displayName}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${membershipClass}`}
        >
          {student.membership}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <GraduationCap
            size={18}
            className="text-slate-400"
          />

          <span>{student.level}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <School
            size={18}
            className="text-slate-400"
          />

          <span>{student.school}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Gamepad2
            size={18}
            className="text-slate-400"
          />

          <span>
            {student.gamesPlayed} games played
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <CalendarDays
            size={18}
            className="text-slate-400"
          />

          <span>
            Last active {student.lastActive}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <Link
          to={`/admin/students/${student.id}`}
          className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-yellow-100 hover:text-yellow-800"
        >
          View student profile

          <ArrowRight
            size={18}
            className="transition group-hover:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}

