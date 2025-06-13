import { DataCard } from './DataCard';

interface Props {
  openInterest: number | null;
  delta1h: number | null;
  delta24h: number | null;
}

export default function OpenInterestCard({ openInterest, delta1h, delta24h }: Props) {
  const highlight = (d: number | null) =>
    d !== null && Math.abs(d) > 5 ? 'text-yellow-300' : '';

  return (
    <DataCard>
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-white/60">Open Interest</span>
          <span className="font-medium">{openInterest !== null ? openInterest.toFixed(0) : 'N/A'}</span>
        </div>
        <div className={`flex justify-between ${highlight(delta1h)}`}>
          <span className="text-white/60">1h Δ</span>
          <span>{delta1h !== null ? `${delta1h.toFixed(2)}%` : 'N/A'}</span>
        </div>
        <div className={`flex justify-between ${highlight(delta24h)}`}>
          <span className="text-white/60">24h Δ</span>
          <span>{delta24h !== null ? `${delta24h.toFixed(2)}%` : 'N/A'}</span>
        </div>
      </div>
    </DataCard>
  );
}
