import { StatusBar } from 'expo-status-bar';
import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LookupError, type LookupFailure, lookup } from './src/api';
import {
  dayKey,
  type Entry,
  isBarcode,
  keepRecent,
  newEntry,
  type Product,
  quickAmounts,
  scale,
  totals,
  unitOf,
} from './src/food';
import { numberLocale, t } from './src/i18n';
import { Scanner } from './src/scanner/Scanner';
import { loadDiary, saveDiary } from './src/storage';
import { type Colors, useColors } from './src/theme';

const SAMPLES = [
  { name: 'Nutella', barcode: '3017620422003' },
  { name: 'Coca-Cola', barcode: '5449000000996' },
  { name: 'Barilla n.5', barcode: '8076800195057' },
];
const SOURCE = 'https://github.com/RR2000/food-calc-app';

type Lookup =
  | { status: 'idle' }
  | { status: 'loading'; barcode: string }
  | { status: 'error'; barcode: string; kind: LookupFailure }
  | { status: 'found'; product: Product };

const num = (n: number, digits = 0) => n.toLocaleString(numberLocale, { maximumFractionDigits: digits });

export default function App() {
  return (
    <SafeAreaProvider>
      <Home />
    </SafeAreaProvider>
  );
}

function Home() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<'add' | 'today'>('add');
  const [toast, setToast] = useState<string | null>(null);
  const today = dayKey(new Date());

  useEffect(() => {
    loadDiary().then((saved) => {
      setEntries(saved);
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) saveDiary(keepRecent(entries, today));
  }, [entries, loaded, today]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const todays = entries.filter((e) => e.day === today);
  const sum = totals(todays);

  const add = (product: Product, amount: number) => {
    const entry = newEntry(product, amount, today, t.unknownProduct);
    setEntries((prev) => [entry, ...prev]);
    setToast(t.added(entry.name));
  };
  const remove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const clearToday = () => setEntries((prev) => prev.filter((e) => e.day !== today));

  const addPane = <AddFood s={s} c={c} onAdd={add} />;
  const todayPane = <Diary s={s} c={c} entries={todays} onRemove={remove} onClear={clearToday} />;

  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={[s.page, { maxWidth: wide ? 1040 : 560 }]}>
          <View style={s.header}>
            <View style={s.logo}>
              <Text style={s.logoText}>kcal</Text>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.title} accessibilityRole="header">
                foodcalc
              </Text>
              <Text style={s.muted}>{t.tagline}</Text>
            </View>
          </View>

          <View style={[s.card, s.summary]}>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.label}>{t.today}</Text>
              <Text style={s.total}>
                {num(sum.kcal)} <Text style={s.totalUnit}>{t.kcal}</Text>
              </Text>
            </View>
            <View style={s.macros}>
              <Macro s={s} label={t.protein} value={sum.protein} />
              <Macro s={s} label={t.carbs} value={sum.carbs} />
              <Macro s={s} label={t.fat} value={sum.fat} />
            </View>
          </View>

          {wide ? (
            <View style={s.columns}>
              <View style={s.column}>
                <Text style={s.section}>{t.addFood}</Text>
                {addPane}
              </View>
              <View style={s.column}>
                <Text style={s.section}>
                  {t.today} · {t.items(todays.length)}
                </Text>
                {todayPane}
              </View>
            </View>
          ) : (
            <>
              <View style={s.tabs} accessibilityRole="tablist">
                {(['add', 'today'] as const).map((key) => (
                  <Pressable
                    key={key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: tab === key }}
                    onPress={() => setTab(key)}
                    style={[s.tab, tab === key && s.tabOn]}
                  >
                    <Text style={[s.tabText, tab === key && s.tabTextOn]}>
                      {key === 'add' ? t.addFood : `${t.today} (${todays.length})`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {tab === 'add' ? addPane : todayPane}
            </>
          )}

          <Text style={[s.muted, s.footer]}>
            {t.footer}{' '}
            <Text style={s.link} accessibilityRole="link" onPress={() => Linking.openURL(SOURCE)}>
              {t.source}
            </Text>
          </Text>
        </View>
      </ScrollView>
      {toast && (
        <View style={s.toast} pointerEvents="none" accessibilityLiveRegion="polite">
          <Text style={s.toastText} numberOfLines={2}>
            {toast}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function Macro({ s, label, value }: { s: Styles; label: string; value: number }) {
  return (
    <View style={s.macro}>
      <Text style={s.macroValue}>{num(value)} g</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

function AddFood({ s, c, onAdd }: { s: Styles; c: Colors; onAdd: (p: Product, amount: number) => void }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<Lookup>({ status: 'idle' });
  const request = useRef(0);

  const find = async (barcode: string) => {
    setCode(barcode);
    if (!isBarcode(barcode)) {
      setResult({ status: 'error', barcode, kind: 'invalid' });
      return;
    }
    const id = ++request.current;
    setResult({ status: 'loading', barcode });
    try {
      const product = await lookup(barcode);
      if (id === request.current) setResult({ status: 'found', product });
    } catch (e) {
      if (id === request.current) {
        setResult({ status: 'error', barcode, kind: e instanceof LookupError ? e.kind : 'unavailable' });
      }
    }
  };

  return (
    <View style={[s.card, { gap: 14 }]}>
      <Scanner onCode={find} />

      <View style={s.orRow}>
        <View style={s.rule} />
        <Text style={s.muted}>{t.orType}</Text>
        <View style={s.rule} />
      </View>

      <View style={s.inputRow}>
        <TextInput
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 14))}
          onSubmitEditing={() => find(code)}
          placeholder={t.barcodePlaceholder}
          placeholderTextColor={c.muted}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="search"
          maxLength={14}
          accessibilityLabel={t.orType}
          style={[s.input, { flex: 1 }]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => find(code)}
          disabled={code.length === 0}
          style={({ pressed }) => [s.secondary, { opacity: code.length === 0 ? 0.5 : pressed ? 0.8 : 1 }]}
        >
          <Text style={s.secondaryText}>{t.lookUp}</Text>
        </Pressable>
      </View>

      <View style={s.chips}>
        <Text style={s.muted}>{t.tryOne}</Text>
        {SAMPLES.map((p) => (
          <Pressable key={p.barcode} accessibilityRole="button" onPress={() => find(p.barcode)} style={s.chip}>
            <Text style={s.chipText}>{p.name}</Text>
          </Pressable>
        ))}
      </View>

      {result.status === 'loading' && (
        <View style={[s.notice, { flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
          <ActivityIndicator color={c.accent} />
          <Text style={s.text}>
            {t.lookingUp} {result.barcode}…
          </Text>
        </View>
      )}
      {result.status === 'error' && (
        <View style={[s.notice, { backgroundColor: c.dangerSoft }]} accessibilityLiveRegion="polite">
          <Text style={{ color: c.danger, lineHeight: 20 }}>
            {result.barcode && result.kind !== 'invalid' ? `${result.barcode}: ` : ''}
            {t[result.kind === 'not-found' ? 'notFound' : result.kind]}
          </Text>
        </View>
      )}
      {result.status === 'found' && (
        <ProductCard
          key={result.product.barcode}
          s={s}
          product={result.product}
          onAdd={(amount) => {
            onAdd(result.product, amount);
            setResult({ status: 'idle' });
            setCode('');
          }}
        />
      )}
    </View>
  );
}

function ProductCard({ s, product, onAdd }: { s: Styles; product: Product; onAdd: (amount: number) => void }) {
  const unit = unitOf(product);
  const [amount, setAmount] = useState('100');
  const value = Number(amount);
  const valid = Number.isFinite(value) && value > 0 && value <= 5000;
  const p = product.per100g;
  const card = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    // on a phone the card opens below the fold: bring it into view (the web View is a DOM element)
    if (Platform.OS === 'web') {
      (card.current as unknown as HTMLElement | null)?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  return (
    <View style={s.product} ref={card}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={s.image} resizeMode="contain" accessibilityIgnoresInvertColors />
        ) : (
          <View style={[s.image, s.imagePlaceholder]} />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.productName} numberOfLines={3}>
            {product.name ?? t.unknownProduct}
          </Text>
          <Text style={s.muted} numberOfLines={1}>
            {[product.brand, product.quantity].filter(Boolean).join(' · ') || product.barcode}
          </Text>
          {p.kcal != null ? (
            <Text style={s.text}>
              <Text style={s.strong}>{num(p.kcal)} kcal</Text> {t.per100(unit)}
            </Text>
          ) : (
            <Text style={s.muted}>{t.noKcal}</Text>
          )}
        </View>
      </View>

      <View style={s.facts}>
        {(
          [
            [t.protein, p.protein],
            [t.carbs, p.carbs],
            [t.sugars, p.sugars],
            [t.fat, p.fat],
            [t.salt, p.salt],
          ] as const
        ).map(([label, v]) => (
          <View key={label} style={s.fact}>
            <Text style={s.factValue}>{v == null ? '–' : `${num(v, 1)} g`}</Text>
            <Text style={s.macroLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={s.label}>{t.howMuch}</Text>
      <View style={s.chips}>
        {quickAmounts(product).map((a) => {
          const on = String(a) === amount;
          return (
            <Pressable
              key={a}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setAmount(String(a))}
              style={[s.chip, on && s.chipOn]}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>
                {a} {unit}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={s.inputRow}>
        <View style={[s.input, s.amountBox]}>
          <TextInput
            value={amount}
            onChangeText={(text) => setAmount(text.replace(/[^\d]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={4}
            accessibilityLabel={t.howMuch}
            style={s.amountInput}
          />
          <Text style={s.muted}>{unit}</Text>
        </View>
        <Text style={[s.strong, { flexShrink: 1 }]}>= {valid ? num(scale(p.kcal, value)) : '–'} kcal</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!valid}
        onPress={() => onAdd(value)}
        style={({ pressed }) => [s.primary, { opacity: !valid ? 0.5 : pressed ? 0.85 : 1 }]}
      >
        <Text style={s.primaryText}>{t.add}</Text>
      </Pressable>
    </View>
  );
}

function Diary({
  s,
  c,
  entries,
  onRemove,
  onClear,
}: {
  s: Styles;
  c: Colors;
  entries: Entry[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!confirm) return;
    const timer = setTimeout(() => setConfirm(false), 3000);
    return () => clearTimeout(timer);
  }, [confirm]);

  if (entries.length === 0) {
    return (
      <View style={[s.card, s.empty]}>
        <Text style={[s.muted, { textAlign: 'center', lineHeight: 20 }]}>{t.emptyDay}</Text>
      </View>
    );
  }
  return (
    <View style={[s.card, { paddingVertical: 4 }]}>
      {entries.map((e, i) => (
        <View key={e.id} style={[s.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.text} numberOfLines={1}>
              {e.name}
            </Text>
            <Text style={s.muted} numberOfLines={1}>
              {[e.brand, `${e.amount} ${e.unit}`].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Text style={s.strong}>{num(scale(e.per100g.kcal, e.amount))} kcal</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t.remove} ${e.name}`}
            onPress={() => onRemove(e.id)}
            hitSlop={8}
            style={s.remove}
          >
            <Text style={s.removeText}>×</Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() => (confirm ? (onClear(), setConfirm(false)) : setConfirm(true))}
        style={s.clear}
      >
        <Text style={{ color: c.danger, fontWeight: '600' }}>{confirm ? t.clearConfirm : t.clearDay}</Text>
      </Pressable>
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function makeStyles(c: Colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48 },
    page: { width: '100%', gap: 16 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logo: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: { color: c.accentText, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
    title: { color: c.text, fontSize: 24, fontWeight: '800' },
    text: { color: c.text, fontSize: 16, lineHeight: 22 },
    strong: { color: c.text, fontSize: 16, fontWeight: '700' },
    muted: { color: c.muted, fontSize: 14, lineHeight: 20 },
    label: { color: c.muted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    section: { color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
    card: { backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16 },
    summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    total: { color: c.text, fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'] },
    totalUnit: { fontSize: 18, fontWeight: '600', color: c.muted },
    macros: { flexDirection: 'row', gap: 8 },
    macro: { backgroundColor: c.surfaceAlt, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, minWidth: 78 },
    macroValue: { color: c.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
    macroLabel: { color: c.muted, fontSize: 12 },
    columns: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
    column: { flex: 1, minWidth: 0 },
    tabs: { flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: 14, padding: 4 },
    tab: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    tabOn: { backgroundColor: c.surface, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' },
    tabText: { color: c.muted, fontSize: 15, fontWeight: '600' },
    tabTextOn: { color: c.text },
    orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rule: { flex: 1, height: 1, backgroundColor: c.border },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    input: {
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingHorizontal: 14,
      color: c.text,
      fontSize: 17,
      minWidth: 0,
      fontVariant: ['tabular-nums'],
    },
    secondary: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.accentSoft,
    },
    secondaryText: { color: c.text, fontSize: 16, fontWeight: '700' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
    chip: {
      minHeight: 36,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      justifyContent: 'center',
    },
    chipOn: { backgroundColor: c.accent, borderColor: c.accent },
    chipText: { color: c.text, fontSize: 14, fontWeight: '600' },
    chipTextOn: { color: c.accentText },
    notice: { borderRadius: 12, padding: 12, backgroundColor: c.surfaceAlt },
    product: { gap: 12, borderRadius: 14, backgroundColor: c.surfaceAlt, padding: 14 },
    productName: { color: c.text, fontSize: 17, fontWeight: '700', lineHeight: 22 },
    image: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#ffffff' },
    imagePlaceholder: { backgroundColor: c.border },
    facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    fact: { backgroundColor: c.surface, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, flexGrow: 1, flexBasis: '30%' },
    factValue: { color: c.text, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
    amountBox: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 130, backgroundColor: c.surface },
    amountInput: { flex: 1, minWidth: 0, color: c.text, fontSize: 17, paddingVertical: 10 },
    primary: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent },
    primaryText: { color: c.accentText, fontSize: 16, fontWeight: '700' },
    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
    remove: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceAlt,
    },
    removeText: { color: c.muted, fontSize: 20, lineHeight: 22 },
    clear: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 4 },
    footer: { textAlign: 'center', marginTop: 8 },
    link: { color: c.accent, textDecorationLine: 'underline' },
    toast: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 24,
      alignSelf: 'center',
      maxWidth: 480,
      marginHorizontal: 'auto',
      backgroundColor: c.text,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    toastText: { color: c.background, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  });
}
