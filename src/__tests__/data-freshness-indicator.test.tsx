/** @jest-environment jsdom */
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataFreshnessIndicator from '../components/DataFreshnessIndicator';
import { orchestrator } from '../lib/agents/Orchestrator';

describe('DataFreshnessIndicator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.setSystemTime(undefined);
  });

  it('updates status when DATA_STATUS_UPDATE received', () => {
    render(<DataFreshnessIndicator />);

    act(() => {
      orchestrator.send({
        from: 'DataCollector',
        type: 'DATA_STATUS_UPDATE',
        payload: { lastUpdateTime: Date.now() },
        timestamp: Date.now(),
      });
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByText('● Live')).toBeInTheDocument();
  });
});
