import React from 'react';
import { CandleChart } from '@/components/CandleChart';
import { MarketRegimeIndicator } from '@/components/MarketRegimeIndicator';
import PerformanceMetricsPanel from '@/components/dashboard/PerformanceMetricsPanel';
import BasicCandleDisplay from '@/components/BasicCandleDisplay';
import DataFreshnessIndicator from '@/components/DataFreshnessIndicator';
import SignalDisplay from '@/components/SignalDisplay';
import dynamic from 'next/dynamic';

// Dynamically import PerformanceMetrics with no SSR since it uses browser APIs
const PerformanceMetrics = dynamic(
  () => import('@/components/PerformanceMetrics'),
  { ssr: false }
);

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">BitDash3 Trading Dashboard</h1>
        <p className="text-gray-600">Real-time market analysis and signals</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="space-y-6">
          <MarketRegimeIndicator />
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Trading Signals</h3>
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-100 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">EMA Crossover</span>
                  <span className="text-green-600">Bullish</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">EMA(9) crossed above EMA(21)</div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-100 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Volume Spike</span>
                  <span className="text-blue-600">+245%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Above 20-period average</div>
              </div>
              
              <div className="p-3 bg-yellow-50 border border-yellow-100 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">RSI</span>
                  <span className="text-yellow-600">62.5</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Approaching overbought</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Risk Management</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Position Size</span>
                  <span className="font-mono">0.05 BTC</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Daily P&L</span>
                  <span className="font-mono text-green-600">+2.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Daily Trades</span>
                  <span>2/5</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Win Rate</span>
                  <span>100% (2/2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <CandleChart height={600} />
          </div>

          <DataFreshnessIndicator />
          <SignalDisplay />

          {/* Basic Candle Display */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="text-lg font-medium mb-3">Basic Candle Display</h2>
            <BasicCandleDisplay />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Order Book</h3>
              <div className="space-y-1 text-xs">
                {Array(5).fill(0).map((_, i) => (
                  <div key={`ask-${i}`} className="flex justify-between">
                    <span className="text-red-500">65,432.10</span>
                    <span>0.25</span>
                    <span className="text-gray-400">Ask</span>
                  </div>
                ))}
                <div className="my-1 border-t border-dashed border-gray-200"></div>
                {Array(5).fill(0).map((_, i) => (
                  <div key={`bid-${i}`} className="flex justify-between">
                    <span className="text-green-500">65,421.50</span>
                    <span>0.18</span>
                    <span className="text-gray-400">Bid</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Trades</h3>
              <div className="space-y-1 text-xs">
                {Array(5).fill(0).map((_, i) => (
                  <div key={`trade-${i}`} className="flex justify-between">
                    <span className={i % 2 === 0 ? 'text-green-500' : 'text-red-500'}>
                      {i % 2 === 0 ? '▲' : '▼'} 65,428.30
                    </span>
                    <span>0.0{i + 1}5</span>
                    <span className="text-gray-400">just now</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Market Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">24h Change</span>
                  <span className="text-green-500">+2.35%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">24h High/Low</span>
                  <span>65,890.20 / 63,450.10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">24h Volume</span>
                  <span>24,582 BTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Market Cap</span>
                  <span>$1.28T</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Funding Rate</span>
                  <span className="text-blue-500">0.01%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Open Interest</span>
                  <span>$24.5B</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-8 text-center text-xs text-gray-500">
        <p>BitDash3 Trading Dashboard - Real-time market data powered by Binance WebSocket API</p>
        <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
      </footer>
    </div>
  );
}
