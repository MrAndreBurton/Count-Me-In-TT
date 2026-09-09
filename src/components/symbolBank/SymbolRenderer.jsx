import katex from "katex";
import "katex/dist/katex.min.css";

const SYMBOL_MATH_SOURCES = Object.freeze({
  "MSB-043": "\\{x:\\ldots\\}",
  "MSB-050": "a^{n}",
  "MSB-051": "a \\times 10^{n}",
  "MSB-059": "f^{-1}(x)",
  "MSB-063": "\\mathbb{Z}^{+}",
  "MSB-064": "\\mathbb{Z}^{-}",
  "MSB-065": "0.\\dot{3}",
  "MSB-078": "\\overrightarrow{AB}",
  "MSB-079": "\\left|\\overrightarrow{AB}\\right|",
  "MSB-080": "\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}",
  "MSB-084": "\\begin{bmatrix}0&0\\\\0&0\\end{bmatrix}",
});

function mathSource(record) {
  const explicitSource = SYMBOL_MATH_SOURCES[record.symbol_id];

  if (explicitSource) {
    return explicitSource;
  }

  const display = record.display || "";
  let source = String(display);

  const replacements = [
    ["×", "\\times "],
    ["÷", "\\div "],
    ["−", "-"],
    ["≤", "\\le "],
    ["≥", "\\ge "],
    ["≠", "\\ne "],
    ["∈", "\\in "],
    ["∪", "\\cup "],
    ["∩", "\\cap "],
    ["∝", "\\propto "],
    ["⇒", "\\Rightarrow "],
    ["⇔", "\\Leftrightarrow "],
    ["±", "\\pm "],
    ["π", "\\pi "],
    ["²", "^{2}"],
    ["³", "^{3}"],
    ["₁", "_{1}"],
  ];

  for (const [from, to] of replacements) {
    source = source.split(from).join(to);
  }

  if (display === "√") {
    source = "\\sqrt{\\phantom{x}}";
  }

  return source;
}

function Graphic({ record, large }) {
  if (record.symbol_id === "MSB-048") {
    return (
      <span
        role="img"
        aria-label={record.accessibility_name || record.canonical_name}
        className={large ? "text-5xl font-black" : "text-3xl font-black"}
      >
        (
        <span className="inline-grid text-[.65em] leading-tight">
          <span>x</span>
          <span>y</span>
        </span>
        )
      </span>
    );
  }

  const cls = large ? "h-24 w-40" : "h-16 w-28";

  if (["MSB-075", "MSB-076", "MSB-077"].includes(record.symbol_id)) {
    const line = record.symbol_id === "MSB-075";
    const ray = record.symbol_id === "MSB-076";

    return (
      <svg
        className={cls}
        viewBox="0 0 160 96"
        role="img"
        aria-label={record.accessibility_name || record.canonical_name}
      >
        <line
          x1="30"
          y1="48"
          x2="130"
          y2="48"
          stroke="currentColor"
          strokeWidth="4"
        />

        {line && (
          <>
            <path
              d="M40 38 L26 48 L40 58"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              d="M120 38 L134 48 L120 58"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
          </>
        )}

        {ray && (
          <path
            d="M120 38 L134 48 L120 58"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
        )}

        {!line && !ray && (
          <>
            <circle cx="30" cy="48" r="5" fill="currentColor" />
            <circle cx="130" cy="48" r="5" fill="currentColor" />
          </>
        )}

        <text x="42" y="32" fontSize="16" fill="currentColor">
          A
        </text>
        <text x="112" y="32" fontSize="16" fill="currentColor">
          B
        </text>
      </svg>
    );
  }

  if (record.symbol_id === "MSB-044") {
    return (
      <span
        className={large ? "text-6xl font-black" : "text-4xl font-black"}
      >
        ○ → ○
      </span>
    );
  }

  if (record.symbol_id === "MSB-007") {
    return (
      <span
        className={
          large
            ? "text-6xl font-black tracking-tight"
            : "text-4xl font-black tracking-tight"
        }
      >
        ||||╱
      </span>
    );
  }

  return (
    <span
      className={large ? "text-6xl font-black" : "text-4xl font-black"}
    >
      {record.display}
    </span>
  );
}

export default function SymbolRenderer({ record, large = false }) {
  if (record.render_mode === "GRAPHIC") {
    return <Graphic record={record} large={large} />;
  }

  if (record.render_mode === "MATH") {
    const html = katex.renderToString(mathSource(record), {
      throwOnError: false,
      strict: "ignore",
      output: "htmlAndMathml",
    });

    return (
      <span
        aria-label={record.accessibility_name || record.canonical_name}
        className={
          large ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl"
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      aria-label={record.accessibility_name || record.canonical_name}
      className={
        large
          ? "text-5xl font-black sm:text-6xl"
          : "text-3xl font-black sm:text-4xl"
      }
    >
      {record.display}
    </span>
  );
}