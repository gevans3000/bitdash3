'use client';

import { useEffect, useState } from 'react';
import { DataCard } from './DataCard';

interface OnChainData {
  tx_count: number;
  mempool_transactions: number;
  total_fees_btc: number;
  timestamp: number;
}

export default function OnChainInsightsPanel() {
  const [data, setData] = useState<OnChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/btc-onchain');
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load on-chain data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isAlert = (value: number, threshold: number) => value > threshold;

  const toggleExpanded = () => setExpanded(prev => !prev);

  return (
    <DataCard>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">On-Chain Metrics</h2>
        <button
          onClick={toggleExpanded}
          className="text-xs hover:underline"
        >
          {expanded ? 'Hide' : 'Details'}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : data ? (
        <>
          <div className="space-y-1 text-sm">
            <div className={`flex justify-between ${isAlert(data.tx_count, 350000) ? 'text-yellow-300' : ''}`}> 
              <span>Transactions</span>
              <span>{data.tx_count.toLocaleString()}</span>
            </div>
            <div className={`flex justify-between ${isAlert(data.mempool_transactions, 100000) ? 'text-yellow-300' : ''}`}> 
              <span>Mempool</span>
              <span>{data.mempool_transactions.toLocaleString()}</span>
            </div>
            <div className={`flex justify-between ${isAlert(data.total_fees_btc, 100) ? 'text-yellow-300' : ''}`}> 
              <span>Total Fees (BTC)</span>
              <span>{data.total_fees_btc.toFixed(2)}</span>
            </div>
          </div>
          {expanded && (
            <div className="mt-2 text-xs text-white/70">
              Last updated: {new Date(data.timestamp).toLocaleString()}
            </div>
          )}
        </>
      ) : (
        <div>No data available</div>
      )}
    </DataCard>
  );
}
