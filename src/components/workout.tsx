import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Check, ChevronDown, Flame, Trash2 } from "lucide-react";
import { PROGRAM, WARMUP, type DayId, type Exercise } from "@/lib/program";
import { nextDayId, setsSummary, sortWorkouts } from "@/lib/stats";
import { fmtDay, todayKey } from "@/lib/dates";
import type { Data, PostFn, ToastFn, Workout as WorkoutLog } from "@/lib/types";
import { Bar, fmtKg } from "./ui";

type Props = { data: Data; post: PostFn; toast: ToastFn; startRest: (seconds: number) => void };
type Entry = { name: string; weight: string; done: number };
type Session = { date: string; dayId: DayId; entries: Record<string, Entry> };
type Last = { weight: string; done: number; sets: number };

const STORE = "forma.session.v2";

function loadSession(today: string): Session | null {
  try {
    const s = JSON.parse(window.localStorage.getItem(STORE) ?? "null") as Session | null;
    return s && s.date === today && s.entries && PROGRAM.some((d) => d.id === s.dayId) ? s : null;
  } catch {
    return null;
  }
}

/** Most recent time this exact exercise was logged (for "Last: 20 kg" and the next-weight hint). */
function lastFor(sorted: WorkoutLog[], name: string): Last | null {
  for (const w of sorted) {
    for (const e of w.exercises) {
      if (e.name === name && (e.weight || (e.setsDone ?? 0) > 0 || e.completed)) {
        return { weight: e.weight, done: e.setsDone ?? (e.completed ? e.sets : 0), sets: e.sets };
      }
    }
  }
  return null;
}

/** Remembers your swap: uses whichever option you did last time for this slot. */
function variantFor(sorted: WorkoutLog[], ex: Exercise): string {
  const options = [ex.name, ...ex.alts.map((a) => a.name)];
  for (const w of sorted) {
    const e = w.exercises.find((x) => x.slot === ex.id);
    if (e && options.includes(e.name)) return e.name;
  }
  return ex.name;
}

function hint(ex: Exercise, last: Last | null): { text: string; up: boolean } | null {
  if (!last) return null;
  const w = parseFloat(last.weight);
  const allSets = last.done >= last.sets;
  if (!Number.isFinite(w) || w <= 0) return allSets ? { text: "Beat it: +1–2 reps", up: true } : { text: "Match last time", up: false };
  return allSets && ex.step > 0 ? { text: `Try ${fmtKg(w + ex.step)} kg`, up: true } : { text: `Repeat ${fmtKg(w)} kg`, up: false };
}

export default function Workout({ data, post, toast, startRest }: Props) {
  const today = todayKey();
  const sorted = useMemo(() => sortWorkouts(data.workouts), [data.workouts]);
  const [session, setSession] = useState<Session>(() => {
    const stored = loadSession(today);
    if (stored) return stored;
    // Already trained today (maybe on another device)? Open that session; otherwise the next one in the rotation.
    const doneId = sortWorkouts(data.workouts).find((w) => w.date === today)?.day.match(/([ABC])\s*$/)?.[1] as DayId | undefined;
    return { date: today, dayId: doneId ?? nextDayId(data.workouts), entries: {} };
  });
  const [swap, setSwap] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const day = PROGRAM.find((d) => d.id === session.dayId) ?? PROGRAM[0];
  const savedToday = sorted.find((w) => w.date === today && w.day === day.title);
  const anySavedToday = sorted.some((w) => w.date === today);
  const suggested = nextDayId(data.workouts);

  useEffect(() => {
    try { window.localStorage.setItem(STORE, JSON.stringify(session)); } catch { /* storage full or blocked */ }
  }, [session]);

  // Keep the screen on while this tab is open (supported on most phones; silently ignored elsewhere).
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    const wakeLock = (navigator as unknown as { wakeLock?: { request: (type: "screen") => Promise<Sentinel> } }).wakeLock;
    if (!wakeLock) return;
    let sentinel: Sentinel | null = null;
    let active = true;
    const lock = async () => {
      try {
        const s = await wakeLock.request("screen");
        if (active) sentinel = s; else void s.release();
      } catch { /* e.g. battery saver */ }
    };
    const onVisible = () => { if (document.visibilityState === "visible") void lock(); };
    void lock();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, []);

  const keyOf = (slot: string) => `${day.id}:${slot}`;
  const defaults = (ex: Exercise): Entry => {
    const saved = savedToday?.exercises.find((e) => e.slot === ex.id);
    if (saved) return { name: saved.name, weight: saved.weight, done: saved.setsDone ?? 0 };
    const name = variantFor(sorted, ex);
    return { name, weight: lastFor(sorted, name)?.weight ?? "", done: 0 };
  };
  const entry = (ex: Exercise): Entry => session.entries[keyOf(ex.id)] ?? defaults(ex);
  const update = (ex: Exercise, change: Partial<Entry>) =>
    setSession((s) => {
      const k = `${day.id}:${ex.id}`;
      const current = s.entries[k] ?? defaults(ex);
      return { ...s, entries: { ...s.entries, [k]: { ...current, ...change } } };
    });

  const finKey = keyOf("finisher");
  const finSaved = savedToday?.exercises.find((e) => e.slot === `${day.id.toLowerCase()}-fin`);
  const finisherDone = (session.entries[finKey]?.done ?? finSaved?.setsDone ?? 0) > 0;
  const totalSets = day.exercises.reduce((n, ex) => n + ex.sets, 0) + 1;
  const doneSets = day.exercises.reduce((n, ex) => n + Math.min(entry(ex).done, ex.sets), 0) + (finisherDone ? 1 : 0);

  function tapSet(ex: Exercise, index: number, isLastExercise: boolean) {
    const current = entry(ex);
    const done = current.done === index + 1 ? index : index + 1; // tap the last ticked set again to undo it
    update(ex, { done });
    if (done > current.done && !ex.superset && !(isLastExercise && done >= ex.sets)) startRest(ex.rest);
  }

  function choose(ex: Exercise, name: string) {
    update(ex, { name, weight: lastFor(sorted, name)?.weight ?? "" });
    setSwap(null);
  }

  function toggleFinisher() {
    setSession((s) => ({ ...s, entries: { ...s.entries, [finKey]: { name: day.finisher.name, weight: "", done: finisherDone ? 0 : 1 } } }));
  }

  async function finish() {
    if (doneSets === 0) { toast("Tick at least one set first."); return; }
    setSaving(true);
    const exercises = day.exercises.map((ex) => {
      const e = entry(ex);
      return { slot: ex.id, name: e.name, muscle: ex.muscle, sets: ex.sets, reps: ex.reps, weight: e.weight.trim(), setsDone: Math.min(e.done, ex.sets) };
    });
    exercises.push({ slot: `${day.id.toLowerCase()}-fin`, name: day.finisher.name, muscle: "Conditioning", sets: 1, reps: day.finisher.detail, weight: "", setsDone: finisherDone ? 1 : 0 });
    const res = await post({ action: "workout", date: today, day: day.title, exercises });
    setSaving(false);
    if (res) {
      setSession((s) => ({ ...s, entries: Object.fromEntries(Object.entries(s.entries).filter(([k]) => !k.startsWith(`${day.id}:`))) }));
      toast(`Workout saved 💪 ${doneSets}/${totalSets} sets`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function remove(w: WorkoutLog) {
    if (!window.confirm(`Delete ${w.day} from ${fmtDay(w.date)}?`)) return;
    if (await post({ action: "deleteWorkout", id: w.id })) toast("Workout deleted");
  }

  return (
    <>
      <div className="seg" role="tablist" aria-label="Workout day">
        {PROGRAM.map((d) => (
          <button key={d.id} role="tab" aria-selected={d.id === day.id} className={d.id === day.id ? "on" : ""} onClick={() => { setSession((s) => ({ ...s, dayId: d.id })); setSwap(null); }}>
            <b>Day {d.id}</b>
            <small>{d.weekdayLabel}</small>
            {d.id === suggested && !anySavedToday && <i className="dot" aria-label="Up next" />}
          </button>
        ))}
      </div>

      {savedToday && <div className="banner"><Check size={18} /> Saved today. Tick more sets and tap update if you do more.</div>}

      <section className="card session-head">
        <span className="label">{day.focus}</span>
        <h2>{day.title}</h2>
        <div className="muscles">{day.muscles.map((mu) => <span key={mu}>{mu}</span>)}</div>
        <div className="progress-line"><Bar value={doneSets} max={totalSets} /><span>{doneSets}/{totalSets} sets</span></div>
      </section>

      <div className="warmup"><Flame size={17} /><p><b>Warm-up · 5 min.</b> {WARMUP}</p></div>

      {day.exercises.map((ex, idx) => {
        const e = entry(ex);
        const last = lastFor(sorted, e.name);
        const h = hint(ex, last);
        const complete = e.done >= ex.sets;
        const options = [{ name: ex.name, note: `${ex.note} · main` }, ...ex.alts];
        return (
          <section key={ex.id} className={`ex ${complete ? "complete" : ""}`}>
            <div className="ex-head">
              <span className="ex-num">{complete ? <Check size={15} /> : idx + 1}</span>
              <div className="grow">
                <h4>{e.name}</h4>
                <div className="ex-meta">
                  <span>{ex.muscle}</span>
                  <b>{ex.sets} × {ex.reps}</b>
                  {ex.superset ? <span className="superset">Superset: go to next, no rest</span> : <span>rest {ex.rest}s</span>}
                </div>
              </div>
              <button className={`swap-btn ${e.name !== ex.name ? "on" : ""}`} onClick={() => setSwap(swap === ex.id ? null : ex.id)} aria-expanded={swap === ex.id}>
                <ArrowLeftRight size={14} /> Swap
              </button>
            </div>

            {swap === ex.id && (
              <div className="swap-list">
                <p className="tiny muted">Machine busy? Any of these trains the same muscles.</p>
                {options.map((o) => (
                  <button key={o.name} className={o.name === e.name ? "on" : ""} onClick={() => choose(ex, o.name)}>
                    <span>{o.name}</span><small>{o.note}</small>
                  </button>
                ))}
              </div>
            )}

            <div className="ex-log">
              <label className="kg">
                <input inputMode="decimal" placeholder={ex.bodyweight ? "BW" : "0"} value={e.weight} aria-label={`${e.name} weight in kg`}
                  onChange={(ev) => update(ex, { weight: ev.target.value.replace(/[^0-9.]/g, "").slice(0, 6) })} />
                <span>kg</span>
              </label>
              <p className="last">
                {last ? (
                  <>
                    Last: {last.weight ? `${last.weight} kg` : "bodyweight"} · {Math.min(last.done, last.sets)}/{last.sets} sets
                    {h && <><br /><b className={h.up ? "up" : ""}>{h.up ? "↑ " : ""}{h.text}</b></>}
                  </>
                ) : (
                  <>First time: choose a weight you can lift {ex.reps} times with 1–2 reps to spare.</>
                )}
              </p>
            </div>

            <div className="sets">
              {Array.from({ length: ex.sets }, (_, i) => (
                <button key={i} className={`set ${i < e.done ? "done" : ""}`} aria-label={`Set ${i + 1}${i < e.done ? " done" : ""}`} onClick={() => tapSet(ex, i, idx === day.exercises.length - 1)}>
                  {i < e.done ? <Check size={18} /> : i + 1}
                </button>
              ))}
              <span className="sets-hint">{e.done === 0 ? "Tap after each set" : complete ? "Done" : `${ex.sets - e.done} to go`}</span>
            </div>
          </section>
        );
      })}

      <section className={`ex ${finisherDone ? "complete" : ""}`}>
        <div className="ex-head">
          <span className="ex-num">{finisherDone ? <Check size={15} /> : <Flame size={15} />}</span>
          <div className="grow">
            <h4>Finisher · {day.finisher.name}</h4>
            <div className="ex-meta"><span>{day.finisher.detail}</span></div>
          </div>
          <button className={`set ${finisherDone ? "done" : ""}`} onClick={toggleFinisher} aria-label="Finisher done"><Check size={18} /></button>
        </div>
      </section>

      <button className="btn dark block big" disabled={saving} onClick={() => void finish()}>
        {saving ? "Saving…" : savedToday ? "Update today’s workout" : "Finish & save workout"}
      </button>
      <p className="tiny muted center">Every week hits chest, back, shoulders, arms, legs, calves and core, with extra shoulder and back work for the V-taper. Stop each set with 1–2 reps left.</p>

      <section className="card">
        <button className="row history-toggle" onClick={() => setShowHistory((v) => !v)} aria-expanded={showHistory}>
          <h3>Recent workouts</h3>
          <ChevronDown size={18} className={showHistory ? "flip" : ""} />
        </button>
        {showHistory && (sorted.length ? (
          <div className="list history">
            {sorted.slice(0, 8).map((w) => {
              const s = setsSummary(w);
              return (
                <div className="list-row" key={w.id}>
                  <div className="grow"><p>{w.day}</p><span>{fmtDay(w.date)} · {s.done}/{s.total} sets</span></div>
                  <button className="del" aria-label="Delete workout" onClick={() => void remove(w)}><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        ) : <p className="empty">Finished workouts show up here.</p>)}
      </section>
    </>
  );
}
