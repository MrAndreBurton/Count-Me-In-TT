import { useRef } from "react";
import { Trophy } from "lucide-react";
import { formatLeaderboardTime, monthLabel } from "../../lib/leaderboardPresentation";
import { championCategoryLabel, championMonths, championMonthInYear, championYears } from "../../lib/monthlyChampions";
import "../../styles/monthlyChampions.css";

export function ChampionMonthPicker({ months, value, onChange, disabled = false, fieldClass }) {
  const available = championMonths(months);
  const selected = available.includes(value) ? value : available[0] || "";
  const year = selected.slice(0, 4);
  return <div className="champions-month-picker">
    <label className="text-sm font-bold text-gray-700">Year
      <select aria-label="Year" className={fieldClass} value={year} disabled={disabled || !available.length} onChange={e => onChange(championMonthInYear(available, selected, e.target.value))}>
        {championYears(available).map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </label>
    <label className="text-sm font-bold text-gray-700">Month
      <select aria-label="Month" className={fieldClass} value={selected} disabled={disabled || !available.length} onChange={e => onChange(e.target.value)}>
        {available.filter(m => m.startsWith(year + "-")).map(m => <option key={m} value={m}>{monthLabel(m).replace(/\s+\d{4}$/, "")}</option>)}
      </select>
    </label>
  </div>;
}

function ChampionCard({ row, index, legacy }) {
  const surface = useRef(null);
  function move(event) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    surface.current?.style.setProperty("--champion-rx", ((0.5 - (event.clientY - box.top) / box.height) * 4) + "deg");
    surface.current?.style.setProperty("--champion-ry", (((event.clientX - box.left) / box.width - 0.5) * 4) + "deg");
  }
  function reset() {
    surface.current?.style.removeProperty("--champion-rx");
    surface.current?.style.removeProperty("--champion-ry");
  }
  return <li className="champion-card" style={{ "--champion-delay": Math.min(index, 8) * 45 + "ms" }}
    onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>
    <article ref={surface} className="champion-card-surface">
      <div className="champion-card-top"><span className="champion-crest"><Trophy aria-hidden="true" /></span>
        <span className="champion-card-edition">{legacy ? "Legacy collection" : "Hall of Fame"}</span></div>
      <h3 className="champion-card-name">{row.display_name}</h3>
      <div className="champion-card-time"><span className="sr-only">Winning time: </span>{formatLeaderboardTime(row.metric)}</div>
      <div className="champion-card-badges"><span><span className="sr-only">Grid: </span>{row.variant.replace("x", " × ")}</span>
        <span><span className="sr-only">Category: </span>{championCategoryLabel(row.category)}</span></div>
    </article>
  </li>;
}

export default function MonthlyChampions({ rows, month, legacy = false }) {
  return <section className="champions-collection" aria-label={"Monthly champions, " + monthLabel(month)}>
    <div className="champions-collection-heading"><span className="champions-eyebrow">{legacy ? "The legacy collection" : "A moment to celebrate"}</span>
      <h2 className="champions-title">Monthly champions</h2><p className="champions-month">{monthLabel(month)}</p></div>
    <ul className="champion-card-grid">{rows.map((row, index) => <ChampionCard key={row.variant + ":" + row.category + ":" + index} row={row} index={index} legacy={legacy} />)}</ul>
  </section>;
}
