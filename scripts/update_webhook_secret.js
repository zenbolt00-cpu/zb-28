const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || '8tiahf-bk.myshopify.com';
  const webhookSecret = 'RANDOM_WEBHOOK_SECRET_1234567890abcdef';
  await prisma.shop.upsert({
    where: { domain: shopDomain },
    create: { domain: shopDomain, accessToken: '', webhookSecret },
    update: { webhookSecret },
  });
  console.log('Webhook secret updated');
  await prisma.$disconnect();
})();
