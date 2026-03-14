import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, isTopFeatured } = body;

    const data: any = {};
    if (status !== undefined) {
      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      data.status = status;
    }
    
    if (isTopFeatured !== undefined) {
      data.isTopFeatured = !!isTopFeatured;
    }

    const user = await prisma.featuredUser.update({
      where: { id },
      data,
    });

    // Real-time sync for homepage and community
    revalidatePath('/');
    revalidatePath('/community');

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.featuredUser.delete({ where: { id } });
    
    // Real-time sync for homepage and community
    revalidatePath('/');
    revalidatePath('/community');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
