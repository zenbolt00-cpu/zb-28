import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name, email, imageUrl, styleDescription, orderId } = await req.json();

    if (!name || !email || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const submission = await prisma.featuredUser.create({
      data: {
        name,
        email,
        imageUrl,
        styleDescription,
        orderId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    console.error('[Featured User Submission Error]:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
