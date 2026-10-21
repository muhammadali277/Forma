import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyMetrics, mealEntries, weeklyCheckins, workoutSessions, type ExerciseLog, type ProgressPhotos } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { parseMeal } from "@/lib/nutrition";

export const dynamic = "force-dynamic";
const validDate = (date: unknown): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
const num = (v: unknown) => Number(v);

export async function GET() {
  try {
    const [meals, workouts, metrics, checkins] = await Promise.all([
      db.select().from(mealEntries).orderBy(desc(mealEntries.createdAt)).limit(300),
      db.select().from(workoutSessions).orderBy(desc(workoutSessions.createdAt)).limit(100),
      db.select().from(dailyMetrics).orderBy(desc(dailyMetrics.date)).limit(100),
      db.select().from(weeklyCheckins).orderBy(desc(weeklyCheckins.date)).limit(52),
    ]);
    return NextResponse.json({ meals, workouts, metrics, checkins });
  } catch (error) {
    console.error("Tracker GET error", error);
    return NextResponse.json({ error: "Unable to load tracker data." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!validDate(body.date)) return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
    if (body.action === "meal") {
      const description = String(body.description || "").trim().slice(0, 2000);
      const parsed = parseMeal(description);
      if (!description || !parsed.foods.length) return NextResponse.json({ error: "No recognized foods. Try roti, chicken salan, chana chaat, eggs, chai, or rice." }, { status: 400 });
      await db.insert(mealEntries).values({ date: body.date, mealType: String(body.mealType || "Meal").slice(0, 40), description, foods: parsed.foods, totals: parsed.totals });
      return NextResponse.json({ success: true, parsed });
    }
    if (body.action === "deleteMeal") {
      await db.delete(mealEntries).where(eq(mealEntries.id, num(body.id)));
      return NextResponse.json({ success: true });
    }
    if (body.action === "workout") {
      const exercises: ExerciseLog[] = Array.isArray(body.exercises) ? body.exercises.map((e: ExerciseLog) => ({ name: String(e.name).slice(0, 100), sets: Math.max(0, Math.min(20, num(e.sets) || 0)), reps: String(e.reps).slice(0, 30), weight: String(e.weight).slice(0, 30), completed: Boolean(e.completed) })) : [];
      if (!exercises.length) return NextResponse.json({ error: "Add exercises before saving." }, { status: 400 });
      await db.insert(workoutSessions).values({ date: body.date, day: String(body.day || "Day A").slice(0, 30), exercises });
      return NextResponse.json({ success: true });
    }
    if (body.action === "metrics") {
      const updates: Record<string, number | string> = {};
      if (body.steps !== undefined) updates.steps = Math.max(0, Math.min(100000, Math.round(num(body.steps) || 0)));
      if (body.waterMl !== undefined) updates.waterMl = Math.max(0, Math.min(12000, Math.round(num(body.waterMl) || 0)));
      if (body.sleepHours !== undefined) updates.sleepHours = Math.max(0, Math.min(24, num(body.sleepHours) || 0));
      if (body.sleepQuality !== undefined) updates.sleepQuality = String(body.sleepQuality).slice(0, 30);
      if (!Object.keys(updates).length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
      await db.insert(dailyMetrics).values({ date: body.date, ...updates }).onConflictDoUpdate({ target: dailyMetrics.date, set: updates });
      return NextResponse.json({ success: true });
    }
    if (body.action === "checkin") {
      const weight = num(body.weight), waist = num(body.waist);
      if (!(weight > 30 && weight < 300 && waist > 15 && waist < 80)) return NextResponse.json({ error: "Enter a valid weight and waist measurement." }, { status: 400 });
      const photos: ProgressPhotos = {};
      for (const key of ["front", "side", "back"] as const) {
        const value = body.photos?.[key];
        if (typeof value === "string" && value.startsWith("data:image/") && value.length < 950000) photos[key] = value;
      }
      await db.insert(weeklyCheckins).values({ date: body.date, weight, waist, photos });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Tracker POST error", error);
    return NextResponse.json({ error: "Unable to save. Please try again." }, { status: 500 });
  }
}
