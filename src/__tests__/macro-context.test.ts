import { GET } from '@/app/api/macro-context/route';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'macro_context.json');

describe('macro-context API', () => {
  beforeEach(() => {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  });

  afterEach(() => {
    // @ts-expect-error jest adds fetch
    delete global.fetch;
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  });

  it('returns summarized macro data on success', async () => {
    const fed = { observations: [ { date: '2024-05-01', value: '5' }, { date: '2024-04-01', value: '4.5' } ] };
    const cpi = { observations: [ { date: '2024-05-01', value: '300' }, { date: '2024-04-01', value: '299' } ] };
    const unemp = { observations: [ { date: '2024-05-01', value: '3.9' }, { date: '2024-04-01', value: '3.8' } ] };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => fed })
      .mockResolvedValueOnce({ ok: true, json: async () => cpi })
      .mockResolvedValueOnce({ ok: true, json: async () => unemp }) as unknown as typeof fetch;

    const res = await GET(new Request('http://localhost/api/macro-context'));
    const data = await res.json();
    expect(data.data.fedFundsRate.value).toBe(5);
    expect(data.insights.fedFunds).toMatch(/rising/);
  });

  it('falls back to cache when fetch fails', async () => {
    const cached = { cached: true };
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), data: cached }));

    global.fetch = jest.fn(() => Promise.reject(new Error('fail'))) as unknown as typeof fetch;
    const res = await GET(new Request('http://localhost/api/macro-context'));
    const json = await res.json();
    expect(json.cached).toBe(true);
  });
});
