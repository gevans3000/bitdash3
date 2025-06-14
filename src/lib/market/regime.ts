import { Candle } from '@/lib/types';

export type MarketRegime = 'strong-trend' | 'weak-trend' | 'ranging';

export class MarketRegimeDetector {
  private adxPeriod = 14;
  private adxThresholds = {
    strongTrend: 25,
    weakTrend: 20,
  };
  private highPrices: number[] = [];
  private lowPrices: number[] = [];
  private closePrices: number[] = [];
  private trueRanges: number[] = [];
  private plusDMs: number[] = [];
  private minusDMs: number[] = [];
  private atr: number | null = null;
  private plusDI: number | null = null;
  private minusDI: number | null = null;
  private adx: number | null = null;
  private currentRegime: MarketRegime = 'ranging';
  private readonly regimeHistory: { timestamp: number; regime: MarketRegime }[] = [];
  private readonly maxHistory = 100;

  constructor(private options: { adxPeriod?: number } = {}) {
    this.adxPeriod = options.adxPeriod || this.adxPeriod;
  }

  public update(candle: Candle): MarketRegime {
    // Update price series
    this.highPrices.push(candle.high);
    this.lowPrices.push(candle.low);
    this.closePrices.push(candle.close);

    // Keep only necessary history
    if (this.highPrices.length > this.adxPeriod * 2) {
      this.highPrices.shift();
      this.lowPrices.shift();
      this.closePrices.shift();
    }

    // Need enough data to calculate ADX
    if (this.closePrices.length < this.adxPeriod * 2) {
      return this.currentRegime;
    }

    this.calculateADX();
    this.determineRegime();

    // Add to history
    this.regimeHistory.push({
      timestamp: candle.time * 1000, // Convert to ms
      regime: this.currentRegime,
    });

    // Keep history size in check
    if (this.regimeHistory.length > this.maxHistory) {
      this.regimeHistory.shift();
    }

    return this.currentRegime;
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
    if (this.adx === null) {
      this.currentRegime = 'ranging';
      return;
    }

    if (this.adx > this.adxThresholds.strongTrend) {
      this.currentRegime = 'strong-trend';
    } else if (this.adx > this.adxThresholds.weakTrend) {
      this.currentRegime = 'weak-trend';
    } else {
      this.currentRegime = 'ranging';
    }
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
    if (this.regimeHistory.length < 2) return 0;
    const currentRegime = this.currentRegime;
    let duration = 0;
    
    // Go backwards through history until regime changes
    for (let i = this.regimeHistory.length - 1; i >= 0; i--) {
      if (this.regimeHistory[i].regime === currentRegime) {
        if (i > 0) {
          duration += this.regimeHistory[i].timestamp - this.regimeHistory[i - 1].timestamp;
        }
      } else {
        break;
      }
    }
    
    return duration;
  }
}
