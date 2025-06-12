import { DataCard } from './DataCard';
import { Signal } from '@/lib/signal';

export function SignalCard({ signal }: { signal: Signal }) {
  const color = 
    signal === 'BUY' ? 'text-green-400' : 
    signal === 'SELL' ? 'text-red-400' : 
    'text-white/60';
  return (
    <DataCard className="flex items-center justify-center h-40">
      <span className={`text-6xl font-bold ${color}`}>{signal}</span>
    </DataCard>
  );
}
