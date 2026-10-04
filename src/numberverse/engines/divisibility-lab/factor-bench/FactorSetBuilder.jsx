import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Undo2,
} from "lucide-react";

function buildTokens(pairs) {
  return pairs.flatMap((pair, pairIndex) =>
    pair.flatMap((rawValue, sideIndex) => {
      const text = String(rawValue ?? "").trim();

      if (text === "") {
        return [];
      }

      const value = Number(text);

      if (!Number.isFinite(value)) {
        return [];
      }

      return [
        {
          id: `pair-${pairIndex}-side-${sideIndex}`,
          value,
        },
      ];
    })
  );
}

function shuffleTokens(tokens) {
  const shuffled = [...tokens];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export default function FactorSetBuilder({
  pairs,
  onChange,
  disabled = false,
  resetKey,
}) {
  const [selectedIds, setSelectedIds] = useState([]);

  const tokens = useMemo(
    () => buildTokens(pairs),
    [pairs]
  );

  const tokenSignature = useMemo(
    () =>
      tokens
        .map((token) => `${token.id}:${token.value}`)
        .join("|"),
    [tokens]
  );

  const shuffledTokens = useMemo(
    () => shuffleTokens(tokens),
    [tokenSignature]
  );

  const tokenMap = useMemo(
    () =>
      new Map(
        tokens.map((token) => [token.id, token])
      ),
    [tokens]
  );

  /*
   * If the learner changes the factor pairs,
   * rebuild Step 2 from scratch.
   *
   * This prevents the factor set from silently
   * containing numbers that no longer exist in
   * the learner's pair work.
   */
  useEffect(() => {
    setSelectedIds([]);
    onChange([]);
  }, [tokenSignature, resetKey, onChange]);

  function commitSelection(nextIds) {
    setSelectedIds(nextIds);

    const nextFactorSet = nextIds
      .map((id) => tokenMap.get(id))
      .filter(Boolean)
      .map((token) => token.value);

    onChange(nextFactorSet);
  }

  function addToFactorSet(id) {
    if (disabled || selectedIds.includes(id)) {
      return;
    }

    commitSelection([...selectedIds, id]);
  }

  function returnToBank(id) {
    if (disabled) {
      return;
    }

    commitSelection(
      selectedIds.filter(
        (selectedId) => selectedId !== id
      )
    );
  }

  function moveFactor(id, direction) {
    if (disabled) {
      return;
    }

    const currentIndex = selectedIds.indexOf(id);

    if (currentIndex === -1) {
      return;
    }

    const nextIndex =
      direction === "left"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      nextIndex < 0 ||
      nextIndex >= selectedIds.length
    ) {
      return;
    }

    const nextIds = [...selectedIds];

    [nextIds[currentIndex], nextIds[nextIndex]] = [
      nextIds[nextIndex],
      nextIds[currentIndex],
    ];

    commitSelection(nextIds);
  }

  const bankTokens = shuffledTokens.filter(
    (token) => !selectedIds.includes(token.id)
  );

  const selectedTokens = selectedIds
    .map((id) => tokenMap.get(id))
    .filter(Boolean);

  const hasDiscoveries = tokens.length > 0;

  return (
    <section className="factor-bench-section">
      <div className="factor-bench-section-heading">
        <span className="factor-bench-step factor-bench-step-purple">
          2
        </span>

        <div>
          <h2>Build the factor set</h2>

          <p>
            Use the numbers you discovered in your factor
            pairs. Choose each factor once and arrange the
            set from smallest to largest.
          </p>
        </div>
      </div>

      {!hasDiscoveries ? (
        <div className="factor-set-waiting">
          <strong>Build some factor pairs first.</strong>

          <p>
            The numbers you discover in Step 1 will appear
            here.
          </p>
        </div>
      ) : (
        <>
          <div className="factor-set-area">
            <div className="factor-set-label-row">
              <div>
                <span className="factor-set-kicker">
                  NUMBER BANK
                </span>

                <h3>Your discoveries</h3>
              </div>

              <span className="factor-set-count">
                {bankTokens.length} remaining
              </span>
            </div>

            <p className="factor-set-instruction">
              Tap a number to move it into your factor set.
            </p>

            <div
              className="factor-number-bank"
              aria-label="Numbers discovered from factor pairs"
            >
              {bankTokens.length > 0 ? (
                bankTokens.map((token) => (
                  <button
                    type="button"
                    className="factor-bank-tile"
                    key={token.id}
                    disabled={disabled}
                    onClick={() =>
                      addToFactorSet(token.id)
                    }
                  >
                    {token.value}
                  </button>
                ))
              ) : (
                <p className="factor-bank-empty">
                  All discovered numbers are currently in
                  your factor set.
                </p>
              )}
            </div>
          </div>

          <div className="factor-set-divider">
            <span>Build your set</span>
          </div>

          <div className="factor-set-area factor-set-build-area">
            <div className="factor-set-label-row">
              <div>
                <span className="factor-set-kicker">
                  FACTOR SET
                </span>

                <h3>Smallest → Largest</h3>
              </div>

              <span className="factor-set-count">
                {selectedTokens.length} selected
              </span>
            </div>

            <div
              className="factor-selected-list"
              aria-label="Factor set"
            >
              {selectedTokens.length === 0 ? (
                <div className="factor-set-placeholder">
                  <span>Smallest</span>

                  <div className="factor-set-placeholder-line" />

                  <span>Largest</span>
                </div>
              ) : (
                selectedTokens.map((token, index) => (
                  <div
                    className="factor-selected-item"
                    key={token.id}
                  >
                    <button
                      type="button"
                      className="factor-selected-number"
                      disabled={disabled}
                      title={`Return ${token.value} to the number bank`}
                      aria-label={`Return ${token.value} to the number bank`}
                      onClick={() =>
                        returnToBank(token.id)
                      }
                    >
                      {token.value}

                      <Undo2
                        size={11}
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </button>

                    <div className="factor-order-controls">
                      <button
                        type="button"
                        disabled={
                          disabled || index === 0
                        }
                        aria-label={`Move ${token.value} left`}
                        title="Move left"
                        onClick={() =>
                          moveFactor(token.id, "left")
                        }
                      >
                        <ChevronLeft
                          size={14}
                          strokeWidth={2.5}
                        />
                      </button>

                      <button
                        type="button"
                        disabled={
                          disabled ||
                          index ===
                            selectedTokens.length - 1
                        }
                        aria-label={`Move ${token.value} right`}
                        title="Move right"
                        onClick={() =>
                          moveFactor(token.id, "right")
                        }
                      >
                        <ChevronRight
                          size={14}
                          strokeWidth={2.5}
                        />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedTokens.length > 0 && (
              <p className="factor-set-help">
                Tap a number to return it to the Number
                Bank. Use the arrows to change its
                position.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}


