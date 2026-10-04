export default function FactorBenchFeedback({
  result,
  error,
}) {
  if (error) {
    return (
      <div
        className="factor-feedback factor-feedback-error"
        role="alert"
      >
        <strong>Something went wrong.</strong>
        <span>{error}</span>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  if (
    result.terminal &&
    result.completionStatus === "COMPLETE_SUCCESS"
  ) {
    return (
      <div
        className="factor-feedback factor-feedback-success"
        role="status"
      >
        <strong>Structure discovered! ✨</strong>

        <span>
          You found the complete factor structure for this
          number.
        </span>
      </div>
    );
  }

  if (!result.terminal) {
    return (
      <div
        className="factor-feedback factor-feedback-retry"
        role="status"
      >
        <strong>There is more to discover.</strong>

        <span>
          Review your factors and factor pairs, then try
          again. Your work has been kept on the screen.
        </span>
      </div>
    );
  }

  return (
    <div
      className="factor-feedback factor-feedback-finished"
      role="status"
    >
      <strong>This challenge is complete.</strong>

      <span>
        You have reached the end of this attempt. The next
        step is to review the number&apos;s factor structure.
      </span>
    </div>
  );
}


