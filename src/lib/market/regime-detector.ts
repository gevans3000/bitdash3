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
    strongTrend: 25,
    weakTrend: 15,
  };
  
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
  private regimeStartTime: number = Date.now();
  private readonly regimeHistory: { timestamp: number; regime: MarketRegime }[] = [];
  private readonly maxHistory = 100;
  private lastCandle: Candle | null = null;

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
    
    // Determine the current market regime
    this.determineRegime();

    // Add to history if regime changed
    if (this.regimeHistory.length === 0 || 
        this.regimeHistory[this.regimeHistory.length - 1].regime !== this.currentRegime) {
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
    const avgVolume = this.volumes
      .slice(-this.volumeLookback, -1)
      .reduce((sum, vol) => sum + vol, 0) / (this.volumeLookback - 1);
      
    return currentVolume / (avgVolume || 0.0001);
  }
  
  private calculateEMASlope(): number {
    if (!this.ema || this.closePrices.length < this.emaPeriod * 2) return 0;
    
    // Calculate EMA for previous period
    const prevPrices = this.closePrices.slice(0, -1);
    let sum = 0;
    for (let i = 0; i < this.emaPeriod; i++) {
      sum += prevPrices[i];
    }
    
    const multiplier = 2 / (this.emaPeriod + 1);
    let ema = sum / this.emaPeriod;
    
    for (let i = this.emaPeriod; i < prevPrices.length; i++) {
      ema = (prevPrices[i] - ema) * multiplier + ema;
    }
    
    // Calculate slope as percentage change
    return ((this.ema! - ema) / ema) * 100;
  }
  
  private calculateADX(): void {
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
    const atr = this.trueRanges.reduce((sum, val) => sum + val, 0) / this.adxPeriod;
    const plusDIAvg = this.plusDMs.reduce((sum, val) => sum + val, 0) / this.adxPeriod;
    const minusDIAvg = this.minusDMs.reduce((sum, val) => sum + val, 0) / this.adxPeriod;

    // Calculate +DI and -DI
    this.plusDI = (plusDIAvg / atr) * 100;
    this.minusDI = (minusDIAvg / atr) * 100;

    // Calculate DX
    const dx = (Math.abs(this.plusDI - this.minusDI) / (this.plusDI + this.minusDI)) * 100;

    // Calculate ADX (smoothed average of DX)
    this.adx = this.adx ? ((this.adx * (this.adxPeriod - 1)) + dx) / this.adxPeriod : dx;
  }

  private determineRegime(): void {
    if (!this.adx || !this.plusDI || !this.minusDI || !this.rsi || !this.ema || !this.lastCandle) {
      this.currentRegime = 'ranging';
      return;
    }

    const price = this.lastCandle.close;
    const diSpread = Math.abs(this.plusDI - this.minusDI);
    const diRatio = diSpread / Math.max(this.plusDI, this.minusDI);
    const volumeRatio = this.calculateVolumeRatio();
    const emaSlope = this.calculateEMASlope();
    
    // Calculate trend strength components
    const adxStrength = (this.adx - this.adxThresholds.weakTrend) / 
                       (this.adxThresholds.strongTrend - this.adxThresholds.weakTrend);
    const volumeStrength = Math.min(1, (volumeRatio - 0.8) / 0.5); // Normalize 0.8-1.3 to 0-1
    const emaSlopeStrength = Math.min(1, Math.abs(emaSlope) / 0.5); // 0.5% slope = strong
    
    // Combined strength score (0-1)
    const trendStrength = Math.min(1, 
      (adxStrength * 0.5) + 
      (volumeStrength * 0.3) + 
      (emaSlopeStrength * 0.2)
    );
    
    // Determine trend direction
    const isUptrend = this.plusDI > this.minusDI * 1.2; // 20% stronger DI
    const isDowntrend = this.minusDI > this.plusDI * 1.2; // 20% stronger -DI
    
    // RSI confirmation
    const rsiConfirmation = (
      (isUptrend && this.rsi > 45 && this.rsi < 70) ||
      (isDowntrend && this.rsi < 55 && this.rsi > 30)
    );
    
    // Price relative to EMA
    const priceVsEma = (price - this.ema) / this.ema * 100; // Percentage above/below EMA
    const emaConfirmation = (
      (isUptrend && price > this.ema) ||
      (isDowntrend && price < this.ema)
    );
    
    // Final regime determination
    if (trendStrength > 0.7 && rsiConfirmation && emaConfirmation) {
      // Strong trend with confirmation
      this.currentRegime = isUptrend ? 'strong-trend-up' : 'strong-trend-down';
    } else if (trendStrength > 0.4 && (rsiConfirmation || emaConfirmation)) {
      // Weak trend with some confirmation
      this.currentRegime = isUptrend ? 'weak-trend-up' : 'weak-trend-down';
    } else if (Math.abs(emaSlope) < 0.1 && Math.abs(priceVsEma) < 1) {
      // Very flat price action near EMA
      this.currentRegime = 'ranging';
    } else {
      // Default to ranging if no clear trend
      this.currentRegime = 'ranging';
    }
  }

  private getCurrentAnalysis(): RegimeAnalysis {
    const volumeRatio = this.calculateVolumeRatio();
    const emaSlope = this.calculateEMASlope();
    
    // Calculate confidence based on indicator agreement
    let confidence = 0.5; // Base confidence
    
    // Increase confidence with stronger ADX
    if (this.adx) {
      confidence += Math.min(0.3, (this.adx - 15) / 50);
    }
    
    // Increase confidence with volume confirmation
    if (volumeRatio > 1.5) {
      confidence += 0.1;
    } else if (volumeRatio < 0.5) {
      confidence -= 0.1;
    }
    
    // Cap confidence between 0.1 and 0.95
    confidence = Math.max(0.1, Math.min(0.95, confidence));
    
    return {
      regime: this.currentRegime,
      confidence: Math.round(confidence * 100),
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
    return Date.now() - this.regimeStartTime;
  }
}
