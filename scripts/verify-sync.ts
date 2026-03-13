import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import * as dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Data Verification Report ---');
  
  const customerCount = await prisma.customer.count();
  const orderCount = await prisma.order.count();
  const itemCount = await prisma.orderItem.count();
  
  console.log(`Total Customers: ${customerCount}`);
  console.log(`Total Orders: ${orderCount}`);
  console.log(`Total Order Items: ${itemCount}`);

  // Sample check: First 5 customers and their orders
  const customers = await prisma.customer.findMany({
    take: 5,
    include: {
      orders: {
        include: {
          items: true
        }
      }
    }
  });

  for (const customer of customers) {
    console.log(`\nCustomer: ${customer.name} (${customer.email})`);
    console.log(`- Phone: ${customer.phone}`);
    console.log(`- Default Address: ${customer.defaultAddress}`);
    console.log(`- Orders Found: ${customer.orders.length}`);
    
    for (const order of customer.orders) {
      console.log(`  - Order ID: ${order.shopifyOrderId}`);
      console.log(`  - Status: ${order.status}`);
      console.log(`  - Total Price: ${order.totalPrice} ${order.currency}`);
      console.log(`  - Shipping Address: ${order.shippingAddress}`);
      console.log(`  - Items:`);
      for (const item of order.items) {
        console.log(`    * ${item.title} (Qty: ${item.quantity}, Price: ${item.price}, SKU: ${item.sku})`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
