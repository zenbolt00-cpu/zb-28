import { NextResponse } from 'next/server';
import { updateVariant } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { sku, barcode, price } = body;
    
    if (!sku && !barcode && !price) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await updateVariant(params.id, { sku, barcode, price });
    return NextResponse.json({ variant: updated });
  } catch (error: any) {
    console.error('Shopify Variant PATCH Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
