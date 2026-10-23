import { useEffect, useRef, useState } from "react";

export type Rest = { endAt: number; total: number };

function beep(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    [0, 0.28].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + offset;
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  } catch {
    /* sound is optional */
  }
}

// Counts down from a fixed end time, so it stays correct even if the phone pauses the page.
export default function RestBar({ rest, audio, onClose, onAdd }: { rest: Rest; audio: AudioContext | null; onClose: () => void; onAdd: (s: number) => void }) {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((rest.endAt - now) / 1000));
  const done = left === 0;

  useEffect(() => {
    if (!done || fired.current) return;
    fired.current = true;
    try { navigator.vibrate?.([180, 90, 180]); } catch { /* not supported on iPhone */ }
    beep(audio);
  }, [done, audio]);
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(t);
  }, [done, onClose]);

  const pct = done ? 100 : Math.min(100, Math.max(0, (1 - (rest.endAt - now) / (rest.total * 1000)) * 100));
  return (
    <div className={`restbar ${done ? "go" : ""}`} role="timer" aria-live="polite">
      <div className="rb-time">
        <span>{done ? "Rest over" : "Rest"}</span>
        <strong>{done ? "Go!" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}</strong>
      </div>
      <p className="rb-text">{done ? "Start your next set" : "Breathe, sip water"}</p>
      {!done && <button className="rb-btn" onClick={() => onAdd(15)}>+15 s</button>}
      <button className="rb-btn" onClick={onClose}>{done ? "Close" : "Skip"}</button>
      <i className="rb-progress" style={{ width: `${pct}%` }} />
    </div>
  );
}
