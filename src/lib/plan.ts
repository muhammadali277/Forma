export const START_WEIGHT = 87;
export const START_WAIST = 34;
export const GOAL_MIN = 73;
export const GOAL_MAX = 75;
export const GOAL_MID = 74;
export const HABITS = { steps: 8000, stepsMin: 7000, waterMl: 3500, sleepMin: 7 };

export type QuickAdd = { id: string; label: string; text: string; plan?: boolean };

// One-tap entries. The text goes through the same food parser as typed meals.
export const QUICK_ADDS: QuickAdd[] = [
  { id: "breakfast", label: "Breakfast", text: "1 whole wheat chicken sandwich, 1 cup chai without sugar", plan: true },
  { id: "lunch", label: "Lunch", text: "1 roti, 1 chicken salan, 3/4 bowl chana chaat, 1 salad", plan: true },
  { id: "pregym", label: "Pre-gym", text: "1 banana", plan: true },
  { id: "dinner", label: "Dinner", text: "1 roti, 150 g grilled chicken, 1 bowl sabzi, half cup dahi", plan: true },
  { id: "chai", label: "Chai", text: "1 cup chai" },
  { id: "roti", label: "Roti", text: "1 roti" },
  { id: "eggs", label: "2 boiled eggs", text: "2 boiled eggs" },
  { id: "whey", label: "Whey scoop", text: "1 scoop whey" },
  { id: "dahi", label: "Dahi", text: "1 cup dahi" },
  { id: "apple", label: "Apple", text: "1 apple" },
];

export const MEAL_PLAN = [
  { time: "9:30 AM", title: "Breakfast", quick: "breakfast", detail: "Whole-wheat chicken sandwich (120 g chicken, cucumber, mint yogurt instead of mayo) + chai without sugar." },
  { time: "1:30 PM", title: "Lunch", quick: "lunch", detail: "1 roti + chicken salan (skim the oil on top) + ¾ bowl chana chaat + salad." },
  { time: "7:10 PM", title: "Pre-gym, at home", quick: "pregym", detail: "1 banana + water. Short on protein today? Add 1 scoop whey." },
  { time: "9:00 PM", title: "Dinner", quick: "dinner", detail: "1 roti + 150 g grilled chicken or fish + sabzi + ½ cup dahi. Add a 2nd roti on gym days." },
];

export const SWAPS: [string, string][] = [
  ["Mayo", "mint yogurt"],
  ["White bread", "whole wheat"],
  ["Rusk + late chai", "green tea or dahi"],
  ["Sugar in chai", "none or ½ tsp"],
  ["Guessing oil", "measure 1–2 tsp"],
];

export const HABIT_TIPS = [
  { title: "8,000 steps", text: "Start at 7,000. Walk 10 min after lunch and after dinner." },
  { title: "Move every hour", text: "Stand up or walk for 2–3 min each hour at your desk." },
  { title: "3.5 L water", text: "Spread it through the day; drink more on gym days." },
  { title: "7–8 h sleep", text: "In bed by 11 PM. No chai or coffee after 3 PM." },
];

export const GROCERY: { group: string; items: string[] }[] = [
  { group: "Protein", items: ["Chicken breast · 1.5–2 kg", "Eggs · 12–18", "Plain dahi · 1.5 kg", "Daal / lentils · 500 g", "Whey protein (optional)"] },
  { group: "Carbs & fibre", items: ["Whole-wheat atta · 1.5 kg", "Whole-wheat bread · 1 loaf", "White chickpeas · 500 g dry", "Bananas · 5–7", "Apples or guava · 5"] },
  { group: "Vegetables", items: ["Cucumber · 1 kg", "Tomatoes · 1 kg", "Onions · 1 kg", "Seasonal sabzi · 2 kg", "Spinach / greens · 500 g", "Lemons, mint, coriander"] },
  { group: "Pantry", items: ["Green tea", "Spices", "Cooking oil (measure it)"] },
];
