import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Providers } from './providers';

// Auto-shutdown functionality for development mode
import '@/lib/shutdown';

export const metadata: Metadata = {
  title: 'Bitdash Lite',
  description: 'Bitcoin trading dashboard with real-time alerts and signals',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
