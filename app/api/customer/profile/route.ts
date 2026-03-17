import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: session.user.email || "" },
          { id: (session.user as any).id || "" }
        ]
      },
      include: {
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
          take: 5
        },
        communityMember: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error("Fetch Profile Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, region, image } = body;

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: session.user.email || "" },
          { id: (session.user as any).id || "" }
        ]
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: name !== undefined ? name : undefined,
        region: region !== undefined ? region : undefined,
        image: image !== undefined ? image : undefined,
      }
    });

    return NextResponse.json({ customer: updatedCustomer });
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
