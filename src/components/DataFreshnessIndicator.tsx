"use client";
import React, { useState, useEffect } from 'react';
import { useAppState } from '@/hooks/useAppState';

export default function DataFreshnessIndicator() {
  const { dataStatus, dataError } = useAppState();
  const [statusText, setStatusText] = useState(dataStatus.text);
  const [statusColor, setStatusColor] = useState(dataStatus.color);

  useEffect(() => {
    if (dataError) {
      setStatusText(`Error: ${dataError.substring(0,30)}`);
      setStatusColor('red');
      return;
    }

    const lastUpdateTime = dataStatus.lastUpdateTime;

    const intervalId = setInterval(() => {
      if (statusColor === 'red') return;
      if (lastUpdateTime === null) {
        setStatusText(dataStatus.text);
        setStatusColor(dataStatus.color);
        return;
      }

      const ageSeconds = (Date.now() - lastUpdateTime) / 1000;

      if (ageSeconds < 10) {
        setStatusText("● Live");
        setStatusColor("green");
      } else if (ageSeconds < 30) {
        setStatusText(`● ${Math.round(ageSeconds)}s ago`);
        setStatusColor("lightgreen");
      } else if (ageSeconds < 120) {
        setStatusText(`● ${Math.round(ageSeconds)}s ago (stale)`);
        setStatusColor("orange");
      } else {
        setStatusText(`● >2m stale!`);
        setStatusColor("red");
      }
    }, 2000);

    return () => {
      console.log('DataFreshnessIndicator: Unmounting.');
      clearInterval(intervalId);
    };
  }, [dataStatus, dataError, statusColor]);

  return (
    <div style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
      Data Status: <strong style={{ color: statusColor }}>{statusText}</strong>
    </div>
  );
}
