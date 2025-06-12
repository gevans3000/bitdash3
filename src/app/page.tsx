'use client';

import { SignalCard } from '@/components/SignalCard';
import { IndicatorCard } from '@/components/IndicatorCard';
import MarketChart from '@/components/MarketChart';
import { getSignal } from '@/lib/signal';
import { Candle } from '@/lib/types';
import { useEffect, useState } from 'react';

function useAutoRefresh<T>(fetcher: () => Promise<T>, interval = 15_000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetcher();
        if (mounted) setData(res);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    load();
    const id = setInterval(load, interval);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [fetcher, interval]);
  
  return { data, error, loading };
}

async function fetchCandles() {
  try {
    const res = await fetch('/api/candles');
    if (!res.ok) throw new Error('api error');
    return (await res.json()) as Candle[];
  } catch {
    throw new Error('Data unavailable \u2014 retrying');
  }
}

export default function Page() {
  const { data: candles, error, loading } = useAutoRefresh(fetchCandles, 60_000);
  
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="space-y-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-center">BitDash</h1>
        
        {loading && !candles && (
          <div className="rounded-xl bg-white/5 p-8 text-center">
            <div className="animate-pulse text-lg">Loading data...</div>
          </div>
        )}
        
        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-800 p-6 text-center">
            <div className="text-red-400 mb-2">Error loading data</div>
            <div className="text-sm text-white/60">{error}</div>
          </div>
        )}
        
        {candles && candles.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SignalCard signal={getSignal(candles)} />
              <IndicatorCard candles={candles} />
            </div>
            <div className="rounded-xl bg-white/5 p-4 shadow-[var(--tw-shadow-elevation-medium)]">
              <MarketChart />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
