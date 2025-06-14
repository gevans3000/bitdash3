import React, { useState, useEffect, useCallback } from 'react';
import { Signal } from '@/lib/signals/generator';
import { processSignalForAlerts, AlertConfig, DEFAULT_ALERT_CONFIGS } from '@/lib/alerts/signal-alerts';
// Simple date formatter to replace date-fns
const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

// Simple icons as text
const Icons = {
  X: '✕',
  Bell: '🔔',
  BellOff: '🔕',
  Volume2: '🔊',
  VolumeX: '🔇',
} as const;

// Simple button component
const Button = ({ 
  onClick, 
  children, 
  disabled = false,
  variant = 'default',
  className = '' 
}: { 
  onClick: () => void; 
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}) => {
  const baseStyles = 'px-3 py-1.5 rounded text-sm font-medium transition-colors';
  const variantStyles = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple card components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`border-b border-gray-200 px-4 py-3 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-medium ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`border-t border-gray-200 px-4 py-3 flex justify-between ${className}`}>
    {children}
  </div>
);

// Simple switch component
const Switch = ({ 
  checked, 
  onCheckedChange,
  className = ''
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    } ${className}`}
  >
    <span
      className={`block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-0.5'
      }`}
    />
  </button>
);

// Simple label component
const Label = ({ 
  htmlFor, 
  children,
  className = ''
}: { 
  htmlFor?: string; 
  children: React.ReactNode;
  className?: string;
}) => (
  <label 
    htmlFor={htmlFor} 
    className={`block text-sm font-medium text-gray-700 ${className}`}
  >
    {children}
  </label>
);

// Simple scroll area
const ScrollArea = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <div className={`overflow-y-auto max-h-[400px] ${className}`}>
    {children}
  </div>
);

export interface Alert extends Signal {
  id: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
}

interface AlertManagerProps {
  /** Array of signals to monitor for alerts */
  signals?: Signal[];
  /** Whether to play sound for alerts */
  soundEnabled?: boolean;
  /** Callback when alerts change */
  onAlertsChange?: (alerts: Alert[]) => void;
  /** Maximum number of alerts to keep in history */
  maxAlerts?: number;
  /** Custom alert configurations */
  alertConfigs?: Record<string, AlertConfig>;
  /** Position of the alert manager */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Whether to show the alert manager header */
  showHeader?: boolean;
  /** Whether to show the alert manager footer */
  showFooter?: boolean;
  /** Custom class name */
  className?: string;
}

const getPositionClasses = (position: string) => {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'top-right':
      return 'top-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'bottom-right':
    default:
      return 'bottom-4 right-4';
  }
};

export const AlertManager: React.FC<AlertManagerProps> = ({
  signals = [],
  soundEnabled: initialSoundEnabled = true,
  onAlertsChange,
  maxAlerts = 50,
  alertConfigs = DEFAULT_ALERT_CONFIGS,
  position = 'top-right',
  showHeader = true,
  showFooter = true,
  className = '',
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(initialSoundEnabled);
  const [isOpen, setIsOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Process new signals and generate alerts
  useEffect(() => {
    if (!signals.length) return;

    const newAlerts: Alert[] = [];
    
    signals.forEach(signal => {
      // Check if we should create an alert for this signal
      if (processSignalForAlerts(signal, {
        ...alertConfigs,
        // Override sound setting based on mute state
        ...(isMuted ? { [signal.type]: { ...alertConfigs[signal.type], sound: undefined } } : {})
      })) {
        newAlerts.push({
          ...signal,
          id: `${signal.type}-${signal.timestamp || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: signal.timestamp || Date.now(),
          read: false,
          dismissed: false,
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prevAlerts => {
        const updatedAlerts = [...newAlerts, ...prevAlerts]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxAlerts);
        
        onAlertsChange?.(updatedAlerts);
        return updatedAlerts;
      });
    }
  }, [signals, alertConfigs, isMuted, maxAlerts, onAlertsChange]);

  // Mark all alerts as read
  const markAllAsRead = useCallback(() => {
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(alert => ({
        ...alert,
        read: true,
      }));
      
      onAlertsChange?.(updatedAlerts);
      return updatedAlerts;
    });
  }, [onAlertsChange]);

  // Dismiss an alert
  const dismissAlert = useCallback((id: string) => {
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(alert => 
        alert.id === id ? { ...alert, dismissed: true } : alert
      );
      
      onAlertsChange?.(updatedAlerts);
      return updatedAlerts;
    });
  }, [onAlertsChange]);

  // Dismiss all alerts
  const dismissAll = useCallback(() => {
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(alert => ({
        ...alert,
        dismissed: true,
      }));
      
      onAlertsChange?.(updatedAlerts);
      return updatedAlerts;
    });
  }, [onAlertsChange]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(alert => !alert.dismissed);
  const unreadCount = visibleAlerts.filter(alert => !alert.read).length;

  // Get alert type class
  const getAlertTypeClass = (type: string) => {
    if (type.includes('bullish') || type.includes('buy') || type.includes('oversold')) {
      return 'border-l-4 border-l-green-500';
    }
    if (type.includes('bearish') || type.includes('sell') || type.includes('overbought')) {
      return 'border-l-4 border-l-red-500';
    }
    if (type.includes('volume')) {
      return 'border-l-4 border-l-blue-500';
    }
    return 'border-l-4 border-l-yellow-500';
  };

  // Get alert icon
  const getAlertIcon = (type: string) => {
    if (type.includes('bullish') || type.includes('buy')) {
      return '📈';
    }
    if (type.includes('bearish') || type.includes('sell')) {
      return '📉';
    }
    if (type.includes('volume')) {
      return '🔊';
    }
    return 'ℹ️';
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${getPositionClasses(position)} bg-white p-3 rounded-full shadow-lg z-50 hover:bg-gray-100 transition-colors`}
        aria-label="Show alerts"
        style={{
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed'
        }}
      >
        <span>{Icons.Bell}</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '0.75rem',
            borderRadius: '9999px',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div 
      className={`fixed ${getPositionClasses(position)} w-80 max-h-[80vh] flex flex-col z-50 shadow-xl bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '80vh',
        width: '320px',
        position: 'fixed',
        zIndex: 50,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      {showHeader && (
        <div className="border-b border-gray-200 px-4 py-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 className="text-sm font-semibold">Trading Alerts</h3>
              {unreadCount > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '0.75rem',
                  borderRadius: '9999px',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={toggleSound}
                style={{
                  padding: '0.25rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'inherit',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                aria-label={isMuted ? 'Unmute alerts' : 'Mute alerts'}
              >
                {isMuted ? Icons.VolumeX : Icons.Volume2}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '0.25rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'inherit',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                aria-label="Close alerts"
              >
                {Icons.X}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ padding: 0, flex: 1, overflow: 'hidden' }}>
        {visibleAlerts.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <div style={{ borderTop: '1px solid #e5e7eb' }}>
              {visibleAlerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => dismissAlert(alert.id)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor: !alert.read ? '#eff6ff' : 'transparent',
                    borderBottom: '1px solid #f3f4f6',
                    ...getAlertTypeStyle(alert.type)
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.125rem', lineHeight: '1.75rem' }}>{getAlertIcon(alert.type)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          lineHeight: '1.25rem',
                          fontWeight: 500,
                          color: '#111827',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {alert.type.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </h4>
                        <span style={{
                          fontSize: '0.75rem',
                          lineHeight: '1rem',
                          color: '#6b7280',
                          marginLeft: '0.5rem',
                          whiteSpace: 'nowrap'
                        }}>
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        lineHeight: '1.25rem',
                        color: '#4b5563',
                        margin: '0.25rem 0 0 0'
                      }}>
                        {alert.metadata?.message || 'New trading signal detected'}
                      </p>
                      <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', fontSize: '0.75rem', lineHeight: '1rem', color: '#6b7280' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: '9999px',
                            marginRight: '0.25rem',
                            backgroundColor: alert.confidence > 70 ? '#10b981' : alert.confidence > 40 ? '#f59e0b' : '#ef4444'
                          }}></span>
                          {alert.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <div style={{ margin: '0 auto 0.5rem', width: '2rem', height: '2rem' }}>{Icons.BellOff}</div>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.25rem' }}>No alerts to display</p>
          </div>
        )}
      </div>
      
      {showFooter && visibleAlerts.length > 0 && (
        <div style={{
          padding: '0.5rem',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <Button
            variant="ghost"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            style={{
              fontSize: '0.75rem',
              lineHeight: '1rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            Mark all as read
          </Button>
          <Button
            variant="ghost"
            onClick={dismissAll}
            style={{
              fontSize: '0.75rem',
              lineHeight: '1rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            Dismiss all
          </Button>
        </div>
      )}
    </div>
  );
};

// Helper function to get alert type style
function getAlertTypeStyle(type: string) {
  const baseStyle = {
    borderLeft: '3px solid',
    borderLeftColor: '#3b82f6', // Default blue
  };

  switch (type) {
    case 'buy':
      return { ...baseStyle, borderLeftColor: '#10b981' }; // Green
    case 'sell':
      return { ...baseStyle, borderLeftColor: '#ef4444' }; // Red
    case 'warning':
      return { ...baseStyle, borderLeftColor: '#f59e0b' }; // Yellow
    case 'info':
    default:
      return baseStyle;
  }
}

// Helper function to get alert icon
function getAlertIcon(type: string) {
  switch (type) {
    case 'buy':
      return '🟢';
    case 'sell':
      return '🔴';
    case 'warning':
      return '⚠️';
    case 'info':
    default:
      return 'ℹ️';
  }
}

export default AlertManager;
