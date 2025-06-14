import React from 'react';
import { Candle } from '@/lib/types';
import { calculatePriceTargets, formatPrice } from '@/lib/calculators/price-targets';

interface PriceTargetsProps {
  candles: Candle[];
  entryPrice: number;
  isLong: boolean;
  accountSize?: number;
  riskPercentage?: number;
  className?: string;
}

export const PriceTargets: React.FC<PriceTargetsProps> = ({
  candles,
  entryPrice,
  isLong,
  accountSize = 1000, // Default account size if not provided
  riskPercentage = 1,  // Default risk per trade (1%)
  className = '',
}) => {
  if (!candles.length || !entryPrice) return null;

  try {
    // Calculate price targets using ATR-based stop loss
    const targets = calculatePriceTargets(candles, entryPrice, isLong);
    
    // Calculate position size based on risk
    const positionSize = calculatePositionSize(
      accountSize,
      riskPercentage,
      entryPrice,
      targets.stopLoss
    );

    // Calculate potential profit/loss
    const potentialProfit = isLong 
      ? (targets.takeProfit - entryPrice) * positionSize
      : (entryPrice - targets.takeProfit) * positionSize;
    
    const potentialLoss = Math.abs(entryPrice - targets.stopLoss) * positionSize;

    return (
      <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
        <h3 className="text-lg font-semibold mb-3">Trade Setup</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Entry Price</h4>
            <div className="text-lg font-mono">${formatPrice(entryPrice)}</div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Position Size</h4>
            <div className="text-lg font-mono">
              {positionSize.toFixed(8)} BTC
              <span className="text-sm text-gray-500 ml-2">
                (${(entryPrice * positionSize).toFixed(2)})
              </span>
            </div>
          </div>
          
          <div className="col-span-2">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div 
                className={`h-full ${isLong ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ 
                  width: '100%',
                  background: isLong 
                    ? 'linear-gradient(90deg, #EF4444, #F59E0B)' 
                    : 'linear-gradient(90deg, #10B981, #3B82F6)'
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>${formatPrice(targets.stopLoss)}</span>
              <span>${formatPrice(entryPrice)}</span>
              <span>${formatPrice(targets.takeProfit)}</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Stop Loss</h4>
            <div className="text-red-600 font-mono">${formatPrice(targets.stopLoss)}</div>
            <div className="text-xs text-gray-500">
              {isLong ? '-' : '+'}{formatPrice(targets.stopDistance)} ({isLong ? '-' : ''}{(targets.stopDistance / entryPrice * 100).toFixed(2)}%)
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Take Profit</h4>
            <div className="text-green-600 font-mono">${formatPrice(targets.takeProfit)}</div>
            <div className="text-xs text-gray-500">
              {isLong ? '+' : '-'}{formatPrice(targets.targetDistance)} ({isLong ? '+' : ''}{(targets.targetDistance / entryPrice * 100).toFixed(2)}%)
            </div>
          </div>
          
          <div className="col-span-2 mt-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Risk/Reward:</span>
              <span className="font-mono">1:{targets.riskRewardRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Potential Profit:</span>
              <span className="font-mono text-green-600">+${potentialProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Potential Loss:</span>
              <span className="font-mono text-red-600">-${potentialLoss.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error calculating price targets:', error);
    return (
      <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
        Error calculating price targets: {error.message}
      </div>
    );
  }
};

// Helper function to calculate position size
function calculatePositionSize(
  accountSize: number,
  riskPercentage: number,
  entryPrice: number,
  stopLossPrice: number
): number {
  const riskAmount = accountSize * (riskPercentage / 100);
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  return priceDistance > 0 ? riskAmount / priceDistance : 0;
}
