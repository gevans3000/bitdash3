// src/lib/agents/DataCollector.ts
import { orchestrator } from './Orchestrator';
import { AgentMessage } from './types';
import { Candle } from '@/lib/types';
import { getBinanceCandles } from '@/lib/binance';
import { subscribeToCandleUpdates } from '@/lib/binance-websocket';

const SYMBOL = 'BTCUSDT';
const INTERVAL = '5m';
const HISTORICAL_LIMIT = 100;
const BUFFER_MAX = 200;

export class DataCollectorAgent {
  private candleBuffer: Candle[] = [];
  private lastCandleTime: number = 0;
  private unsubscribeWS: (() => void) | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    console.log('DataCollector: Constructor called');
    // Bind methods
    this.handleInitialDataRequest = this.handleInitialDataRequest.bind(this);
    
    // Register message handlers
    orchestrator.register('REQUEST_INITIAL_DATA', this.handleInitialDataRequest);
    
    // Start initialization but don't wait for it
    if (!this.initializationPromise) {
      this.initializationPromise = this.initialize();
      
      // Log any initialization errors
      this.initializationPromise.catch(error => {
        console.error('DataCollector: Initialization failed:', error);
        this.initializationPromise = null; // Allow retries
      });
    }
  }

  public async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    
    if (!this.initializationPromise) {
      this.initializationPromise = this.initialize();
    }
    
    try {
      await this.initializationPromise;
    } catch (error) {
      // Reset initialization promise on error to allow retries
      this.initializationPromise = null;
      throw error;
    }
  }

  private async handleInitialDataRequest() {
    console.log('DataCollector: Received REQUEST_INITIAL_DATA');
    
    try {
      // Ensure we're initialized
      await this.ensureInitialized();
      
      // If we have data, send it
      if (this.candleBuffer.length > 0) {
        console.log('DataCollector: Sending initial candles');
        this.notifyInitialCandles();
      } else {
        console.log('DataCollector: No data available to send');
      }
    } catch (error) {
      console.error('DataCollector: Error handling initial data request:', error);
      this.handleError(error, 'handling initial data request');
    }
  }

  private async initialize(): Promise<void> {
    console.log('DataCollector: Starting initialization...');
    
    try {
      // Load initial data
      await this.loadInitialCandles();
      
      // Set up WebSocket for live updates
      this.setupWebSocket();
      
      // Mark as initialized
      this.isInitialized = true;
      console.log('DataCollector: Initialized successfully');
      
      // Notify that we're ready
      orchestrator.send({
        from: 'DataCollector',
        type: 'DATA_READY',
        payload: { 
          candleCount: this.candleBuffer.length,
          lastUpdate: this.lastCandleTime
        },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('DataCollector: Initialization failed:', error);
      this.handleError(error, 'Failed to initialize DataCollector');
      throw error;
    }
  }

  private async loadInitialCandles(): Promise<void> {
    console.log('DataCollector: Fetching initial candles...');
    
    try {
      const candles = await getBinanceCandles(INTERVAL, HISTORICAL_LIMIT);
      
      if (!Array.isArray(candles)) {
        throw new Error('Expected array of candles but got: ' + typeof candles);
      }
      
      // Process the candles
      this.candleBuffer = candles;
      if (this.candleBuffer.length > 0) {
        this.lastCandleTime = this.candleBuffer[this.candleBuffer.length - 1].time;
      }
      
      console.log(`DataCollector: Loaded ${candles.length} initial candles`);
      this.notifyInitialCandles();
    } catch (error) {
      console.error('DataCollector: Error loading initial candles:', error);
      this.handleError(error, 'Failed to load initial candles');
      throw error;
    }
  }

  private notifyInitialCandles(): void {
    console.log(`DataCollector: Notifying about ${this.candleBuffer.length} initial candles`);
    
    try {
      orchestrator.send({
        from: 'DataCollector',
        type: 'INITIAL_CANDLES_5M',
        payload: [...this.candleBuffer],
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('DataCollector: Error notifying initial candles:', error);
      this.handleError(error, 'Failed to send initial candles');
    }
  }

  private setupWebSocket(): void {
    console.log('DataCollector: Setting up WebSocket connection...');
    
    try {
      // Unsubscribe from previous connection if exists
      if (this.unsubscribeWS) {
        console.log('DataCollector: Unsubscribing from previous WebSocket connection');
        this.unsubscribeWS();
      }
      
      // Subscribe to WebSocket updates
      console.log('DataCollector: Subscribing to WebSocket updates');
      this.unsubscribeWS = subscribeToCandleUpdates(
        (candle: Candle, isClosed: boolean) => this.handleNewCandle(candle, isClosed)
      );
      
      console.log('DataCollector: WebSocket subscription active');
      
      // Notify that we're connected
      orchestrator.send({
        from: 'DataCollector',
        type: 'WEBSOCKET_STATUS',
        payload: { 
          connected: true, 
          message: 'WebSocket connected',
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('DataCollector: Error setting up WebSocket connection:', error);
      this.handleError(error, 'Failed to set up WebSocket connection');
      
      // The WebSocket client will handle reconnection automatically
      throw error;
    }
  }

  private handleNewCandle(candle: Candle, isClosed: boolean): void {
    try {
      // Validate candle data
      if (!candle || typeof candle.time !== 'number' || 
          typeof candle.open !== 'number' || 
          typeof candle.high !== 'number' ||
          typeof candle.low !== 'number' ||
          typeof candle.close !== 'number' ||
          typeof candle.volume !== 'number') {
        console.error('DataCollector: Invalid candle data:', candle);
        return;
      }

      const existingIndex = this.candleBuffer.findIndex(c => c.time === candle.time);
      
        if (existingIndex >= 0) {
          // Update existing candle
          this.candleBuffer[existingIndex] = candle;
        } else {
          // Add new candle and sort by time
          this.candleBuffer.push(candle);
          this.candleBuffer.sort((a, b) => a.time - b.time);
          
          // Keep buffer size in check
          if (this.candleBuffer.length > BUFFER_MAX) {
            this.candleBuffer.shift();
          }
        }

        // Update last candle time
        this.lastCandleTime = Math.max(this.lastCandleTime, candle.time);

        // Notify about the update
        const messageType = isClosed ? 'NEW_CLOSED_CANDLE_5M' : 'LIVE_CANDLE_UPDATE_5M';
        orchestrator.send({
          from: 'DataCollector',
          type: messageType,
          payload: { ...candle, isClosed },
          timestamp: Date.now()
        });

        orchestrator.send<{ lastUpdateTime: number; lastCandleTime: number }>({
          from: 'DataCollector',
          type: 'DATA_STATUS_UPDATE',
          payload: { lastUpdateTime: Date.now(), lastCandleTime: candle.time },
          timestamp: Date.now()
        });
        
    } catch (error) {
      console.error('DataCollector: Error in handleNewCandle:', error);
      this.handleError(error, 'Failed to handle new candle');
    }
  }

  private handleError(error: unknown, context: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`DataCollector: Error in ${context}:`, errorMessage);
    
    // Notify the orchestrator about the error
    orchestrator.send({
      from: 'DataCollector',
      type: 'ERROR',
      payload: {
        message: `Error in ${context}`,
        error: errorMessage,
        timestamp: Date.now(),
        context
      },
      timestamp: Date.now()
    });
    
    // If this was an initialization error, reset the promise to allow retries
    if (context.includes('initialization')) {
      console.log('DataCollector: Resetting initialization promise to allow retries');
      this.initializationPromise = null;
    }
  }

  public cleanup(): void {
    console.log('DataCollector: Cleaning up...');
    
    try {
      if (this.unsubscribeWS) {
        this.unsubscribeWS();
        this.unsubscribeWS = null;
      }
    } catch (error) {
      console.error('Error during WebSocket cleanup:', error);
    } finally {
      this.unsubscribeWS = null;
      // Clear any pending operations
      this.isInitialized = false;
      this.initializationPromise = null;
      
      console.log('DataCollector: Cleanup complete');
    }
  }
}

// Export a singleton instance
export const dataCollectorAgent = new DataCollectorAgent();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    dataCollectorAgent.cleanup();
  });
}
