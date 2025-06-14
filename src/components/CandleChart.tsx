import React, { useEffect, useRef, useState } from 'react';
import { Candle } from '@/lib/types';
import { useMarketData } from '@/hooks/useMarketData';
import { MarketRegime } from '@/lib/market/regime';

// Import Lightweight Charts
import { createChart, ColorType, CrosshairMode, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';

interface CandleChartProps {
  symbol?: string;
  interval?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  symbol = 'BTCUSDT',
  interval = '5m',
  width = '100%',
  height = 400,
  className = '',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { candles, regime, currentPrice, isConnected } = useMarketData({
    symbol,
    interval,
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Clean up previous chart if it exists
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: '#FFFFFF' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: 'rgba(0, 0, 0, 0.1)',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: 'rgba(0, 0, 0, 0.1)',
          style: 2,
        },
      },
      width: typeof width === 'number' ? width : chartContainerRef.current.clientWidth,
      height: typeof height === 'number' ? height : 400,
      timeScale: {
        borderColor: '#D1D5DB',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#D1D5DB',
      },
    });

    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: 'rgba(79, 70, 229, 0.3)',
      priceFormat: {
        type: 'volume',
      },
      priceLineVisible: false,
      priceScaleId: '',
    });

    // Store references
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) {
      return;
    }

    // Format data for the chart
    const candleData = candles.map((candle) => ({
      time: (candle.time) as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData = candles.map((candle) => ({
      time: (candle.time) as UTCTimestamp,
      value: candle.volume,
      color: candle.close >= candle.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }));

    // Update chart data
    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    // Auto-scroll to the end
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }

    // Update loading state
    if (isLoading) {
      setIsLoading(false);
    }
  }, [candles, isLoading]);

  // Update chart colors based on market regime
  useEffect(() => {
    if (!chartRef.current) return;

    let upColor = '#10B981';
    let downColor = '#EF4444';
    let wickUpColor = '#10B981';
    let wickDownColor = '#EF4444';
    let gridColor = '#f0f0f0';
    let textColor = '#333';

    // Customize colors based on market regime
    switch (regime) {
      case 'strong-trend':
        upColor = '#059669';
        downColor = '#DC2626';
        wickUpColor = '#059669';
        wickDownColor = '#DC2626';
        break;
      case 'weak-trend':
        upColor = '#34D399';
        downColor = '#F87171';
        wickUpColor = '#34D399';
        wickDownColor = '#F87171';
        break;
      case 'ranging':
        upColor = '#60A5FA';
        downColor = '#F59E0B';
        wickUpColor = '#60A5FA';
        wickDownColor = '#F59E0B';
        break;
    }

    // Apply colors to the chart
    chartRef.current.applyOptions({
      layout: {
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
    });

    if (candleSeriesRef.current) {
      candleSeriesRef.current.applyOptions({
        upColor,
        downColor,
        wickUpColor,
        wickDownColor,
      });
    }
  }, [regime]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="animate-pulse text-gray-500">Loading chart...</div>
        </div>
      )}
      
      {!isConnected && (
        <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded z-10">
          Disconnected - Using cached data
        </div>
      )}
      
      <div 
        ref={chartContainerRef} 
        style={{ width, height }}
        className="rounded-lg overflow-hidden border border-gray-200"
      />
      
      <div className="mt-1 text-xs text-gray-500 text-right">
        {symbol} • {interval} • {currentPrice ? `$${currentPrice.toLocaleString()}` : '--'}
      </div>
    </div>
  );
};
