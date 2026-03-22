import { NextResponse } from 'next/server';
import { searchCustomerByPhone } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone') || '9222212222';

  try {
    const customer = await searchCustomerByPhone(phone);
    return NextResponse.json({
      phone,
      found: !!customer,
      customer: customer ? {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        orders_count: customer.orders_count,
        total_spent: customer.total_spent,
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
