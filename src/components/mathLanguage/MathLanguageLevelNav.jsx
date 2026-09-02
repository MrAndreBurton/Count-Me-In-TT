import { Link } from "react-router-dom";

const LEVELS = [
  {
    id: "level-1",
    number: "Level 1",
    name: "Foundation",
    audience: "SEA / Primary",
    to: "/math-language/level-1",
  },
  {
    id: "level-2",
    number: "Level 2",
    name: "Secondary",
    audience: "Forms 1–3",
    to: "/math-language/level-2",
  },
  {
    id: "level-3",
    number: "Level 3",
    name: "CSEC",
    audience: "CSEC Mathematics",
    to: "/math-language/level-3",
  },
];

export default function MathLanguageLevelNav({
  currentLevel = null,
}) {
  return (
    <nav
      className="mb-6"
      aria-label="Mathematics Language levels"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to="/math-language"
            className="text-sm font-black text-gray-600 hover:text-blue-700"
          >
            ← Math Language
          </Link>

          <p className="mt-2 text-xs font-black uppercase tracking-wider text-gray-400">
            Choose or change level
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {LEVELS.map((level) => {
          const active =
            currentLevel === level.id;

          return (
            <Link
              key={level.id}
              to={level.to}
              aria-current={
                active ? "page" : undefined
              }
              className={`rounded-2xl border-2 p-3 transition ${
                active
                  ? "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-100"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <p
                className={`text-xs font-black uppercase tracking-wider ${
                  active
                    ? "text-yellow-800"
                    : "text-gray-500"
                }`}
              >
                {level.number}
              </p>

              <p className="mt-1 font-black text-gray-950">
                {level.name}
              </p>

              <p className="mt-1 text-xs font-semibold text-gray-500">
                {level.audience}
              </p>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

