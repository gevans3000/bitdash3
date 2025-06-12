import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Candle } from '@/lib/types';

const CACHE_KEY = 'candles';
let cached: { data: Candle[]; ts: number } | undefined;
const CACHE_TTL = 30_000; // 30s

async function fetchBinance(): Promise<Candle[]> {
  const url =
    'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=120';
  const res = await fetch(url, { next: { revalidate: CACHE_TTL / 1000 } });
  const json = (await res.json()) as any[];
  return json.map((k) => ({
    open: +k[1],
    high: +k[2],
    low: +k[3],
    close: +k[4],
    volume: +k[5],
  }));
}

export async function GET(_req: NextRequest) {
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }
  const candles = await fetchBinance();
  cached = { data: candles, ts: Date.now() };
  return NextResponse.json(candles);
}
