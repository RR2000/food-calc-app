import { LookupError, lookup } from '../api';

const answer = (status: number, body: unknown = {}) =>
  jest.fn().mockResolvedValue({ status, ok: status >= 200 && status < 300, json: async () => body });

describe('lookup', () => {
  it('asks the backend for the barcode', async () => {
    const fetchFn = answer(200, { barcode: '5449000000996', name: 'Cola' });
    const product = await lookup('5449000000996', fetchFn as unknown as typeof fetch);
    expect(product.name).toBe('Cola');
    expect(fetchFn.mock.calls[0][0]).toMatch(/\/api\/products\/5449000000996$/);
  });

  it.each([
    [404, 'not-found'],
    [400, 'invalid'],
    [502, 'unavailable'],
  ])('HTTP %i is %s', async (status, kind) => {
    await expect(lookup('5449000000996', answer(status) as unknown as typeof fetch)).rejects.toEqual(
      new LookupError(kind as never),
    );
  });

  it('a product without nutrients comes back with nulls, never undefined', async () => {
    const product = await lookup('5449000000996', answer(200, { barcode: '5449000000996' }) as unknown as typeof fetch);
    expect(product.name).toBeNull();
    expect(product.per100g.kcal).toBeNull();
  });

  it('an answer that is not a product (or not JSON) is "unavailable"', async () => {
    await expect(lookup('5449000000996', answer(200, null) as unknown as typeof fetch)).rejects.toMatchObject({
      kind: 'unavailable',
    });
    const html = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    });
    await expect(lookup('5449000000996', html as unknown as typeof fetch)).rejects.toMatchObject({
      kind: 'unavailable',
    });
  });

  it('no network is "unavailable"', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(lookup('5449000000996', fetchFn as unknown as typeof fetch)).rejects.toMatchObject({
      kind: 'unavailable',
    });
  });
});
