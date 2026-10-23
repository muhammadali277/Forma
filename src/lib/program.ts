// 3-day full-body program for a lean, athletic "V-taper" look.
// Every session trains legs, push, pull and core; across the week every muscle gets 2–3 hits,
// with extra shoulder (side delt), back-width and upper-chest work — the muscles that make
// you look athletic rather than bulky. ~18–20 working sets keeps each session to ~50 minutes.

export type DayId = "A" | "B" | "C";
export type Alt = { name: string; note: string };
export type Exercise = {
  id: string;
  name: string;
  note: string; // equipment
  muscle: string;
  sets: number;
  reps: string;
  rest: number; // seconds — the rest timer starts automatically with this
  step: number; // suggested kg jump when every set is completed
  bodyweight?: boolean;
  superset?: boolean; // go straight to the next exercise, rest after it
  alts: Alt[];
};
export type WorkoutDay = {
  id: DayId;
  title: string;
  weekday: number; // 1 = Monday
  weekdayLabel: string;
  focus: string;
  muscles: string[];
  exercises: Exercise[];
  finisher: { name: string; detail: string };
};

export const GYM_WEEKDAYS = [1, 3, 5];
export const WARMUP = "Brisk walk or bike, 10 arm circles and 10 bodyweight squats, then 1 light set of your first lift.";

export const PROGRAM: WorkoutDay[] = [
  {
    id: "A", title: "Full Body A", weekday: 1, weekdayLabel: "Mon", focus: "Strength · chest & back width",
    muscles: ["Legs", "Chest", "Back", "Shoulders", "Arms", "Core"],
    exercises: [
      { id: "a1", name: "Back squat", note: "Barbell", muscle: "Quads · Glutes", sets: 3, reps: "6–8", rest: 90, step: 2.5,
        alts: [{ name: "Goblet squat", note: "Dumbbell" }, { name: "Leg press", note: "Machine" }, { name: "Hack squat", note: "Machine" }] },
      { id: "a2", name: "Dumbbell bench press", note: "Dumbbells", muscle: "Chest · Triceps", sets: 3, reps: "8–10", rest: 90, step: 2,
        alts: [{ name: "Barbell bench press", note: "Barbell" }, { name: "Machine chest press", note: "Machine" }, { name: "Push-ups", note: "No equipment" }] },
      { id: "a3", name: "Lat pulldown", note: "Cable", muscle: "Lats · Back width", sets: 3, reps: "8–12", rest: 75, step: 2.5,
        alts: [{ name: "Assisted pull-up", note: "Machine" }, { name: "Single-arm cable pulldown", note: "Cable" }, { name: "Band pulldown", note: "Band" }] },
      { id: "a4", name: "Romanian deadlift", note: "Barbell", muscle: "Hamstrings · Glutes", sets: 2, reps: "8–10", rest: 90, step: 2.5,
        alts: [{ name: "Dumbbell Romanian deadlift", note: "Dumbbells" }, { name: "Seated leg curl", note: "Machine" }, { name: "Cable pull-through", note: "Cable" }] },
      { id: "a5", name: "Dumbbell lateral raise", note: "Dumbbells", muscle: "Side delts · V-taper", sets: 3, reps: "12–15", rest: 60, step: 1,
        alts: [{ name: "Cable lateral raise", note: "Cable" }, { name: "Machine lateral raise", note: "Machine" }, { name: "Band lateral raise", note: "Band" }] },
      { id: "a6", name: "Dumbbell curl", note: "Dumbbells", muscle: "Biceps", sets: 2, reps: "10–12", rest: 60, step: 1, superset: true,
        alts: [{ name: "Cable curl", note: "Cable" }, { name: "EZ-bar curl", note: "Barbell" }, { name: "Band curl", note: "Band" }] },
      { id: "a7", name: "Triceps rope pushdown", note: "Cable", muscle: "Triceps", sets: 2, reps: "10–12", rest: 60, step: 2.5,
        alts: [{ name: "Overhead dumbbell extension", note: "Dumbbell" }, { name: "Bench dips", note: "No equipment" }, { name: "Close-grip push-ups", note: "No equipment" }] },
      { id: "a8", name: "Plank", note: "Bodyweight", muscle: "Core", sets: 2, reps: "30–45 s", rest: 45, step: 0, bodyweight: true,
        alts: [{ name: "Dead bug", note: "No equipment" }, { name: "Ab wheel rollout", note: "Ab wheel" }, { name: "Hollow hold", note: "No equipment" }] },
    ],
    finisher: { name: "Incline walk", detail: "6 min · fast pace, incline 8–10" },
  },
  {
    id: "B", title: "Full Body B", weekday: 3, weekdayLabel: "Wed", focus: "Athletic · shoulders & posture",
    muscles: ["Legs", "Shoulders", "Back", "Arms", "Core"],
    exercises: [
      { id: "b1", name: "Trap-bar deadlift", note: "Trap bar", muscle: "Glutes · Hamstrings · Back", sets: 3, reps: "6–8", rest: 90, step: 5,
        alts: [{ name: "Dumbbell deadlift", note: "Dumbbells" }, { name: "Barbell deadlift", note: "Barbell" }, { name: "Kettlebell deadlift", note: "Kettlebell" }] },
      { id: "b2", name: "Seated dumbbell shoulder press", note: "Dumbbells", muscle: "Shoulders · Triceps", sets: 3, reps: "8–10", rest: 90, step: 2,
        alts: [{ name: "Machine shoulder press", note: "Machine" }, { name: "Landmine press", note: "Barbell" }, { name: "Pike push-ups", note: "No equipment" }] },
      { id: "b3", name: "Seated cable row", note: "Cable", muscle: "Mid-back · Lats", sets: 3, reps: "10–12", rest: 75, step: 2.5,
        alts: [{ name: "Chest-supported dumbbell row", note: "Dumbbells" }, { name: "One-arm dumbbell row", note: "Dumbbell" }, { name: "Machine row", note: "Machine" }] },
      { id: "b4", name: "Reverse lunge", note: "Dumbbells", muscle: "Quads · Glutes", sets: 2, reps: "8 / leg", rest: 75, step: 2,
        alts: [{ name: "Bulgarian split squat", note: "Dumbbells" }, { name: "Step-ups", note: "Bench + dumbbells" }, { name: "Leg press", note: "Machine" }] },
      { id: "b5", name: "Face pull", note: "Cable", muscle: "Rear delts · Posture", sets: 2, reps: "12–15", rest: 60, step: 2.5,
        alts: [{ name: "Reverse pec deck", note: "Machine" }, { name: "Rear-delt dumbbell fly", note: "Dumbbells" }, { name: "Band pull-apart", note: "Band" }] },
      { id: "b6", name: "Hammer curl", note: "Dumbbells", muscle: "Biceps · Forearms", sets: 2, reps: "10–12", rest: 60, step: 1, superset: true,
        alts: [{ name: "Rope hammer curl", note: "Cable" }, { name: "Incline dumbbell curl", note: "Dumbbells" }, { name: "Band hammer curl", note: "Band" }] },
      { id: "b7", name: "Overhead cable extension", note: "Cable", muscle: "Triceps", sets: 2, reps: "10–12", rest: 60, step: 2.5,
        alts: [{ name: "Overhead dumbbell extension", note: "Dumbbell" }, { name: "EZ-bar skull crusher", note: "Barbell" }, { name: "Diamond push-ups", note: "No equipment" }] },
      { id: "b8", name: "Pallof press", note: "Cable", muscle: "Obliques · Core", sets: 2, reps: "10 / side", rest: 45, step: 2.5,
        alts: [{ name: "Side plank", note: "No equipment" }, { name: "Cable woodchop", note: "Cable" }, { name: "Band Pallof press", note: "Band" }] },
    ],
    finisher: { name: "Bike intervals", detail: "6 min · 20 s hard / 40 s easy" },
  },
  {
    id: "C", title: "Full Body C", weekday: 5, weekdayLabel: "Fri", focus: "Upper chest · legs · V-taper",
    muscles: ["Legs", "Chest", "Back", "Shoulders", "Calves", "Core"],
    exercises: [
      { id: "c1", name: "Leg press", note: "Machine", muscle: "Quads · Glutes", sets: 3, reps: "10–12", rest: 90, step: 5,
        alts: [{ name: "Hack squat", note: "Machine" }, { name: "Goblet squat", note: "Dumbbell" }, { name: "Smith machine squat", note: "Machine" }] },
      { id: "c2", name: "Incline dumbbell press", note: "Dumbbells", muscle: "Upper chest", sets: 3, reps: "8–12", rest: 90, step: 2,
        alts: [{ name: "Incline machine press", note: "Machine" }, { name: "Incline barbell press", note: "Barbell" }, { name: "Feet-elevated push-ups", note: "No equipment" }] },
      { id: "c3", name: "Pull-up", note: "Bodyweight", muscle: "Lats · Back width", sets: 3, reps: "6–10", rest: 90, step: 2.5, bodyweight: true,
        alts: [{ name: "Assisted pull-up", note: "Machine" }, { name: "Neutral-grip lat pulldown", note: "Cable" }, { name: "Band-assisted pull-up", note: "Band" }] },
      { id: "c4", name: "Hip thrust", note: "Barbell", muscle: "Glutes · Hamstrings", sets: 2, reps: "10–12", rest: 75, step: 5,
        alts: [{ name: "Dumbbell glute bridge", note: "Dumbbell" }, { name: "Seated leg curl", note: "Machine" }, { name: "Cable pull-through", note: "Cable" }] },
      { id: "c5", name: "Cable lateral raise", note: "Cable", muscle: "Side delts · V-taper", sets: 3, reps: "12–15", rest: 60, step: 2.5,
        alts: [{ name: "Dumbbell lateral raise", note: "Dumbbells" }, { name: "Machine lateral raise", note: "Machine" }, { name: "Lean-away lateral raise", note: "Dumbbell" }] },
      { id: "c6", name: "Cable chest fly", note: "Cable", muscle: "Chest", sets: 2, reps: "12–15", rest: 60, step: 2.5, superset: true,
        alts: [{ name: "Pec deck", note: "Machine" }, { name: "Dumbbell fly", note: "Dumbbells" }, { name: "Slow push-ups", note: "No equipment" }] },
      { id: "c7", name: "Standing calf raise", note: "Machine", muscle: "Calves", sets: 2, reps: "12–15", rest: 45, step: 5,
        alts: [{ name: "Seated calf raise", note: "Machine" }, { name: "Leg press calf raise", note: "Machine" }, { name: "Single-leg calf raise", note: "Dumbbell" }] },
      { id: "c8", name: "Hanging knee raise", note: "Pull-up bar", muscle: "Lower abs", sets: 2, reps: "10–15", rest: 45, step: 0, bodyweight: true,
        alts: [{ name: "Captain's chair knee raise", note: "Machine" }, { name: "Reverse crunch", note: "No equipment" }, { name: "Cable crunch", note: "Cable" }] },
    ],
    finisher: { name: "Rower or incline walk", detail: "6 min · steady, breathing hard" },
  },
];
