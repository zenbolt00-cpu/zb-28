
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const shop = await prisma.shop.findFirst()
  if (!shop) {
    console.log('No shop found')
    return
  }

  // Ensure test customer exists
  // Upsert using email
  const customer = await prisma.customer.upsert({
    where: { shopifyId: 'test_id_123' },
    update: { email: 'test@zicabella.com', ordersCount: 1 },
    create: {
      email: 'test@zicabella.com',
      name: 'Test User',
      shopifyId: 'test_id_123',
      ordersCount: 1,
      shopId: shop.id
    }
  })

  // Create an order for the customer
  await prisma.order.upsert({
    where: { shopifyOrderId: 'order_test_123' },
    update: {},
    create: {
      shopifyOrderId: 'order_test_123',
      customerId: customer.id,
      shopId: shop.id,
      totalPrice: 120.00,
      status: 'paid'
    }
  })

  console.log('Seed done: Test user has 1 order.')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
