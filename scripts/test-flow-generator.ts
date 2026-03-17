import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
  console.log('--- STARTING FLOW GENERATOR ---');

  // 1. Get Shop
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    console.error('❌ No shop found. Run migrations and seed basic data first.');
    return;
  }
  console.log('✔ Using Shop:', shop.domain);

  // 2. Get or Create "Local Tester" Customer
  const phone = '+1234567890';
  const customer = await prisma.customer.upsert({
    where: { shopifyId: 'gid://shopify/Customer/local_tester_001' },
    update: { phone },
    create: {
      shopifyId: 'gid://shopify/Customer/local_tester_001',
      shopId: shop.id,
      email: 'tester@example.com',
      name: 'Local Tester',
      phone,
      ordersCount: 2,
      totalSpent: 8500.00,
      defaultAddress: JSON.stringify({
        name: 'Local Tester',
        email: 'tester@example.com',
        phone: '+1234567890',
        street: '123 Tech Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        country: 'India'
      })
    }
  });
  console.log('✔ Customer Verified:', customer.name);

  // 3. Get Some Products for Line Items
  const products = await prisma.product.findMany({ take: 3 });
  if (products.length === 0) {
    console.log('ℹ No products found in DB. Creating a mock product...');
    const mockProduct = await prisma.product.create({
      data: {
        shopifyProductId: 'gid://shopify/Product/mock_001',
        shopId: shop.id,
        title: 'ARCHIVAL ZIP HOODIE',
        sku: 'ZB-ARK-001',
      }
    });
    products.push(mockProduct);
  }

  // 4. Create Mock Orders
  console.log('⟳ Generating Orders...');

  // Order 1: Paid & Fulfilled
  await prisma.order.upsert({
    where: { shopifyOrderId: 'gid://shopify/Order/mock_paid_001' },
    update: {},
    create: {
      shopifyOrderId: 'gid://shopify/Order/mock_paid_001',
      shopId: shop.id,
      customerId: customer.id,
      status: 'open',
      totalPrice: 4250.00,
      subtotalPrice: 4250.00,
      paymentStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      deliveryStatus: 'delivered',
      createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      items: {
        create: [
          {
            shopifyLineItemId: 'gid://shopify/LineItem/mock_li_001',
            productId: products[0].id,
            title: products[0].title,
            quantity: 1,
            price: 4250.00,
            sku: products[0].sku
          }
        ]
      },
      shipments: {
        create: {
          trackingNumber: 'ZB-TRK-9999',
          courier: 'Delhivery',
          status: 'delivered'
        }
      }
    }
  });

  // Order 2: Pending & Unfulfilled
  await prisma.order.upsert({
    where: { shopifyOrderId: 'gid://shopify/Order/mock_pending_002' },
    update: {},
    create: {
      shopifyOrderId: 'gid://shopify/Order/mock_pending_002',
      shopId: shop.id,
      customerId: customer.id,
      status: 'open',
      totalPrice: 4250.00,
      subtotalPrice: 4250.00,
      paymentStatus: 'pending',
      fulfillmentStatus: 'unfulfilled',
      deliveryStatus: 'pending',
      createdAt: new Date(), // Just now
      items: {
        create: [
          {
            shopifyLineItemId: 'gid://shopify/LineItem/mock_li_002',
            productId: products[0].id,
            title: products[0].title,
            quantity: 1,
            price: 4250.00,
            sku: products[0].sku
          }
        ]
      }
    }
  });

  console.log('✔ 2 Mock Orders Created for Local Tester.');
  console.log('--- GENERATOR COMPLETE ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
