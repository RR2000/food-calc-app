// Pure logic of the app: products, the food diary and the sums. No React here, so it is easy to test.

export type Per100g = {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  sugars: number | null;
  fat: number | null;
  salt: number | null;
};

/** As the backend answers it (GET /api/products/{barcode}). */
export type Product = {
  barcode: string;
  name: string | null;
  brand: string | null;
  quantity: string | null;
  imageUrl: string | null;
  per100g: Per100g;
};

export type Unit = 'g' | 'ml';

/** One thing eaten: what, how much, which day (local date, YYYY-MM-DD). */
export type Entry = {
  id: string;
  day: string;
  barcode: string;
  name: string;
  brand: string | null;
  amount: number;
  unit: Unit;
  per100g: Per100g;
};

export type Totals = { kcal: number; protein: number; carbs: number; fat: number };

/** What a barcode looks like: 6 to 14 digits (EAN-13, EAN-8, UPC-A, UPC-E, in-store codes). */
export function isBarcode(text: string): boolean {
  return /^\d{6,14}$/.test(text);
}

/** "400 g", "33 cl", "1,5 L", "6 x 125 g"... -> amount of one package in g or ml, or null. */
export function parseQuantity(quantity: string | null): { amount: number; unit: Unit } | null {
  if (!quantity) return null;
  const m = quantity
    .toLowerCase()
    .replace(',', '.')
    .match(/(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|dl|l)\b/);
  if (!m) return null;
  const value = Number(m[2]);
  const factor: Record<string, [number, Unit]> = {
    kg: [1000, 'g'],
    g: [1, 'g'],
    l: [1000, 'ml'],
    dl: [100, 'ml'],
    cl: [10, 'ml'],
    ml: [1, 'ml'],
  };
  const [f, unit] = factor[m[3]];
  const amount = Math.round(value * f);
  return amount > 0 ? { amount, unit } : null;
}

export function unitOf(product: Product): Unit {
  return parseQuantity(product.quantity)?.unit ?? 'g';
}

/** Amounts offered with one tap: the usual ones, plus the whole package when it is a portion. */
export function quickAmounts(product: Product): number[] {
  const amounts = [50, 100, 150, 200];
  const pack = parseQuantity(product.quantity);
  if (pack && pack.amount <= 1000 && !amounts.includes(pack.amount)) {
    amounts.push(pack.amount);
  }
  return amounts.sort((a, b) => a - b);
}

/** Value per 100 g scaled to the amount eaten. */
export function scale(per100: number | null, amount: number): number {
  return per100 == null ? 0 : (per100 * amount) / 100;
}

export function totals(entries: Entry[]): Totals {
  return entries.reduce<Totals>(
    (t, e) => ({
      kcal: t.kcal + scale(e.per100g.kcal, e.amount),
      protein: t.protein + scale(e.per100g.protein, e.amount),
      carbs: t.carbs + scale(e.per100g.carbs, e.amount),
      fat: t.fat + scale(e.per100g.fat, e.amount),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function dayKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function newEntry(product: Product, amount: number, day: string, fallbackName: string): Entry {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    day,
    barcode: product.barcode,
    name: product.name ?? fallbackName,
    brand: product.brand,
    amount,
    unit: unitOf(product),
    per100g: product.per100g,
  };
}

/** The diary keeps the last `days` days; older entries are dropped when it is saved. */
export function keepRecent(entries: Entry[], today: string, days = 30): Entry[] {
  const limit = new Date(`${today}T12:00:00`);
  limit.setDate(limit.getDate() - days);
  const from = dayKey(limit);
  return entries.filter((e) => e.day > from && e.day <= today);
}

/** Entries read back from storage: anything that is not a well formed entry is skipped. */
export function parseDiary(json: string | null): Entry[] {
  if (!json) return [];
  try {
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (e): e is Entry =>
        e != null &&
        typeof e.id === 'string' &&
        typeof e.day === 'string' &&
        typeof e.name === 'string' &&
        typeof e.amount === 'number' &&
        e.amount > 0 &&
        (e.unit === 'g' || e.unit === 'ml') &&
        e.per100g != null &&
        typeof e.per100g === 'object',
    );
  } catch {
    return [];
  }
}
