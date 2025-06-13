import { GET } from '@/app/api/market-data/route';

describe('market-data API', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.reject(new Error('fail')) ) as unknown as typeof fetch;
  });

  afterEach(() => {
    // @ts-expect-error - jest adds fetch during tests
    delete global.fetch;
  });

  it('returns candle timestamps in seconds', async () => {
    const req = new Request('http://localhost/api/market-data');
    const res = await GET(req);
    const data = await res.json();
    expect(Array.isArray(data.candles)).toBe(true);
    const sample = data.candles[0];
    expect(sample.time).toBeLessThan(1e11); // should be seconds, not ms
    expect(sample.closeTime).toBe(sample.time + 5 * 60);
  });

  it('includes open interest deltas', async () => {
    const req = new Request('http://localhost/api/market-data');
    const res = await GET(req);
    const data = await res.json();
    expect(data).toHaveProperty('openInterestDelta1h');
    expect(data).toHaveProperty('openInterestDelta24h');
  });
});
