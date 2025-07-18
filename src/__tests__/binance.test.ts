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
    // @ts-expect-error - jest adds fetch during tests
    delete global.fetch;
    delete process.env.BINANCE_BASE_URL;
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

  it('uses custom base url when provided', async () => {
    process.env.BINANCE_BASE_URL = 'https://custom.com/api/v3';
    await getBinanceCandles();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://custom.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=100'
    );
  });
});
