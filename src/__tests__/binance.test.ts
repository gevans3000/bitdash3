import { getBinanceCandles } from '@/lib/binance';

describe('getBinanceCandles', () => {
  beforeEach(() => {
    const mockData = Array.from({ length: 100 }, (_, i) => [
      i * 1000,
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockData,
      })
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    // @ts-ignore
    delete global.fetch;
  });

  it('maps response to candle objects', async () => {
    const candles = await getBinanceCandles();
    expect(candles).toHaveLength(100);
    const sample = candles[0];
    expect(sample).toHaveProperty('time');
    expect(sample).toHaveProperty('open');
    expect(sample).toHaveProperty('high');
    expect(sample).toHaveProperty('low');
    expect(sample).toHaveProperty('close');
    expect(sample).toHaveProperty('volume');
  });
});
