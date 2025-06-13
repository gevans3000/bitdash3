import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'btc_onchain.json');
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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
    console.error('Failed to load on-chain cache:', e);
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
    console.error('Failed to save on-chain cache:', e);
  }
}

export async function GET() {
  try {
    const res = await fetch('https://api.blockchain.info/stats?cors=true', { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const json = await res.json();
    const data = {
      tx_count: json.n_tx,
      mempool_transactions: json.mempool_transactions,
      total_fees_btc: json.total_fees_btc,
      timestamp: Date.now(),
    };
    saveCache(data);
    return NextResponse.json(data);
  } catch (err) {
    console.warn('On-chain API failed, using cache or mock:', err);
    const cached = loadCache();
    if (cached) return NextResponse.json(cached);
    const mock = { tx_count: 0, mempool_transactions: 0, total_fees_btc: 0, timestamp: Date.now() };
    return NextResponse.json(mock);
  }
}
