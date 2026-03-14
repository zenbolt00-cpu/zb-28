import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isTopFeatured = searchParams.get('isTopFeatured') === 'true';

    const where: any = { status: 'APPROVED' };
    if (isTopFeatured) {
      where.isTopFeatured = true;
    }

    const users = await prisma.featuredUser.findMany({
      where,
      include: {
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
      take: isTopFeatured ? 20 : undefined,
    });
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, imageUrl, styleDescription } = body;

    const user = await prisma.featuredUser.create({
      data: {
        name,
        email,
        imageUrl,
        styleDescription,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
