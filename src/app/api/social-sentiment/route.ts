import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'social_sentiment.json');
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
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
    console.error('Failed to load sentiment cache:', e);
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
    console.error('Failed to save sentiment cache:', e);
  }
}

export async function GET() {
  try {
    const key = process.env.LUNARCRUSH_API_KEY || '';
    const url = `https://api.lunarcrush.com/v2?data=assets&symbol=BTC&key=${key}`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const json = await res.json();
    saveCache(json);
    return NextResponse.json(json);
  } catch (err) {
    console.warn('Sentiment API failed, using cache or mock:', err);
    const cached = loadCache();
    if (cached) return NextResponse.json(cached);
    const mock = { symbol: 'BTC', alt_rank: 50, galaxy_score: 50, timestamp: Date.now() };
    return NextResponse.json(mock);
  }
}
