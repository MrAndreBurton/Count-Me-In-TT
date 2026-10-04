export default function CompletionClaim({
  value,
  onChange,
  disabled = false,
  isConfirmedCorrect = false,
}) {
  return (
    <section
      className={`factor-bench-section factor-completion-claim-section${
        isConfirmedCorrect
          ? " factor-completion-claim-success"
          : ""
      }`}
    >
      <div className="factor-bench-section-heading">
        <span className="factor-bench-step factor-bench-step-gold">
          3
        </span>

        <div>
          <h2>Make your claim</h2>

          <p>
            Have you found all the factors of the target number?
          </p>
        </div>
      </div>

      <div className="completion-claim-options">
        <button
          type="button"
          className={`completion-claim-option ${
            value === true
              ? "completion-claim-option-selected"
              : ""
          }${
            isConfirmedCorrect && value === true
              ? " completion-claim-option-correct"
              : ""
          }`}
          disabled={disabled}
          aria-pressed={value === true}
          onClick={() => onChange(true)}
        >
          <span className="completion-claim-icon">
            ✓
          </span>

          <span>
            <strong>Yes</strong>
            <small>My factor set is complete.</small>
          </span>
        </button>

        <button
          type="button"
          className={`completion-claim-option ${
            value === false
              ? "completion-claim-option-selected"
              : ""
          }`}
          disabled={disabled}
          aria-pressed={value === false}
          onClick={() => onChange(false)}
        >
          <span className="completion-claim-icon">
            ?
          </span>

          <span>
            <strong>I’m not sure yet</strong>
            <small>I want to check my work.</small>
          </span>
        </button>
      </div>

      {isConfirmedCorrect && (
        <div
          className="completion-claim-confirmation"
          role="status"
        >
          <span
            className="completion-claim-confirmation-icon"
            aria-hidden="true"
          >
            ✓
          </span>

          <span>
            <strong>Correct.</strong> The factor set is complete.
          </span>
        </div>
      )}
    </section>
  );
}
