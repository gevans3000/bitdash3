import { NextResponse } from 'next/server';

let isShuttingDown = false;

export async function POST() {
  // Only allow shutdown in development mode for safety
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ success: false, message: 'Shutdown only allowed in development mode' }, { status: 403 });
  }

  if (isShuttingDown) {
    return NextResponse.json({ success: false, message: 'Shutdown already in progress' });
  }

  isShuttingDown = true;
  
  // Send the response before shutting down
  setTimeout(() => {
    console.log('Shutting down server by user request...');
    process.exit(0);
  }, 100);

  return NextResponse.json({ success: true, message: 'Server shutdown initiated' });
}
