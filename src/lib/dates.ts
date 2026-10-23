// Dates are local calendar days as "YYYY-MM-DD" strings (the phone's own timezone).
export const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayKey = () => toKey(new Date());
const noon = (key: string) => new Date(`${key}T12:00:00`);
export const addDays = (key: string, n: number) => { const d = noon(key); d.setDate(d.getDate() + n); return toKey(d); };
export const daysBetween = (from: string, to: string) => Math.round((noon(to).getTime() - noon(from).getTime()) / 86400000);
export const weekday = (key: string) => noon(key).getDay(); // 0 = Sunday
export const fmtDay = (key: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) =>
  noon(key).toLocaleDateString("en-US", opts);
