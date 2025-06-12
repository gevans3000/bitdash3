import { DataCard } from './DataCard';
import { SignalResult } from '@/lib/signal';

export function SignalCard({ signal }: { signal: SignalResult }) {
  const color = 
    signal.signal === 'BUY' ? 'text-green-400' : 
    signal.signal === 'SELL' ? 'text-red-400' : 
    'text-white/60';
  return (
    <DataCard className="flex flex-col items-center justify-center h-40">
      <span className={`text-6xl font-bold ${color}`}>{signal.signal}</span>
      <span className="text-sm mt-2 text-white/70">{signal.reason}</span>
    </DataCard>
  );
}
