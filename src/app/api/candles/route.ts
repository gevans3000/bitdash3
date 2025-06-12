import { NextResponse } from 'next/server';
import { getBinanceCandles } from '@/lib/binance';

export const revalidate = 60;

export async function GET() {
  try {
    const candles = await getBinanceCandles();
    return NextResponse.json(candles);
  } catch (err) {
    console.error('getBinanceCandles failed', err);
    const body: { error: string; detail?: string } = {
      error: 'upstream_unavailable',
    };
    if (process.env.NODE_ENV === 'development' && err instanceof Error) {
      body.detail = err.message;
    }
    return NextResponse.json(body, { status: 502 });
  }
}
