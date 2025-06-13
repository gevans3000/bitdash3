'use client';
import { useState } from 'react';
import { DataCard } from './DataCard';
import type { Candle } from '@/lib/types';

interface Props {
  candles: Candle[];
  onRun: (opts: { candles: Candle[]; preset: string }) => void;
}

export default function BacktestConfigPanel({ candles, onRun }: Props) {
  const first = candles[0]?.time ? new Date(candles[0].time * 1000) : new Date();
  const last = candles[candles.length - 1]?.time ? new Date(candles[candles.length - 1].time * 1000) : new Date();
  const [start, setStart] = useState(first.toISOString().slice(0,16));
  const [end, setEnd] = useState(last.toISOString().slice(0,16));
  const [preset, setPreset] = useState('default');
  const maxCandles = 5000;

  const run = () => {
    const s = new Date(start).getTime() / 1000;
    const e = new Date(end).getTime() / 1000;
    if (isNaN(s) || isNaN(e) || s >= e) return;
    const selected = candles.filter(c => c.time >= s && c.time <= e);
    if (selected.length > maxCandles) {
      alert('Range too large');
      return;
    }
    onRun({ candles: selected, preset });
  };

  return (
    <DataCard>
      <h2 className="text-xl font-medium mb-2">Backtest Config</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <label>Start</label>
          <input
            type="datetime-local"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="bg-neutral-800 p-1 rounded text-sm"
          />
        </div>
        <div className="flex justify-between items-center">
          <label>End</label>
          <input
            type="datetime-local"
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="bg-neutral-800 p-1 rounded text-sm"
          />
        </div>
        <div className="flex justify-between items-center">
          <label>Preset</label>
          <select
            value={preset}
            onChange={e => setPreset(e.target.value)}
            className="bg-neutral-800 p-1 rounded"
          >
            <option value="default">Default</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
        <button
          onClick={run}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white py-1 rounded"
        >
          Run
        </button>
      </div>
    </DataCard>
  );
}
