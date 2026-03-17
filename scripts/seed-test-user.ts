import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
  // 0. Ensure Shop exists
  const shop = await prisma.shop.upsert({
    where: { domain: '8tiahf-bk.myshopify.com' },
    update: {},
    create: {
      id: 'cmmr27wo70000poue250vvx2h',
      domain: '8tiahf-bk.myshopify.com',
      accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || 'shpat_placeholder',
      webhookSecret: 'RANDOM_WEBHOOK_SECRET_1234567890abcdef',
      showHeroText: false,
      heroTitle: 'Redefine The Standard',
    }
  });
  console.log('✔ Shop created/verified:', shop.id);

  // 1. Create Test Customer (9229229221)
  const customer = await prisma.customer.upsert({
    where: { shopifyId: 'gid://shopify/Customer/9229229221' },
    update: {
        phone: '+919229229221',
        name: 'Zica Collector',
    },
    create: {
      shopifyId: 'gid://shopify/Customer/9229229221',
      shopId: shop.id,
      email: 'collector@zicabella.com',
      name: 'Zica Collector',
      phone: '+919229229221',
      ordersCount: 3,
      totalSpent: 12500.00,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
      region: "India"
    }
  });

  console.log('✔ Test Customer created/verified:', customer.id);

  // 2. Create Community Member
  await prisma.communityMember.upsert({
    where: { customerId: customer.id },
    update: { isVerified: true },
    create: {
      customerId: customer.id,
      isVerified: true,
      whatsappOptIn: true,
    }
  });
  console.log('✔ Community Member status established.');

  // 3. Create Sample Orders for Profile Page
  const orderCount = await prisma.order.count({ where: { customerId: customer.id } });
  if (orderCount === 0) {
    console.log('🏗 Generating mock order history...');
    
    await prisma.order.create({
      data: {
        shopifyOrderId: 'gid://shopify/Order/1001',
        shopId: shop.id,
        customerId: customer.id,
        totalPrice: 4500,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'FULFILLED',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      }
    });

    await prisma.order.create({
      data: {
        shopifyOrderId: 'gid://shopify/Order/1002',
        shopId: shop.id,
        customerId: customer.id,
        totalPrice: 3200,
        status: 'IN_TRANSIT',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'UNFULFILLED',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }
    });

    console.log('✔ 2 Mock orders generated.');
  }

  console.log('\n--- VERIFICATION CREDENTIALS ---');
  console.log('Phone:', '+919229229221');
  console.log('OTP:', '123456');
  console.log('--------------------------------');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
