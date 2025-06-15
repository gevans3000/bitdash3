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
  private unsubscribeWebSocket: (() => void) | null = null;
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
    }
    
    try {
      this.initializationPromise; // Initialization is started, ensureInitialized will await
    } catch (error) {
      // Reset initialization promise on error to allow retries
      this.initializationPromise = null;
      throw error;
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
      this.handleError(error);
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
      // Unsubscribe from any existing connection
      if (this.unsubscribeWebSocket) {
        this.unsubscribeWebSocket();
        this.unsubscribeWebSocket = null;
      }

      // Subscribe to candle updates
      const unsubscribe = subscribeToCandleUpdates((candle: Candle, isClosed: boolean) => {
        this.handleNewCandle(candle, isClosed);
      });

      // Store unsubscribe function
      this.unsubscribeWebSocket = () => {
        console.log('DataCollector: Unsubscribing from WebSocket');
        unsubscribe();
      };

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
      console.error('DataCollector: WebSocket setup failed:', error);
      this.handleError(error, 'Failed to set up WebSocket connection');
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
      
      try {
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
        
      } catch (error) {
        console.error('DataCollector: Error processing candle update:', error);
        this.handleError(error, 'Failed to process candle update');
      }
    } catch (error) {
      console.error('DataCollector: Error in handleNewCandle:', error);
      this.handleError(error, 'Failed to handle new candle');
    }
  }
  
  private notifyCandleUpdate(candle: Candle, isClosed: boolean): void {
    try {
      const messageType = isClosed ? 'NEW_CLOSED_CANDLE_5M' : 'LIVE_CANDLE_UPDATE_5M';
      orchestrator.send({
        from: 'DataCollector',
        type: messageType,
        payload: { ...candle, isClosed },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('DataCollector: Error notifying candle update:', error);
      this.handleError(error, 'Failed to send candle update');
    }
  }

  private handleError(error: unknown, context: string = ''): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`DataCollector: Error ${context}`, error);
    
    try {
      // Notify about the error
      orchestrator.send({
        from: 'DataCollector',
        type: 'DATA_ERROR',
        payload: {
          message: errorMessage,
          context,
          timestamp: Date.now(),
          stack: error instanceof Error ? error.stack : undefined
        },
        timestamp: Date.now()
      });
    } catch (sendError) {
      console.error('DataCollector: Failed to send error notification:', sendError);
    }
    
    // Attempt to recover by reinitializing if we're in a bad state
    if (this.isInitialized) {
      console.log('DataCollector: Attempting to recover from error...');
      this.isInitialized = false;
      this.initializationPromise = null;
      this.initialize().catch(err => {
        console.error('DataCollector: Recovery initialization failed:', err);
      });
    }
  }

  public cleanup() {
    console.log('DataCollector: Cleaning up...');
    
    // Unsubscribe from WebSocket updates
    if (this.unsubscribeWebSocket) {
      try {
        this.unsubscribeWebSocket();
      } catch (error) {
        console.error('Error during WebSocket cleanup:', error);
      } finally {
        this.unsubscribeWebSocket = null;
      }
    }
    
    // Clear any pending operations
    this.isInitialized = false;
    this.initializationPromise = null;
    
    console.log('DataCollector: Cleanup complete');
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
