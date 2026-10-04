import {
  FACTOR_PAIR_SUPPORT_LEVELS,
} from "./factorPairPracticeSupport";

const OPTIONS = [
  {
    value: FACTOR_PAIR_SUPPORT_LEVELS.SUPPORTED,
    title: "Supported",
    description:
      "Some factors are already shown. Complete the missing partners.",
    meta: "50% of factor entries supplied",
  },
  {
    value: FACTOR_PAIR_SUPPORT_LEVELS.GUIDED,
    title: "Guided",
    description:
      "The correct number of factor-pair rows is shown. Find every pair.",
    meta: "Row count supplied",
  },
  {
    value: FACTOR_PAIR_SUPPORT_LEVELS.INDEPENDENT,
    title: "Independent",
    description:
      "Build the factor-pair structure yourself and add rows when you need them.",
    meta: "Learner-managed rows",
  },
];

export default function FactorPairSupportStart({
  onSelect,
  onBack,
}) {
  return (
    <main className="numberverse-page">
      <div className="numberverse-overlay">
        <section className="numberverse-hero">
          <div>
            <p className="numberverse-eyebrow">
              NUMBERVERSE
            </p>
            <p className="numberverse-lab-label">
              Divisibility Lab
            </p>
            <h1>Factor Pairs</h1>
            <p className="numberverse-hero-copy">
              Choose how much structure you want while
              practising factor pairs.
            </p>
          </div>
        </section>

        <section className="factor-bench-workspace">
          <header className="factor-bench-header">
            <div>
              <p className="factor-bench-engine">
                🔬 Pair Practice
              </p>
              <h2>Choose your support</h2>
              <p>
                The mathematics stays focused on factor
                pairs. What changes is how much of the
                structure is provided.
              </p>
            </div>
          </header>

          <div className="factor-bench-round-results">
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="factor-status-card"
                onClick={() => onSelect(option.value)}
              >
                <span>{option.meta}</span>
                <strong>{option.title}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>

          <footer className="factor-bench-actions">
            <button
              type="button"
              className="factor-clear-button"
              onClick={onBack}
            >
              Back to Modes
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}
