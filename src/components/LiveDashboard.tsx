'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Candle, OrderBookData, Trade } from '@/lib/types';
import SignalsDisplay from './SignalsDisplay';
import { useSignals } from '@/hooks/useSignals';

interface LiveDashboardProps {
  refreshTrigger?: number;
}

// Enhanced cached data interface with timestamps
interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export default function LiveDashboard({ refreshTrigger = 0 }: LiveDashboardProps) {
  // Main data states
  const [candles, setCandles] = useState<Candle[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // Data status tracking
  const [candlesStatus, setCandlesStatus] = useState<string>('cached');
  const [orderBookStatus, setOrderBookStatus] = useState<string>('cached');
  const [tradesStatus, setTradesStatus] = useState<string>('cached');
  
  // Timestamp for last update
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Store cached data references
  const cachedCandles = useRef<Candle[]>([]);
  const cachedOrderBook = useRef<OrderBookData | null>(null);
  const cachedTrades = useRef<Trade[]>([]);
  
  // Track initialization status
  const initialized = useRef(false);
  
  // Generate signals from candles
  const signals = useSignals(candles);
  
  // Initialize from localStorage on first render
  useEffect(() => {
    if (!initialized.current) {
      // Try to load cached data from localStorage
      try {
        const storedCandles = localStorage.getItem('bitdash_candles');
        const storedOrderBook = localStorage.getItem('bitdash_orderbook');
        const storedTrades = localStorage.getItem('bitdash_trades');
        const storedTimestamp = localStorage.getItem('bitdash_last_updated');

        let hasValidCache = false;

        // Process stored candles
        if (storedCandles) {
          try {
            const parsed = JSON.parse(storedCandles);
            // Validate candle data structure to prevent errors in signal generation
            if (Array.isArray(parsed) && parsed.length > 0 && 
                parsed.every(candle => (
                  candle && 
                  typeof candle === 'object' && 
                  'time' in candle && 
                  'open' in candle && 
                  'high' in candle && 
                  'low' in candle && 
                  'close' in candle && 
                  'volume' in candle
                ))) {
              cachedCandles.current = parsed;
              setCandles(parsed);
              setCandlesStatus('cached');
              hasValidCache = true;
            } else {
              console.log('Cached candle data had invalid structure, clearing cache');
              localStorage.removeItem('bitdash_candles');
            }
          } catch (parseErr) {
            console.error('Failed to parse cached candles', parseErr);
            localStorage.removeItem('bitdash_candles');
          }
        }

        // Process stored order book
        if (storedOrderBook) {
          try {
            const parsed = JSON.parse(storedOrderBook);
            if (parsed && typeof parsed === 'object' && 'bids' in parsed && 'asks' in parsed) {
              cachedOrderBook.current = parsed;
              setOrderBook(parsed);
              setOrderBookStatus('cached');
              hasValidCache = true;
            } else {
              localStorage.removeItem('bitdash_orderbook');
            }
          } catch (parseErr) {
            console.error('Failed to parse cached order book', parseErr);
            localStorage.removeItem('bitdash_orderbook');
          }
        }

        // Process stored trades
        if (storedTrades) {
          try {
            const parsed = JSON.parse(storedTrades);
            if (Array.isArray(parsed)) {
              cachedTrades.current = parsed;
              setTrades(parsed);
              setTradesStatus('cached');
              hasValidCache = true;
            } else {
              localStorage.removeItem('bitdash_trades');
            }
          } catch (parseErr) {
            console.error('Failed to parse cached trades', parseErr);
            localStorage.removeItem('bitdash_trades');
          }
        }
        
        // Process timestamp
        if (storedTimestamp) {
          try {
            const timestamp = parseInt(storedTimestamp, 10);
            if (!isNaN(timestamp)) {
              setLastUpdated(timestamp);
            }
          } catch (err) {
            // Ignore timestamp parse errors
          }
        }

        // If no valid cache found, fetch data immediately
        if (!hasValidCache) {
          fetchMarketData();
        }

        // Mark as initialized
        initialized.current = true;
      } catch (err) {
        console.error('Failed to load cached data', err);
        fetchMarketData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Fetch data from new market-data API endpoint
  const fetchMarketData = async (symbol: string = 'BTCUSDT', interval: string = '5m') => {
    setLoading(true);
    setCandlesStatus('loading');
    setOrderBookStatus('loading');
    setTradesStatus('loading');
    
    try {
      // Call our new unified market data endpoint
      const res = await fetch(`/api/market-data?symbol=${symbol}&interval=${interval}`, {
        cache: 'no-store'
      });
      
      if (res.ok) {
        const data = await res.json();
        const timestamp = data.timestamp || Date.now();
        
        // Update candles data
        if (data.candles && Array.isArray(data.candles)) {
          setCandles(data.candles);
          cachedCandles.current = data.candles;
          setCandlesStatus('fresh');
          localStorage.setItem('bitdash_candles', JSON.stringify(data.candles));
        }
        
        // Update order book data
        if (data.orderBook) {
          setOrderBook(data.orderBook);
          cachedOrderBook.current = data.orderBook;
          setOrderBookStatus('fresh');
          localStorage.setItem('bitdash_orderbook', JSON.stringify(data.orderBook));
        }
        
        // Update trades data
        if (data.trades && Array.isArray(data.trades)) {
          setTrades(data.trades);
          cachedTrades.current = data.trades;
          setTradesStatus('fresh');
          localStorage.setItem('bitdash_trades', JSON.stringify(data.trades));
        }
        
        // Update last updated timestamp
        setLastUpdated(timestamp);
        localStorage.setItem('bitdash_last_updated', timestamp.toString());
      } else {
        throw new Error('Failed to fetch market data');
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setCandlesStatus('error');
      setOrderBookStatus('error');
      setTradesStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data when refresh button is clicked
  useEffect(() => {
    if (refreshTrigger === 0) return;
    
    // Fetch fresh data from API endpoint
    fetchMarketData('BTCUSDT', '5m');
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);
  
  // Update cache references when data changes but avoid unnecessary localStorage updates
  // that could cause performance issues
  useEffect(() => {
    if (candles.length > 0) {
      // Only update localStorage when we get fresh data from the API
      if (candlesStatus === 'fresh') {
        localStorage.setItem('bitdash_candles', JSON.stringify(candles));
      }
      cachedCandles.current = candles;
    }
  }, [candles, candlesStatus]);
  
  useEffect(() => {
    if (orderBook && Object.keys(orderBook).length > 0) {
      // Only update localStorage when we get fresh data from the API
      if (orderBookStatus === 'fresh') {
        localStorage.setItem('bitdash_orderbook', JSON.stringify(orderBook));
      }
      cachedOrderBook.current = orderBook;
    }
  }, [orderBook, orderBookStatus]);
  
  useEffect(() => {
    if (trades.length > 0) {
      // Only update localStorage when we get fresh data from the API
      if (tradesStatus === 'fresh') {
        localStorage.setItem('bitdash_trades', JSON.stringify(trades));
      }
      cachedTrades.current = trades;
    }
  }, [trades, tradesStatus]);
  
  // Ensure we always have a valid array for candles, even if empty
  const displayCandles = candles.length > 0 ? candles : 
                         (cachedCandles.current && cachedCandles.current.length > 0) ? cachedCandles.current : [];
  
  // Show latest price from candles
  const latestPrice = displayCandles.length > 0 
    ? displayCandles[displayCandles.length - 1].close 
    : null;
  
  // Get latest trade data (from live or cache)
  const latestTrade = trades.length > 0 ? trades[0] : 
                      (cachedTrades.current && cachedTrades.current.length > 0) ? cachedTrades.current[0] : null;
  
  // Extract top 5 bids and asks (from live or cache)
  const effectiveOrderBook = orderBook || cachedOrderBook.current;
  const topBids = effectiveOrderBook?.bids?.slice(0, 5) || [];
  const topAsks = effectiveOrderBook?.asks?.slice(0, 5) || [];
  
  return (
    <div className="space-y-8">
      {/* Data Status */}
      <div className="grid grid-cols-3 gap-4">
        <StatusCard 
          title="Candles" 
          status={candlesStatus} 
          count={displayCandles.length} 
        />
        <StatusCard 
          title="Order Book" 
          status={orderBookStatus} 
          count={effectiveOrderBook ? ((effectiveOrderBook.bids?.length || 0) + (effectiveOrderBook.asks?.length || 0)) : 0} 
        />
        <StatusCard 
          title="Trades" 
          status={tradesStatus} 
          count={trades.length > 0 ? trades.length : (cachedTrades.current ? cachedTrades.current.length : 0)} 
        />
      </div>
      
      {/* Price Overview and Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-medium mb-4">Bitcoin Price</h2>
          {latestPrice ? (
            <div className="text-4xl font-bold">${latestPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</div>
          ) : loading ? (
            <div className="text-4xl font-bold animate-pulse">Loading...</div>
          ) : (
            <div className="text-4xl font-bold text-red-500">No Data</div>
          )}
          
          {lastUpdated && (
            <div className="mt-2 text-gray-400 text-sm">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}
          
          {latestTrade && (
            <div className={`mt-2 ${latestTrade.isBuyerMaker ? 'text-red-400' : 'text-green-400'}`}>
              Last trade: {latestTrade.price.toFixed(2)} ({latestTrade.qty.toFixed(6)} BTC)
            </div>
          )}
        </div>
        
        {/* Trading Signals */}
        <SignalsDisplay candles={displayCandles} />
      </div>
      
      {/* Market Depth */}
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
                    <th className="text-left py-1">Price</th>
                    <th className="text-right py-1">Amount</th>
                    <th className="text-right py-1">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 15).map((trade) => (
                    <tr key={trade.id} className={trade.isBuyerMaker ? 'text-red-400' : 'text-green-400'}>
                      <td className="py-1">${trade.price.toFixed(2)}</td>
                      <td className="text-right py-1">{trade.qty.toFixed(6)}</td>
                      <td className="text-right text-white/50 py-1">
                        {new Date(trade.time).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-white/50">No trade data</div>
          )}
        </div>
      </div>
      
      {/* Candles Summary */}
      <div className="bg-white/5 rounded-xl p-6">
        <h2 className="text-xl font-medium mb-4">Recent Candles</h2>
        
        {displayCandles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/50">
                  <th className="text-left py-1">Time</th>
                  <th className="text-right py-1">Open</th>
                  <th className="text-right py-1">High</th>
                  <th className="text-right py-1">Low</th>
                  <th className="text-right py-1">Close</th>
                  <th className="text-right py-1">Volume</th>
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

// Helper component for connection status
function StatusCard({ title, status, count }: { title: string, status: string, count?: number }) {
  const getStatusColor = () => {
    switch(status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-neutral-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-neutral-500';
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
