import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ActionCard({
  icon,
  title,
  description,
  to,
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-48 flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-yellow-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
          {icon}
        </div>

        <ArrowUpRight
          size={21}
          className="text-slate-300 transition duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-yellow-600"
        />
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-black tracking-tight text-slate-950">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </Link>
  );
}

