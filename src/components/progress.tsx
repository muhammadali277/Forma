import { useRef, useState } from "react";
import { Camera, CheckCircle2, Info, Plus, Printer, Trash2, TriangleAlert } from "lucide-react";
import { GOAL_MAX, GOAL_MID, GOAL_MIN, START_WAIST, START_WEIGHT } from "@/lib/plan";
import { detectPlateau, weekStats } from "@/lib/stats";
import { daysBetween, fmtDay, todayKey } from "@/lib/dates";
import type { Checkin, Data, PostFn, ToastFn } from "@/lib/types";
import { Bar, Ring, fmtKg } from "./ui";

type Props = { data: Data; post: PostFn; toast: ToastFn };
type Photos = { front?: string; side?: string; back?: string };
const VIEWS = ["front", "side", "back"] as const;

// Phone photos are often 3–8 MB; shrink to max 1280 px JPEG (~150–400 KB) before upload.
function shrinkPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("no canvas")); return; }
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let quality = 0.82;
      let out = canvas.toDataURL("image/jpeg", quality);
      while (out.length > 900_000 && quality > 0.4) { quality -= 0.15; out = canvas.toDataURL("image/jpeg", quality); }
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable")); };
    img.src = url;
  });
}

function Trend({ points }: { points: Checkin[] }) {
  if (points.length < 2) return <p className="tiny muted trend-empty">Your trend line appears after 2 weigh-ins.</p>;
  const W = 320, H = 96, pad = 10;
  const ws = points.map((p) => p.weight);
  const lo = Math.min(...ws) - 0.6, hi = Math.max(...ws) + 0.6;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (points.length - 1);
  const y = (w: number) => pad + ((hi - w) * (H - pad * 2)) / (hi - lo);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.weight).toFixed(1)}`).join(" ");
  return (
    <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weight trend">
      <path d={`${d} L${x(points.length - 1).toFixed(1)},${H} L${pad},${H} Z`} fill="var(--lime-soft)" />
      <path d={d} fill="none" stroke="var(--lime-strong)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={p.id} cx={x(i)} cy={y(p.weight)} r="3.5" fill="#fff" stroke="var(--lime-strong)" strokeWidth="2" />)}
    </svg>
  );
}

export default function Progress({ data, post, toast }: Props) {
  const today = todayKey();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [photos, setPhotos] = useState<Photos>({});
  const [saving, setSaving] = useState(false);
  const files = useRef<Record<string, HTMLInputElement | null>>({});

  const asc = [...data.checkins].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  const latest = asc[asc.length - 1];
  const prev = asc[asc.length - 2];
  const due = !latest || daysBetween(latest.date, today) >= 7;
  const week = weekStats(data, today);
  const plateau = detectPlateau(data.checkins);
  const current = latest?.weight ?? START_WEIGHT;
  const lost = START_WEIGHT - current;
  const weekly = latest && prev ? latest.weight - prev.weight : null;
  const waistNow = latest?.waist ?? START_WAIST;
  const waistDown = START_WAIST - waistNow;
  const firstFront = asc.find((c) => c.photoKeys.includes("front"));
  const lastFront = [...asc].reverse().find((c) => c.photoKeys.includes("front"));

  const status = plateau
    ? { tone: "alert", icon: <TriangleAlert size={18} />, title: "Plateau: 2 weeks without change", text: "Pick one: eat ~150 kcal less a day (about 1 roti) or add 2,000 steps a day. Keep protein at 130 g. Check again in 2 weeks." }
    : asc.length < 3
      ? { tone: "alert info", icon: <Info size={18} />, title: "Plateau check", text: "Starts after 3 weekly weigh-ins. Weigh in on the same day each week." }
      : prev && Math.abs(latest.weight - prev.weight) < 0.2 && latest.waist < prev.waist - 0.2
        ? { tone: "alert good", icon: <CheckCircle2 size={18} />, title: "Waist down, weight steady", text: "That’s fat loss while keeping muscle. Keep going." }
        : { tone: "alert good", icon: <CheckCircle2 size={18} />, title: "On track", text: "Your numbers are still moving. No changes needed." };

  async function pick(view: (typeof VIEWS)[number], file?: File) {
    if (!file) return;
    try { const url = await shrinkPhoto(file); setPhotos((p) => ({ ...p, [view]: url })); }
    catch { toast("Couldn’t read that photo. Try a JPG or PNG."); }
  }

  async function save() {
    const w = Number(weight), ws = Number(waist);
    if (!(w > 30 && w < 300) || !(ws > 15 && ws < 80)) { toast("Enter your weight in kg and waist in inches."); return; }
    setSaving(true);
    const res = await post({ action: "checkin", date: today, weight: w, waist: ws, photos });
    setSaving(false);
    if (res) { setWeight(""); setWaist(""); setPhotos({}); setOpen(false); toast("Check-in saved"); }
  }

  async function remove(c: Checkin) {
    if (!window.confirm(`Delete the check-in from ${fmtDay(c.date)}?`)) return;
    if (await post({ action: "deleteCheckin", id: c.id })) toast("Check-in deleted");
  }

  return (
    <>
      <section className="card">
        <div className="row">
          <span className="label">Current weight</span>
          {weekly !== null && <span className={`delta ${weekly > 0 ? "up" : ""}`}>{weekly > 0 ? "+" : "−"}{fmtKg(Math.abs(weekly))} kg this week</span>}
        </div>
        <div className="weight-now"><strong>{current.toFixed(1)}<small> kg</small></strong></div>
        <Bar value={Math.max(0, lost)} max={START_WEIGHT - GOAL_MID} />
        <div className="scale-labels">
          <span>Start {START_WEIGHT}</span>
          <b>{lost > 0 ? `−${fmtKg(lost)} kg so far` : "Your journey starts now"}</b>
          <span>Goal {GOAL_MIN}–{GOAL_MAX}</span>
        </div>
        <Trend points={asc.slice(-12)} />
        <div className="mini-stats">
          <div><small>Waist</small><b>{waistNow.toFixed(1)} in</b></div>
          <div><small>Waist change</small><b>{waistDown > 0 ? `−${fmtKg(waistDown)}` : waistDown < 0 ? `+${fmtKg(-waistDown)}` : "0"} in</b></div>
          <div><small>To goal</small><b>{fmtKg(Math.max(0, current - GOAL_MAX))} kg</b></div>
        </div>
      </section>

      {due || open ? (
        <section className="card no-print">
          <div className="card-head"><h3>{due ? "Weekly check-in is due" : "New check-in"}</h3>{due && <span className="tag">Due</span>}</div>
          <div className="fields">
            <label className="field">Weight (kg)<input className="input" inputMode="decimal" placeholder={latest ? String(latest.weight) : "87.0"} value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, "").slice(0, 5))} /></label>
            <label className="field">Waist (in)<input className="input" inputMode="decimal" placeholder={latest ? String(latest.waist) : "34"} value={waist} onChange={(e) => setWaist(e.target.value.replace(/[^0-9.]/g, "").slice(0, 4))} /></label>
          </div>
          <p className="field-note">Photos (optional) show belly-fat changes the scale misses</p>
          <div className="photos">
            {VIEWS.map((v) => (
              <button key={v} className="photo-btn" onClick={() => files.current[v]?.click()}>
                {photos[v] ? <img src={photos[v]} alt={`${v} preview`} /> : <Camera size={20} />}
                <span>{v}</span>
                <input ref={(el) => { files.current[v] = el; }} type="file" accept="image/*" hidden onChange={(e) => void pick(v, e.target.files?.[0])} />
              </button>
            ))}
          </div>
          <button className="btn dark block" disabled={saving || !weight || !waist} onClick={() => void save()}>{saving ? "Saving…" : "Save check-in"}</button>
        </section>
      ) : (
        <button className="btn ghost block no-print" onClick={() => setOpen(true)}><Plus size={17} /> New check-in</button>
      )}

      <div className={status.tone}>{status.icon}<div><strong>{status.title}</strong>{status.text}</div></div>

      <section className="card">
        <div className="card-head"><h3>Consistency</h3><span className="tiny muted">last 7 days</span></div>
        <div className="score">
          <Ring pct={week.score} size={108}><strong>{week.score}%</strong></Ring>
          <div className="score-rows">
            <div><span>Food logged</span><b>{week.loggedDays}/7 days</b></div>
            <div><span>Workouts</span><b>{week.workouts}/3</b></div>
            <div><span>7,000+ steps</span><b>{week.stepDays}/7 days</b></div>
            <div><span>7 h+ sleep</span><b>{week.sleepDays}/7 nights</b></div>
          </div>
        </div>
      </section>

      {firstFront && lastFront && firstFront.id !== lastFront.id ? (
        <section className="card">
          <div className="card-head"><h3>Then vs now</h3></div>
          <div className="compare">
            <figure><img src={`/api/photos/${firstFront.id}/front`} alt="First front photo" loading="lazy" /><figcaption>{fmtDay(firstFront.date)} · {firstFront.weight.toFixed(1)} kg</figcaption></figure>
            <figure><img src={`/api/photos/${lastFront.id}/front`} alt="Latest front photo" loading="lazy" /><figcaption>{fmtDay(lastFront.date)} · {lastFront.weight.toFixed(1)} kg</figcaption></figure>
          </div>
        </section>
      ) : latest && latest.photoKeys.length > 0 ? (
        <section className="card">
          <div className="card-head"><h3>Latest photos</h3><span className="tiny muted">{fmtDay(latest.date)}</span></div>
          <div className="compare three">
            {latest.photoKeys.map((k) => <figure key={k}><img src={`/api/photos/${latest.id}/${k}`} alt={`${k} photo`} loading="lazy" /><figcaption>{k}</figcaption></figure>)}
          </div>
        </section>
      ) : null}

      {asc.length > 0 && (
        <section className="card">
          <div className="card-head"><h3>History</h3></div>
          <div className="list">
            {[...asc].reverse().map((c) => (
              <div className="list-row" key={c.id}>
                <div className="grow"><p>{c.weight.toFixed(1)} kg · {c.waist.toFixed(1)} in</p><span>{fmtDay(c.date)}{c.photoKeys.length ? ` · ${c.photoKeys.length} photo${c.photoKeys.length > 1 ? "s" : ""}` : ""}</span></div>
                <button className="del no-print" aria-label="Delete check-in" onClick={() => void remove(c)}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      <button className="btn ghost block no-print" onClick={() => window.print()}><Printer size={16} /> Print weekly report</button>
    </>
  );
}
