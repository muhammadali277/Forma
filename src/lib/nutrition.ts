import type { MacroTotals, ParsedFood } from "@/db/schema";

export const TARGETS: MacroTotals = { calories: 2100, protein: 130, carbs: 250, fat: 65, fiber: 30 };
export const ZERO: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

type FoodDef = {
  name: string;
  unit: string;
  /** grams (or ml for drinks) in one unit, so "150 g chicken" or "250 ml milk" works */
  per?: number;
  /** teaspoons of sugar already included; removed for "without sugar" / "pheeki" */
  sugarTsp?: number;
  aliases: string[];
  macros: MacroTotals;
  note?: string;
};

const m = (calories: number, protein: number, carbs: number, fat: number, fiber: number): MacroTotals => ({ calories, protein, carbs, fat, fiber });

// Typical home-style portions. Longer names win over shorter ones ("chicken salan" beats "chicken").
export const FOOD_DB: FoodDef[] = [
  // Breads & grains
  { name: "Roti / chapati", unit: "roti", per: 40, aliases: ["roti", "chapati", "chapatti", "phulka", "rotiyan", "rotian"], macros: m(110, 3, 22, 1.5, 3), note: "Medium roti (~6 in), no ghee" },
  { name: "Tandoori roti", unit: "roti", per: 70, aliases: ["tandoori roti", "tandoori"], macros: m(220, 7, 42, 2, 3) },
  { name: "Naan", unit: "naan", per: 100, aliases: ["naan"], macros: m(290, 9, 50, 6, 2) },
  { name: "Paratha", unit: "paratha", per: 90, aliases: ["paratha", "parontha", "parathay"], macros: m(300, 6, 35, 15, 3), note: "Oil in parathas varies a lot" },
  { name: "Aloo paratha", unit: "paratha", per: 130, aliases: ["aloo paratha", "alu paratha"], macros: m(350, 7, 45, 16, 4) },
  { name: "Puri", unit: "puri", per: 30, aliases: ["puri", "poori"], macros: m(100, 2, 12, 5, 0.5) },
  { name: "Rice (cooked)", unit: "cup", per: 160, aliases: ["rice", "chawal", "chaawal"], macros: m(205, 4, 45, 0.5, 1) },
  { name: "Biryani / pulao", unit: "plate", per: 350, aliases: ["biryani", "biriyani", "pulao", "pulav", "chicken biryani", "chicken pulao", "beef pulao", "mutton pulao", "fried rice"], macros: m(650, 25, 75, 28, 3), note: "Restaurant-size plate" },
  { name: "Bread", unit: "slice", per: 30, aliases: ["bread", "toast", "white bread", "double roti"], macros: m(80, 3, 15, 1, 1) },
  { name: "Whole-wheat bread", unit: "slice", per: 30, aliases: ["whole wheat bread", "wholewheat bread", "brown bread", "atta bread"], macros: m(80, 4, 14, 1, 2) },
  { name: "Rusk", unit: "piece", per: 12, aliases: ["rusk", "papay", "paapay", "cake rusk"], macros: m(55, 1, 9, 2, 0.5) },
  { name: "Oats", unit: "bowl", aliases: ["oats", "oatmeal", "daliya", "dalia"], macros: m(150, 5, 27, 3, 4), note: "40 g oats cooked in water" },
  { name: "Cereal", unit: "bowl", aliases: ["cornflakes", "corn flakes", "cereal"], macros: m(250, 8, 45, 4, 1), note: "With milk" },
  // Protein
  { name: "Egg", unit: "egg", per: 50, aliases: ["egg", "boiled egg", "anda", "anday", "ande"], macros: m(78, 6, 0.6, 5, 0) },
  { name: "Fried / scrambled egg", unit: "egg", aliases: ["fried egg", "scrambled egg", "half fry", "fry anda", "fried anda"], macros: m(100, 6, 1, 8, 0), note: "Includes a little oil" },
  { name: "Omelette (2 eggs)", unit: "omelette", aliases: ["omelette", "omelet", "khagina"], macros: m(200, 12, 2, 16, 0.5), note: "2 eggs + 1 tsp oil" },
  { name: "Grilled chicken", unit: "100 g", per: 100, aliases: ["grilled chicken", "chicken breast", "chicken tikka", "boiled chicken", "chicken boti", "tikka", "chicken"], macros: m(165, 31, 0, 4, 0), note: "Plain cooked chicken, per 100 g" },
  { name: "Chicken salan / karahi", unit: "serving", per: 150, aliases: ["chicken salan", "chicken curry", "chicken karahi", "chicken handi", "chicken qorma", "chicken korma", "chicken jalfrezi", "murgh salan", "chicken ka salan", "chicken ke salan"], macros: m(290, 27, 8, 17, 1), note: "Homemade, ~2 tsp oil per serving" },
  { name: "Salan (homemade)", unit: "serving", per: 150, aliases: ["salan", "saalan", "curry", "shorba"], macros: m(220, 14, 10, 14, 3), note: "Mixed homemade salan; meat salan is higher" },
  { name: "Mutton / beef salan", unit: "serving", per: 150, aliases: ["mutton salan", "beef salan", "mutton karahi", "beef karahi", "mutton curry", "beef curry", "qorma", "korma", "gosht", "mutton", "beef"], macros: m(330, 24, 6, 23, 1), note: "Homemade, ~2 tsp oil per serving" },
  { name: "Keema", unit: "serving", per: 150, aliases: ["keema", "qeema", "kheema", "keema matar", "qeema matar"], macros: m(320, 24, 8, 21, 2) },
  { name: "Nihari", unit: "bowl", per: 250, aliases: ["nihari", "nahari"], macros: m(520, 30, 12, 39, 1), note: "Rich, oily gravy" },
  { name: "Haleem", unit: "bowl", per: 250, aliases: ["haleem", "daleem"], macros: m(380, 22, 35, 16, 6) },
  { name: "Seekh kabab", unit: "piece", per: 50, aliases: ["seekh kabab", "seekh kebab", "seekh"], macros: m(120, 9, 2, 8, 0) },
  { name: "Shami kabab", unit: "piece", per: 50, aliases: ["shami kabab", "shami kebab", "shami", "kabab", "kebab"], macros: m(100, 7, 5, 6, 1) },
  { name: "Fish (grilled)", unit: "100 g", per: 100, aliases: ["fish", "grilled fish", "machli", "machhli"], macros: m(130, 22, 0, 4.5, 0) },
  { name: "Fried fish", unit: "100 g", per: 100, aliases: ["fried fish", "fish fry", "fish pakora"], macros: m(230, 18, 8, 14, 0) },
  { name: "Fried chicken / broast", unit: "piece", per: 120, aliases: ["fried chicken", "broast", "chicken broast", "chicken piece"], macros: m(300, 20, 10, 20, 0.5) },
  { name: "Whey protein", unit: "scoop", per: 30, aliases: ["whey", "whey protein", "protein shake", "protein powder"], macros: m(120, 24, 3, 2, 0), note: "Mixed in water" },
  { name: "Paneer", unit: "100 g", per: 100, aliases: ["paneer", "cottage cheese"], macros: m(265, 18, 3, 20, 0) },
  // Lentils & chickpeas
  { name: "Daal", unit: "bowl", per: 200, aliases: ["daal", "dal", "dhal", "lentils", "masoor", "moong", "chana daal", "chana dal", "daal mash", "mash ki daal"], macros: m(210, 12, 28, 6, 9), note: "Includes ~1 tsp tarka oil" },
  { name: "Chana chaat", unit: "bowl", per: 200, aliases: ["chana chaat", "chana chat", "chickpea chaat", "chickpea salad", "chana"], macros: m(260, 12, 40, 6, 10), note: "Medium bowl (~200 g), no papri/sev" },
  { name: "Cholay / chana masala", unit: "bowl", per: 200, aliases: ["cholay", "chole", "chhole", "chana masala", "chanay", "channay"], macros: m(290, 12, 38, 10, 10) },
  // Vegetables & sides
  { name: "Vegetable sabzi", unit: "bowl", per: 150, aliases: ["sabzi", "sabji", "vegetables", "vegetable", "bhindi", "palak", "lauki", "tinda", "gobi", "mix vegetable", "mixed vegetables"], macros: m(110, 3, 14, 5, 5), note: "Cooked with ~1 tsp oil" },
  { name: "Aloo sabzi", unit: "bowl", per: 150, aliases: ["aloo", "alu", "aloo sabzi", "aloo ki bhujia", "potato"], macros: m(180, 3, 24, 8, 3) },
  { name: "Salad", unit: "bowl", per: 150, aliases: ["salad", "kachumar", "cucumber", "kheera"], macros: m(40, 2, 8, 0.3, 3), note: "No dressing" },
  { name: "Raita", unit: "bowl", per: 150, aliases: ["raita"], macros: m(90, 4, 7, 4, 0.5) },
  { name: "Plain yogurt (dahi)", unit: "cup", per: 245, aliases: ["dahi", "yogurt", "yoghurt", "curd"], macros: m(120, 9, 9, 5, 0) },
  { name: "Greek yogurt", unit: "cup", per: 200, aliases: ["greek yogurt", "greek yoghurt", "hung curd"], macros: m(130, 20, 8, 2, 0) },
  // Drinks
  { name: "Milk tea (chai)", unit: "cup", per: 150, sugarTsp: 1.5, aliases: ["chai", "tea", "doodh patti", "milk tea", "karak chai"], macros: m(90, 3, 12, 3, 0), note: "Milk + 1½ tsp sugar per cup" },
  { name: "Green tea / kahwa", unit: "cup", aliases: ["green tea", "herbal tea", "kahwa", "qehwa", "black tea"], macros: m(2, 0, 0, 0, 0) },
  { name: "Coffee", unit: "cup", per: 200, aliases: ["coffee", "latte", "cappuccino", "nescafe"], macros: m(60, 3, 6, 3, 0), note: "With milk, no sugar" },
  { name: "Black coffee", unit: "cup", aliases: ["black coffee", "americano", "espresso"], macros: m(5, 0, 1, 0, 0) },
  { name: "Milk", unit: "glass", per: 250, aliases: ["milk", "doodh"], macros: m(150, 8, 12, 8, 0), note: "Full-fat, 250 ml" },
  { name: "Lassi", unit: "glass", per: 300, aliases: ["lassi", "sweet lassi", "meethi lassi"], macros: m(250, 8, 38, 7, 0), note: "Sweet lassi" },
  { name: "Milkshake", unit: "glass", per: 300, aliases: ["banana shake", "milkshake", "milk shake", "shake"], macros: m(300, 9, 50, 8, 2) },
  { name: "Soft drink", unit: "can", per: 330, aliases: ["coke", "pepsi", "cola", "soft drink", "7up", "sprite", "fanta"], macros: m(140, 0, 39, 0, 0) },
  { name: "Juice", unit: "glass", per: 250, aliases: ["juice", "orange juice", "apple juice"], macros: m(115, 1, 27, 0, 0.5) },
  // Fruit & snacks
  { name: "Banana", unit: "banana", per: 120, aliases: ["banana", "kela"], macros: m(105, 1.3, 27, 0.4, 3) },
  { name: "Apple", unit: "apple", per: 180, aliases: ["apple", "seb"], macros: m(95, 0.5, 25, 0.3, 4) },
  { name: "Orange / kinnow", unit: "fruit", per: 150, aliases: ["orange", "kinnow", "kino", "malta"], macros: m(65, 1.3, 16, 0.2, 3) },
  { name: "Guava", unit: "guava", per: 100, aliases: ["guava", "amrood", "amrud"], macros: m(68, 2.6, 14, 1, 5) },
  { name: "Mango", unit: "mango", per: 200, aliases: ["mango"], macros: m(200, 2.8, 50, 1.2, 5) },
  { name: "Fruit chaat", unit: "bowl", per: 200, aliases: ["fruit chaat", "fruit chat", "fruit salad"], macros: m(150, 2, 36, 0.5, 4) },
  { name: "Dates", unit: "date", per: 8, aliases: ["dates", "khajoor", "khajur"], macros: m(23, 0.2, 6, 0, 0.6) },
  { name: "Nuts", unit: "handful", per: 15, aliases: ["almonds", "badam", "nuts", "mixed nuts", "walnuts", "akhrot", "cashews", "kaju", "pista"], macros: m(90, 3, 3, 8, 1.5), note: "Small handful (~15 g)" },
  { name: "Peanuts", unit: "handful", per: 30, aliases: ["peanuts", "moongphali", "mungphali"], macros: m(170, 7, 5, 14, 2.5) },
  { name: "Peanut butter", unit: "tbsp", per: 16, aliases: ["peanut butter"], macros: m(95, 4, 3, 8, 1) },
  { name: "Biscuit", unit: "biscuit", per: 8, aliases: ["biscuit", "cookie"], macros: m(40, 0.5, 6, 1.7, 0.1) },
  { name: "Samosa", unit: "samosa", per: 80, aliases: ["samosa", "samosay", "samose"], macros: m(250, 4, 26, 15, 2) },
  { name: "Pakora", unit: "piece", per: 20, aliases: ["pakora", "pakoray", "pakode", "pakoda"], macros: m(60, 1.5, 5, 4, 0.8) },
  { name: "Roll paratha", unit: "roll", per: 250, aliases: ["roll paratha", "paratha roll", "chicken roll", "roll"], macros: m(550, 25, 50, 27, 3) },
  { name: "Shawarma", unit: "shawarma", per: 250, aliases: ["shawarma", "chicken shawarma"], macros: m(500, 25, 45, 24, 3) },
  { name: "Burger", unit: "burger", per: 220, aliases: ["burger", "zinger", "zinger burger", "chicken burger", "beef burger"], macros: m(520, 25, 42, 28, 2) },
  { name: "Pizza", unit: "slice", per: 110, aliases: ["pizza", "pizza slice", "chicken pizza"], macros: m(285, 12, 36, 10, 2) },
  { name: "Fries", unit: "serving", per: 115, aliases: ["fries", "french fries", "chips"], macros: m(365, 4, 48, 17, 4) },
  { name: "Chicken sandwich", unit: "sandwich", aliases: ["chicken sandwich", "club sandwich", "sandwich"], macros: m(380, 25, 32, 17, 2), note: "White bread + mayo" },
  { name: "Whole-wheat chicken sandwich", unit: "sandwich", aliases: ["whole wheat chicken sandwich", "wholewheat chicken sandwich", "brown bread chicken sandwich"], macros: m(430, 45, 32, 12, 5), note: "120 g chicken, whole-wheat bread, mint yogurt instead of mayo" },
  { name: "Egg sandwich", unit: "sandwich", aliases: ["egg sandwich", "anda sandwich"], macros: m(330, 15, 30, 16, 2) },
  { name: "Kheer", unit: "bowl", per: 150, aliases: ["kheer", "firni", "phirni"], macros: m(280, 7, 42, 9, 0.5) },
  { name: "Mithai / dessert", unit: "piece", per: 40, aliases: ["mithai", "gulab jamun", "barfi", "jalebi", "ladoo", "laddu", "halwa", "dessert"], macros: m(160, 2, 24, 7, 0.3) },
  { name: "Cheese slice", unit: "slice", per: 20, aliases: ["cheese", "cheese slice"], macros: m(70, 4, 1, 5.5, 0) },
  { name: "Honey / jam", unit: "tsp", per: 7, aliases: ["honey", "shehad", "jam"], macros: m(21, 0, 5.5, 0, 0) },
  // Add-ons
  { name: "Oil / ghee / butter", unit: "tsp", per: 5, aliases: ["oil", "ghee", "tarri", "butter", "makhan"], macros: m(45, 0, 0, 5, 0) },
  { name: "Mayonnaise", unit: "tbsp", per: 14, aliases: ["mayo", "mayonnaise"], macros: m(95, 0, 0, 10, 0) },
  { name: "Sugar", unit: "tsp", per: 4, aliases: ["sugar", "cheeni", "chini", "shakar"], macros: m(16, 0, 4, 0, 0) },
];

const WORD_NUMS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, half: 0.5, quarter: 0.25,
  ek: 1, aik: 1, ik: 1, do: 2, teen: 3, char: 4, chaar: 4, panch: 5, paanch: 5, chay: 6, che: 6,
  aadha: 0.5, aadhi: 0.5, adha: 0.5, adhi: 0.5, dedh: 1.5, derh: 1.5, dhai: 2.5, dhaai: 2.5,
};
const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };
const SIZE_MULT: Record<string, number> = {
  small: 0.75, choti: 0.75, chota: 0.75, chhoti: 0.75, chhota: 0.75, medium: 1,
  large: 1.4, big: 1.4, bari: 1.4, bara: 1.4, bada: 1.4, badi: 1.4,
};
const PLURAL_WORDS = new Set(["anday", "ande", "rotiyan", "rotian", "samosay", "samose", "pakoray", "pakode", "papay", "paapay", "parathay"]);

const NUM = `(\\d+(?:\\.\\d+)?(?:\\s*\\/\\s*\\d+)?|[½¼¾⅓⅔]|${Object.keys(WORD_NUMS).sort((a, b) => b.length - a.length).join("|")})`;
const UNITS = "cups?|bowls?|plates?|slices?|pieces?|pcs|scoops?|glass(?:es)?|mugs?|cans?|tsp|tbsp|teaspoons?|tablespoons?|spoons?|chamach|servings?|katori|pyala|pyali|handfuls?|grams?|gms?|g|ml";
const SIZES = Object.keys(SIZE_MULT).join("|");
// "<number> [size] [unit] [of] [size]" right before the food, e.g. "2", "1 cup", "half plate", "150 g", "1 large bowl of"
const BEFORE_RE = new RegExp(`(?:^|[\\s,(])${NUM}\\s*(?:x\\s*)?(?:(${SIZES})\\s+)?(?:(${UNITS})\\b\\.?\\s*(?:of\\s+|ki\\s+|ka\\s+|ke\\s+)?)?(?:(${SIZES})\\s+)?$`);
const SIZE_ONLY_RE = new RegExp(`(?:^|\\s)(${SIZES})\\s*$`);
// "<food> 2 cups" / "chai ke do cup" (needs a unit so it can't steal the next food's number)
const AFTER_RE = new RegExp(`^\\s*(?:ke\\s+|ki\\s+|ka\\s+)?${NUM}\\s*(${UNITS})\\b`);
const AFTER_X_RE = /^\s*[x×]\s*(\d+(?:\.\d+)?)/;
// "without sugar", "no mayo", "bina cheeni", "pheeki"... are removed so they aren't counted as food
const NEGATION_RE = /\b(?:without|no|bina|baghair|beghair)\s+(?:any\s+|extra\s+)?(?:sugar|cheeni|chini|shakar|mayo|mayonnaise|oil|ghee|butter|makhan)\b|\bsugar[\s-]?free\b|\bph?eek[ia]\b/g;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ALIASES = FOOD_DB.flatMap((def) => def.aliases.map((alias) => ({ def, re: new RegExp(`\\b${escapeRe(alias).replace(/ /g, "\\s+")}(s|es)?\\b`, "g") })));

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

function toQty(raw: string): number {
  const s = raw.trim();
  if (FRACTIONS[s] !== undefined) return FRACTIONS[s];
  if (Object.prototype.hasOwnProperty.call(WORD_NUMS, s)) return WORD_NUMS[s];
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return Number(frac[2]) ? Number(frac[1]) / Number(frac[2]) : 1;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function scale(t: MacroTotals, q: number): MacroTotals {
  return { calories: round1(t.calories * q), protein: round1(t.protein * q), carbs: round1(t.carbs * q), fat: round1(t.fat * q), fiber: round1(t.fiber * q) };
}

export function sumMacros(items: MacroTotals[]): MacroTotals {
  return items.reduce((acc, x) => ({
    calories: round1(acc.calories + x.calories), protein: round1(acc.protein + x.protein), carbs: round1(acc.carbs + x.carbs),
    fat: round1(acc.fat + x.fat), fiber: round1(acc.fiber + x.fiber),
  }), { ...ZERO });
}

export type ParseResult = { foods: ParsedFood[]; totals: MacroTotals; assumptions: string[] };

export function parseMeal(input: string): ParseResult {
  let text = ` ${input.toLowerCase().replace(/[’'`]/g, "").replace(/\s+/g, " ")} `;
  const noSugar: [number, number][] = [];
  text = text.replace(NEGATION_RE, (match: string, offset: number) => {
    if (/sugar|cheeni|chini|shakar|eek/.test(match)) noSugar.push([offset, offset + match.length]);
    return " ".repeat(match.length);
  });

  type Hit = { start: number; end: number; def: FoodDef; plural: boolean; word: string };
  const hits: Hit[] = [];
  for (const { def, re } of ALIASES) {
    re.lastIndex = 0;
    let found: RegExpExecArray | null;
    while ((found = re.exec(text)) !== null) {
      hits.push({ start: found.index, end: found.index + found[0].length, def, plural: Boolean(found[1]), word: found[0] });
    }
  }
  hits.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);
  const chosen: Hit[] = [];
  for (const h of hits) if (!chosen.some((c) => h.start < c.end && h.end > c.start)) chosen.push(h);
  chosen.sort((a, b) => a.start - b.start);

  const assumptions = new Set<string>();
  const foods: ParsedFood[] = chosen.map((h, i) => {
    const before = text.slice(Math.max(0, h.start - 40, i > 0 ? chosen[i - 1].end : 0), h.start);
    const after = text.slice(h.end, Math.min(text.length, h.end + 24, i < chosen.length - 1 ? chosen[i + 1].start : text.length));
    let qty = 1;
    let mult = 1;
    let unitWord = "";
    const b = BEFORE_RE.exec(before);
    if (b) {
      qty = toQty(b[1]);
      unitWord = b[3] ?? "";
      const size = b[2] ?? b[4];
      if (size) mult = SIZE_MULT[size] ?? 1;
    } else {
      const sizeOnly = SIZE_ONLY_RE.exec(before);
      if (sizeOnly) mult = SIZE_MULT[sizeOnly[1]] ?? 1;
      const a = AFTER_RE.exec(after);
      const x = a ? null : AFTER_X_RE.exec(after);
      if (a) { qty = toQty(a[1]); unitWord = a[2] ?? ""; }
      else if (x) qty = Number(x[1]) || 1;
      else if (h.plural || PLURAL_WORDS.has(h.word.trim())) qty = 2;
    }
    if (/^(g|gms?|grams?|ml)$/.test(unitWord)) {
      if (h.def.per) qty = qty / h.def.per;
      else { qty = 1; assumptions.add(`Counted 1 ${h.def.unit} of ${h.def.name}`); }
    }

    let macros = h.def.macros;
    const sugar = h.def.sugarTsp ?? 0;
    const sameClause = (s: number, e: number) => {
      const gap = s >= h.end ? text.slice(h.end, s) : text.slice(e, h.start);
      return gap.length < 30 && !/[,.;]|\b(?:aur|and|plus)\b/.test(gap);
    };
    if (sugar && noSugar.some(([s, e]) => sameClause(s, e))) {
      macros = { ...macros, calories: macros.calories - 16 * sugar, carbs: macros.carbs - 4 * sugar };
      assumptions.add(`${h.def.name}: no sugar`);
    } else if (h.def.note) {
      assumptions.add(h.def.note);
    }
    const quantity = round2(qty * mult);
    return { name: h.def.name, quantity, unit: h.def.unit, totals: scale(macros, quantity) };
  });

  return { foods, totals: sumMacros(foods.map((f) => f.totals)), assumptions: [...assumptions].slice(0, 4) };
}
