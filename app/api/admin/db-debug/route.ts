import { NextResponse } from 'next/server';
import { Pool } from 'pg';
export const dynamic = 'force-dynamic';
export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const prismaUrl = process.env.POSTGRES_PRISMA_URL;
  const activeUrl = dbUrl || prismaUrl || process.env.POSTGRES_URL || '';
  const isProd = process.env.NODE_ENV === 'production';
  return NextResponse.json({
    dbUrlPrefix: dbUrl ? dbUrl.split('@')[1] : null,
    prismaUrlPrefix: prismaUrl ? prismaUrl.split('@')[1] : null,
    priorityUrlPrefix: activeUrl ? activeUrl.split('@')[1] : null,
    isProd
  });
}
