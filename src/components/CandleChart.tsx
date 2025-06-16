import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Candle } from '@/lib/types';
import { useMarketData } from '@/hooks/useMarketData';
// import { MarketRegime } from '@/lib/market/regime'; // regime prop is used, ensure this is the correct type or from useMarketData
import { createChart, ColorType, CrosshairMode, ISeriesApi, CandlestickData, UTCTimestamp, LineStyle, IChartApi } from 'lightweight-charts';
import { detectEMACross, EMACrossResult } from '@/lib/signals/ema-crossover';
import { VolumeSpikes } from './VolumeSpikes';

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
    mockMode: true, // Forcing mockMode for reliable dev signals
  });
  
  const [emaSignals, setEmaSignals] = useState<EMACrossResult | null>(null);
  
  // Calculate EMA signals using useMemo for optimization
  const emaSignalsResult = useMemo(() => {
    if (candles.length >= 22) { // Need at least 21 candles for EMA21
      return detectEMACross(candles);
    }
    return null;
  }, [candles]);

  useEffect(() => {
    setEmaSignals(emaSignalsResult);
  }, [emaSignalsResult]);
  
  // Add EMA lines to chart
  const addEMALines = useCallback((chart: any) => {
    if (!emaSignalsResult || !chart) return; // Use emaSignalsResult for condition
    
    // Remove existing EMA lines
    chart.getAllPanes().forEach((pane: any) => {
      const series = pane.getSeries();
      if (series && series.length > 0) {
        series.forEach((s: any) => {
          if (s._options && (s._options.title === 'EMA9' || s._options.title === 'EMA21')) {
            chart.removeSeries(s);
          }
        });
      }
    });
    
    // Add EMA lines
    const ema9Line = chart.addLineSeries({
      color: '#8B5CF6', // Purple
      lineWidth: 2,
      title: 'EMA9',
      priceLineVisible: false,
    });
    
    const ema21Line = chart.addLineSeries({
      color: '#F59E0B', // Amber
      lineWidth: 2,
      title: 'EMA21',
      priceLineVisible: false,
    });
    
    // Add EMA data points
    // Use emaSignalsResult directly if its structure matches emaSignals,
    // or adapt if emaSignals (the state) is preferred for some reason after being set.
    // Assuming emaSignals (state) is what subsequent logic expects after being set by the effect.
    if (!emaSignals) return; // Guard against null emaSignals state

    const ema9Data = emaSignals.fastEMA.map((value, index) => ({
      time: Math.floor(new Date(candles[index].time).getTime() / 1000) as UTCTimestamp,
      value,
    }));
    
    const ema21Data = emaSignals.slowEMA.map((value, index) => ({
      time: Math.floor(new Date(candles[index].time).getTime() / 1000) as UTCTimestamp,
      value,
    }));
    
    ema9Line.setData(ema9Data);
    ema21Line.setData(ema21Data);
    
    return () => {
      chart.removeSeries(ema9Line);
      chart.removeSeries(ema21Line);
    };
  }, [candles, emaSignals]); // Keep emaSignals (state) as dependency here if addEMALines relies on the state version
  
  // Add signal indicators to chart
  const addSignalIndicators = useCallback((chart: any) => {
    if (!emaSignals || !chart) return; // Use emaSignals (state) here
    
    const { signal } = emaSignals;
    const priceScale = chart.priceScale('right');
    
    // Add signal line
    const signalLine = chart.addLineSeries({
      color: signal.type === 'BUY' ? '#10B981' : '#EF4444',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    
    signalLine.setData([
      { time: signal.timestamp - 3600, value: signal.price * 0.99 },
      { time: signal.timestamp, value: signal.price },
    ]);
    
    // Add signal marker
    const marker = document.createElement('div');
    marker.className = `absolute px-2 py-1 text-xs font-medium rounded ${
      signal.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`;
    marker.textContent = `${signal.type} (${Math.round(signal.confidence * 100)}%)`;
    marker.style.top = '10px';
    marker.style.right = '10px';
    chart._container.appendChild(marker);
    
    return () => {
      chart.removeSeries(signalLine);
      if (marker.parentNode) {
        chart._container.removeChild(marker);
      }
    };
  }, [emaSignals]); // Use emaSignals (state) here

  // Calculate volume moving average and identify spikes
  const { volumeMA, priceExtremes } = useMemo(() => {
    if (candles.length < 21) return { volumeMA: 0, priceExtremes: { high: 0, low: Infinity } };
    
    // Calculate 20-period volume moving average
    const volumes = candles.slice(-21).map((c: Candle) => c.volume);
    const volumeMA = volumes.reduce((sum: number, vol: number) => sum + vol, 0) / volumes.length;
    
    // Find recent high and low prices (last 20 candles)
    const recentCandles = candles.slice(-20);
    const highs = recentCandles.map((c: Candle) => c.high);
    const lows = recentCandles.map((c: Candle) => c.low);
    
    return {
      volumeMA,
      priceExtremes: {
        high: Math.max(...highs),
        low: Math.min(...lows)
      }
    };
  }, [candles]);

  // Prepare candle data with visual enhancements
  const candleData = useMemo(() => {
    if (!candles.length) return [];
    
    return candles.map((candle: Candle) => {
      const isLargeMove = Math.abs(candle.close - candle.open) / candle.open > 0.02; // 2% move
      const isVolumeSpike = candle.volume > volumeMA * 1.5; // 150% of average volume
      
      return {
        time: Math.floor(new Date(candle.time).getTime() / 1000) as UTCTimestamp, // Changed to .time
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        ...(isLargeMove && { borderColor: '#F59E0B' }), // Yellow border for large moves
        ...(isVolumeSpike && { wickColor: '#3B82F6' }), // Blue wick for volume spikes
      };
    });
  }, [candles, volumeMA]);

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
    const chart: IChartApi = createChart(container, { // Explicitly type chart
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
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

    // Create candlestick series with enhanced styling
    const candleSeries = (chart as any).addCandlestickSeries({ // Type assertion as workaround
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
      priceLineVisible: false,
    });

    // Create volume series
    const volumeSeries = (chart as any).addHistogramSeries({ // Type assertion as workaround
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

    // Add price scale for volume (right side)
    chart.priceScale('right').applyOptions({
      scaleMargins: {
        top: 0.7,  // Start volume at 70% of the chart height
        bottom: 0,
      },
    });

    // Update chart when data changes
    if (candleData.length > 0) {
      candleSeries.setData(candleData);
      
      // Add volume data with dynamic coloring
      const volumeData = candles.map((candle: Candle) => ({
        time: Math.floor(new Date(candle.time).getTime() / 1000) as UTCTimestamp, // Changed to .time
        value: candle.volume,
        color: candle.close >= candle.open
          ? 'rgba(16, 185, 129, 0.5)'  // Green for up candles
          : 'rgba(239, 68, 68, 0.5)',  // Red for down candles
      }));
      
      volumeSeries.setData(volumeData);
      
      // Add recent high/low lines
      if (priceExtremes.high > 0 && priceExtremes.low < Infinity) {
        // Add recent high line
        const highLine = {
          price: priceExtremes.high,
          color: '#10B981',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'Recent High',
        };
        
        // Add recent low line
        const lowLine = {
          price: priceExtremes.low,
          color: '#EF4444',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'Recent Low',
        };
        
        candleSeries.createPriceLine(highLine);
        candleSeries.createPriceLine(lowLine);
      }
      
      // Auto-scale to fit data
      chart.timeScale().fitContent();
      setIsLoading(false);
    }

    // Add EMAs and signals
    addEMALines(chart);
    addSignalIndicators(chart);
    
    // Handle window resize
    const handleResize = () => {
      if (container) {
        chart.applyOptions({
          width: container.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Store chart reference
    chartRef.current = chart;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  // Update chart data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) {
      return;
    }

    // Format data for the chart
    const candleData = candles.map((candle: Candle) => ({
      time: (candle.time) as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData = candles.map((candle: Candle) => ({
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
      case 'strong-trend-up':
      case 'strong-trend-down': // Grouping strong trends for color
        upColor = '#059669';
        downColor = '#DC2626';
        wickUpColor = '#059669';
        wickDownColor = '#DC2626';
        break;
      case 'weak-trend-up':
      case 'weak-trend-down': // Grouping weak trends for color
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

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="animate-pulse text-gray-500">Loading chart data...</div>
      </div>
    );
  }

  // Show no data state
  if (!isLoading && candles.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-gray-500">No chart data available for {symbol}.</div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col ${className}`} style={{ width, height }}>
      <div className="relative" style={{ height: '70%' }}>
        <div ref={chartContainerRef} className="w-full h-full rounded-t-lg border border-b-0 border-gray-200" />
        
        {/* Connection status indicator */}
        <div className="absolute top-2 right-2 flex items-center space-x-2">
          <div 
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
          <span className="text-xs text-gray-600">
            {regime ? `${regime.charAt(0).toUpperCase() + regime.slice(1)} Market` : 'Loading...'}
          </span>
        </div>
        
        {/* Signal indicator with RSI info */}
        {emaSignals?.signal && emaSignals.signal.type !== 'NEUTRAL' && ( // Use emaSignals (state) here
          <div className={`absolute top-10 right-2 px-2 py-1 text-xs font-medium rounded shadow ${
            emaSignals.signal.type === 'BUY'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="font-bold">{emaSignals.signal.type} Signal</div>
            <div>Confidence: {Math.round(emaSignals.signal.confidence * 100)}%</div>
            {emaSignals.signal.rsi !== undefined && (
              <div className="flex items-center">
                RSI: <span className={`ml-1 font-medium ${
                  emaSignals.signal.rsi > 70 ? 'text-red-500' :
                  emaSignals.signal.rsi < 30 ? 'text-green-500' : 'text-gray-600'
                }`}>
                  {emaSignals.signal.rsi.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Volume spikes */}
        {candles.length > 0 && (
          <div className="absolute bottom-10 left-2">
            <VolumeSpikes 
              candles={candles} 
              currentPrice={currentPrice || 0} 
            />
          </div>
        )}
      </div>
      
      {/* RSI Indicator (Commented out due to missing import/definition)
      <div className="h-[25%] w-full">
        <RSIIndicator candles={candles} />
      </div>
      */}
      
      {/* Price Targets (Commented out due to missing import/definition for showTargets and PriceTargets)
      {showTargets && emaSignals?.signal && emaSignals.signal.type !== 'NEUTRAL' && (
        <div className="h-[15%] w-full border-t border-gray-200 bg-gray-50 p-2 overflow-hidden">
          <PriceTargets
            candles={candles}
            entryPrice={emaSignals.signal.price}
            isLong={emaSignals.signal.type === 'BUY'}
            accountSize={10000} // Example account size, can be made configurable
            riskPercentage={1} // 1% risk per trade
          />
        </div>
      )}
      */}
      
      {/* Chart legend */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500">
        <div className="flex flex-col space-y-1 bg-white/80 p-1.5 rounded backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-green-100 border border-green-500 mr-1"></span>
              Bullish
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-red-100 border border-red-500 mr-1"></span>
              Bearish
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="flex items-center">
              <span className="w-3 h-3 border-2 border-yellow-400 mr-1"></span>
              &gt;2% Move
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 mr-1"></span>
              High Volume
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-purple-500 mr-1"></span>
              EMA9
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-amber-500 mr-1"></span>
              EMA21
            </span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
        {symbol} • {interval} • {currentPrice ? `$${currentPrice.toLocaleString()}` : '--'}
      </div>
    </div>
  );
};
