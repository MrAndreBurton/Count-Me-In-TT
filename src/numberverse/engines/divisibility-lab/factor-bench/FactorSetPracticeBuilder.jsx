import { useState } from "react";
import "./factor-set-practice.css";

export default function FactorSetPracticeBuilder({
  target,
  selectedFactors,
  onChange,
  candidateBank = [],
  lockedFactors = [],
  usesCandidateBank = false,
  disabled = false,
}) {
  const [entry, setEntry] = useState("");
  const locked = new Set(lockedFactors.map(Number));
  const selected = new Set(selectedFactors.map(Number));
  const sort = (values) => [...new Set(values.map(Number))]
    .filter(Number.isFinite).sort((a, b) => a - b);

  function add(value) {
    const n = Number(value);
    if (disabled || !Number.isFinite(n) || n <= 0 || selected.has(n)) return;
    onChange(sort([...selectedFactors, n]));
  }

  function remove(value) {
    if (disabled || locked.has(Number(value))) return;
    onChange(selectedFactors.filter((f) => Number(f) !== Number(value)));
  }

  function submitEntry(event) {
    event.preventDefault();
    if (!entry.trim()) return;
    add(entry);
    setEntry("");
  }

  return (
    <section className="factor-set-practice-builder">
      {usesCandidateBank && (
        <div className="factor-set-practice-panel">
          <span className="factor-step-label">NUMBER BANK</span>
          <h3>
            Which numbers are factors of{" "}
            <span className="factor-inline-target">{target}</span>?
          </h3>

          <p>Choose the numbers that belong in the complete factor set.</p>
          <div className="factor-number-bank">
            {candidateBank.map((value) => {
              const used = selected.has(Number(value));
              return (
                <button key={value} type="button"
                  className={used ? "factor-number-tile factor-number-tile-selected" : "factor-number-tile"}
                  disabled={disabled || used} onClick={() => add(value)}>
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="factor-set-practice-panel">
        <span className="factor-step-label">YOUR FACTOR SET</span>
        <h3>
          Build the complete factor set for{" "}
          <span className="factor-inline-target">{target}</span>
        </h3>

        <p>{usesCandidateBank ? "Tap a chosen factor to return it to the bank. Supplied factors stay locked." : "Generate the factors yourself. Tap an entry to remove it."}</p>

        <div className="factor-selected-set">
          {selectedFactors.length === 0 ? (
            <p className="factor-empty-set">No factors added yet.</p>
          ) : selectedFactors.map((value) => {
            const isLocked = locked.has(Number(value));
            return (
              <button key={value} type="button"
                className={isLocked ? "factor-selected-tile factor-selected-tile-locked" : "factor-selected-tile"}
                disabled={disabled || isLocked} onClick={() => remove(value)}>
                {value}{isLocked ? " •" : ""}
              </button>
            );
          })}
        </div>

        {!usesCandidateBank && (
          <form className="factor-set-entry-form" onSubmit={submitEntry}>
            <label htmlFor="factor-set-entry">Enter a factor</label>
            <div className="factor-set-entry-row">
              <input id="factor-set-entry" type="number" min="1" step="1"
                inputMode="numeric" value={entry} disabled={disabled}
                onChange={(event) => setEntry(event.target.value)}
                placeholder="Type a number" />
              <button type="submit" disabled={disabled || entry.trim() === ""}>
                + Add Factor
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
