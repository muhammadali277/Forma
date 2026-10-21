import type { MacroTotals, ParsedFood } from "@/db/schema";

export const TARGETS: MacroTotals = { calories: 2100, protein: 130, carbs: 250, fat: 65, fiber: 30 };
export const ZERO: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

type FoodDef = { name: string; unit: string; aliases: string[]; macros: MacroTotals; note?: string };
export const FOOD_DB: FoodDef[] = [
  { name: "Chicken salan", unit: "serving", aliases: ["chicken salan", "chicken curry", "murgh salan", "chicken karahi", "chicken ke salan"], macros: { calories: 290, protein: 27, carbs: 8, fat: 17, fiber: 1 }, note: "Includes ~2 tsp oil/tarri per serving" },
  { name: "Chana chaat", unit: "bowl", aliases: ["chana chaat", "chana chat", "chickpea chaat", "chana"], macros: { calories: 260, protein: 12, carbs: 40, fat: 6, fiber: 10 }, note: "Medium bowl (~200 g); no sev" },
  { name: "Roti / chapati", unit: "medium roti", aliases: ["chapati", "roti", "phulka"], macros: { calories: 110, protein: 3, carbs: 22, fat: 1.5, fiber: 3 }, note: "6-inch, ~30 g atta; no ghee" },
  { name: "Paratha", unit: "medium paratha", aliases: ["paratha"], macros: { calories: 300, protein: 6, carbs: 35, fat: 15, fiber: 3 }, note: "Oil varies substantially" },
  { name: "Chicken sandwich", unit: "sandwich", aliases: ["chicken sandwich"], macros: { calories: 380, protein: 25, carbs: 32, fat: 17, fiber: 2 }, note: "White bread + mayonnaise estimate" },
  { name: "Grilled chicken", unit: "100 g", aliases: ["grilled chicken", "chicken breast", "chicken tikka", "boiled chicken"], macros: { calories: 165, protein: 31, carbs: 0, fat: 4, fiber: 0 } },
  { name: "Egg", unit: "egg", aliases: ["scrambled eggs", "scrambled egg", "boiled eggs", "boiled egg", "anday", "anda", "eggs", "egg"], macros: { calories: 78, protein: 6, carbs: 1, fat: 5, fiber: 0 }, note: "Add cooking oil separately for scrambled eggs" },
  { name: "Milk tea", unit: "cup", aliases: ["chai", "tea"], macros: { calories: 90, protein: 2, carbs: 14, fat: 3, fiber: 0 }, note: "Milk + 1 tsp sugar per cup" },
  { name: "Coffee", unit: "cup", aliases: ["coffee"], macros: { calories: 35, protein: 1, carbs: 5, fat: 1, fiber: 0 }, note: "Splash of milk; sugar may add ~16 kcal/tsp" },
  { name: "Rusk", unit: "piece", aliases: ["rusk", "rusks"], macros: { calories: 55, protein: 1, carbs: 9, fat: 2, fiber: 0.5 } },
  { name: "Bread", unit: "slice", aliases: ["bread", "toast"], macros: { calories: 80, protein: 3, carbs: 15, fat: 1, fiber: 1 } },
  { name: "Daal", unit: "bowl", aliases: ["daal", "dal", "lentils"], macros: { calories: 210, protein: 12, carbs: 28, fat: 6, fiber: 9 }, note: "Includes ~1 tsp tempering oil" },
  { name: "Rice", unit: "cup cooked", aliases: ["rice", "chawal"], macros: { calories: 205, protein: 4, carbs: 45, fat: 0, fiber: 1 } },
  { name: "Biryani", unit: "plate", aliases: ["biryani", "pulao"], macros: { calories: 650, protein: 25, carbs: 75, fat: 28, fiber: 3 } },
  { name: "Plain yogurt", unit: "cup", aliases: ["yogurt", "dahi", "curd"], macros: { calories: 120, protein: 9, carbs: 9, fat: 5, fiber: 0 } },
  { name: "Greek yogurt", unit: "cup", aliases: ["greek yogurt", "hung curd"], macros: { calories: 130, protein: 20, carbs: 8, fat: 2, fiber: 0 } },
  { name: "Banana", unit: "banana", aliases: ["banana", "kela"], macros: { calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3 } },
  { name: "Apple", unit: "apple", aliases: ["apple", "seb"], macros: { calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4 } },
  { name: "Milk", unit: "glass", aliases: ["milk", "doodh"], macros: { calories: 120, protein: 8, carbs: 12, fat: 5, fiber: 0 } },
  { name: "Whey protein", unit: "scoop", aliases: ["whey", "protein shake", "protein powder"], macros: { calories: 120, protein: 24, carbs: 3, fat: 2, fiber: 0 } },
  { name: "Vegetable sabzi", unit: "bowl", aliases: ["sabzi", "vegetables", "salad"], macros: { calories: 110, protein: 3, carbs: 14, fat: 5, fiber: 5 }, note: "Cooked with ~1 tsp oil" },
  { name: "Cooking oil / ghee", unit: "tsp", aliases: ["oil", "ghee", "tarri"], macros: { calories: 45, protein: 0, carbs: 0, fat: 5, fiber: 0 } },
  { name: "Sugar", unit: "tsp", aliases: ["sugar", "cheeni"], macros: { calories: 16, protein: 0, carbs: 4, fat: 0, fiber: 0 } },
];

const numberWords: Record<string, number> = { a: 1, an: 1, ek: 1, aik: 1, one: 1, do: 2, two: 2, teen: 3, three: 3, four: 4, char: 4, half: 0.5, aadha: 0.5 };
const round = (n: number) => Math.round(n * 10) / 10;
export function sumMacros(items: MacroTotals[]): MacroTotals {
  return items.reduce((acc, m) => ({ calories: round(acc.calories + m.calories), protein: round(acc.protein + m.protein), carbs: round(acc.carbs + m.carbs), fat: round(acc.fat + m.fat), fiber: round(acc.fiber + m.fiber) }), { ...ZERO });
}

export function parseMeal(input: string): { foods: ParsedFood[]; totals: MacroTotals; assumptions: string[] } {
  const text = input.toLowerCase().replace(/\b(khaya|khayi|khaaya|main ne|maine|aaj|aur|ke sath|with|had|ate|drank|pee)\b/g, " ").replace(/\s+/g, " ");
  const matches: { start: number; end: number; def: FoodDef; alias: string }[] = [];
  for (const def of FOOD_DB) {
    for (const alias of def.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "g");
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) matches.push({ start: match.index, end: match.index + alias.length, def, alias });
    }
  }
  // Prefer longer matches: "chicken sandwich" should not also count as chicken or bread.
  matches.sort((a, b) => (b.end - b.start) - (a.end - a.start));
  const selected: typeof matches = [];
  for (const match of matches) if (!selected.some((s) => match.start < s.end && match.end > s.start)) selected.push(match);
  selected.sort((a, b) => a.start - b.start);
  const foods = selected.map((match) => {
    const before = text.slice(Math.max(0, match.start - 32), match.start);
    const after = text.slice(match.end, Math.min(text.length, match.end + 22));
    const countMatch = before.match(/(?:^|\s)(\d+(?:\.\d+)?|aik|ek|do|teen|one|two|three|half|aadha|a|an)\s*(?:(?:small|medium|large|choti|bari|cups?|bowls?|plates?|slices?|pieces?|scoops?|glasses?|tsp|tbsp)\s*)?$/);
    let quantity = countMatch ? (Number(countMatch[1]) || numberWords[countMatch[1]] || 1) : 1;
    if (match.def.name === "Egg" && /eggs|anday/.test(match.alias) && !countMatch) quantity = 2;
    let multiplier = 1;
    if (/\b(large|bari)\b/.test(before.slice(-17)) || /^\s*(large|bari)/.test(after)) multiplier = 1.4;
    if (/\b(small|choti)\b/.test(before.slice(-17)) || /^\s*(small|choti)/.test(after)) multiplier = 0.75;
    if (match.def.name === "Milk tea" && /without sugar|no sugar|sugar free|bina cheeni/.test(text)) multiplier = 0.55;
    const m = match.def.macros;
    return { name: match.def.name, quantity, unit: match.def.unit, totals: { calories: round(m.calories * quantity * multiplier), protein: round(m.protein * quantity * multiplier), carbs: round(m.carbs * quantity * multiplier), fat: round(m.fat * quantity * multiplier), fiber: round(m.fiber * quantity * multiplier) } };
  });
  const assumptions = Array.from(new Set(selected.map((x) => x.def.note).filter((x): x is string => !!x)));
  return { foods, totals: sumMacros(foods.map((x) => x.totals)), assumptions };
}
