import { useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Mic, Plus, Trash2 } from "lucide-react";
import { TARGETS, parseMeal, sumMacros } from "@/lib/nutrition";
import { QUICK_ADDS } from "@/lib/plan";
import { addDays, fmtDay, todayKey } from "@/lib/dates";
import type { Data, Meal, PostFn, ToastFn } from "@/lib/types";
import { Bar, fmt, fmtQty } from "./ui";

type Props = { data: Data; post: PostFn; toast: ToastFn };
type SpeechEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type Recognizer = { lang: string; interimResults: boolean; onresult: ((e: SpeechEvent) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void };
type RecognizerCtor = new () => Recognizer;

const QUICK_TOTALS = Object.fromEntries(QUICK_ADDS.map((q) => [q.id, parseMeal(q.text).totals]));

export default function Food({ data, post, toast }: Props) {
  const today = todayKey();
  const [date, setDate] = useState(today);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const recognizer = useRef<Recognizer | null>(null);
  const preview = useMemo(() => parseMeal(text), [text]);

  const meals = data.meals.filter((m) => m.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const totals = sumMacros(meals.map((m) => m.totals));
  const logged = new Set(meals.map((m) => m.mealType));
  const gap = Math.max(0, TARGETS.protein - totals.protein);
  const idea = gap >= 40 ? "150 g grilled chicken (≈46 g)" : gap >= 20 ? "1 scoop whey (≈24 g) or 2 eggs + dahi" : "1 cup dahi (≈9 g) or 2 eggs (≈12 g)";
  const dayLabel = date === today ? "Today" : date === addDays(today, -1) ? "Yesterday" : fmtDay(date);

  async function add(description: string, mealType: string) {
    setSaving(true);
    const res = await post({ action: "meal", date, description, mealType });
    setSaving(false);
    if (!res) return false;
    const id = Number(res.id);
    const t = (res.parsed as { totals?: { calories: number; protein: number } } | undefined)?.totals;
    toast(`${mealType === "Meal" ? "Meal" : mealType} added${t ? ` · ${fmt(t.calories)} kcal · ${fmt(t.protein)} g protein` : ""}`, {
      label: "Undo",
      run: () => void post({ action: "deleteMeal", id }),
    });
    return true;
  }

  async function remove(meal: Meal) {
    const res = await post({ action: "deleteMeal", id: meal.id });
    if (res) toast("Entry deleted", { label: "Undo", run: () => void post({ action: "meal", date: meal.date, description: meal.description, mealType: meal.mealType }) });
  }

  function voice() {
    if (listening) { recognizer.current?.stop(); return; }
    const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { toast("Voice isn’t supported here — use the mic on your keyboard instead."); return; }
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript ?? "";
      if (said) setText((t) => (t.trim() ? `${t.trim()}, ${said}` : said));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); toast("Couldn’t hear you. Try again or type it."); };
    recognizer.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <>
      <div className="day-switch">
        <button aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><ChevronLeft size={20} /></button>
        <span>{dayLabel}</span>
        <button aria-label="Next day" disabled={date >= today} onClick={() => setDate(addDays(date, 1))}><ChevronRight size={20} /></button>
      </div>

      <section className="card">
        <div className="macro">
          <div className="macro-line"><span>Calories</span><b>{fmt(totals.calories)} <small>/ {fmt(TARGETS.calories)}</small></b></div>
          <Bar value={totals.calories} max={TARGETS.calories} color={totals.calories > TARGETS.calories ? "var(--peach)" : undefined} />
        </div>
        <div className="macro">
          <div className="macro-line"><span>Protein</span><b>{fmt(totals.protein)} <small>/ {TARGETS.protein} g</small></b></div>
          <Bar value={totals.protein} max={TARGETS.protein} color="var(--peach)" />
        </div>
        <p className="tiny muted macro-minor">Carbs {fmt(totals.carbs)} g · Fat {fmt(totals.fat)} g · Fibre {fmt(totals.fiber)} g</p>
        {date === today && meals.length > 0 && gap > 0 && <p className="tip">{fmt(gap)} g protein to go — try {idea}.</p>}
      </section>

      <h2 className="section-title">Quick add · one tap</h2>
      <div className="quick">
        {QUICK_ADDS.map((q) => {
          const t = QUICK_TOTALS[q.id];
          const done = q.plan && logged.has(q.label);
          return (
            <button key={q.id} className={q.plan ? "plan" : ""} disabled={saving} onClick={() => void add(q.text, q.label)}>
              <span className="grow"><b>{q.label}</b><small>{fmt(t.calories)} kcal · {fmt(t.protein)} g P</small></span>
              <span className={`plus ${done ? "done" : ""}`}>{done ? <Check size={16} /> : <Plus size={16} />}</span>
            </button>
          );
        })}
      </div>

      <h2 className="section-title">Something else?</h2>
      <section className="card">
        <div className="composer">
          <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or speak, e.g. “2 roti, chicken salan, 1 cup chai”" />
          <button className={`mic ${listening ? "on" : ""}`} onClick={voice} aria-label={listening ? "Stop listening" : "Speak your meal"}><Mic size={18} /></button>
        </div>
        {text.trim() && (preview.foods.length ? (
          <div className="preview">
            <div className="parsed">
              {preview.foods.map((f, i) => <span key={i}><b>{fmtQty(f.quantity)}×</b> {f.name} · {fmt(f.totals.calories)}</span>)}
            </div>
            <div className="estimate">
              <p><strong>{fmt(preview.totals.calories)} kcal</strong> <span className="muted small">· {fmt(preview.totals.protein)} g protein</span></p>
              <button className="btn dark sm" disabled={saving} onClick={async () => { if (await add(text, "Meal")) setText(""); }}>Add</button>
            </div>
          </div>
        ) : (
          <p className="small muted preview">No food recognised yet. Try “2 roti”, “chicken salan” or “1 cup chai”.</p>
        ))}
      </section>

      <h2 className="section-title">{date === today ? "Eaten today" : `Eaten · ${dayLabel}`}</h2>
      <section className="card">
        {meals.length ? (
          <div className="list">
            {meals.map((m) => (
              <div className="list-row" key={m.id}>
                <div className="grow">
                  <p>{m.mealType !== "Meal" && <b>{m.mealType} · </b>}{m.description}</p>
                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {fmt(m.totals.protein)} g protein</span>
                </div>
                <span className="kcal">{fmt(m.totals.calories)}</span>
                <button className="del" aria-label="Delete entry" onClick={() => void remove(m)}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">Nothing logged yet. Tap a quick add above.</p>
        )}
      </section>
      <p className="tiny faint center">Estimates for home-style portions. Oil and portion size change totals.</p>
    </>
  );
}
