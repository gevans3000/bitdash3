'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, Time, IChartApi, UTCTimestamp, ISeriesApiCandlestick, CandlestickData } from 'lightweight-charts';
import { Candle } from '@/lib/types';

// Using CandlestickData from lightweight-charts for type safety

interface BasicCandleChartProps {
  candles: Candle[];
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function BasicCandleChart({ 
  candles, 
  width = '100%', 
  height = '400px', 
  className = '' 
}: BasicCandleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApiCandlestick<Time, UTCTimestamp> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Format candles for the chart with proper typing
  const formatCandles = useCallback((candles: Candle[]): CandlestickData<UTCTimestamp>[] => {
    return candles.map(candle => ({
      time: Math.floor(candle.time / 1000) as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      // Clean up previous chart if it exists
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#FFFFFF' },
          textColor: '#333',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        width: typeof width === 'number' ? width : chartContainerRef.current.clientWidth,
        height: typeof height === 'number' ? height : chartContainerRef.current.clientHeight,
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        rightPriceScale: {
          borderColor: '#f0f0f0',
        },
        timeScale: {
          borderColor: '#f0f0f0',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          vertLine: {
            color: 'rgba(0, 0, 0, 0.1)',
            labelBackgroundColor: '#2962FF',
          },
          horzLine: {
            color: 'rgba(0, 0, 0, 0.1)',
            labelBackgroundColor: '#2962FF',
          },
        },
        localization: {
          timeFormatter: (time: Time) => {
            const date = new Date(Number(time) * 1000);
            return date.toLocaleTimeString();
          },
          priceFormatter: (price: number) => `$${price.toFixed(2)}`,
        },
      });

      // Create candle series
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;

      // Set initial data if we have any
      if (candles.length > 0) {
        const formattedCandles = formatCandles(candles);
        candleSeries.setData(formattedCandles);
        chart.timeScale().fitContent();
      }

      // Handle resize with ResizeObserver
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !chartRef.current) return;
        
        const { width, height } = entries[0].contentRect;
        chartRef.current.applyOptions({ 
          width: width,
          height: height 
        });
        chartRef.current.timeScale().fitContent();
      });

      resizeObserver.observe(chartContainerRef.current);
      resizeObserverRef.current = resizeObserver;

      return () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        }
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error initializing chart:', err);
    }
  }, [formatCandles, height, width]);

  // Update chart data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !candles || candles.length === 0) {
      console.warn('No candles to display or chart not ready');
      return;
    }

    try {
      console.log('Updating chart with', candles.length, 'candles');
      const formattedCandles = formatCandles(candles);
      
      if (!formattedCandles || formattedCandles.length === 0) {
        console.warn('No valid formatted candles to display');
        return;
      }
      
      console.log('Setting chart data with', formattedCandles.length, 'formatted candles');
      candleSeriesRef.current.setData(formattedCandles);
      
      // Fit content after data is set
      if (chartRef.current) {
        console.log('Fitting chart content');
        chartRef.current.timeScale().fitContent();
      }
    } catch (err) {
      console.error('Error updating chart data:', err);
      
      // Try to recover by reinitializing the chart
      if (chartRef.current && chartContainerRef.current) {
        try {
          console.log('Attempting to recover chart...');
          chartRef.current.remove();
          chartRef.current = null;
          
          // Reinitialize chart
          const chart = createChart(chartContainerRef.current, {
            layout: {
              background: { type: ColorType.Solid, color: '#FFFFFF' },
              textColor: '#333',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            grid: { vertLines: { color: '#f0f0f0' }, horzLines: { color: '#f0f0f0' } },
            rightPriceScale: { borderColor: '#f0f0f0' },
            timeScale: {
              borderColor: '#f0f0f0',
              timeVisible: true,
              secondsVisible: false,
            },
          });
          
          const candleSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
          });
          
          chartRef.current = chart;
          candleSeriesRef.current = candleSeries;
          
          // Retry setting the data
          const formattedCandles = formatCandles(candles);
          candleSeries.setData(formattedCandles);
          chart.timeScale().fitContent();
          
        } catch (recoveryError) {
          console.error('Failed to recover chart:', recoveryError);
        }
      }
    }
  }, [candles, formatCandles]);

  return (
    <div 
      ref={chartContainerRef} 
      className={`w-full h-full ${className}`}
      style={{
        width,
        height,
        minHeight: '400px',
      }}
    />
  );
}
export default BasicCandleChart;
