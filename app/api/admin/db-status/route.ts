import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const isBuild = process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build';
    const isProdWithoutDb = process.env.NODE_ENV === 'production' && (!dbUrl || dbUrl.includes('placeholder'));
    
    // Check if prisma is a real client or a mock
    const isMock = (prisma as any)._isMock || false;
    
    // Try a simple query to verify connection
    let connectionAlive = false;
    let error: string | null = null;
    let shopCount = 0;

    try {
      shopCount = await prisma.shop.count();
      connectionAlive = true;
    } catch (e: any) {
      error = e.message;
    }

    return NextResponse.json({
      status: connectionAlive ? 'connected' : 'disconnected',
      isMock,
      isBuild,
      isProdWithoutDb,
      shopCount,
      environment: process.env.NODE_ENV,
      databaseUrlPrefix: dbUrl ? dbUrl.substring(0, 8) : 'none',
      error: error,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return NextResponse.json({ 
      status: 'error', 
      error: e.message 
    }, { status: 500 });
  }
}
