import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyMetrics, mealEntries, weeklyCheckins, workoutSessions, type ExerciseLog, type ProgressPhotos } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { parseMeal } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const toNum = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : NaN; };
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const idOf = (v: unknown) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const ok = (extra: Record<string, unknown> = {}) => NextResponse.json({ success: true, ...extra });

export async function GET() {
  try {
    const [meals, workouts, metrics, checkins] = await Promise.all([
      db.select().from(mealEntries).orderBy(desc(mealEntries.createdAt)).limit(400),
      db.select().from(workoutSessions).orderBy(desc(workoutSessions.date), desc(workoutSessions.createdAt)).limit(120),
      db.select().from(dailyMetrics).orderBy(desc(dailyMetrics.date)).limit(120),
      db.select({
        id: weeklyCheckins.id, date: weeklyCheckins.date, weight: weeklyCheckins.weight, waist: weeklyCheckins.waist,
        // Only photo names are listed; images load from /api/photos/[id]/[view] (keeps this response small).
        photoKeys: sql<string[]>`array(select jsonb_object_keys(${weeklyCheckins.photos}))`,
      }).from(weeklyCheckins).orderBy(desc(weeklyCheckins.date), desc(weeklyCheckins.id)).limit(60),
    ]);
    return NextResponse.json({ meals, workouts, metrics, checkins, locked: Boolean(process.env.APP_PASSWORD) });
  } catch (error) {
    console.error("Tracker GET error", error);
    return bad("Unable to load your data.", 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return bad("Invalid request."); }
  const date = body.date;

  try {
    switch (body.action) {
      case "meal": {
        if (!isDate(date)) return bad("A valid date is required.");
        const description = text(body.description, 2000);
        const parsed = parseMeal(description);
        if (!description || !parsed.foods.length) return bad("No food recognised. Try e.g. “2 roti, chicken salan, 1 cup chai”.");
        const [row] = await db.insert(mealEntries)
          .values({ date, mealType: text(body.mealType, 40) || "Meal", description, foods: parsed.foods, totals: parsed.totals })
          .returning({ id: mealEntries.id });
        return ok({ id: row.id, parsed });
      }
      case "deleteMeal": {
        const id = idOf(body.id);
        if (!id) return bad("Invalid entry.");
        await db.delete(mealEntries).where(eq(mealEntries.id, id));
        return ok();
      }
      case "workout": {
        if (!isDate(date)) return bad("A valid date is required.");
        const day = text(body.day, 40) || "Workout";
        const list: unknown[] = Array.isArray(body.exercises) ? body.exercises.slice(0, 30) : [];
        const exercises: ExerciseLog[] = list.map((raw) => {
          const e = (raw ?? {}) as Record<string, unknown>;
          const sets = clamp(Math.round(toNum(e.sets) || 0), 0, 20);
          const setsDone = clamp(Math.round(toNum(e.setsDone) || 0), 0, sets);
          return { slot: text(e.slot, 40), name: text(e.name, 100), muscle: text(e.muscle, 60), sets, reps: text(e.reps, 40), weight: text(e.weight, 12), setsDone, completed: sets > 0 && setsDone >= sets };
        }).filter((e) => e.name);
        if (!exercises.some((e) => (e.setsDone ?? 0) > 0)) return bad("Tick at least one set before saving.");
        // Saving the same session twice on one day updates it instead of creating a duplicate.
        const id = await db.transaction(async (tx) => {
          await tx.delete(workoutSessions).where(and(eq(workoutSessions.date, date), eq(workoutSessions.day, day)));
          const [row] = await tx.insert(workoutSessions).values({ date, day, exercises }).returning({ id: workoutSessions.id });
          return row.id;
        });
        return ok({ id });
      }
      case "deleteWorkout": {
        const id = idOf(body.id);
        if (!id) return bad("Invalid workout.");
        await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
        return ok();
      }
      case "metrics": {
        if (!isDate(date)) return bad("A valid date is required.");
        const updates: Partial<{ steps: number; waterMl: number; sleepHours: number; sleepQuality: string }> = {};
        if (body.steps !== undefined) updates.steps = clamp(Math.round(toNum(body.steps) || 0), 0, 100000);
        if (body.waterMl !== undefined) updates.waterMl = clamp(Math.round(toNum(body.waterMl) || 0), 0, 12000);
        if (body.sleepHours !== undefined) updates.sleepHours = clamp(toNum(body.sleepHours) || 0, 0, 24);
        if (body.sleepQuality !== undefined) updates.sleepQuality = text(body.sleepQuality, 20);
        if (!Object.keys(updates).length) return bad("Nothing to update.");
        await db.insert(dailyMetrics).values({ date, ...updates }).onConflictDoUpdate({ target: dailyMetrics.date, set: updates });
        return ok();
      }
      case "water": {
        if (!isDate(date)) return bad("A valid date is required.");
        const delta = clamp(Math.round(toNum(body.deltaMl) || 0), -5000, 5000);
        if (!delta) return bad("Nothing to add.");
        // Atomic add, so quick repeated taps are never lost.
        await db.insert(dailyMetrics).values({ date, waterMl: Math.max(0, delta) }).onConflictDoUpdate({
          target: dailyMetrics.date,
          set: { waterMl: sql`least(12000, greatest(0, ${dailyMetrics.waterMl} + ${delta}::int))` },
        });
        return ok();
      }
      case "checkin": {
        if (!isDate(date)) return bad("A valid date is required.");
        const weight = toNum(body.weight);
        const waist = toNum(body.waist);
        if (!(weight > 30 && weight < 300 && waist > 15 && waist < 80)) return bad("Enter your weight in kg and waist in inches.");
        const photos: ProgressPhotos = {};
        const given = (body.photos ?? {}) as Record<string, unknown>;
        for (const key of ["front", "side", "back"] as const) {
          const value = given[key];
          if (typeof value === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(value) && value.length < 950000) photos[key] = value;
        }
        const [row] = await db.insert(weeklyCheckins).values({ date, weight, waist, photos }).returning({ id: weeklyCheckins.id });
        return ok({ id: row.id });
      }
      case "deleteCheckin": {
        const id = idOf(body.id);
        if (!id) return bad("Invalid check-in.");
        await db.delete(weeklyCheckins).where(eq(weeklyCheckins.id, id));
        return ok();
      }
      default:
        return bad("Unknown action.");
    }
  } catch (error) {
    console.error("Tracker POST error", error);
    return bad("Couldn’t save. Please try again.", 500);
  }
}
