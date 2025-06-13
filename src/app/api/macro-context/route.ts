import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'macro_context.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

interface FredResponse {
  observations: { date: string; value: string }[];
}

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.error('Failed to load macro cache:', e);
  }
  return null;
}

function saveCache(data: any) {
  try {
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ timestamp: Date.now(), data }),
      'utf8'
    );
  } catch (e) {
    console.error('Failed to save macro cache:', e);
  }
}

async function fetchSeries(id: string): Promise<FredResponse> {
  const key = process.env.FRED_API_KEY || '';
  const url =
    `https://api.stlouisfed.org/fred/series/observations?series_id=${id}` +
    `&api_key=${key}&file_type=json&sort_order=desc&limit=2`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`FRED ${id} status ${res.status}`);
  return (await res.json()) as FredResponse;
}

export async function GET() {
  try {
    const [fed, cpi, unemp] = await Promise.all([
      fetchSeries('FEDFUNDS'),
      fetchSeries('CPIAUCSL'),
      fetchSeries('UNRATE')
    ]);

    function parse(obs: FredResponse) {
      const [latest, previous] = obs.observations;
      const value = parseFloat(latest.value);
      const change = value - parseFloat(previous.value);
      const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
      return { date: latest.date, value, change, trend };
    }

    const data = {
      fedFundsRate: parse(fed),
      cpi: parse(cpi),
      unemployment: parse(unemp)
    };

    const insights = {
      fedFunds: data.fedFundsRate.trend === 'up' ? 'Rates rising' :
        data.fedFundsRate.trend === 'down' ? 'Rates falling' : 'Rates stable',
      inflation:
        data.cpi.trend === 'up'
          ? 'Inflation increasing'
          : data.cpi.trend === 'down'
            ? 'Inflation decreasing'
            : 'Inflation stable',
      employment:
        data.unemployment.trend === 'up'
          ? 'Job market weakening'
          : data.unemployment.trend === 'down'
            ? 'Job market improving'
            : 'Employment stable'
    };

    const payload = { updated: Date.now(), data, insights };
    saveCache(payload);
    return NextResponse.json(payload);
  } catch (err) {
    console.warn('Macro API failed, using cache or mock:', err);
    const cached = loadCache();
    if (cached) return NextResponse.json(cached);
    const mock = {
      updated: Date.now(),
      data: {
        fedFundsRate: { date: '', value: 0, change: 0, trend: 'flat' },
        cpi: { date: '', value: 0, change: 0, trend: 'flat' },
        unemployment: { date: '', value: 0, change: 0, trend: 'flat' }
      },
      insights: {
        fedFunds: 'No data',
        inflation: 'No data',
        employment: 'No data'
      }
    };
    return NextResponse.json(mock);
  }
}
