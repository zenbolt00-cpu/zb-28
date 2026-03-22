import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? 'PRESENT (hidden)' : 'MISSING',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'PRESENT (hidden)' : 'MISSING',
    POSTGRES_URL: process.env.POSTGRES_URL ? 'PRESENT (hidden)' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PHASE: process.env.NEXT_PHASE,
  };

  try {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
    let schemaContent = 'FILE NOT FOUND';
    if (fs.existsSync(schemaPath)) {
      schemaContent = fs.readFileSync(schemaPath, 'utf8').substring(0, 500);
    }

    const shopCount = await prisma.shop.count();
    return NextResponse.json({
      v: 3,
      status: 'connected',
      isMock: (prisma as any)._isMock || false,
      mockReason: (prisma as any)._mockReason || null,
      dbType: prisma.constructor.name,
      schemaSnippet: schemaContent,
      shopCount,
      envVars
    });
  } catch (error: any) {
    return NextResponse.json({
      v: 2,
      status: 'error',
      message: error.message,
      isMock: (prisma as any)._isMock || false,
      mockReason: (prisma as any)._mockReason || null,
      envVars
    }, { status: 500 });
  }
}
