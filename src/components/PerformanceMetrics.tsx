import React, { useEffect, useState } from 'react';
import { performanceTracker, formatMetrics } from '@/lib/tracking/signal-performance';
import { loadTrades } from '@/lib/storage/trade-history';

interface MetricCardProps {
  title: string;
  value: string | number;
  isPositive?: boolean;
  isNegative?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, isPositive, isNegative }) => {
  let valueClass = 'text-gray-900';
  if (isPositive) valueClass = 'text-green-600';
  if (isNegative) valueClass = 'text-red-600';
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
};

const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState(performanceTracker.calculateMetrics());
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved trades on component mount
  useEffect(() => {
    try {
      const savedTrades = loadTrades();
      // Here you would typically restore the trades to the performance tracker
      // For now, we'll just use the in-memory tracker
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load trade history:', error);
      setIsLoading(false);
    }
    
    // Subscribe to performance updates
    const handleUpdate = () => {
      setMetrics(performanceTracker.calculateMetrics());
    };
    
    // In a real app, you'd have an event system to listen for trade updates
    // For now, we'll use a simple interval
    const interval = setInterval(handleUpdate, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const formattedMetrics = formatMetrics(metrics);
  
  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p>Loading performance data...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Trades" 
          value={metrics.totalTrades} 
        />
        <MetricCard 
          title="Win Rate" 
          value={formattedMetrics['Win Rate']} 
          isPositive={metrics.winRate > 50}
          isNegative={metrics.winRate < 30}
        />
        <MetricCard 
          title="Total P&L" 
          value={formattedMetrics['Total P&L']} 
          isPositive={metrics.totalPnlPercent > 0}
          isNegative={metrics.totalPnlPercent < 0}
        />
        <MetricCard 
          title="Profit Factor" 
          value={formattedMetrics['Profit Factor']} 
          isPositive={metrics.profitFactor > 1.5}
          isNegative={metrics.profitFactor < 1}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Performance Summary</h3>
          <div className="space-y-2">
            {Object.entries(formattedMetrics).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-600">{key}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Recent Trades</h3>
          {metrics.trades.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No trades recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {metrics.trades.slice(-5).map((trade) => (
                    <tr key={trade.id}>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium">${trade.entryPrice.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(trade.entryTime).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {trade.exitPrice ? (
                          <>
                            <div className="text-sm font-medium">${trade.exitPrice.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(trade.exitTime!).toLocaleTimeString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">Open</span>
                        )}
                      </td>
                      <td className={`px-2 py-2 whitespace-nowrap text-right text-sm font-medium ${
                        (trade.pnlPercent || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trade.pnlPercent ? `${trade.pnlPercent > 0 ? '+' : ''}${trade.pnlPercent.toFixed(2)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
