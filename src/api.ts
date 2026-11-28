import { Platform } from 'react-native';
import { type Product, toProduct } from './food';

/**
 * Where the backend is. On the web the app and the API share the origin (nginx passes /api on), so the
 * path is enough; a phone build talks to the public demo unless EXPO_PUBLIC_API_URL says otherwise.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? '' : 'https://kcal.raoulrondinella.dev');

export type LookupFailure = 'not-found' | 'invalid' | 'unavailable';

export class LookupError extends Error {
  constructor(readonly kind: LookupFailure) {
    super(kind);
  }
}

export async function lookup(barcode: string, fetchFn: typeof fetch = fetch): Promise<Product> {
  let response: Response;
  try {
    response = await fetchFn(`${API_URL}/api/products/${encodeURIComponent(barcode)}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new LookupError('unavailable');
  }
  if (response.status === 404) throw new LookupError('not-found');
  if (response.status === 400) throw new LookupError('invalid');
  if (!response.ok) throw new LookupError('unavailable');
  let product: Product | null;
  try {
    product = toProduct(await response.json(), barcode);
  } catch {
    // not JSON: a proxy or error page answered instead of the backend
    product = null;
  }
  if (!product) throw new LookupError('unavailable');
  return product;
}
