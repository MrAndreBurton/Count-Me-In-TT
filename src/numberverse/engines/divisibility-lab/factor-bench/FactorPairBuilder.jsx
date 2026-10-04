export default function FactorPairBuilder({
  target,
  pairs,
  onChange,
  disabled = false,
  allowRowManagement = true,
  lockedCells = [],
  standalone = false,
}) {
  function isCellLocked(pairIndex, side) {
    return Boolean(lockedCells?.[pairIndex]?.[side]);
  }

  function updatePair(index, side, value) {
    if (isCellLocked(index, side)) {
      return;
    }

    const nextPairs = pairs.map((pair, pairIndex) => {
      if (pairIndex !== index) {
        return pair;
      }

      const updated = [...pair];
      updated[side] = value;

      return updated;
    });

    onChange(nextPairs);
  }

  function addPair() {
    if (!allowRowManagement) {
      return;
    }

    onChange([...pairs, ["", ""]]);
  }

  function removePair(index) {
    if (!allowRowManagement) {
      return;
    }

    if (pairs.length === 1) {
      onChange([["", ""]]);
      return;
    }

    onChange(
      pairs.filter((_, pairIndex) => pairIndex !== index)
    );
  }

  return (
    <section className="factor-bench-section">
      <div className="factor-bench-section-heading">
        {standalone ? (
          <span className="factor-pair-mode-badge">
            PAIRS
          </span>
        ) : (
          <span className="factor-bench-step factor-bench-step-blue">
            1
          </span>
        )}

        <div>
          <h2>
            Build the factor pairs for{" "}
            <span className="factor-pair-target">
              {target}
            </span>
          </h2>

          <p>
            Find two numbers that multiply to make{" "}
            <strong className="factor-pair-target">
              {target}
            </strong>.
          </p>
        </div>
      </div>

      <div className="factor-pair-list">
        {pairs.map((pair, index) => (
          <div
            className="factor-pair-row"
            key={`pair-${index}`}
          >
            <input
              type="text"
              inputMode="numeric"
              value={pair[0]}
              disabled={
                disabled || isCellLocked(index, 0)
              }
              aria-label={`First number in factor pair ${
                index + 1
              }`}
              onChange={(event) =>
                updatePair(index, 0, event.target.value)
              }
            />

            <span
              className="factor-pair-symbol"
              aria-hidden="true"
            >
              ×
            </span>

            <input
              type="text"
              inputMode="numeric"
              value={pair[1]}
              disabled={
                disabled || isCellLocked(index, 1)
              }
              aria-label={`Second number in factor pair ${
                index + 1
              }`}
              onChange={(event) =>
                updatePair(index, 1, event.target.value)
              }
            />

            {allowRowManagement && (
              <button
                type="button"
                className="factor-pair-remove"
                disabled={disabled}
                aria-label={`Remove factor pair ${index + 1}`}
                onClick={() => removePair(index)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {allowRowManagement && (
        <button
          type="button"
          className="factor-add-pair-button"
          disabled={disabled}
          onClick={addPair}
        >
          + Add another pair
        </button>
      )}
    </section>
  );
}
