import { Candle } from '../types';
import { MarketRegime } from '../market/regime';
import { ConfluenceScorer, ConfluenceSignal } from './confluence-scorer';
import { PositionSizer, PositionSizeParams, PositionSizeCalculation } from './position-sizer';

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  regime: MarketRegime;
  positionSize?: PositionSizeCalculation;
  confluenceDetails: ConfluenceSignal;
  timestamp: number;
  price: number;
  reason: string;
}

export interface StrategyConfig {
  accountBalance: number;
  enablePositionSizing: boolean;
  minConfidenceThreshold: number;
}

export class StrategyAutomaticSwitcher {
  private static readonly DEFAULT_CONFIG: StrategyConfig = {
    accountBalance: 10000,
    enablePositionSizing: true,
    minConfidenceThreshold: 55 // 55% minimum confidence
  };

  /**
   * Generate trading signal with regime-based strategy switching
   */
  public static generateSignal(
    candles: Candle[],
    regime: MarketRegime,
    currentPrice: number,
    config: Partial<StrategyConfig> = {}
  ): TradingSignal {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    // Get confluence score using regime-aware logic
    const confluenceSignal = ConfluenceScorer.calculateScore(
      candles,
      regime,
      currentPrice
    );

    const timestamp = Date.now();
    
    // Check if signal meets minimum confidence threshold
    if (confluenceSignal.confidence < finalConfig.minConfidenceThreshold) {
      return {
        action: 'HOLD',
        confidence: confluenceSignal.confidence,
        regime,
        confluenceDetails: confluenceSignal,
        timestamp,
        price: currentPrice,
        reason: `Confidence ${confluenceSignal.confidence.toFixed(1)}% below threshold ${finalConfig.minConfidenceThreshold}%`
      };
    }

    // Generate position sizing if enabled
    let positionSize: PositionSizeCalculation | undefined;
    if (finalConfig.enablePositionSizing && confluenceSignal.recommendation !== 'HOLD') {
      const positionParams: PositionSizeParams = {
        accountBalance: finalConfig.accountBalance,
        currentPrice,
        direction: confluenceSignal.recommendation,
        regime,
        confidenceScore: confluenceSignal.confidence
      };

      positionSize = PositionSizer.calculatePositionSize(candles, positionParams);
    }

    // Generate detailed reason based on regime and signals
    const reason = this.generateSignalReason(regime, confluenceSignal);

    return {
      action: confluenceSignal.recommendation,
      confidence: confluenceSignal.confidence,
      regime,
      positionSize,
      confluenceDetails: confluenceSignal,
      timestamp,
      price: currentPrice,
      reason
    };
  }

  /**
   * Generate human-readable reason for the trading signal
   */
  private static generateSignalReason(
    regime: MarketRegime,
    confluence: ConfluenceSignal
  ): string {
    const activeSignals = confluence.signals.filter(s => s.active);
    const regimeDescription = this.getRegimeDescription(regime);
    
    if (activeSignals.length === 0) {
      return `${regimeDescription} - No clear signals detected`;
    }

    const signalNames = activeSignals.map(s => s.name).join(', ');
    const action = confluence.recommendation.toLowerCase();
    
    return `${regimeDescription} - ${action.toUpperCase()} signal from: ${signalNames} (${confluence.score}/${confluence.maxScore} points)`;
  }

  /**
   * Get human-readable regime description
   */
  private static getRegimeDescription(regime: MarketRegime): string {
    switch (regime) {
      case 'strong-trend':
        return 'Strong Trending Market';
      case 'weak-trend':
        return 'Weak Trending Market';
      case 'ranging':
        return 'Ranging Market';
      default:
        return 'Unknown Market Regime';
    }
  }

  /**
   * Validate if a signal should be executed based on additional filters
   */
  public static shouldExecuteSignal(
    signal: TradingSignal,
    volatilityThreshold: number = 90 // Don't trade in top 10% volatility
  ): boolean {
    // Don't execute HOLD signals
    if (signal.action === 'HOLD') {
      return false;
    }

    // Check confidence threshold
    if (signal.confidence < 50) {
      return false;
    }

    // Validate position size if available
    if (signal.positionSize) {
      const isValidPosition = PositionSizer.validatePosition(
        signal.positionSize,
        10000 // Default account balance for validation
      );
      if (!isValidPosition) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get strategy description for current regime
   */
  public static getStrategyDescription(regime: MarketRegime): string {
    switch (regime) {
      case 'strong-trend':
        return 'Trend-following strategy: Looking for EMA crossovers with momentum confirmation. Higher position sizes due to strong directional bias.';
      
      case 'weak-trend':
        return 'Cautious trend-following: Reduced position sizes due to uncertain direction. Waiting for clearer signals.';
      
      case 'ranging':
        return 'Mean-reversion strategy: Trading Bollinger Band bounces and RSI extremes. Lower risk due to choppy conditions.';
      
      default:
        return 'Adaptive strategy: Analyzing market conditions to determine optimal approach.';
    }
  }
}
