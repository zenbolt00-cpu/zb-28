import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { reviewerName, rating, comment } = body;

    const review = await prisma.review.create({
      data: {
        featuredUserId: id,
        reviewerName: reviewerName || 'Anonymous',
        rating: Number(rating) || 5,
        comment,
        status: 'APPROVED', // Auto-approve reviews for now as requested for "appraisal"
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
