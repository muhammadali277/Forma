import { pgTable, serial, text, integer, real, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export type MacroTotals = { calories: number; protein: number; carbs: number; fat: number; fiber: number };
export type ParsedFood = { name: string; quantity: number; unit: string; totals: MacroTotals };
export type ExerciseLog = {
  name: string; sets: number; reps: string; weight: string; completed: boolean;
  slot?: string; muscle?: string; setsDone?: number; // added for set-by-set logging (stored in JSONB, no migration needed)
};
export type ProgressPhotos = { front?: string; side?: string; back?: string };

// .enableRLS() turns on Row Level Security: Supabase's public API is blocked, while the app
// (which connects as the table owner) keeps full access.

export const mealEntries = pgTable("meal_entries", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  mealType: text("meal_type").notNull().default("Meal"),
  description: text("description").notNull(),
  foods: jsonb("foods").$type<ParsedFood[]>().notNull(),
  totals: jsonb("totals").$type<MacroTotals>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}).enableRLS();

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  day: text("day").notNull(),
  exercises: jsonb("exercises").$type<ExerciseLog[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}).enableRLS();

export const dailyMetrics = pgTable("daily_metrics", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  steps: integer("steps").notNull().default(0),
  waterMl: integer("water_ml").notNull().default(0),
  sleepHours: real("sleep_hours").notNull().default(0),
  sleepQuality: text("sleep_quality").notNull().default("Good"),
}, (table) => [uniqueIndex("daily_metrics_date_unique").on(table.date)]).enableRLS();

export const weeklyCheckins = pgTable("weekly_checkins", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  weight: real("weight").notNull(),
  waist: real("waist").notNull(),
  photos: jsonb("photos").$type<ProgressPhotos>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}).enableRLS();
