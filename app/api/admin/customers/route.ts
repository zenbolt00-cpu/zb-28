import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { fetchAllCustomers } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format');

    const [dbCustomers, shopifyCustomers] = await Promise.all([
      prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            include: {
              items: true,
            },
          },
        },
      }),
      fetchAllCustomers(250),
    ]);

    const shopifyMap = new Map<
      string,
      {
        email: string;
        first_name: string;
        last_name: string;
        phone: string | null;
        tags: string;
      }
    >();

    for (const c of shopifyCustomers) {
      shopifyMap.set(String(c.id), {
        email: c.email,
        first_name: c.first_name,
        last_name: c.last_name,
        phone: c.phone,
        tags: c.tags,
      });
    }

    const payload = dbCustomers.map((c) => {
      const s = shopifyMap.get(c.shopifyId);

      const shopifyName = s
        ? `${s.first_name || ''} ${s.last_name || ''}`.trim()
        : '';
      const email = s?.email || c.email || null;
      const phone = s?.phone || c.phone || null;

      const displayName =
        shopifyName ||
        c.name ||
        email ||
        (c.shopifyId !== 'anonymous' ? c.shopifyId : 'Anonymous User');

      const totalOrders = c.orders.length;
      const totalSpent = c.orders.reduce((sum, o) => sum + o.totalPrice, 0);

      return {
        id: c.id,
        shopifyId: c.shopifyId,
        email,
        name: displayName,
        phone,
        createdAt: c.createdAt,
        totalOrders,
        totalSpent,
        tags: s?.tags || '',
        orders: c.orders.map((o) => ({
          id: o.id,
          shopifyOrderId: o.shopifyOrderId,
          status: o.status,
          totalPrice: o.totalPrice,
          paymentStatus: o.paymentStatus,
          fulfillmentStatus: o.fulfillmentStatus,
          createdAt: o.createdAt,
          items: o.items.map((i) => ({
            id: i.id,
            title: i.title,
            quantity: i.quantity,
            price: i.price,
            sku: i.sku,
          })),
        })),
      };
    });

    if (format === 'csv') {
      const header = [
        'Shopify ID',
        'Name',
        'Email',
        'Phone',
        'Created At',
        'Total Orders',
        'Total Spent',
        'Tags',
      ];

      const rows = payload.map((c) => [
        c.shopifyId,
        c.name || '',
        c.email || '',
        c.phone || '',
        c.createdAt.toISOString(),
        String(c.totalOrders),
        c.totalSpent.toFixed(2),
        c.tags,
      ]);

      const csv = [header, ...rows]
        .map((cols) =>
          cols
            .map((v) => {
              const s = String(v ?? '');
              return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            })
            .join(','),
        )
        .join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="customers.csv"',
        },
      });
    }

    return NextResponse.json({ customers: payload }, { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Admin Customers API Error:', error);
    return NextResponse.json(
      { customers: [], error: 'Failed to load customers' },
      { status: 500 },
    );
  }
}

