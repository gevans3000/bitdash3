import { Candle } from '../types';
import { MarketRegime } from '../market/regime';
import { atr } from '../indicators/volatility';

export interface PositionSizeCalculation {
  positionSize: number;
  riskAmount: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  maxAccountRisk: number;
}

export interface PositionSizeParams {
  accountBalance: number;
  currentPrice: number;
  direction: 'BUY' | 'SELL';
  regime: MarketRegime;
  confidenceScore: number;
}

export class PositionSizer {
  private static readonly BASE_RISK_PERCENT = 0.01; // 1% base risk
  private static readonly ATR_MULTIPLIER = 2.5;
  private static readonly MIN_RR_RATIO = 2.0;

  /**
   * Calculate position size based on dynamic ATR stops and regime-based risk
   */
  public static calculatePositionSize(
    candles: Candle[],
    params: PositionSizeParams
  ): PositionSizeCalculation {
    // Calculate ATR for dynamic stop placement
    const atrValue = atr(candles, 14);
    if (isNaN(atrValue) || atrValue <= 0) {
      return this.createMinimalPosition(params);
    }

    // Regime-based risk adjustment
    const regimeRiskMultiplier = this.getRegimeRiskMultiplier(params.regime);
    const confidenceMultiplier = this.getConfidenceMultiplier(params.confidenceScore);
    
    // Calculate adjusted risk percentage
    const adjustedRiskPercent = this.BASE_RISK_PERCENT * regimeRiskMultiplier * confidenceMultiplier;
    const maxRiskAmount = params.accountBalance * adjustedRiskPercent;

    // Calculate stop loss based on ATR
    const stopDistance = atrValue * this.ATR_MULTIPLIER;
    const stopLoss = params.direction === 'BUY' 
      ? params.currentPrice - stopDistance
      : params.currentPrice + stopDistance;

    // Calculate position size based on risk
    const riskPerUnit = Math.abs(params.currentPrice - stopLoss);
    const positionSize = maxRiskAmount / riskPerUnit;

    // Calculate take profit (minimum 2:1 R:R)
    const profitDistance = riskPerUnit * this.MIN_RR_RATIO;
    const takeProfit = params.direction === 'BUY'
      ? params.currentPrice + profitDistance
      : params.currentPrice - profitDistance;

    const riskRewardRatio = profitDistance / riskPerUnit;

    return {
      positionSize: Math.floor(positionSize * 100) / 100, // Round to 2 decimals
      riskAmount: maxRiskAmount,
      stopLoss: Math.round(stopLoss * 100) / 100,
      takeProfit: Math.round(takeProfit * 100) / 100,
      riskRewardRatio,
      maxAccountRisk: adjustedRiskPercent * 100
    };
  }

  /**
   * Get risk multiplier based on market regime
   */
  private static getRegimeRiskMultiplier(regime: MarketRegime): number {
    switch (regime) {
      case 'strong-trend':
        return 1.5; // Increase risk in strong trends
      case 'weak-trend':
        return 0.75; // Reduce risk in weak trends
      case 'ranging':
        return 0.5; // Minimal risk in ranging markets
      default:
        return 1.0;
    }
  }

  /**
   * Get multiplier based on signal confidence
   */
  private static getConfidenceMultiplier(confidenceScore: number): number {
    if (confidenceScore >= 80) return 1.2; // High confidence
    if (confidenceScore >= 60) return 1.0; // Medium confidence
    if (confidenceScore >= 40) return 0.8; // Low confidence
    return 0.5; // Very low confidence
  }

  /**
   * Create minimal position when ATR calculation fails
   */
  private static createMinimalPosition(params: PositionSizeParams): PositionSizeCalculation {
    const stopDistance = params.currentPrice * 0.02; // 2% stop as fallback
    const stopLoss = params.direction === 'BUY' 
      ? params.currentPrice - stopDistance
      : params.currentPrice + stopDistance;

    const riskAmount = params.accountBalance * 0.005; // 0.5% risk
    const positionSize = riskAmount / stopDistance;
    
    const profitDistance = stopDistance * 2;
    const takeProfit = params.direction === 'BUY'
      ? params.currentPrice + profitDistance
      : params.currentPrice - profitDistance;

    return {
      positionSize: Math.floor(positionSize * 100) / 100,
      riskAmount,
      stopLoss: Math.round(stopLoss * 100) / 100,
      takeProfit: Math.round(takeProfit * 100) / 100,
      riskRewardRatio: 2.0,
      maxAccountRisk: 0.5
    };
  }

  /**
   * Validate position size against account limits
   */
  public static validatePosition(
    calculation: PositionSizeCalculation,
    accountBalance: number,
    maxPositionPercent: number = 0.05 // 5% max position size
  ): boolean {
    const maxPositionValue = accountBalance * maxPositionPercent;
    const positionValue = calculation.positionSize * calculation.riskAmount;
    
    return positionValue <= maxPositionValue && 
           calculation.riskRewardRatio >= this.MIN_RR_RATIO;
  }
}
