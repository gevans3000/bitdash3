/** @jest-environment jsdom */
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataFreshnessIndicator from '../components/DataFreshnessIndicator';

describe('DataFreshnessIndicator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.setSystemTime(undefined);
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('shows green status and correct time for fresh binance data', () => {
    const { container } = render(
      <DataFreshnessIndicator lastUpdated={Date.now() - 10000} dataSource="binance" />
    );
    const dot = container.querySelector('div.w-2.h-2.rounded-full');
    expect(dot).toHaveClass('bg-green-500');
    expect(screen.getByText('10s ago')).toBeInTheDocument();
  });

  it('shows yellow status for data older than 30s', () => {
    const { container } = render(
      <DataFreshnessIndicator lastUpdated={Date.now() - 60000} dataSource="coingecko" />
    );
    const dot = container.querySelector('div.w-2.h-2.rounded-full');
    expect(dot).toHaveClass('bg-yellow-500');
    expect(screen.getByText('1m ago')).toBeInTheDocument();
  });

  it('shows red status for stale data and refreshes after interval', () => {
    const onRefresh = jest.fn();
    const { container } = render(
      <DataFreshnessIndicator
        lastUpdated={Date.now() - 180000}
        dataSource="binance"
        refreshInterval={30000}
        onRefresh={onRefresh}
      />
    );
    const dot = container.querySelector('div.w-2.h-2.rounded-full');
    expect(dot).toHaveClass('bg-red-500');
    expect(screen.getByText('3m ago')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(onRefresh).toHaveBeenCalled();
  });
});
