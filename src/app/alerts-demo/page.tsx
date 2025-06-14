'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertManager } from '@/components/AlertManager';
import { useSignalNotifications } from '@/hooks/useSignalNotifications';
import { generateSignals } from '@/lib/signals/generator';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function AlertsDemoPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [autoGenerate, setAutoGenerate] = useState(false);
  
  // Initialize the notifications hook
  const {
    notifications,
    unreadCount,
    soundEnabled,
    processSignals,
    markAllAsRead,
    dismissAll,
    toggleSound,
  } = useSignalNotifications({
    soundEnabled: true,
    maxNotifications: 20,
    autoProcess: true,
  });

  // Generate a random signal
  const generateRandomSignal = () => {
    const signalTypes = [
      'ema_crossover_bullish',
      'ema_crossover_bearish',
      'rsi_overbought',
      'rsi_oversold',
      'volume_spike',
    ];
    
    const randomType = signalTypes[Math.floor(Math.random() * signalTypes.length)];
    const timestamp = Date.now();
    
    return {
      type: randomType,
      timestamp,
      confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
      metadata: {
        message: `Random ${randomType.replace('_', ' ')} signal`,
        price: (Math.random() * 10000 + 30000).toFixed(2),
        volume: (Math.random() * 100 + 50).toFixed(2),
      },
    };
  };

  // Generate and process a new signal
  const generateNewSignal = () => {
    const newSignal = generateRandomSignal();
    setSignals(prev => [newSignal, ...prev].slice(0, 10));
    processSignals([newSignal]);
  };

  // Auto-generate signals
  useEffect(() => {
    if (!autoGenerate) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to generate a signal each interval
        generateNewSignal();
      }
    }, 5000); // Every 5 seconds
    
    return () => clearInterval(interval);
  }, [autoGenerate]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Trading Alerts Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-generate">Auto-generate signals</Label>
                  <p className="text-sm text-muted-foreground">
                    {autoGenerate ? 'Generating signals every 5s' : 'Click to enable auto-generation'}
                  </p>
                </div>
                <Switch
                  id="auto-generate"
                  checked={autoGenerate}
                  onCheckedChange={setAutoGenerate}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sound-enabled">Sound alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    {soundEnabled ? 'Sounds enabled' : 'Sounds muted'}
                  </p>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={soundEnabled}
                  onCheckedChange={toggleSound}
                />
              </div>
              
              <div className="pt-2 space-x-2">
                <Button onClick={generateNewSignal} disabled={autoGenerate}>
                  Generate Signal
                </Button>
                <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
                  Mark All as Read
                </Button>
                <Button variant="outline" onClick={dismissAll} disabled={notifications.length === 0}>
                  Dismiss All
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Signals</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {signals.length} signal{signals.length !== 1 ? 's' : ''} generated
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {signals.length > 0 ? (
                <div className="space-y-2">
                  {signals.map((signal, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">
                            {signal.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${signal.metadata.price}
                          </div>
                          <div className="text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              signal.confidence > 70 ? 'bg-green-100 text-green-800' :
                              signal.confidence > 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {signal.confidence}% Confident
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No signals generated yet. Click "Generate Signal" to create one.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Alert Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This is the AlertManager component that would be included in your layout.
                It shows notifications in a floating panel.
              </p>
              <div className="border rounded-md p-4 bg-muted/20">
                <AlertManager 
                  signals={signals}
                  position="static"
                  className="relative shadow-none w-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
