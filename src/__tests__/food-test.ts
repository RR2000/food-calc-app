import {
  dayKey,
  type Entry,
  isBarcode,
  keepRecent,
  newEntry,
  parseDiary,
  parseQuantity,
  type Product,
  quickAmounts,
  scale,
  toPer100g,
  toProduct,
  totals,
  unitOf,
} from '../food';

const product = (over: Partial<Product> = {}): Product => ({
  barcode: '3017620422003',
  name: 'Spread',
  brand: 'Brand',
  quantity: '400 g',
  imageUrl: null,
  per100g: { kcal: 539, protein: 6.3, carbs: 57.5, sugars: 56.3, fat: 30.9, salt: 0.1 },
  ...over,
});

describe('barcodes', () => {
  it('accepts 6 to 14 digits only', () => {
    expect(isBarcode('3017620422003')).toBe(true);
    expect(isBarcode('12345678')).toBe(true);
    expect(isBarcode('12345')).toBe(false);
    expect(isBarcode('123456789012345')).toBe(false);
    expect(isBarcode('30176204220a3')).toBe(false);
    expect(isBarcode('')).toBe(false);
  });
});

describe('package quantity', () => {
  it('reads grams, litres and multipacks', () => {
    expect(parseQuantity('400 g')).toEqual({ amount: 400, unit: 'g' });
    expect(parseQuantity('400 g e')).toEqual({ amount: 400, unit: 'g' });
    expect(parseQuantity('1 kg')).toEqual({ amount: 1000, unit: 'g' });
    expect(parseQuantity('33 cl')).toEqual({ amount: 330, unit: 'ml' });
    expect(parseQuantity('1,5 L')).toEqual({ amount: 1500, unit: 'ml' });
    expect(parseQuantity('6 x 125 g')).toEqual({ amount: 125, unit: 'g' });
    expect(parseQuantity('a box')).toBeNull();
    expect(parseQuantity(null)).toBeNull();
  });

  it('drinks are in ml', () => {
    expect(unitOf(product({ quantity: '330 ml' }))).toBe('ml');
    expect(unitOf(product({ quantity: null }))).toBe('g');
  });

  it('offers the whole package when it is a portion', () => {
    expect(quickAmounts(product({ quantity: '330 ml' }))).toEqual([50, 100, 150, 200, 330]);
    expect(quickAmounts(product({ quantity: '100 g' }))).toEqual([50, 100, 150, 200]);
    expect(quickAmounts(product({ quantity: '5 kg' }))).toEqual([50, 100, 150, 200]);
  });
});

describe('sums', () => {
  it('scales per 100 g to the amount eaten, missing values count as 0', () => {
    expect(scale(539, 150)).toBeCloseTo(808.5);
    expect(scale(null, 150)).toBe(0);
  });

  it('adds up the day', () => {
    const a = newEntry(product(), 50, '2026-11-25', 'x');
    const b = newEntry(product({ per100g: { ...product().per100g, kcal: 44, protein: null } }), 330, '2026-11-25', 'x');
    const sum = totals([a, b]);
    expect(sum.kcal).toBeCloseTo(269.5 + 145.2);
    expect(sum.protein).toBeCloseTo(3.15);
    expect(totals([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('a product without a name gets the fallback name', () => {
    expect(newEntry(product({ name: null }), 100, '2026-11-25', 'Unnamed').name).toBe('Unnamed');
  });
});

describe('diary', () => {
  it('day keys are local dates', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('keeps only the last 30 days', () => {
    const at = (day: string) => ({ ...newEntry(product(), 100, day, 'x') });
    const kept = keepRecent([at('2026-11-25'), at('2026-10-27'), at('2026-10-26'), at('2026-11-26')], '2026-11-25');
    expect(kept.map((e) => e.day)).toEqual(['2026-11-25', '2026-10-27']);
  });

  it('reads back only well formed entries', () => {
    const good: Entry = newEntry(product(), 100, '2026-11-25', 'x');
    const json = JSON.stringify([good, { id: 'x' }, null, { ...good, amount: -1 }, { ...good, unit: 'kg' }]);
    expect(parseDiary(json)).toEqual([good]);
    expect(parseDiary('not json')).toEqual([]);
    expect(parseDiary('{"a":1}')).toEqual([]);
    expect(parseDiary(null)).toEqual([]);
  });
});

describe('first use and odd data', () => {
  it('an empty day sums to zeros, never NaN', () => {
    expect(totals(parseDiary(null))).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('a product with only the barcode becomes a product with nulls', () => {
    expect(toProduct({}, '9000000000001')).toEqual({
      barcode: '9000000000001',
      name: null,
      brand: null,
      quantity: null,
      imageUrl: null,
      per100g: { kcal: null, protein: null, carbs: null, sugars: null, fat: null, salt: null },
    });
    expect(toProduct({ barcode: '1', name: '  ', per100g: null }, '9')?.name).toBeNull();
  });

  it('what is not a product is null', () => {
    for (const data of [null, undefined, 'html', 42, []]) {
      expect(toProduct(data, '9000000000001')).toBeNull();
    }
  });

  it('nutrients that are not real numbers are unknown', () => {
    expect(toPer100g({ kcal: 'abc', protein: NaN, carbs: Infinity, sugars: -1, fat: 0, salt: 1.2 })).toEqual({
      kcal: null,
      protein: null,
      carbs: null,
      sugars: null,
      fat: 0,
      salt: 1.2,
    });
    expect(toPer100g(undefined)).toEqual(toPer100g({}));
  });

  it('a diary saved with odd values reads back without NaN in the sums', () => {
    const good = newEntry(product(), 100, '2026-11-25', 'x');
    const odd = { ...good, id: 'odd', brand: undefined, per100g: { kcal: 'abc', protein: null } };
    const diary = parseDiary(JSON.stringify([odd, { ...good, id: 'nan', amount: 'NaN' }]));
    expect(diary).toHaveLength(1);
    expect(diary[0].brand).toBeNull();
    const sum = totals(diary);
    expect(Object.values(sum).every(Number.isFinite)).toBe(true);
    expect(sum.kcal).toBe(0);
  });
});
