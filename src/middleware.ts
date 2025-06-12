import { NextResponse } from 'next/server';

// Pass-through middleware (no logic). Keeps Next.js happy when `src/middleware.ts` exists.
export function middleware() {
  return NextResponse.next();
}

// Disable by default (matches nothing) but file can be extended later.
export const config = {
  matcher: '/_noop',
};
