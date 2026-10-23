import { useState } from "react";
import { Check, ChevronRight, Droplets, Dumbbell, Footprints, Minus, Moon, Plus, TriangleAlert } from "lucide-react";
import { TARGETS, sumMacros } from "@/lib/nutrition";
import { GOAL_MAX, GOAL_MID, GOAL_MIN, HABITS, START_WEIGHT } from "@/lib/plan";
import { GYM_WEEKDAYS, PROGRAM } from "@/lib/program";
import { detectPlateau, nextDayId, setsSummary, weekStats, workoutsThisWeek } from "@/lib/stats";
import { daysBetween, fmtDay, todayKey, weekday } from "@/lib/dates";
import type { Data, Metric, PostFn, Tab, ToastFn } from "@/lib/types";
import { Bar, fmt, fmtKg } from "./ui";

type Props = { data: Data; post: PostFn; patch: (fn: (d: Data) => Data) => void; toast: ToastFn; go: (t: Tab) => void };
type Editing = null | "steps" | "water" | "sleep";
const SLEEP_OPTIONS = [5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

function withMetric(d: Data, date: string, change: (m: Metric) => Metric): Data {
  const current = d.metrics.find((m) => m.date === date) ?? { id: -1, date, steps: 0, waterMl: 0, sleepHours: 0, sleepQuality: "Good" };
  return { ...d, metrics: [change(current), ...d.metrics.filter((m) => m.date !== date)] };
}

export default function Today({ data, post, patch, toast, go }: Props) {
  const today = todayKey();
  const [editing, setEditing] = useState<Editing>(null);
  const [stepsIn, setStepsIn] = useState("");
  const [waterIn, setWaterIn] = useState("");
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [busy, setBusy] = useState(false);

  const eaten = sumMacros(data.meals.filter((m) => m.date === today).map((m) => m.totals));
  const metric = data.metrics.find((m) => m.date === today);
  const steps = metric?.steps ?? 0;
  const water = metric?.waterMl ?? 0;
  const sleep = metric?.sleepHours ?? 0;
  const week = weekStats(data, today);
  const doneToday = data.workouts.find((w) => w.date === today);
  const next = PROGRAM.find((d) => d.id === nextDayId(data.workouts)) ?? PROGRAM[0];
  const gymDay = GYM_WEEKDAYS.includes(weekday(today));
  const thisWeek = workoutsThisWeek(data.workouts, today);
  const latest = data.checkins[0];
  const sinceCheckin = latest ? daysBetween(latest.date, today) : 99;
  const due = sinceCheckin >= 7;
  const plateau = detectPlateau(data.checkins);
  const calLeft = TARGETS.calories - eaten.calories;
  const proteinLeft = Math.max(0, TARGETS.protein - eaten.protein);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const lost = latest ? START_WEIGHT - latest.weight : 0;

  const open = (e: Editing) => {
    setEditing((cur) => (cur === e ? null : e));
    if (e === "steps") setStepsIn(steps ? String(steps) : "");
    if (e === "water") setWaterIn(water ? String(water / 1000) : "");
  };

  async function addWater(ml: number) {
    patch((d) => withMetric(d, today, (m) => ({ ...m, waterMl: Math.max(0, m.waterMl + ml) })));
    const res = await post({ action: "water", date: today, deltaMl: ml });
    if (!res) patch((d) => withMetric(d, today, (m) => ({ ...m, waterMl: Math.max(0, m.waterMl - ml) })));
  }
  async function saveMetric(body: Record<string, unknown>) {
    setBusy(true);
    const res = await post({ action: "metrics", date: today, ...body });
    setBusy(false);
    if (res) setEditing(null);
  }
  async function saveCheckin() {
    const w = Number(weight);
    const ws = Number(waist);
    if (!(w > 30 && w < 300) || !(ws > 15 && ws < 80)) { toast("Enter your weight in kg and waist in inches."); return; }
    setBusy(true);
    const res = await post({ action: "checkin", date: today, weight: w, waist: ws });
    setBusy(false);
    if (res) { setWeight(""); setWaist(""); toast("Weigh-in saved. See you next week!"); }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <div>
            <h1>{greeting}</h1>
            <p>{fmtDay(today, { weekday: "long", month: "short", day: "numeric" })}</p>
          </div>
          <button className="pill" onClick={() => go("progress")}>{week.score}% this week</button>
        </div>
        <div className="hero-stats">
          <div className={`stat ${calLeft < 0 ? "over" : ""}`}>
            <small>{calLeft < 0 ? "Over by" : "Calories left"}</small>
            <strong>{fmt(Math.abs(calLeft))}</strong>
            <Bar value={eaten.calories} max={TARGETS.calories} color={calLeft < 0 ? "#ffb48a" : "var(--lime)"} />
            <span>{fmt(eaten.calories)} / {fmt(TARGETS.calories)} kcal</span>
          </div>
          <div className="stat">
            <small>Protein</small>
            <strong>{fmt(eaten.protein)}<em> / {TARGETS.protein} g</em></strong>
            <Bar value={eaten.protein} max={TARGETS.protein} color="var(--peach)" />
            <span>{proteinLeft > 0 ? `${fmt(proteinLeft)} g to go` : "Target hit"}</span>
          </div>
        </div>
        <button className="btn lime block" onClick={() => go("food")}><Plus size={18} /> Log food</button>
      </section>

      <section className="card today-workout">
        <div className={`icon-box ${doneToday ? "done" : ""}`}>{doneToday ? <Check size={22} /> : <Dumbbell size={22} />}</div>
        <div className="grow">
          <span className="label">{doneToday ? "Workout done" : gymDay ? "Gym day" : "Rest day"}</span>
          <h3>{doneToday ? doneToday.day : gymDay ? next.title : "Walk 8,000 steps"}</h3>
          <p className="muted small">
            {doneToday
              ? `${setsSummary(doneToday).done} sets · ${thisWeek}/3 this week`
              : gymDay ? "~50 min · whole body" : `${thisWeek}/3 workouts this week · next: ${next.title}`}
          </p>
        </div>
        {!doneToday && (
          <button className={`btn sm ${gymDay ? "dark" : "ghost"}`} onClick={() => go("workout")}>
            {gymDay ? "Start" : "Train"}<ChevronRight size={16} />
          </button>
        )}
      </section>

      <div className="tiles">
        <div className="tile steps">
          <button className="tile-main" onClick={() => open("steps")}>
            <span className="tile-top"><Footprints size={15} /> Steps</span>
            <strong>{steps ? fmt(steps) : "—"}</strong>
            <Bar value={steps} max={HABITS.steps} />
            <small>of {fmt(HABITS.steps)}</small>
          </button>
          <button className="tile-action" onClick={() => open("steps")}>{steps ? "Edit" : "Add"}</button>
        </div>
        <div className="tile water">
          <button className="tile-main" onClick={() => open("water")}>
            <span className="tile-top"><Droplets size={15} /> Water</span>
            <strong>{(water / 1000).toFixed(1)}<em>L</em></strong>
            <Bar value={water} max={HABITS.waterMl} color="var(--water)" />
            <small>of {HABITS.waterMl / 1000} L</small>
          </button>
          <button className="tile-action" onClick={() => void addWater(250)}><Plus size={14} /> 250 ml</button>
        </div>
        <div className="tile sleep">
          <button className="tile-main" onClick={() => open("sleep")}>
            <span className="tile-top"><Moon size={15} /> Sleep</span>
            <strong>{sleep ? fmtKg(sleep) : "—"}{sleep ? <em>h</em> : null}</strong>
            <Bar value={sleep} max={8} color="var(--sleep)" />
            <small>goal 7–8 h</small>
          </button>
          <button className="tile-action" onClick={() => open("sleep")}>{sleep ? "Edit" : "Add"}</button>
        </div>
      </div>

      {editing === "steps" && (
        <div className="editor">
          <p className="small muted">Today’s total steps (from your phone’s health app)</p>
          <div className="inline-form">
            <input className="input" inputMode="numeric" autoFocus placeholder="e.g. 6500" value={stepsIn} onChange={(e) => setStepsIn(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => { if (e.key === "Enter" && stepsIn) void saveMetric({ steps: Number(stepsIn) }); }} />
            <button className="btn dark" disabled={busy || !stepsIn} onClick={() => void saveMetric({ steps: Number(stepsIn) })}>Save</button>
          </div>
        </div>
      )}
      {editing === "water" && (
        <div className="editor">
          <p className="small muted">Fix today’s total (litres)</p>
          <div className="inline-form">
            <button className="btn ghost" aria-label="Remove 250 ml" disabled={water <= 0} onClick={() => { void addWater(-250); setEditing(null); }}><Minus size={16} /> 250</button>
            <input className="input" inputMode="decimal" placeholder="e.g. 2.5" value={waterIn} onChange={(e) => setWaterIn(e.target.value.replace(/[^0-9.]/g, "").slice(0, 4))} />
            <button className="btn dark" disabled={busy || !waterIn} onClick={() => void saveMetric({ waterMl: Math.round(Number(waterIn) * 1000) })}>Save</button>
          </div>
        </div>
      )}
      {editing === "sleep" && (
        <div className="editor">
          <p className="small muted">How many hours did you sleep last night?</p>
          <div className="chips">
            {SLEEP_OPTIONS.map((h) => (
              <button key={h} className={`chip ${sleep === h ? "on" : ""}`} disabled={busy} onClick={() => void saveMetric({ sleepHours: h })}>{h} h</button>
            ))}
          </div>
        </div>
      )}

      {due ? (
        <section className="card">
          <div className="card-head"><h3>Weekly weigh-in</h3><span className="tag">Due</span></div>
          <p className="muted small">Morning, after the toilet, before breakfast. Waist at belly-button level.</p>
          <div className="fields">
            <label className="field">Weight (kg)<input className="input" inputMode="decimal" placeholder={latest ? String(latest.weight) : "87.0"} value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, "").slice(0, 5))} /></label>
            <label className="field">Waist (in)<input className="input" inputMode="decimal" placeholder={latest ? String(latest.waist) : "34"} value={waist} onChange={(e) => setWaist(e.target.value.replace(/[^0-9.]/g, "").slice(0, 4))} /></label>
          </div>
          <button className="btn dark block" disabled={busy || !weight || !waist} onClick={() => void saveCheckin()}>Save weigh-in</button>
        </section>
      ) : latest ? (
        <section className="card">
          <div className="row">
            <span className="label">Weight</span>
            <button className="link" onClick={() => go("progress")}>Progress <ChevronRight size={14} /></button>
          </div>
          <div className="weight-now">
            <strong>{latest.weight.toFixed(1)}<small> kg</small></strong>
            <span className={`delta ${lost < 0 ? "up" : ""}`}>{lost >= 0 ? "−" : "+"}{fmtKg(Math.abs(lost))} kg so far</span>
          </div>
          <Bar value={Math.max(0, lost)} max={START_WEIGHT - GOAL_MID} />
          <div className="scale-labels"><span>Start {START_WEIGHT} kg</span><span>Goal {GOAL_MIN}–{GOAL_MAX} kg</span></div>
          <p className="muted tiny">Next weigh-in in {7 - sinceCheckin} day{7 - sinceCheckin === 1 ? "" : "s"}</p>
        </section>
      ) : null}

      {plateau && (
        <div className="alert">
          <TriangleAlert size={18} />
          <div>
            <strong>No change for 2 weeks</strong>
            Pick one: eat ~150 kcal less a day (about 1 roti) or add 2,000 steps a day. Check again in 2 weeks.
          </div>
        </div>
      )}
    </>
  );
}
