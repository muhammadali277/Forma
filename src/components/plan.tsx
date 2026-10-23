import { useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { TARGETS, parseMeal, sumMacros } from "@/lib/nutrition";
import { GROCERY, HABIT_TIPS, MEAL_PLAN, QUICK_ADDS, SWAPS } from "@/lib/plan";
import { PROGRAM } from "@/lib/program";
import type { Tab } from "@/lib/types";
import { fmt } from "./ui";

const STORE = "forma.grocery.v1";
const MEAL_TOTALS = Object.fromEntries(MEAL_PLAN.map((m) => [m.quick, parseMeal(QUICK_ADDS.find((q) => q.id === m.quick)?.text ?? "").totals]));
const PLAN_TOTAL = sumMacros(Object.values(MEAL_TOTALS));

export default function Plan({ go }: { go: (t: Tab) => void }) {
  const [checked, setChecked] = useState<string[]>(() => {
    try { return typeof window === "undefined" ? [] : (JSON.parse(window.localStorage.getItem(STORE) ?? "[]") as string[]); }
    catch { return []; }
  });
  const store = (next: string[]) => {
    setChecked(next);
    try { window.localStorage.setItem(STORE, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const toggle = (id: string) => store(checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id]);

  return (
    <>
      <section className="card">
        <div className="card-head"><h3>Daily targets</h3><span className="tiny muted">lose fat, keep muscle</span></div>
        <div className="targets">
          <div className="target"><strong>{fmt(TARGETS.calories)}</strong><span>kcal a day</span></div>
          <div className="target protein"><strong>{TARGETS.protein} g</strong><span>protein a day</span></div>
        </div>
        <p className="tiny muted targets-note">Plus about {TARGETS.fat} g fat, {TARGETS.carbs} g carbs and {TARGETS.fiber} g fibre. Expect roughly 0.4–0.6 kg less per week (a little more in week 1).</p>
        <details className="how">
          <summary>How these were worked out <ChevronDown size={16} /></summary>
          <ul>
            <li>Resting burn (BMR) for 25 y, 180 cm, 87 kg: ~1,880 kcal</li>
            <li>Daily burn with desk job + 3 gym days: ~2,550–2,700 kcal</li>
            <li>2,100 kcal gives a steady ~450–600 kcal deficit</li>
            <li>Protein: 1.6 g × 75 kg goal = 120 g minimum; 130 g gives a buffer</li>
            <li>Stuck for 2 weeks? The Progress tab will tell you what to change</li>
          </ul>
        </details>
      </section>

      <h2 className="section-title">Meals</h2>
      <section className="card">
        {MEAL_PLAN.map((m) => (
          <div className="plan-meal" key={m.time}>
            <span className="time">{m.time}</span>
            <div className="grow">
              <h4>{m.title}</h4>
              <p>{m.detail}</p>
              <span className="nums">{fmt(MEAL_TOTALS[m.quick].calories)} kcal · {fmt(MEAL_TOTALS[m.quick].protein)} g protein</span>
            </div>
          </div>
        ))}
        <p className="tip">Plan ≈ {fmt(PLAN_TOTAL.calories)} kcal · {fmt(PLAN_TOTAL.protein)} g protein, which leaves room for an extra chai, a 2nd roti or whey. Each meal is one tap in Food.</p>
      </section>

      <h2 className="section-title">Easy swaps</h2>
      <div className="swaps">{SWAPS.map(([from, to]) => <span key={from}>{from} → <b>{to}</b></span>)}</div>

      <h2 className="section-title">Training week · 7:40 PM</h2>
      <section className="card">
        {PROGRAM.map((d) => (
          <button className="plan-day" key={d.id} onClick={() => go("workout")}>
            <span className="day-badge">{d.weekdayLabel}</span>
            <div className="grow"><h4>{d.title}</h4><p>{d.muscles.join(" · ")}</p></div>
            <ChevronRight size={18} />
          </button>
        ))}
        <p className="tiny muted plan-day-note">~50 min each. Leave 1–2 reps in the tank. Hit the top of the rep range on every set, then add weight.</p>
      </section>

      <h2 className="section-title">Daily habits</h2>
      <div className="habits">{HABIT_TIPS.map((h) => <div className="habit" key={h.title}><b>{h.title}</b><span>{h.text}</span></div>)}</div>

      <h2 className="section-title">Weekly groceries</h2>
      <section className="card">
        {GROCERY.map((g) => (
          <div key={g.group} className="grocery-group">
            <span className="label">{g.group}</span>
            {g.items.map((item) => {
              const id = `${g.group}:${item}`;
              const on = checked.includes(id);
              return (
                <button key={id} className={`check-row ${on ? "on" : ""}`} onClick={() => toggle(id)} aria-pressed={on}>
                  <span className="box">{on && <Check size={14} />}</span>
                  <span className="grow">{item}</span>
                </button>
              );
            })}
          </div>
        ))}
        {checked.length > 0 && <button className="link clear-ticks" onClick={() => store([])}>Clear ticks</button>}
      </section>
    </>
  );
}
