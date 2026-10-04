import { useState } from "react";
import { X } from "lucide-react";

export default function FactorEntry({
  factors,
  onChange,
  disabled = false,
}) {
  const [value, setValue] = useState("");

  function addFactor() {
    const parsed = Number(value.trim());

    if (!Number.isFinite(parsed)) {
      return;
    }

    if (!factors.includes(parsed)) {
      onChange([...factors, parsed].sort((a, b) => a - b));
    }

    setValue("");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addFactor();
    }
  }

  function removeFactor(factor) {
    onChange(factors.filter((item) => item !== factor));
  }

  return (
    <section className="factor-bench-section">
      <div className="factor-bench-section-heading">
        <span className="factor-bench-step factor-bench-step-purple">
          2
        </span>

        <div>
          <h2>List the factors</h2>
          <p>
            Enter all the factors in ascending order, from smallest to largest.
          </p>
        </div>
      </div>

      <div className="factor-entry-row">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          placeholder="Enter a number"
          aria-label="Enter a factor"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          type="button"
          className="factor-add-button"
          disabled={disabled || !value.trim()}
          onClick={addFactor}
        >
          Add
        </button>
      </div>

      <div
        className="factor-chip-area"
        aria-label="Factors entered"
      >
        {factors.length === 0 ? (
          <p className="factor-empty-message">
            Your factors will appear here.
          </p>
        ) : (
          factors.map((factor) => (
            <div
              className="factor-chip"
              key={factor}
            >
              <span>{factor}</span>

              {!disabled && (
                <button
                  type="button"
                  className="factor-chip-remove"
                  aria-label={`Remove factor ${factor}`}
                  title={`Remove ${factor}`}
                  onClick={() => removeFactor(factor)}
                >
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}


