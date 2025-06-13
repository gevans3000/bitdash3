import { DataCard } from './DataCard';

interface Props {
  price: number;
  change24h?: number;
  volume24h?: number;
}

export function PriceCard({ price, change24h, volume24h }: Props) {
  const rows = [
    ['Price', price.toFixed(2)],
    change24h === undefined ? null : ['24h Change', `${change24h.toFixed(2)}%`],
    volume24h === undefined ? null : ['24h Vol', volume24h.toFixed(2)],
  ].filter(Boolean) as [string, string][];

  return (
    <DataCard>
      <ul className="text-sm space-y-1">
        {rows.map(([k, v]) => (
          <li key={k} className="flex justify-between">
            <span className="text-white/60">{k}</span>
            <span className="font-medium">{v}</span>
          </li>
        ))}
      </ul>
    </DataCard>
  );
}
