// src/components/SignalDisplay.tsx
"use client";
import React from 'react';
import { useAppState } from '@/hooks/useAppState';

export default function SignalDisplay() {
  const { latestSignal } = useAppState();

  if (!latestSignal) {
    return <div className="p-4 text-center text-gray-500">Awaiting first signal...</div>;
  }

  const { action, confidence, reason, marketRegime, entryPrice, stopLoss, takeProfit, timestamp, rawIndicators } = latestSignal;

  const getActionColor = () => {
    if (action === 'BUY') return 'green';
    if (action === 'SELL') return 'red';
    return 'gray';
  };

  return (
    <div style={{ border: `3px solid ${getActionColor()}`, padding: '15px', margin: '10px 0', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h3 style={{ color: getActionColor(), marginTop: 0, marginBottom: '10px', fontSize: '1.5em' }}>
        Current Signal: {action}
      </h3>
      <p><strong>Confidence: {confidence.toFixed(1)}%</strong></p>
      <p><strong>Reason:</strong> {reason}</p>
      <p><strong>Market Regime:</strong> {marketRegime}</p>
      <p><strong>Signal Time:</strong> {new Date(timestamp).toLocaleTimeString()}</p>
      {action !== 'HOLD' && entryPrice && (
        <>
          <hr style={{margin: '10px 0'}} />
          <p><strong>Entry Price:</strong> {entryPrice.toFixed(2)}</p>
          <p><strong>Stop-Loss:</strong> {stopLoss?.toFixed(2) || 'N/A (Check ATR)'}</p>
          <p><strong>Take-Profit:</strong> {takeProfit?.toFixed(2) || 'N/A (Check ATR)'}</p>
        </>
      )}
      {rawIndicators && (
        <details style={{marginTop: '10px'}}>
          <summary style={{cursor: 'pointer', fontWeight: 'bold'}}>Raw Indicators (at signal time)</summary>
          <pre style={{ fontSize: '0.8em', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
            {JSON.stringify(rawIndicators, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
