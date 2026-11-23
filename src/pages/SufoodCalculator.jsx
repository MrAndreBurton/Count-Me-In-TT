import "./SufoodResult.css";
import { useState } from "react";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import recipes from "../data/sufoodRecipes.json";

function spoonNumber(value) {
  const fractions = ["", "⅛", "¼", "⅜", "½", "⅝", "¾", "⅞"];
  const index = (value % 1) * 8;
  if (!Number.isInteger(index) || !index) return String(value);
  return (Math.floor(value) || "") + fractions[index];
}

function bottles(ml) {
  const count = Math.ceil(ml / 250);
  const large = Math.max(0, Math.ceil((ml - 190 * count) / 60));
  return [[count - large, 190], [large, 250]].filter(([n]) => n)
    .map(([n,size]) => (n === 1 ? "one" : n) + " " + size + "-millilitre bottle" + (n === 1 ? "" : "s")).join(" and ");
}

export default function SufoodCalculator() {
  const [group, setGroup] = useState("");
  const [item, setItem] = useState("");
  const [strength, setStrength] = useState("1");
  const [answer, setAnswer] = useState(null);
  const recipe = recipes.find(r => r.subgroup === item);
  function calculate(event) {
    event.preventDefault();
    if (!recipe) return;
    const quantity = event.currentTarget.elements.quantity.valueAsNumber;
    const regular = quantity * recipe.teaspoons_per_unit;
    const exact = regular * Number(strength);
    const measure = exact < 0.25 ? exact : Math.round(exact * 4) / 4;
    setAnswer({ quantity, regular, exact, measure, ml: measure * 5 });
    window.gtag?.("event", "sufood_calculation_completed");
    requestAnimationFrame(() => document.getElementById("elixir-result")?.focus());
  }
  const field = "block w-full mt-1 rounded-lg border border-slate-400 p-2 bg-white";
  return <><SiteHeader/><main id="main-content" className="mx-auto max-w-6xl p-5 text-[#0B2D5B]">
    <div className="sufood-hero">
      <div className="sufood-hero-copy">
        <h1>Sufood Elixir Calculator</h1>
        <p>Find out how much Elixir to use in your recipe.</p>
      </div>
    </div>
    <p className="my-3">Development preview · Recipe amounts and bottle guidance are provisional.</p>
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <form
        onSubmit={calculate}
        onChange={() => setAnswer(null)}
        aria-labelledby="sufood-form-heading"
        id="sufood-form"
        className="grid content-start gap-3 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
      >
        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3">
          <h2 id="sufood-form-heading" className="text-xl font-bold text-[#0B2D5B]">
            What are you making?
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Choose your recipe, quantity and strength.
          </p>
        </div>
        <label>Category<select className={field} required value={group} onChange={e => {setGroup(e.target.value); setItem("");}}>
          <option value="">Choose a category</option>{[...new Set(recipes.map(r => r.group))].map(g => <option key={g}>{g}</option>)}</select></label>
        <label>Recipe<select className={field} required disabled={!group} value={item} onChange={e => setItem(e.target.value)}>
          <option value="">Choose a recipe</option>{recipes.filter(r => r.group === group).map(r => <option key={r.subgroup}>{r.subgroup}</option>)}</select></label>
        {recipe && <small>For example, {recipe.examples}.</small>}
        <label>Quantity {recipe && "· " + recipe.unit}<input className={field} name="quantity" required type="number" min="0.5" step="0.5" max="1000000000"/></label>
        <label>Strength<select className={field} value={strength} onChange={e => setStrength(e.target.value)}><option value=".5">Light · half</option><option value="1">Regular</option><option value="1.5">Bold · one and a half</option></select></label>
        <button type="submit" className="rounded-xl bg-blue-700 p-3 font-bold text-white">Calculate</button>
      </form>
      <section id="elixir-result" tabIndex={-1} aria-live="polite" className="space-y-3 self-start rounded-2xl bg-blue-50 p-5">
        <h2 className="text-xl font-bold">How much to use</h2>
        {answer && recipe ? <><div className="sf-serving"><strong>{spoonNumber(answer.measure)}</strong><span>{answer.measure === 1 ? "teaspoon" : "teaspoons"} of Elixir</span><small>About {answer.ml} mL{answer.measure >= 3 && answer.measure % 3 === 0 && " · " + answer.measure / 3 + (answer.measure === 3 ? " tablespoon" : " tablespoons")}</small></div>
        {answer.exact < .25 && <p>This is below ¼ teaspoon. The exact amount is shown.</p>}
        {answer.measure !== answer.exact && <p>Exact: {answer.exact} tsp. Recommended measure: {answer.measure} tsp.</p>}
        <h3 className="font-bold">What to buy</h3><p>This recipe uses {answer.ml} millilitres. Buy {bottles(answer.ml)}.</p>
        <p className="sf-equation">{spoonNumber(answer.quantity)} × {spoonNumber(recipe.teaspoons_per_unit)} × {spoonNumber(Number(strength))} = <b>{spoonNumber(answer.exact)} tsp</b></p>
        <p>Maths · Multiplication and measurement{(answer.exact % 1 !== 0 || strength !== "1") && ", fractions"}{answer.measure !== answer.exact && ", rounding"}.</p>
        <details className="sf-work"><summary>See how the maths works <span aria-hidden="true">↓</span></summary><ol>
        <li><b>Start with Regular</b><p>Each {recipe.unit} takes {spoonNumber(recipe.teaspoons_per_unit)} tsp. Multiply by your quantity.</p><em>{spoonNumber(answer.quantity)} × {spoonNumber(recipe.teaspoons_per_unit)} = {spoonNumber(answer.regular)} tsp</em></li>
        <li><b>{strength === ".5" ? "Light? Take half." : strength === "1.5" ? "Going Bold? Add half again." : "Keep it Regular"}</b><p>{strength === "1.5" ? "Half of " + spoonNumber(answer.regular) + " is " + spoonNumber(answer.regular / 2) + ". Add that to the regular amount." : strength === ".5" ? "Divide the regular amount into two equal parts. Use one part." : "Regular uses the amount you just worked out."}</p><em>{spoonNumber(answer.regular)} {strength === "1.5" ? "+ " + spoonNumber(answer.regular / 2) : strength === ".5" ? "÷ 2" : "× 1"} = {spoonNumber(answer.exact)} tsp</em></li>
        {answer.measure !== answer.exact && <li><b>Find the nearest quarter spoon</b><p>Round the final amount to a quarter teaspoon. For this preview, a halfway value rounds up.</p><em>{spoonNumber(answer.exact)} tsp → {spoonNumber(answer.measure)} tsp</em></li>}
        <li><b>What’s that in millilitres?</b><p>Each teaspoon holds about 5 mL.</p><em>{spoonNumber(answer.measure)} × 5 = {answer.ml} mL</em></li></ol></details>
        <a className="inline-block underline" href="https://sufoodtt.com/?utm_source=countmeintt&utm_medium=referral&utm_campaign=elixir_calculator">Get the Elixir</a></> : <p>Choose your recipe and press Calculate.</p>}
      </section></div></main><SiteFooter/></>;
}
