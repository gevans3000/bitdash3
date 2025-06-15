import { Candle } from '@/lib/types';

export type MarketRegime = 'strong-trend-up' | 'strong-trend-down' | 'weak-trend-up' | 'weak-trend-down' | 'ranging';

export interface RegimeAnalysis {
  regime: MarketRegime;
  confidence: number;
  adx: number;
  plusDI: number;
  minusDI: number;
  atr: number;
  rsi: number;
  volumeRatio: number;
  emaSlope: number;
  lastCandle: Candle | null;
  timestamp: number;
}

export class MarketRegimeDetector {
  private adxPeriod = 14;
  private rsiPeriod = 14;
  private emaPeriod = 21;
  private volumeLookback = 20;
  
  private adxThresholds = {
    strongTrend: 10,  // Further lowered thresholds for better 5m timeframe detection
    weakTrend: 2,    // More sensitive to weak trends
  };
  
  private minCandlesForAnalysis = 21;  // Reduced from 28 to 21 for faster response
  
  // Price and indicator buffers
  private highPrices: number[] = [];
  private lowPrices: number[] = [];
  private closePrices: number[] = [];
  private volumes: number[] = [];
  private candles: Candle[] = [];
  
  // Indicator values
  private trueRanges: number[] = [];
  private plusDMs: number[] = [];
  private minusDMs: number[] = [];
  private atr: number | null = null;
  private plusDI: number | null = null;
  private minusDI: number | null = null;
  private adx: number | null = null;
  private rsi: number | null = null;
  private ema: number | null = null;
  
  // State
  private currentRegime: MarketRegime = 'ranging';
  private regimeStartTime: number = 0;
  private lastRegimeChange: number = 0;
  private readonly regimeHistory: { timestamp: number; regime: MarketRegime }[] = [];
  private readonly maxHistory = 100;
  private lastCandle: Candle | null = null;
  private regimeConfidence: number = 50;
  
  public getRegimeConfidence(): number {
    return this.regimeConfidence;
  }

  constructor(private options: { 
    adxPeriod?: number;
    rsiPeriod?: number;
    emaPeriod?: number;
    volumeLookback?: number;
  } = {}) {
    this.adxPeriod = options.adxPeriod || this.adxPeriod;
    this.rsiPeriod = options.rsiPeriod || this.rsiPeriod;
    this.emaPeriod = options.emaPeriod || this.emaPeriod;
    this.volumeLookback = options.volumeLookback || this.volumeLookback;
  }

  public update(candle: Candle): RegimeAnalysis {
    this.lastCandle = candle;
    
    // Update price and volume series
    this.highPrices.push(candle.high);
    this.lowPrices.push(candle.low);
    this.closePrices.push(candle.close);
    this.volumes.push(candle.volume);
    this.candles.push(candle);

    // Keep only necessary history
    const maxLookback = Math.max(this.adxPeriod * 2, this.volumeLookback, this.emaPeriod * 2);
    if (this.highPrices.length > maxLookback) {
      this.highPrices.shift();
      this.lowPrices.shift();
      this.closePrices.shift();
      this.volumes.shift();
      this.candles.shift();
    }

    // Need enough data to calculate indicators
    if (this.closePrices.length < maxLookback) {
      return this.getCurrentAnalysis();
    }

    // Calculate all indicators
    this.calculateADX();
    this.calculateRSI();
    this.calculateEMA();
    
    // Store previous regime for comparison
    const previousRegime = this.currentRegime;
    
    // Determine the current market regime
    this.determineRegime();

    // Only update regime history if regime actually changed
    if (previousRegime !== this.currentRegime) {
      this.regimeStartTime = Date.now();
      this.regimeHistory.push({
        timestamp: Date.now(),
        regime: this.currentRegime
      });
      
      // Keep history size in check
      if (this.regimeHistory.length > this.maxHistory) {
        this.regimeHistory.shift();
      }
    }
    
    return this.getCurrentAnalysis();
  }

  private calculateRSI(): void {
    if (this.closePrices.length < this.rsiPeriod + 1) return;
    
    let gains: number[] = [];
    let losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < this.closePrices.length; i++) {
      const change = this.closePrices[i] - this.closePrices[i - 1];
      gains.push(Math.max(0, change));
      losses.push(Math.max(0, -change));
    }
    
    // Calculate average gains and losses
    let avgGain = gains.slice(0, this.rsiPeriod).reduce((a, b) => a + b, 0) / this.rsiPeriod;
    let avgLoss = losses.slice(0, this.rsiPeriod).reduce((a, b) => a + b, 0) / this.rsiPeriod;
    
    // Calculate RSI
    for (let i = this.rsiPeriod; i < gains.length; i++) {
      avgGain = (avgGain * (this.rsiPeriod - 1) + gains[i]) / this.rsiPeriod;
      avgLoss = (avgLoss * (this.rsiPeriod - 1) + losses[i]) / this.rsiPeriod;
    }
    
    const rs = avgGain / (avgLoss || 0.0001); // Avoid division by zero
    this.rsi = 100 - (100 / (1 + rs));
  }
  
  private calculateEMA(): void {
    if (this.closePrices.length < this.emaPeriod) return;
    
    // Simple SMA for the first value
    let sum = 0;
    for (let i = 0; i < this.emaPeriod; i++) {
      sum += this.closePrices[i];
    }
    
    const multiplier = 2 / (this.emaPeriod + 1);
    let ema = sum / this.emaPeriod;
    
    // EMA calculation
    for (let i = this.emaPeriod; i < this.closePrices.length; i++) {
      ema = (this.closePrices[i] - ema) * multiplier + ema;
    }
    
    this.ema = ema;
  }
  
  private calculateVolumeRatio(): number {
    if (this.volumes.length < this.volumeLookback) return 1;
    
    const currentVolume = this.volumes[this.volumes.length - 1];
    const lookbackVolumes = this.volumes.slice(-this.volumeLookback, -1);
    
    // Calculate median volume to be less sensitive to outliers
    const sortedVolumes = [...lookbackVolumes].sort((a, b) => a - b);
    const mid = Math.floor(sortedVolumes.length / 2);
    const medianVolume = sortedVolumes.length % 2 !== 0 
      ? sortedVolumes[mid] 
      : (sortedVolumes[mid - 1] + sortedVolumes[mid]) / 2;
      
    // Cap the ratio to avoid extreme values
    const ratio = currentVolume / (medianVolume || 0.0001);
    return Math.min(5, Math.max(0.2, ratio));
  }
  
  private calculateEMASlope(period: number): number {
    if (this.ema === null || this.closePrices.length < period + 1) {
      return 0;
    }
    
    // Calculate EMA for the current period and 'period' candles ago
    const currentEMA = this.ema;
    const prevEMA = this.calculateEMAValue(period);
    
    // Calculate slope as percentage change
    const slope = ((currentEMA - prevEMA) / prevEMA) * 100;
    
    // Apply smoothing and cap extreme values
    return Math.max(-5, Math.min(5, slope));
  }
  
  private calculateEMAValue(period: number): number {
    if (this.closePrices.length < period) {
      return this.closePrices.length > 0 ? this.closePrices[0] : 0;
    }
    
    const multiplier = 2 / (period + 1);
    let ema = this.closePrices[0];
    
    for (let i = 1; i < this.closePrices.length; i++) {
      ema = (this.closePrices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }



  private calculateADX(): void {
    if (this.highPrices.length < 2 || this.lowPrices.length < 2 || this.closePrices.length < 2) {
      return;
    }

    // Calculate True Range (TR)
    const currentHigh = this.highPrices[this.highPrices.length - 1];
    const currentLow = this.lowPrices[this.lowPrices.length - 1];
    const previousClose = this.closePrices[this.closePrices.length - 2];
    
    const tr = Math.max(
      currentHigh - currentLow,
      Math.abs(currentHigh - previousClose),
      Math.abs(currentLow - previousClose)
    );

    // Calculate +DM and -DM
    const upMove = currentHigh - this.highPrices[this.highPrices.length - 2];
    const downMove = this.lowPrices[this.lowPrices.length - 2] - currentLow;
    
    let plusDM = 0;
    let minusDM = 0;
    
    if (upMove > downMove && upMove > 0) {
      plusDM = upMove;
    }
    
    if (downMove > upMove && downMove > 0) {
      minusDM = downMove;
    }

    // Store calculations
    this.trueRanges.push(tr);
    this.plusDMs.push(plusDM);
    this.minusDMs.push(minusDM);

    // Keep only necessary history
    if (this.trueRanges.length > this.adxPeriod) {
      this.trueRanges.shift();
      this.plusDMs.shift();
      this.minusDMs.shift();
    }

    // Need enough data to calculate ADX
    if (this.trueRanges.length < this.adxPeriod) {
      return;
    }

    // Calculate smoothed averages
    const atr = this.trueRanges.reduce((sum: number, val: number) => sum + val, 0) / this.adxPeriod;
    const plusDIAvg = this.plusDMs.reduce((sum: number, val: number) => sum + val, 0) / this.adxPeriod;
    const minusDIAvg = this.minusDMs.reduce((sum: number, val: number) => sum + val, 0) / this.adxPeriod;

    // Calculate +DI and -DI
    this.plusDI = (plusDIAvg / (atr || 0.0001)) * 100;
    this.minusDI = (minusDIAvg / (atr || 0.0001)) * 100;

    // Calculate DX (avoid division by zero)
    const diSum = this.plusDI! + this.minusDI!;
    const dx = diSum > 0 ? (Math.abs(this.plusDI! - this.minusDI!) / diSum) * 100 : 0;

    // Calculate ADX (smoothed average of DX)
    this.adx = this.adx ? ((this.adx * (this.adxPeriod - 1)) + dx) / this.adxPeriod : dx;
  }

  private determineRegime(): void {
    // Initialize timestamps if not set
    const now = Date.now();
    if (this.regimeStartTime === 0) {
      this.regimeStartTime = now;
      this.lastRegimeChange = now;
    }
    
    // Default to ranging if not enough data
    if (!this.lastCandle || this.candles.length < this.minCandlesForAnalysis) {
      this.currentRegime = 'ranging';
      this.regimeConfidence = 50;
      return;
    }

    // Get indicator values with fallbacks
    const adx = this.adx || 0;
    const plusDI = this.plusDI || 0;
    const minusDI = this.minusDI || 0;
    const ema = this.ema || this.closePrices[this.closePrices.length - 1];
    const price = this.closePrices[this.closePrices.length - 1];
    const rsi = this.rsi || 50;
    
    // Calculate ADX strength with smoothing
    let adxStrength = 0;
    if (adx > this.adxThresholds.weakTrend) {
      adxStrength = Math.min(1, 
        (adx - this.adxThresholds.weakTrend) / 
        (this.adxThresholds.strongTrend - this.adxThresholds.weakTrend)
      );
    }
    
    // Enhanced volume analysis
    const volumeRatio = this.calculateVolumeRatio();
    const volumeContribution = volumeRatio > 1 ? 
      Math.min(1, (volumeRatio - 1) * 0.5) : 0;
    
    // EMA slope contribution with smoothing
    const emaSlope = this.calculateEMASlope(14);
    const emaSlopeContribution = Math.min(1, Math.abs(emaSlope) / 0.2);
    
    // Combined trend strength (0-1) with more weight on ADX
    const trendStrength = Math.min(1, 
      (adxStrength * 0.6) + 
      (volumeContribution * 0.25) + 
      (emaSlopeContribution * 0.15)
    );
    
    // Direction with hysteresis to prevent rapid flipping
    const isUptrend = plusDI > minusDI * 1.05;
    
    // Store previous regime
    const previousRegime = this.currentRegime;
    
    // Regime determination with improved thresholds
    const priceVsEma = Math.abs((price - ema) / ema);
    
    // Enhanced regime detection with multiple factors
    const isRanging = adx < 5 && priceVsEma < 0.02 && Math.abs(emaSlope) < 0.15;
    const isStrongTrend = (adx > this.adxThresholds.strongTrend && 
                         trendStrength > 0.35) || 
                         (adx > this.adxThresholds.strongTrend * 1.5);
    const isWeakTrend = (adx > this.adxThresholds.weakTrend && 
                       trendStrength > 0.2) ||
                       (adx > this.adxThresholds.weakTrend * 1.2 &&
                       priceVsEma > 0.002);
    
    // Determine regime with priority: strong trend > weak trend > ranging
    if (isStrongTrend) {
      this.currentRegime = isUptrend ? 'strong-trend-up' : 'strong-trend-down';
      this.regimeConfidence = Math.min(100, 75 + Math.round(trendStrength * 20));
    } 
    else if (isWeakTrend) {
      this.currentRegime = isUptrend ? 'weak-trend-up' : 'weak-trend-down';
      this.regimeConfidence = Math.min(100, 60 + Math.round(trendStrength * 30));
    }
    else if (isRanging) {
      this.currentRegime = 'ranging';
      // Higher confidence when ADX is very low and price is near EMA
      this.regimeConfidence = 85 - (adx * 5);
    }
    // If none of the above, use a default based on ADX
    else {
      this.currentRegime = adx > this.adxThresholds.weakTrend ? 
        (isUptrend ? 'weak-trend-up' : 'weak-trend-down') : 'ranging';
      this.regimeConfidence = adx > this.adxThresholds.weakTrend ? 55 : 65;
    }
    
    // Update timestamps if regime changed
    if (this.currentRegime !== previousRegime) {
      const now = Date.now();
      this.lastRegimeChange = now;
      this.regimeStartTime = now;
      this.regimeHistory.push({ timestamp: now, regime: this.currentRegime });
      if (this.regimeHistory.length > this.maxHistory) {
        this.regimeHistory.shift();
      }
    }
    
    // Adjust confidence based on RSI for ranging markets
    if (this.currentRegime === 'ranging' && (rsi < 40 || rsi > 60)) {
      this.regimeConfidence = Math.max(40, this.regimeConfidence - 10);
    }
  }

  private getCurrentAnalysis(): RegimeAnalysis {
    const volumeRatio = this.calculateVolumeRatio();
    const emaSlope = this.calculateEMASlope(14);
    
    return {
      regime: this.currentRegime,
      confidence: this.regimeConfidence,
      adx: this.adx || 0,
      plusDI: this.plusDI || 0,
      minusDI: this.minusDI || 0,
      atr: this.atr || 0,
      rsi: this.rsi || 50,
      volumeRatio,
      emaSlope,
      lastCandle: this.lastCandle,
      timestamp: Date.now()
    };
  }

  public getCurrentRegime(): MarketRegime {
    return this.currentRegime;
  }

  public getADX(): { adx: number; plusDI: number; minusDI: number } {
    return {
      adx: this.adx || 0,
      plusDI: this.plusDI || 0,
      minusDI: this.minusDI || 0,
    };
  }

  public getRegimeHistory() {
    return [...this.regimeHistory];
  }

  public getRegimeDurationMs(): number {
    if (this.regimeStartTime === 0) return 0;
    return Date.now() - this.regimeStartTime;
  }
  
  public getLastRegimeChangeMs(): number {
    if (this.lastRegimeChange === 0) return 0;
    return Date.now() - this.lastRegimeChange;
  }
}
