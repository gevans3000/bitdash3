'use client';
import { DataCard } from './DataCard';
import type { BacktestResult } from '@/lib/backtesting/engine';

interface Props {
  result: BacktestResult | null;
}

export default function BacktestResultsPanel({ result }: Props) {
  if (!result) {
    return (
      <DataCard>
        <div className="text-sm text-white/60">No results</div>
      </DataCard>
    );
  }

  const { metrics, equity } = result;
  const min = Math.min(...equity);
  const max = Math.max(...equity);
  const points = equity
    .map((v, i) => {
      const x = (i / (equity.length - 1)) * 100;
      const y = max === min ? 50 : 100 - ((v - min) / (max - min)) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <DataCard>
      <h2 className="text-xl font-medium mb-2">Backtest Results</h2>
      <ul className="text-sm space-y-1 mb-3">
        <li>Total Trades: {metrics.totalTrades}</li>
        <li>Win Rate: {metrics.winRate.toFixed(1)}%</li>
        <li>Profit Factor: {metrics.profitFactor.toFixed(2)}</li>
        <li>Max Drawdown: {metrics.maxDrawdown.toFixed(2)}%</li>
        <li>Net Profit: {metrics.netProfit.toFixed(2)}</li>
      </ul>
      <svg viewBox="0 0 100 40" className="w-full h-20 bg-neutral-800 rounded">
        <polyline
          fill="none"
          stroke="#4ade80"
          strokeWidth="1"
          points={points}
        />
      </svg>
    </DataCard>
  );
}
