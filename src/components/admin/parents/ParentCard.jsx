import {
  Mail,
  Phone,
  UsersRound,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function ParentCard({
  parent,
}) {
  const statusStyles = {
    Active:
      "bg-emerald-100 text-emerald-700",
    Pending:
      "bg-amber-100 text-amber-700",
    Inactive:
      "bg-slate-100 text-slate-600",
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-lg font-black text-yellow-700">
            {parent.initials}
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-950">
              {parent.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {parent.relationship}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            statusStyles[parent.status] ||
            statusStyles.Inactive
          }`}
        >
          {parent.status}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Mail
            size={17}
            className="text-slate-400"
          />

          <span className="truncate">
            {parent.email}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Phone
            size={17}
            className="text-slate-400"
          />

          <span>{parent.phone}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <UsersRound
            size={17}
            className="text-slate-400"
          />

          <span>
            {parent.studentIds.length}{" "}
            {parent.studentIds.length === 1
              ? "student"
              : "students"}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <Link
          to={`/admin/parents/${parent.id}`}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-yellow-400 hover:text-slate-950"
        >
          View parent profile
        </Link>
      </div>
    </article>
  );
}


