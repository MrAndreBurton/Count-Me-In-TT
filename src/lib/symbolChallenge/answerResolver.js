function firstString(values) {
  if (!Array.isArray(values)) return "";
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}
export function normalizeAnswer(value) {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
export function getAnswerSpec(record, behaviour) {
  if (behaviour === "QB-01") return { value: String(record.canonical_name || "").trim(), kind: "text", renderMode: "TEXT" };
  if (behaviour === "QB-02" || behaviour === "QB-03") return { value: String(record.display || "").trim(), kind: "symbol", renderMode: String(record.render_mode || "TEXT").toUpperCase() };
  if (behaviour === "QB-04") return { value: firstString(record.read_as), kind: "text", renderMode: "TEXT" };
  throw new Error(`Unsupported B2 question behaviour: ${behaviour}`);
}
export function getPromptSpec(record, behaviour) {
  if (behaviour === "QB-01") return { instruction: "What is this symbol or notation called?", stimulus: String(record.display || "").trim(), stimulusType: "symbol", renderMode: String(record.render_mode || "TEXT").toUpperCase() };
  if (behaviour === "QB-02") return { instruction: `Which symbol or notation is ${String(record.canonical_name || "").trim()}?`, stimulus: String(record.canonical_name || "").trim(), stimulusType: "text", renderMode: "TEXT" };
  if (behaviour === "QB-03") return { instruction: "Which symbol or notation matches this meaning?", stimulus: String(record.short_meaning || "").trim(), stimulusType: "text", renderMode: "TEXT" };
  if (behaviour === "QB-04") return { instruction: "How should this notation be read?", stimulus: String(record.display || "").trim(), stimulusType: "symbol", renderMode: String(record.render_mode || "TEXT").toUpperCase() };
  throw new Error(`Unsupported B2 question behaviour: ${behaviour}`);
}
