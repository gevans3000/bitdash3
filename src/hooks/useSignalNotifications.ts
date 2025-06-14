import { useState, useEffect, useCallback, useRef } from 'react';
import { Signal } from '@/lib/signals/generator';
import { processSignalForAlerts, AlertConfig } from '@/lib/alerts/signal-alerts';

export interface SignalNotification extends Signal {
  id: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
}

interface UseSignalNotificationsOptions {
  /** Initial signals to monitor */
  initialSignals?: Signal[];
  /** Whether to play sound for alerts */
  soundEnabled?: boolean;
  /** Maximum number of notifications to keep in history */
  maxNotifications?: number;
  /** Custom alert configurations */
  alertConfigs?: Record<string, AlertConfig>;
  /** Whether to automatically process new signals */
  autoProcess?: boolean;
  /** Callback when a new notification is added */
  onNotificationAdd?: (notification: SignalNotification) => void;
  /** Callback when notifications change */
  onNotificationsChange?: (notifications: SignalNotification[]) => void;
}

/**
 * Hook for managing signal notifications throughout the application
 */
export function useSignalNotifications({
  initialSignals = [],
  soundEnabled: initialSoundEnabled = true,
  maxNotifications = 50,
  alertConfigs: initialAlertConfigs = {},
  autoProcess = true,
  onNotificationAdd,
  onNotificationsChange,
}: UseSignalNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<SignalNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(initialSoundEnabled);
  const [isMuted, setIsMuted] = useState(false);
  const alertConfigsRef = useRef<Record<string, AlertConfig>>(initialAlertConfigs);
  const processingSignals = useRef<Set<string>>(new Set());

  // Update alert configs when they change
  useEffect(() => {
    alertConfigsRef.current = initialAlertConfigs;
  }, [initialAlertConfigs]);

  // Process a single signal and create a notification if needed
  const processSignal = useCallback(async (signal: Signal): Promise<SignalNotification | null> => {
    // Skip if already processing this signal
    const signalKey = `${signal.type}-${signal.timestamp || ''}-${JSON.stringify(signal.metadata || {})}`;
    if (processingSignals.current.has(signalKey)) {
      return null;
    }

    processingSignals.current.add(signalKey);

    try {
      // Check if we should create an alert for this signal
      const shouldAlert = await processSignalForAlerts(signal, {
        ...alertConfigsRef.current,
        // Override sound setting based on mute state
        ...(isMuted ? { [signal.type]: { ...alertConfigsRef.current[signal.type], sound: undefined } } : {})
      });

      if (!shouldAlert) {
        return null;
      }

      const newNotification: SignalNotification = {
        ...signal,
        id: `${signal.type}-${signal.timestamp || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: signal.timestamp || Date.now(),
        read: false,
        dismissed: false,
      };

      return newNotification;
    } catch (error) {
      console.error('Error processing signal for notification:', error);
      return null;
    } finally {
      processingSignals.current.delete(signalKey);
    }
  }, [isMuted]);

  // Add a new notification
  const addNotification = useCallback((notification: SignalNotification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      onNotificationsChange?.(updated);
      return updated;
    });
    onNotificationAdd?.(notification);
  }, [maxNotifications, onNotificationAdd, onNotificationsChange]);

  // Process an array of signals and add notifications
  const processSignals = useCallback(async (signals: Signal[]) => {
    if (!autoProcess || !signals.length) return;

    const newNotifications = await Promise.all(
      signals.map(signal => processSignal(signal))
    );

    const validNotifications = newNotifications.filter(
      (n): n is SignalNotification => n !== null
    );

    if (validNotifications.length > 0) {
      setNotifications(prev => {
        const updated = [...validNotifications, ...prev]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxNotifications);
        
        onNotificationsChange?.(updated);
        return updated;
      });

      validNotifications.forEach(onNotificationAdd);
    }
  }, [autoProcess, maxNotifications, onNotificationAdd, onNotificationsChange, processSignal]);

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      onNotificationsChange?.(updated);
      return updated;
    });
  }, [onNotificationsChange]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({
        ...n,
        read: true,
      }));
      onNotificationsChange?.(updated);
      return updated;
    });
  }, [onNotificationsChange]);

  // Dismiss a notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, dismissed: true } : n
      );
      onNotificationsChange?.(updated);
      return updated;
    });
  }, [onNotificationsChange]);

  // Dismiss all notifications
  const dismissAll = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({
        ...n,
        dismissed: true,
      }));
      onNotificationsChange?.(updated);
      return updated;
    });
  }, [onNotificationsChange]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    onNotificationsChange?.([]);
    setNotifications([]);
  }, [onNotificationsChange]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Process initial signals on mount
  useEffect(() => {
    if (initialSignals.length > 0) {
      processSignals(initialSignals);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;

  return {
    // State
    notifications,
    unreadCount,
    soundEnabled: !isMuted,
    
    // Actions
    addNotification,
    processSignals,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    clearAll,
    toggleSound,
    
    // State setters
    setSoundEnabled: (enabled: boolean) => setIsMuted(!enabled),
    setNotifications,
  };
}

export default useSignalNotifications;
