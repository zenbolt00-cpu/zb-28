import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/init-db
 * Seeds the initial Shop record from environment variables.
 * Call this once after setting DATABASE_URL in Vercel to bootstrap the database.
 */
export async function POST() {
  try {
    const isMock = (prisma as any)._isMock;

    if (isMock) {
      const mockReason = (prisma as any)._mockReason || 'unknown';
      return NextResponse.json({
        error: `Database is not connected (Reason: ${mockReason}). Ensure POSTGRES_PRISMA_URL is set in Vercel.`,
        hint: 'If you just added the variables, ensure you clicked "Redeploy" in the Vercel Deployments tab.'
      }, { status: 503 });
    }

    const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
      || process.env.SHOPIFY_STORE_DOMAIN
      || 'zica-bella.myshopify.com';

    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '';

    // Upsert shop record
    const shop = await prisma.shop.upsert({
      where: { domain },
      update: { accessToken },
      create: {
        domain,
        accessToken,
      },
    });

    // Seed admin user if not exists
    const existingAdmin = await (prisma as any).admin?.findUnique?.({ where: { username: 'admin' } });
    if (!existingAdmin) {
      await (prisma as any).admin?.create?.({
        data: {
          username: 'admin',
          password: process.env.ADMIN_PASSWORD || 'admin123',
        },
      }).catch(() => null); // Non-fatal if admin model differs
    }

    return NextResponse.json({
      success: true,
      message: `Shop record created/verified for ${shop.domain}`,
      shopId: shop.id,
    });
  } catch (e: any) {
    console.error('[init-db]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const isMock = (prisma as any)._isMock;
    if (isMock) {
      return NextResponse.json({ status: 'no_database', isMock: true });
    }
    const shopCount = await prisma.shop.count();
    return NextResponse.json({ status: 'ok', shopCount });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', error: e.message }, { status: 500 });
  }
}
