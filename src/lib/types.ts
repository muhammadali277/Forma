import type { ExerciseLog, MacroTotals, ParsedFood } from "@/db/schema";

export type Meal = { id: number; date: string; mealType: string; description: string; foods: ParsedFood[]; totals: MacroTotals; createdAt: string };
export type Workout = { id: number; date: string; day: string; exercises: ExerciseLog[]; createdAt: string };
export type Metric = { id: number; date: string; steps: number; waterMl: number; sleepHours: number; sleepQuality: string };
export type Checkin = { id: number; date: string; weight: number; waist: number; photoKeys: string[] };
export type Data = { meals: Meal[]; workouts: Workout[]; metrics: Metric[]; checkins: Checkin[]; locked: boolean };

export type Tab = "today" | "food" | "workout" | "progress" | "plan";
export type PostFn = (body: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
export type ToastFn = (message: string, action?: { label: string; run: () => void }) => void;
