/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickActionPanel from '@/components/QuickActionPanel';
import { performanceTracker } from '@/lib/tracking/signal-performance';

type PT = typeof performanceTracker;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('QuickActionPanel', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('updates position size when entry or stop changes', () => {
    render(React.createElement(QuickActionPanel, { latestPrice: 100 }));
    const entry = screen.getByLabelText(/Entry/);
    const stop = screen.getByLabelText(/Stop/);
    expect(screen.getByText(/Position Size:/)).toHaveTextContent('10.0000');

    fireEvent.change(entry, { target: { value: '120' } });
    fireEvent.change(stop, { target: { value: '110' } });

    expect(screen.getByText(/Position Size:/)).toHaveTextContent('1.0000');
  });

  it('BUY and SELL buttons trigger performance tracker', () => {
    const entrySpy = jest.spyOn(performanceTracker, 'recordEntry');
    const exitSpy = jest.spyOn(performanceTracker, 'recordExit');
    render(React.createElement(QuickActionPanel, { latestPrice: 100 }));

    fireEvent.click(screen.getByText('BUY'));
    expect(entrySpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('SELL'));
    expect(exitSpy).toHaveBeenCalledTimes(1);
  });

  it('export and copy functions run without errors', async () => {
    render(React.createElement(QuickActionPanel, { latestPrice: 100 }));
    expect(() => fireEvent.click(screen.getByText('Export Data'))).not.toThrow();
    fireEvent.click(screen.getByText('Copy'));
    const clip = (navigator as any).clipboard.writeText as jest.Mock;
    expect(clip).toHaveBeenCalled();
  });
});
