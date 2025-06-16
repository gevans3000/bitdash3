// src/lib/agents/DataCollector.ts
import { orchestrator } from './Orchestrator';
import { AgentMessage } from './types';
import { Candle } from '@/lib/types';
import { getBinanceCandles } from '@/lib/binance';
import { subscribeToCandleUpdates } from '@/lib/binance-websocket';

const SYMBOL = 'BTCUSDT';
const INTERVAL = '5m';
const HISTORICAL_LIMIT = 100;
const REFRESH_LIMIT = 30; // Added: Number of recent candles to fetch on manual refresh
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
    this.handleManualDataRefreshRequest = this.handleManualDataRefreshRequest.bind(this); // Added
    
    // Register message handlers
    orchestrator.register('REQUEST_INITIAL_DATA', this.handleInitialDataRequest);
    orchestrator.register('MANUAL_DATA_REFRESH_REQUEST', this.handleManualDataRefreshRequest);
    
    // REMOVED: Do not auto-initialize on construction.
    // Initialization will now be triggered by MANUAL_DATA_REFRESH_REQUEST.
    // if (!this.initializationPromise) {
    //   this.initializationPromise = this.initialize();
    //
    //   // Log any initialization errors
    //   this.initializationPromise.catch(error => {
    //     console.error('DataCollector: Initialization failed:', error);
    //     this.initializationPromise = null; // Allow retries
    //   });
    // }
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
    
    // IMPORTANT CHANGE: Only send data if already initialized. Do NOT trigger initialization here.
    // Initialization is now solely triggered by MANUAL_DATA_REFRESH_REQUEST.
    if (this.isInitialized && this.candleBuffer.length > 0) {
      console.log('DataCollector: Already initialized and has data, sending initial candles in response to REQUEST_INITIAL_DATA.');
      this.notifyInitialCandles();
    } else if (this.isInitialized && this.candleBuffer.length === 0) {
      console.log('DataCollector: Initialized but no candle data in buffer to send for REQUEST_INITIAL_DATA.');
    }
     else {
      console.log('DataCollector: Not yet initialized. Ignoring REQUEST_INITIAL_DATA. Waiting for user to trigger refresh.');
    }
    // No try-catch needed here anymore as we are not calling ensureInitialized which could throw.
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

  private async handleManualDataRefreshRequest(): Promise<void> {
    console.log('DataCollector: Received MANUAL_DATA_REFRESH_REQUEST');
    
    // If not initialized, run full initialization. Otherwise, just refresh recent data.
    if (!this.isInitialized || !this.initializationPromise) {
      console.log('DataCollector: Not initialized, running full initialization via refresh request.');
      orchestrator.send({
        from: 'DataCollector',
        type: 'DATA_STATUS_UPDATE',
        payload: { text: 'Initializing data via refresh...', color: 'text-yellow-400', lastUpdateTime: Date.now(), lastCandleTime: this.lastCandleTime },
        timestamp: Date.now()
      });
      try {
        // Ensure any previous failed promise is cleared
        this.initializationPromise = null;
        await this.ensureInitialized(); // This will call this.initialize()
         orchestrator.send({
          from: 'DataCollector',
          type: 'DATA_STATUS_UPDATE',
          payload: { text: 'Data initialized', color: 'text-green-400', lastUpdateTime: Date.now(), lastCandleTime: this.lastCandleTime },
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('DataCollector: Error during initial data load triggered by refresh:', error);
        // handleError is called within initialize() or ensureInitialized()
        orchestrator.send({
          from: 'DataCollector',
          type: 'DATA_STATUS_UPDATE',
          payload: { text: 'Initialization failed', color: 'text-red-400', lastUpdateTime: Date.now(), lastCandleTime: this.lastCandleTime },
          timestamp: Date.now()
        });
      }
    } else {
      console.log('DataCollector: Already initialized, fetching recent candles for refresh.');
      orchestrator.send({
        from: 'DataCollector',
        type: 'DATA_STATUS_UPDATE',
        payload: { text: 'Refreshing data...', color: 'text-yellow-400', lastUpdateTime: Date.now(), lastCandleTime: this.lastCandleTime },
        timestamp: Date.now()
      });
      try {
        // Ensure WebSocket is active or try to reconnect
        // setupWebSocket is part of initialize, but we might want to ensure it's connected
        // without re-fetching all historical data if already initialized.
        // For simplicity now, initialize() handles this. If more granular control is needed,
        // binanceWebSocket.connect() could be called directly here.
        // For now, let's assume ensureInitialized or a direct call to fetchRecentCandles + WS check is enough.

        // Re-establish WebSocket connection if needed (setupWebSocket also connects)
        // This might be redundant if initialize() is robust, but good for explicit refresh.
        if (this.unsubscribeWS) { // If there was a subscription, try to set it up again.
             this.setupWebSocket();
        } else { // If never subscribed (e.g. initial init failed before WS setup), try full init.
            await this.ensureInitialized(); // This will attempt to setup websocket if not done.
        }


        // Fetch a small number of recent candles
        await this.fetchRecentCandles();

        // Notify that data has been refreshed
        orchestrator.send({
          from: 'DataCollector',
          type: 'INITIAL_CANDLES_5M',
          payload: [...this.candleBuffer],
          timestamp: Date.now()
        });
        orchestrator.send({
          from: 'DataCollector',
          type: 'DATA_STATUS_UPDATE',
          payload: { text: 'Data refreshed', color: 'text-green-400', lastUpdateTime: Date.now(), lastCandleTime: this.lastCandleTime },
          timestamp: Date.now()
        });

      } catch (error) {
        console.error('DataCollector: Error handling manual data refresh:', error);
        this.handleError(error, 'handling manual data refresh');
        orchestrator.send({
          from: 'DataCollector',
          type: 'DATA_STATUS_UPDATE',
          payload: { text: 'Refresh failed', color: 'text-red-400', lastUpdateTime: Date.now(), lastCandleTime: this.lastCandleTime },
          timestamp: Date.now()
        });
      }
    }
  }

  private async fetchRecentCandles(): Promise<void> {
    console.log('DataCollector: Fetching recent candles for refresh...');
    try {
      const recentCandles = await getBinanceCandles(INTERVAL, REFRESH_LIMIT);
      if (!Array.isArray(recentCandles)) {
        throw new Error('Expected array of recent candles but got: ' + typeof recentCandles);
      }

      console.log(`DataCollector: Loaded ${recentCandles.length} recent candles for refresh`);
      
      // Merge recent candles into the buffer
      // This simple merge assumes recentCandles might overlap or be newer
      // A more sophisticated merge might be needed depending on exact data guarantees
      const existingTimes = new Set(this.candleBuffer.map(c => c.time));
      recentCandles.forEach(newCandle => {
        if (!existingTimes.has(newCandle.time)) {
          this.candleBuffer.push(newCandle);
        } else {
          // Update if existing
          const index = this.candleBuffer.findIndex(c => c.time === newCandle.time);
          if (index !== -1) {
            this.candleBuffer[index] = newCandle;
          }
        }
      });

      this.candleBuffer.sort((a, b) => a.time - b.time);

      // Keep buffer size in check
      while (this.candleBuffer.length > BUFFER_MAX) {
        this.candleBuffer.shift();
      }

      if (this.candleBuffer.length > 0) {
        this.lastCandleTime = this.candleBuffer[this.candleBuffer.length - 1].time;
      }
      // No explicit notification here, handled by handleManualDataRefreshRequest after this call
    } catch (error) {
      console.error('DataCollector: Error fetching recent candles:', error);
      this.handleError(error, 'Failed to fetch recent candles');
      throw error; // Re-throw to be caught by the caller
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
