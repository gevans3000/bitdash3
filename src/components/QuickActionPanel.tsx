'use client';

import { useState, useEffect, useMemo } from 'react';
import { calculatePositionSize } from '@/lib/calculators/price-targets';
import { cn } from '@/lib/utils';
import { DataCard } from './DataCard';

interface QuickActionPanelProps {
  latestPrice?: number | null;
  className?: string;
}

export default function QuickActionPanel({ latestPrice = 0, className = '' }: QuickActionPanelProps) {
  const [entry, setEntry] = useState<number>(latestPrice || 0);
  const [stop, setStop] = useState<number>(latestPrice ? latestPrice * 0.99 : 0);
  const [target, setTarget] = useState<number>(latestPrice ? latestPrice * 1.02 : 0);
  const [account, setAccount] = useState<number>(1000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [feesPct, setFeesPct] = useState<number>(0.1);
  const [alertPrice, setAlertPrice] = useState<number>(latestPrice || 0);

  useEffect(() => {
    if (latestPrice) {
      setEntry(latestPrice);
      setAlertPrice(latestPrice);
    }
  }, [latestPrice]);

  const positionSize = useMemo(() => {
    try {
      return calculatePositionSize(account, riskPct, entry, stop);
    } catch {
      return 0;
    }
  }, [account, riskPct, entry, stop]);

  const riskReward = useMemo(() => {
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    return risk > 0 ? reward / risk : 0;
  }, [entry, stop, target]);

  const breakEven = useMemo(() => entry * (1 + (feesPct / 100) * 2), [entry, feesPct]);

  const executeBuy = () => {
    console.log('Execute BUY', { entry, positionSize });
  };

  const executeSell = () => {
    console.log('Execute SELL', { entry, positionSize });
  };

  const setPriceAlert = () => {
    alert(`Price alert set at ${alertPrice}`);
  };

  const exportData = () => {
    const data = {
      entry,
      stop,
      target,
      account,
      riskPct,
      positionSize,
      riskReward,
      breakEven,
    } as Record<string, number>;
    const csv = Object.keys(data).join(',') + '\n' + Object.values(data).join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'trade_plan.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const inputClass = 'bg-neutral-800 rounded px-2 py-1 text-sm';

  return (
    <DataCard className={cn('space-y-3', className)}>
      <h2 className="text-lg font-medium">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex flex-col">
          <span>Entry</span>
          <input type="number" className={inputClass} value={entry} onChange={e => setEntry(parseFloat(e.target.value))} />
        </label>
        <label className="flex flex-col">
          <span>Stop</span>
          <input type="number" className={inputClass} value={stop} onChange={e => setStop(parseFloat(e.target.value))} />
        </label>
        <label className="flex flex-col">
          <span>Target</span>
          <input type="number" className={inputClass} value={target} onChange={e => setTarget(parseFloat(e.target.value))} />
        </label>
        <label className="flex flex-col">
          <span>Account ($)</span>
          <input type="number" className={inputClass} value={account} onChange={e => setAccount(parseFloat(e.target.value))} />
        </label>
        <label className="flex flex-col">
          <span>Risk %</span>
          <input type="number" className={inputClass} value={riskPct} onChange={e => setRiskPct(parseFloat(e.target.value))} />
        </label>
        <label className="flex flex-col">
          <span>Fees %</span>
          <input type="number" className={inputClass} value={feesPct} onChange={e => setFeesPct(parseFloat(e.target.value))} />
        </label>
        <label className="flex flex-col col-span-2">
          <span>Alert Price</span>
          <input type="number" className={inputClass} value={alertPrice} onChange={e => setAlertPrice(parseFloat(e.target.value))} />
        </label>
      </div>
      <div className="text-xs space-y-1">
        <div>Position Size: <span className="font-mono">{positionSize.toFixed(4)}</span></div>
        <div>Risk/Reward: <span className="font-mono">{riskReward.toFixed(2)}</span></div>
        <div>Break-Even: <span className="font-mono">{breakEven.toFixed(2)}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <button onClick={executeBuy} className="bg-green-600 hover:bg-green-700 rounded px-2 py-1">BUY</button>
        <button onClick={executeSell} className="bg-red-600 hover:bg-red-700 rounded px-2 py-1">SELL</button>
        <button onClick={setPriceAlert} className="col-span-2 bg-yellow-600 hover:bg-yellow-700 rounded px-2 py-1">Set Price Alert</button>
        <button onClick={exportData} className="col-span-2 bg-blue-600 hover:bg-blue-700 rounded px-2 py-1">Export Data</button>
      </div>
    </DataCard>
  );
}
