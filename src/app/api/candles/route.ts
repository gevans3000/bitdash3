import { NextResponse } from 'next/server';
import { getBinanceCandles } from '@/lib/binance';

export const revalidate = 60;

export async function GET() {
  try {
    const candles = await getBinanceCandles();
    return NextResponse.json(candles);
  } catch {
    return NextResponse.json(
      { error: 'upstream_unavailable' },
      { status: 502 }
    );
  }
}
