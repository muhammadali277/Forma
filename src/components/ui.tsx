import type { ReactNode } from "react";

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmtKg = (n: number) => String(Math.round(n * 100) / 100);

export function fmtQty(q: number) {
  const whole = Math.floor(q + 1e-9);
  const frac = q - whole;
  if (frac < 0.02) return String(whole);
  const glyph = ([[0.25, "¼"], [0.5, "½"], [0.75, "¾"], [1 / 3, "⅓"], [2 / 3, "⅔"]] as const).find(([v]) => Math.abs(frac - v) < 0.02);
  return glyph ? `${whole || ""}${glyph[1]}` : String(Math.round(q * 100) / 100);
}

export function Bar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return <div className="bar"><i style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }} /></div>;
}

export function Ring({ pct, size = 112, color = "var(--lime-strong)", children }: { pct: number; size?: number; color?: string; children: ReactNode }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="ring" style={{ width: size, height: size, background: `conic-gradient(${color} ${p}%, #edf0ea 0)` }}>
      <div>{children}</div>
    </div>
  );
}
