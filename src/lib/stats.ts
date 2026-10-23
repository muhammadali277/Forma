import type { Checkin, Data, Workout } from "./types";
import type { DayId } from "./program";
import { addDays, daysBetween, weekday } from "./dates";

export function sortWorkouts(list: Workout[]): Workout[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function setsSummary(w: Workout) {
  let done = 0;
  let total = 0;
  for (const e of w.exercises) {
    total += e.sets;
    done += Math.min(e.sets, e.setsDone ?? (e.completed ? e.sets : 0));
  }
  return { done, total };
}

/** Consistency over the last 7 days: food logging 35%, workouts 30%, 7k+ steps 20%, 7h+ sleep 15%. */
export function weekStats(data: Data, today: string) {
  const from = addDays(today, -6);
  const inWeek = (d: string) => d >= from && d <= today;
  const loggedDays = new Set(data.meals.filter((m) => inWeek(m.date)).map((m) => m.date)).size;
  const workouts = new Set(data.workouts.filter((w) => inWeek(w.date)).map((w) => w.date)).size;
  const metrics = data.metrics.filter((m) => inWeek(m.date));
  const stepDays = metrics.filter((m) => m.steps >= 7000).length;
  const sleepDays = metrics.filter((m) => m.sleepHours >= 7).length;
  const score = Math.round(
    (Math.min(loggedDays / 7, 1) * 0.35 + Math.min(workouts / 3, 1) * 0.3 + Math.min(stepDays / 7, 1) * 0.2 + Math.min(sleepDays / 7, 1) * 0.15) * 100,
  );
  return { score, loggedDays, workouts, stepDays, sleepDays };
}

/** Workouts since Monday of this week. */
export function workoutsThisWeek(list: Workout[], today: string) {
  const monday = addDays(today, -((weekday(today) + 6) % 7));
  return new Set(list.filter((w) => w.date >= monday && w.date <= today).map((w) => w.date)).size;
}

/** Next session in the A → B → C rotation, so a missed day never breaks the plan. */
export function nextDayId(list: Workout[]): DayId {
  const last = sortWorkouts(list)[0];
  const id = last?.day.match(/([ABC])\s*$/)?.[1];
  return id === "A" ? "B" : id === "B" ? "C" : "A";
}

/** True when the last 3 weekly check-ins (≥6 days apart) show no real change in weight or waist. */
export function detectPlateau(checkins: Checkin[]): boolean {
  const s = [...checkins].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id).slice(-3);
  if (s.length < 3) return false;
  return s.every((c, i) => i === 0 || (
    daysBetween(s[i - 1].date, c.date) >= 6 && Math.abs(c.weight - s[i - 1].weight) < 0.2 && Math.abs(c.waist - s[i - 1].waist) < 0.25
  ));
}
