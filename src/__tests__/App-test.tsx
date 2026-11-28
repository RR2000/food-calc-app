// The whole screen on first use: empty diary, then products with missing data. No network, no camera.
import { fireEvent, render, screen } from '@testing-library/react-native';
import App from '../../App';
import { t } from '../i18n';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// without a real device the provider waits for the insets forever: the library's own mock gives fixed ones
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../scanner/Scanner', () => ({ Scanner: () => null }));

const fetchMock = jest.fn();

beforeEach(async () => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  const storage = require('@react-native-async-storage/async-storage');
  await storage.clear();
});

const answer = (status: number, body: unknown) =>
  fetchMock.mockResolvedValueOnce({ status, ok: status >= 200 && status < 300, json: async () => body });

async function lookUp(barcode: string) {
  await fireEvent.changeText(screen.getByLabelText(t.orType), barcode);
  await fireEvent.press(screen.getByText(t.lookUp));
}

describe('first use', () => {
  it('an empty diary shows zeros and the empty day message', async () => {
    await render(<App />);
    await fireEvent.press(await screen.findByText(`${t.today} (0)`));
    expect(await screen.findByText(t.emptyDay)).toBeTruthy();
    expect(screen.queryByText(/NaN|undefined/)).toBeNull();
  });

  it('a product with only the barcode can be shown and added', async () => {
    await render(<App />);
    answer(200, { barcode: '9000000000001' });
    await lookUp('9000000000001');
    expect(await screen.findByText(t.unknownProduct)).toBeTruthy();
    expect(screen.getByText(t.noKcal)).toBeTruthy();
    expect(screen.getAllByText('–').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByText(t.add));
    await fireEvent.press(await screen.findByText(`${t.today} (1)`));
    expect(await screen.findByText(t.unknownProduct)).toBeTruthy();
    expect(screen.queryByText(/NaN|undefined/)).toBeNull();
  });

  it('an answer that is not a product is a clear message, not a crash', async () => {
    await render(<App />);
    answer(200, '<html>');
    await lookUp('9000000000002');
    expect(await screen.findByText(t.unavailable, { exact: false })).toBeTruthy();
  });

  it('an unknown barcode says so', async () => {
    await render(<App />);
    answer(404, { error: 'product not found' });
    await lookUp('9000000000003');
    expect(await screen.findByText(t.notFound, { exact: false })).toBeTruthy();
  });
});
