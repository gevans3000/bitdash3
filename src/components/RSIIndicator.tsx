import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import { Candle } from '@/lib/types';
import { calculateRSI } from '@/lib/indicators/rsi';

interface RSIIndicatorProps {
  candles: Candle[];
  height?: number;
  className?: string;
}

export const RSIIndicator: React.FC<RSIIndicatorProps> = ({
  candles,
  height = 150,
  className = '',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Calculate RSI values
  const rsiValues = calculateRSI(candles, 14);
  const currentRSI = rsiValues[rsiValues.length - 1] || 50;
  
  // Get RSI signal state
  const rsiSignal = currentRSI >= 70 ? 'OVERBOUGHT' : currentRSI <= 30 ? 'OVERSOLD' : 'NEUTRAL';
  const rsiStrength = Math.min(Math.abs(50 - currentRSI) / 50, 1);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart if it exists
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Create chart container
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    chartContainerRef.current.appendChild(container);

    // Create chart
    const chart = createChart(container, {
      height,
      layout: {
        background: { type: 'solid', color: '#FFFFFF' },
        textColor: '#333',
        fontSize: 12,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#f0f0f0' },
      },
      timeScale: {
        visible: false,
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        borderVisible: false,
      },
      leftPriceScale: {
        visible: false,
      },
    });

    // Create RSI line series
    const rsiLine = chart.addLineSeries({
      color: '#8B5CF6',
      lineWidth: 2,
      priceLineVisible: false,
    });

    // Add RSI data
    const rsiData = candles.slice(14).map((candle, index) => ({
      time: Math.floor(new Date(candle.timestamp).getTime() / 1000) as any,
      value: rsiValues[index + 14] || 50,
    }));

    rsiLine.setData(rsiData);
    rsiSeriesRef.current = rsiLine;

    // Add overbought/oversold lines
    const overboughtLine = {
      price: 70,
      color: '#EF4444',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Overbought',
    };

    const oversoldLine = {
      price: 30,
      color: '#10B981',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Oversold',
    };

    const neutralLine = {
      price: 50,
      color: '#9CA3AF',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
    };

    rsiLine.createPriceLine(overboughtLine);
    rsiLine.createPriceLine(oversoldLine);
    rsiLine.createPriceLine(neutralLine);

    // Handle resize
    const handleResize = () => {
      if (container) {
        chart.applyOptions({ width: container.clientWidth });
      }
    };

    // Use ResizeObserver for better performance
    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(container);

    // Store chart reference
    chartRef.current = chart;

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      chart.remove();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [candles.length]);

  // Update RSI data when candles change
  useEffect(() => {
    if (!rsiSeriesRef.current || rsiValues.length === 0) return;

    const rsiData = candles.slice(14).map((candle, index) => ({
      time: Math.floor(new Date(candle.timestamp).getTime() / 1000) as any,
      value: rsiValues[index + 14] || 50,
    }));

    rsiSeriesRef.current.setData(rsiData);
  }, [candles, rsiValues]);

  // Get color based on RSI value
  const getRSIColor = () => {
    if (rsiSignal === 'OVERBOUGHT') return 'text-red-500';
    if (rsiSignal === 'OVERSOLD') return 'text-green-500';
    return 'text-gray-600';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-2 left-2 flex items-center space-x-2 z-10">
        <div className="text-xs font-medium">
          RSI(14):{' '}
          <span className={`font-bold ${getRSIColor()}`}>
            {currentRSI.toFixed(2)}
          </span>
        </div>
        <div 
          className={`px-2 py-0.5 text-xs rounded-full ${
            rsiSignal === 'OVERBOUGHT' 
              ? 'bg-red-100 text-red-800' 
              : rsiSignal === 'OVERSOLD' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          {rsiSignal}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};
