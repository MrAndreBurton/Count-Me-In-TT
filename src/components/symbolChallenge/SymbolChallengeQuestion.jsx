import SymbolRenderer from "../symbolBank/SymbolRenderer";

function ChallengeValue({
  value,
  renderMode,
  record,
  large = false,
}) {
  const mode =
    String(
      renderMode || "TEXT"
    ).toUpperCase();

  if (
    mode === "MATH" ||
    mode === "GRAPHIC"
  ) {
    if (record) {
      return (
        <SymbolRenderer
          record={record}
          large={large}
        />
      );
    }
  }

  return (
    <span
      className={
        large
          ? "text-3xl font-black leading-tight sm:text-4xl"
          : "text-lg font-black leading-snug"
      }
    >
      {value}
    </span>
  );
}

function optionClass({
  selected,
  correct,
  incorrect,
  locked,
  focus,
}) {
  const base = [
    "relative flex w-full items-center justify-center rounded-2xl border text-center font-black transition",
    "focus:outline-none focus:ring-4 focus:ring-blue-100",
    focus
      ? "min-h-28 p-6 sm:min-h-32"
      : "min-h-24 p-5 sm:min-h-28",
  ];

  if (correct) {
    base.push(
      "border-emerald-500 bg-emerald-50 text-emerald-950"
    );
  } else if (incorrect) {
    base.push(
      "border-red-400 bg-red-50 text-red-900"
    );
  } else if (selected) {
    base.push(
      "border-blue-500 bg-blue-50 text-slate-950"
    );
  } else {
    base.push(
      "border-slate-200 bg-white text-slate-950"
    );
  }

  if (!locked) {
    base.push(
      "hover:border-blue-400 hover:shadow-sm"
    );
  }

  if (locked) {
    base.push(
      "cursor-default"
    );
  }

  return base.join(" ");
}

export default function SymbolChallengeQuestion({
  encounter,
  recordMap,
  currentIndex,
  total,
  experienceMode,
  selectedOptionId,
  firstSelectedOptionId,
  feedbackStage,
  firstResponseCorrect,
  finalResponseCorrect,
  onAnswer,
  onNext,
}) {
  const isFocus =
    experienceMode === "FOCUS";

  const targetRecord =
    recordMap.get(
      String(
        encounter.symbolId
      )
    );

  const resolved =
    feedbackStage ===
    "RESOLVED";

  const retrying =
    feedbackStage ===
    "RETRY";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between gap-4 text-sm font-black text-slate-600">
        <span>
          Question {currentIndex + 1} of{" "}
          {total}
        </span>

        <span>
          {currentIndex + 1} / {total}
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{
            width: `${
              ((currentIndex + 1) /
                total) *
              100
            }%`,
          }}
        />
      </div>

      <section
        className={[
          "mt-5 rounded-3xl border border-slate-200 bg-white shadow-sm",
          isFocus
            ? "p-6 sm:p-10"
            : "p-6 sm:p-8",
        ].join(" ")}
      >
        <p className="text-sm font-black uppercase tracking-wide text-blue-600">
          {encounter.promptPayload
            .instruction}
        </p>

        <div
          className={[
            "mt-6 flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center",
            isFocus
              ? "sm:min-h-44"
              : "sm:min-h-36",
          ].join(" ")}
        >
          <ChallengeValue
            value={
              encounter
                .promptPayload
                .stimulus
            }
            renderMode={
              encounter
                .promptPayload
                .renderMode
            }
            record={
              targetRecord
            }
            large
          />
        </div>

        <div
          className={[
            "mt-6 grid gap-4",
            isFocus
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2",
          ].join(" ")}
        >
          {encounter.optionPayload.map(
            (option) => {
              const optionRecord =
                recordMap.get(
                  String(
                    option.symbolId
                  )
                );

              const selected =
                selectedOptionId ===
                option.id;

              const isCorrect =
                resolved &&
                option.id ===
                  encounter
                    .correctOptionId;

              const isIncorrect =
                resolved &&
                selected &&
                option.id !==
                  encounter
                    .correctOptionId;

              const disabledForRetry =
                retrying &&
                option.id ===
                  firstSelectedOptionId;

              const locked =
                resolved ||
                disabledForRetry;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={locked}
                  onClick={() =>
                    onAnswer(
                      option.id
                    )
                  }
                  className={optionClass({
                    selected,
                    correct:
                      isCorrect,
                    incorrect:
                      isIncorrect,
                    locked,
                    focus:
                      isFocus,
                  })}
                >
                  <span className="absolute left-4 top-3 text-xs font-black text-slate-400">
                    {option.id}
                  </span>

                  <ChallengeValue
                    value={
                      option.value
                    }
                    renderMode={
                      option
                        .renderMode
                    }
                    record={
                      optionRecord
                    }
                    large={
                      option.renderMode !==
                      "TEXT"
                    }
                  />
                </button>
              );
            }
          )}
        </div>

        {retrying ? (
          <div
            className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"
            role="status"
          >
            <p className="font-black text-amber-950">
              Try once more.
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-900">
              Look carefully at the
              choices and choose again.
            </p>
          </div>
        ) : null}

        {resolved ? (
          <div
            className={[
              "mt-6 rounded-2xl border p-5",
              finalResponseCorrect
                ? "border-emerald-200 bg-emerald-50"
                : "border-blue-200 bg-blue-50",
            ].join(" ")}
            role="status"
          >
            <p
              className={[
                "font-black",
                finalResponseCorrect
                  ? "text-emerald-950"
                  : "text-blue-950",
              ].join(" ")}
            >
              {finalResponseCorrect
                ? firstResponseCorrect
                  ? "Correct!"
                  : "You got it."
                : "Here is the correct answer."}
            </p>

            <div className="mt-3 text-sm leading-6 text-slate-700">
              <span className="font-black">
                {
                  targetRecord
                    ?.canonical_name
                }
              </span>

              {targetRecord
                ?.short_meaning ? (
                <>
                  {" — "}
                  {
                    targetRecord
                      .short_meaning
                  }
                </>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onNext}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-black text-white hover:bg-slate-800"
            >
              {currentIndex + 1 ===
              total
                ? "See Results"
                : "Next Question"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}