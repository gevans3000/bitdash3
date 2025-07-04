'use client';

import { useState, useEffect, useMemo } from 'react';
// import { orchestrator } from '@/lib/agents/Orchestrator'; // No longer dispatching from here
import { calculatePositionSize } from '@/lib/calculators/price-targets';
import { executeMockBuy, executeMockSell } from '@/lib/trading/quick-trades';
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
  const [openTradeId, setOpenTradeId] = useState<string | null>(null);
  // Removed const { orchestrator } = useAppState();

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
  const profitAtTarget = useMemo(() => (target - entry) * positionSize, [target, entry, positionSize]);
  const lossAtStop = useMemo(() => (entry - stop) * positionSize, [entry, stop, positionSize]);

  const executeBuy = () => {
    const id = executeMockBuy({ price: entry, positionSize });
    setOpenTradeId(id);
  };

  const executeSell = () => {
    if (!openTradeId) return;
    executeMockSell(openTradeId, entry);
    setOpenTradeId(null);
  };

  const setPriceAlert = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('bd_price_alert', alertPrice.toString());
      if ('Notification' in window) {
        Notification.requestPermission().then(p => {
          if (p === 'granted') {
            new Notification('Price Alert Set', { body: `Alert at ${alertPrice}` });
          }
        });
      } else {
        alert(`Price alert set at ${alertPrice}`);
      }
    } catch {
      alert(`Price alert set at ${alertPrice}`);
    }
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

  const copyToClipboard = async () => {
    const text = `Entry:${entry}, Stop:${stop}, Target:${target}, Size:${positionSize}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.warn('Copy failed');
    }
  };

  const savePlan = () => {
    try {
      localStorage.setItem('bd_trade_plan', JSON.stringify({ entry, stop, target, account, riskPct }));
    } catch (e) {
      console.error('Failed to save plan', e);
    }
  };

  const sharePlan = () => {
    if (navigator.share) {
      navigator.share({ title: 'Trade Plan', text: `Entry ${entry} Stop ${stop} Target ${target}` });
    }
  };

  // This handleRefreshData function for the QuickActionPanel's button
  // will NOT dispatch the MANUAL_DATA_REFRESH_REQUEST for currentPrice,
  // as per the new requirement that only the main page refresh button does that.
  // It can be left to do nothing, or be repurposed later.
  const handleRefreshData = () => {
    console.log('QuickActionPanel Refresh Data button clicked - currently does not update main current price.');
    // orchestrator.send({ ... }); // REMOVED - This button no longer updates the main current price
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
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={riskPct}
            onChange={e => setRiskPct(parseFloat(e.target.value))}
          />
          <span className="text-center mt-1">{riskPct.toFixed(1)}%</span>
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
        <div>Profit @ Target: <span className="font-mono">{profitAtTarget.toFixed(2)}</span></div>
        <div>Loss @ Stop: <span className="font-mono">{lossAtStop.toFixed(2)}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <button onClick={executeBuy} className="bg-green-600 hover:bg-green-700 rounded px-2 py-1">BUY</button>
        <button onClick={executeSell} className="bg-red-600 hover:bg-red-700 rounded px-2 py-1">SELL</button>
        <button onClick={handleRefreshData} className="col-span-2 bg-teal-600 hover:bg-teal-700 rounded px-2 py-1">Refresh Data (Panel)</button> {/* Text changed to differentiate if needed */}
        <button onClick={setPriceAlert} className="col-span-2 bg-yellow-600 hover:bg-yellow-700 rounded px-2 py-1">Set Price Alert</button>
        <button onClick={exportData} className="col-span-2 bg-blue-600 hover:bg-blue-700 rounded px-2 py-1">Export Data</button>
        <button onClick={copyToClipboard} className="col-span-2 bg-neutral-600 hover:bg-neutral-700 rounded px-2 py-1">Copy</button>
        <button onClick={savePlan} className="col-span-2 bg-neutral-600 hover:bg-neutral-700 rounded px-2 py-1">Save Plan</button>
        <a href="https://www.binance.com/en/trade/BTC_USDT" target="_blank" rel="noopener" className="col-span-2 bg-neutral-700 hover:bg-neutral-800 rounded px-2 py-1 text-center">Open Exchange</a>
        <button onClick={sharePlan} className="col-span-2 bg-neutral-500 hover:bg-neutral-600 rounded px-2 py-1">Share</button>
      </div>
    </DataCard>
  );
}
