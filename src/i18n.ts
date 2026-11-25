// English, or Italian when the device speaks Italian.

const en = {
  tagline: 'Calories from the barcode',
  today: 'Today',
  addFood: 'Add food',
  kcal: 'kcal',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  sugars: 'Sugars',
  salt: 'Salt',
  useCamera: 'Scan with the camera',
  startingCamera: 'Opening the camera…',
  pointCamera: 'Point the camera at the barcode',
  stopCamera: 'Stop',
  cameraDenied: 'The camera is blocked. Allow it in the browser settings, or type the barcode below.',
  cameraMissing: 'No camera here: type the barcode below.',
  cameraError: 'The camera did not start. Type the barcode below.',
  allowCamera: 'Allow the camera',
  orType: 'or type the barcode',
  barcodePlaceholder: 'e.g. 3017620422003',
  lookUp: 'Look up',
  tryOne: 'Try one:',
  lookingUp: 'Looking up',
  notFound: 'This barcode is not in Open Food Facts yet.',
  invalid: 'A barcode is 6 to 14 digits.',
  unavailable: 'Open Food Facts is not answering. Try again in a moment.',
  unknownProduct: 'Unnamed product',
  per100: (unit: string) => `per 100 ${unit}`,
  noKcal: 'Open Food Facts has no calories for this product.',
  howMuch: 'How much?',
  pack: 'pack',
  add: 'Add to today',
  added: (name: string) => `Added: ${name}`,
  emptyDay: 'Nothing yet today. Scan a product or type its barcode.',
  remove: 'Remove',
  clearDay: 'Clear today',
  clearConfirm: 'Tap again to clear',
  footer: 'Data from Open Food Facts (ODbL). Your diary stays on this device.',
  source: 'Source code',
  items: (n: number) => (n === 1 ? '1 item' : `${n} items`),
};

const it: typeof en = {
  tagline: 'Le calorie dal codice a barre',
  today: 'Oggi',
  addFood: 'Aggiungi',
  kcal: 'kcal',
  protein: 'Proteine',
  carbs: 'Carboidrati',
  fat: 'Grassi',
  sugars: 'Zuccheri',
  salt: 'Sale',
  useCamera: 'Scansiona con la fotocamera',
  startingCamera: 'Apro la fotocamera…',
  pointCamera: 'Inquadra il codice a barre',
  stopCamera: 'Ferma',
  cameraDenied: 'La fotocamera è bloccata. Consentila nelle impostazioni del browser, o scrivi il codice qui sotto.',
  cameraMissing: 'Qui non c’è una fotocamera: scrivi il codice qui sotto.',
  cameraError: 'La fotocamera non è partita. Scrivi il codice qui sotto.',
  allowCamera: 'Consenti la fotocamera',
  orType: 'oppure scrivi il codice',
  barcodePlaceholder: 'es. 3017620422003',
  lookUp: 'Cerca',
  tryOne: 'Prova:',
  lookingUp: 'Cerco',
  notFound: 'Questo codice non è ancora su Open Food Facts.',
  invalid: 'Un codice a barre ha da 6 a 14 cifre.',
  unavailable: 'Open Food Facts non risponde. Riprova tra poco.',
  unknownProduct: 'Prodotto senza nome',
  per100: (unit: string) => `per 100 ${unit}`,
  noKcal: 'Open Food Facts non ha le calorie di questo prodotto.',
  howMuch: 'Quanto?',
  pack: 'confezione',
  add: 'Aggiungi a oggi',
  added: (name: string) => `Aggiunto: ${name}`,
  emptyDay: 'Ancora niente oggi. Scansiona un prodotto o scrivi il suo codice.',
  remove: 'Togli',
  clearDay: 'Svuota oggi',
  clearConfirm: 'Tocca ancora per svuotare',
  footer: 'Dati di Open Food Facts (ODbL). Il diario resta su questo dispositivo.',
  source: 'Codice sorgente',
  items: (n: number) => (n === 1 ? '1 voce' : `${n} voci`),
};

export type Texts = typeof en;

export function textsFor(language: string | undefined): Texts {
  return language?.toLowerCase().startsWith('it') ? it : en;
}

function deviceLanguage(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

const device = typeof navigator !== 'undefined' && navigator.language ? navigator.language : deviceLanguage();

export const t = textsFor(device);

/** Numbers are written in the same language as the texts. */
export const numberLocale = t === it ? 'it-IT' : 'en-US';
