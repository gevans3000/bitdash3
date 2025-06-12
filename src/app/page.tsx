'use client';

import { SignalCard } from '@/components/SignalCard';
import { IndicatorCard } from '@/components/IndicatorCard';
import MarketChart from '@/components/MarketChart';
import { getSignal } from '@/lib/signal';
import { Candle } from '@/lib/types';
import { useEffect, useState } from 'react';

function useAutoRefresh<T>(fetcher: () => Promise<T>, interval = 15_000) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetcher();
      if (mounted) setData(res);
    }
    load();
    const id = setInterval(load, interval);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [fetcher, interval]);
  return data;
}

async function fetchCandles() {
  const res = await fetch('/api/candles');
  if (!res.ok) throw new Error('api error');
  return (await res.json()) as Candle[];
}

export default function Page() {
  const candles = useAutoRefresh(fetchCandles);
  if (!candles) return null;
  const signal = getSignal(candles);
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="space-y-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-center">BitDash</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignalCard signal={signal} />
          <IndicatorCard candles={candles} />
        </div>
        <div className="rounded-xl bg-white/5 p-4 shadow-[var(--tw-shadow-elevation-medium)]">
          <MarketChart />
        </div>
      </div>
    </main>
  );
}
