import { Signal } from '../signals/generator';

/**
 * Alert configuration for different signal types
 */
export interface AlertConfig {
  /** Whether this alert type is enabled */
  enabled: boolean;
  /** Sound to play for this alert */
  sound?: string;
  /** Notification title */
  title?: string;
  /** Notification body template (supports {{variable}} interpolation) */
  body?: string;
  /** Minimum confidence level to trigger alert (0-100) */
  minConfidence: number;
  /** Cooldown period between alerts of this type (ms) */
  cooldown: number;
  /** Last triggered timestamp for cooldown */
  lastTriggered?: number;
}

/**
 * Default alert configurations for different signal types
 */
export const DEFAULT_ALERT_CONFIGS: Record<string, AlertConfig> = {
  'ema_crossover_bullish': {
    enabled: true,
    sound: 'alert_high',
    title: '📈 Bullish Crossover',
    body: '{{symbol}}: EMA Crossover ({{timeframe}}) - Price: {{price}}',
    minConfidence: 70,
    cooldown: 1000 * 60 * 15, // 15 minutes cooldown
  },
  'ema_crossover_bearish': {
    enabled: true,
    sound: 'alert_low',
    title: '📉 Bearish Crossover',
    body: '{{symbol}}: EMA Crossover ({{timeframe}}) - Price: {{price}}',
    minConfidence: 70,
    cooldown: 1000 * 60 * 15,
  },
  'rsi_overbought': {
    enabled: true,
    sound: 'alert_medium',
    title: '⚠️ Overbought',
    body: '{{symbol}}: RSI {{rsiValue}} ({{timeframe}})',
    minConfidence: 75,
    cooldown: 1000 * 60 * 30, // 30 minutes cooldown
  },
  'rsi_oversold': {
    enabled: true,
    sound: 'alert_medium',
    title: '⚠️ Oversold',
    body: '{{symbol}}: RSI {{rsiValue}} ({{timeframe}})',
    minConfidence: 75,
    cooldown: 1000 * 60 * 30,
  },
  'volume_spike': {
    enabled: true,
    sound: 'alert_high',
    title: '📊 Volume Spike',
    body: '{{symbol}}: Volume {{volumeChange}}% above average',
    minConfidence: 80,
    cooldown: 1000 * 60 * 5, // 5 minutes cooldown
  },
};

/**
 * Check if an alert should be triggered for a signal
 */
export function shouldTriggerAlert(
  signal: Signal,
  configs: Record<string, AlertConfig> = DEFAULT_ALERT_CONFIGS,
  now: number = Date.now()
): boolean {
  const config = configs[signal.type];
  
  // No config or alert disabled
  if (!config || !config.enabled) {
    return false;
  }

  // Confidence too low
  if (signal.confidence < config.minConfidence) {
    return false;
  }

  // Check cooldown
  if (config.lastTriggered && now - config.lastTriggered < config.cooldown) {
    return false;
  }

  return true;
}

/**
 * Format an alert message using signal data
 */
export function formatAlertMessage(
  template: string,
  signal: Signal,
  additionalData: Record<string, any> = {}
): string {
  const data = {
    ...signal.metadata,
    ...additionalData,
    symbol: signal.symbol || 'BTC/USDT',
    timeframe: signal.timeframe || '5m',
    price: signal.price?.toFixed(2) || 'N/A',
    confidence: signal.confidence,
    type: signal.type,
  };

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : '';
  });
}

/**
 * Play an alert sound
 */
export function playAlertSound(sound: string): void {
  // In a real implementation, this would play a sound file
  // For now, we'll just log it
  console.log(`Playing sound: ${sound}`);
  
  // Example implementation with Web Audio API:
  // const audio = new Audio(`/sounds/${sound}.mp3`);
  // audio.play().catch(e => console.error('Error playing sound:', e));
}

/**
 * Send a browser notification
 */
export async function sendBrowserNotification(
  title: string,
  options: NotificationOptions & { body: string }
): Promise<Notification | null> {
  // Request permission if not already granted
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }
  }

  // Create and return the notification
  return new Notification(title, options);
}

/**
 * Process a signal and trigger alerts if conditions are met
 */
export async function processSignalForAlerts(
  signal: Signal,
  configs: Record<string, AlertConfig> = DEFAULT_ALERT_CONFIGS
): Promise<boolean> {
  const now = Date.now();
  const config = configs[signal.type];
  
  if (!shouldTriggerAlert(signal, configs, now)) {
    return false;
  }

  // Update last triggered time
  if (config) {
    config.lastTriggered = now;
  }

  try {
    // Format message
    const title = formatAlertMessage(
      config.title || signal.type,
      signal,
      { timestamp: new Date().toLocaleTimeString() }
    );
    
    const body = formatAlertMessage(
      config.body || '{{type}} signal detected',
      signal,
      { timestamp: new Date().toLocaleTimeString() }
    );

    // Play sound if configured
    if (config.sound) {
      playAlertSound(config.sound);
    }

    // Show notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      await sendBrowserNotification(title, {
        body,
        icon: '/favicon.ico',
        tag: `signal-${signal.type}-${signal.timestamp || now}`,
      });
    }

    console.log(`[Alert] ${title}: ${body}`);
    return true;
  } catch (error) {
    console.error('Error processing alert:', error);
    return false;
  }
}

export default {
  DEFAULT_ALERT_CONFIGS,
  shouldTriggerAlert,
  formatAlertMessage,
  playAlertSound,
  sendBrowserNotification,
  processSignalForAlerts,
};
