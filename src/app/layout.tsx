import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

// Auto-shutdown functionality for development mode
import '@/lib/shutdown';

export const metadata: Metadata = {
  title: 'Bitdash Lite',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
