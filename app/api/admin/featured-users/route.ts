import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.featuredUser.findMany({
      include: {
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, imageUrl, styleDescription } = await req.json();

    if (!name || !email || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.featuredUser.create({
      data: {
        name,
        email,
        imageUrl,
        styleDescription,
        status: 'APPROVED',
        isTopFeatured: false,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('[Featured User API POST Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
