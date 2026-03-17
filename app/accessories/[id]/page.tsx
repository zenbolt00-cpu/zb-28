import prisma from "@/lib/db";
import Link from "next/link";
import AccessoryDetailsClient from "./AccessoryDetailsClient";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function AccessoryPage({ params }: { params: { id: string } }) {
  const shop = await prisma.shop.findFirst().catch(() => null);

  let items = [];
  if (shop?.ringCarouselItems) {
    try {
      items = JSON.parse(shop.ringCarouselItems);
    } catch (e) {
      items = [];
    }
  }

  const accessory = items.find((i: any) => i.id === params.id);

  if (!accessory) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accessory Not Found</h1>
          <Link href="/" className="px-6 py-3 bg-foreground text-background font-bold rounded-xl text-[10px] uppercase tracking-widest">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <AccessoryDetailsClient item={accessory} />
    </>
  );
}
