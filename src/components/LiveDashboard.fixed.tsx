'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Candle, OrderBookData, Trade } from '@/lib/types';
import SignalsDisplay from './SignalsDisplay';
import { useSignals } from '@/hooks/useSignals';
import { browserCache, withCache } from '@/lib/cache/browserCache';
import DataFreshnessIndicator from './DataFreshnessIndicator';

interface LiveDashboardProps {
  refreshTrigger?: number;
}

export default function LiveDashboard({ refreshTrigger = 0 }: LiveDashboardProps) {
  // Main data states
  const [candles, setCandles] = useState<Candle[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // Data source and freshness tracking
  const [dataSource, setDataSource] = useState<string>('cached');
  const [candlesStatus, setCandlesStatus] = useState<string>('cached');
  const [orderBookStatus, setOrderBookStatus] = useState<string>('cached');
  const [tradesStatus, setTradesStatus] = useState<string>('cached');
  
  // Timestamp for last update
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Track initialization status
  const initialized = useRef(false);
  
  // Generate signals from candles with memoization to prevent unnecessary rerenders
  const memoizedCandles = useCallback(() => candles, [candles]);
  const signals = useSignals({ candles: memoizedCandles() });
  
  // Initialize from cache on first render
  useEffect(() => {
    if (!initialized.current) {
      // Load from enhanced cache system
      loadFromCache();
      initialized.current = true;
    }
  }, []);
  
  // Load data from the cache system
  const loadFromCache = async () => {
    try {
      // Get candles from cache with 30-minute TTL
      const candlesCache = await browserCache.get<Candle[]>('candles');
      if (candlesCache) {
        setCandles(candlesCache.data);
        setCandlesStatus('cached');
      }
      
      // Get order book from cache with 1-minute TTL
      const orderBookCache = await browserCache.get<OrderBookData>('orderBook');
      if (orderBookCache) {
        setOrderBook(orderBookCache.data);
        setOrderBookStatus('cached');
      }
      
      // Get trades from cache with 1-minute TTL
      const tradesCache = await browserCache.get<Trade[]>('trades');
      if (tradesCache) {
        setTrades(tradesCache.data);
        setTradesStatus('cached');
      }
      
      // Get metadata for data source tracking
      const metadataCache = await browserCache.get<{timestamp: number, source: string}>('market_data_meta');
      if (metadataCache) {
        setLastUpdated(metadataCache.data.timestamp);
        setDataSource(metadataCache.data.source || 'cached');
      }
    } catch (err) {
      console.error('Failed to load cached data', err);
    }
  };
  
  // Fetch market data
  const fetchMarketData = async () => {
    setLoading(true);
    
    try {
      // Use symbol from URL or default to BTCUSDT
      const symbol = new URLSearchParams(window.location.search).get('symbol') || 'BTCUSDT';
      const interval = new URLSearchParams(window.location.search).get('interval') || '5m';
      
      // Use withCache pattern to handle caching and network requests
      const { data, fromCache, age } = await withCache(
        `market_data_${symbol}_${interval}`,
        async () => {
          // Fetch market data from our API
          const response = await fetch(`/api/market-data?symbol=${symbol}&interval=${interval}`);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          return response.json();
        },
        {
          // Cache settings
          ttl: 60000, // 1 minute TTL for market data
          source: 'api',
          forceRefresh: refreshTrigger > 0, // Force refresh when trigger changes
          maxAge: 300000 // 5 minutes max age
        }
      );
      
      // Update state with new data
      setCandles(data.candles);
      setOrderBook(data.orderBook);
      setTrades(data.trades);
      setLastUpdated(data.timestamp);
      setDataSource(fromCache ? 'cached' : data.dataSource || 'api');
      
      // Update status based on data source
      const statusValue = data.usedMockData ? 'mock' : 
                        data.usedFallbackApi ? 'fallback' : 
                        fromCache ? 'cached' : 'live';
                        
      setCandlesStatus(statusValue);
      setOrderBookStatus(statusValue);
      setTradesStatus(statusValue);
      
      // Store components separately for different TTLs
      await browserCache.set('candles', data.candles, 1800000, data.dataSource); // 30 minutes for candles
      await browserCache.set('orderBook', data.orderBook, 60000, data.dataSource); // 1 minute for order book
      await browserCache.set('trades', data.trades, 60000, data.dataSource); // 1 minute for trades
      await browserCache.set('market_data_meta', {
        timestamp: data.timestamp,
        source: data.dataSource || 'api',
        refreshed: Date.now()
      }, 1800000); // 30 minutes for metadata
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setCandlesStatus('error');
      setOrderBookStatus('error');
      setTradesStatus('error');
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh data when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchMarketData();
    }
  }, [refreshTrigger]);
  
  // Ensure we always have a valid array for candles, even if empty
  const displayCandles = candles.length > 0 ? candles : [];
  
  // Show latest price from candles
  const latestPrice = displayCandles.length > 0 
    ? displayCandles[displayCandles.length - 1].close
    : null;
  
  // Get latest trade data
  const latestTrade = trades.length > 0 ? trades[0] : null;
  
  // Extract top 5 bids and asks
  const effectiveOrderBook = orderBook || null;
  const topBids = effectiveOrderBook?.bids?.slice(0, 5) || [];
  const topAsks = effectiveOrderBook?.asks?.slice(0, 5) || [];
  
  return (
    <div className="space-y-8">
      {/* Data Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
        <StatusCard 
          title="Candles" 
          status={candlesStatus} 
          count={candles.length} 
        />
        <StatusCard 
          title="Order Book" 
          status={orderBookStatus}
        />
        <StatusCard 
          title="Trades" 
          status={tradesStatus} 
          count={trades.length > 0 ? trades.length : 0} 
        />
      </div>
      
      {/* Data Freshness Indicator */}
      <div className="mb-6 px-2">
        <DataFreshnessIndicator
          lastUpdated={lastUpdated}
          dataSource={dataSource}
          cacheKey="market_data_meta"
          browserCache={browserCache}
          className="hover:bg-white/5 px-2 py-1 rounded-md cursor-pointer transition-colors"
        />
      </div>
      
      {/* Price Overview and Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price Card */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-medium mb-4">Current Price</h2>
          
          {latestPrice ? (
            <div>
              <div className="text-3xl font-bold mb-2">
                ${latestPrice.toFixed(2)}
              </div>
              
              {latestTrade && (
                <div className="text-sm text-white/70">
                  Last trade: {parseFloat(latestTrade.price).toFixed(2)} ({latestTrade.size} BTC)
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="animate-pulse text-3xl">Loading...</div>
          ) : (
            <div className="text-white/50">No price data available</div>
          )}
        </div>
        
        {/* Signals Card */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-medium mb-4">Trading Signals</h2>
          <SignalsDisplay signals={signals} />
        </div>
      </div>
      
      {/* Order Book and Trades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Book */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-medium mb-4">Order Book</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Asks (Sell Orders) */}
            <div>
              <h3 className="text-sm font-medium text-red-400 mb-2">Asks (Sells)</h3>
              {topAsks.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/50">
                      <th className="text-left">Price</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAsks.map((ask, i) => (
                      <tr key={i} className="text-red-400">
                        <td className="py-1">${parseFloat(ask[0]).toFixed(2)}</td>
                        <td className="text-right py-1">{parseFloat(ask[1]).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-white/50">No asks data</div>
              )}
            </div>
            
            {/* Bids (Buy Orders) */}
            <div>
              <h3 className="text-sm font-medium text-green-400 mb-2">Bids (Buys)</h3>
              {topBids.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/50">
                      <th className="text-left">Price</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBids.map((bid, i) => (
                      <tr key={i} className="text-green-400">
                        <td className="py-1">${parseFloat(bid[0]).toFixed(2)}</td>
                        <td className="text-right py-1">{parseFloat(bid[1]).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-white/50">No bids data</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Recent Trades */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-medium mb-4">Recent Trades</h2>
          
          {trades.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-neutral-900">
                  <tr className="text-white/50">
                    <th className="text-left">Time</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Size</th>
                    <th className="text-right">Side</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <tr key={i} className={trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                      <td className="py-1">{new Date(trade.time).toLocaleTimeString()}</td>
                      <td className="text-right py-1">${parseFloat(trade.price).toFixed(2)}</td>
                      <td className="text-right py-1">{parseFloat(trade.size).toFixed(4)}</td>
                      <td className="text-right py-1 capitalize">{trade.side}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : loading ? (
            <div className="text-center py-4 animate-pulse">Loading trade data...</div>
          ) : (
            <div className="text-white/50 text-center py-4">No trade data available</div>
          )}
        </div>
      </div>
      
      {/* Candles */}
      <div className="bg-white/5 rounded-xl p-6">
        <h2 className="text-xl font-medium mb-4">Recent Candles</h2>
        
        {displayCandles.length > 0 ? (
          <div className="max-h-[400px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-900">
                <tr className="text-white/50">
                  <th className="text-left">Time</th>
                  <th className="text-right">Open</th>
                  <th className="text-right">High</th>
                  <th className="text-right">Low</th>
                  <th className="text-right">Close</th>
                  <th className="text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {displayCandles.slice(-5).map((candle, i) => (
                  <tr key={i} className={candle.close > candle.open ? 'text-green-400' : 'text-red-400'}>
                    <td className="py-1">{new Date(candle.time * 1000).toLocaleString()}</td>
                    <td className="text-right py-1">${candle.open.toFixed(2)}</td>
                    <td className="text-right py-1">${candle.high.toFixed(2)}</td>
                    <td className="text-right py-1">${candle.low.toFixed(2)}</td>
                    <td className="text-right py-1">${candle.close.toFixed(2)}</td>
                    <td className="text-right py-1 text-white/70">{candle.volume.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : loading ? (
          <div className="text-center py-4 animate-pulse">Loading candle data...</div>
        ) : (
          <div className="text-white/50 text-center py-4">No candle data available</div>
        )}
      </div>
    </div>
  );
}

// Helper component for status indicators
function StatusCard({ title, status, count }: { title: string; status: string; count?: number }) {
  const getStatusColor = () => {
    switch (status) {
      case 'live':
        return 'bg-green-500';
      case 'cached':
        return 'bg-blue-500';
      case 'fallback':
        return 'bg-yellow-500';
      case 'mock':
        return 'bg-red-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center">
        <span>{title}</span>
        {count !== undefined && (
          <span className="text-xs text-white/50 ml-2">({count})</span>
        )}
      </div>
      <div className="flex items-center">
        <span className="text-xs mr-2">{status}</span>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
      </div>
    </div>
  );
}
