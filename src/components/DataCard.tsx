import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

export function DataCard({ children, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white/5 p-6 shadow-[var(--tw-shadow-elevation-medium)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
