import prisma from '../lib/db';

async function main() {
  console.log('--- DB CHECK ---');
  try {
    const shop = await prisma.shop.findFirst();
    console.log('Shop Data Found:', !!shop);
    console.log('shop.domain:', shop?.domain);
    console.log('shop.showCommunity:', shop?.showCommunity);
    console.log('shop.communityTitle:', shop?.communityTitle);
    
    const users = await prisma.featuredUser.findMany();
    console.log('Total FeaturedUsers in DB:', users.length);
    console.log('Status breakdown:');
    const statusCounts = users.reduce((acc: any, u) => {
      acc[u.status] = (acc[u.status] || 0) + 1;
      return acc;
    }, {});
    console.log(statusCounts);
    
    const topFeatured = users.filter(u => u.isTopFeatured && u.status === 'APPROVED');
    console.log('Top Featured & Approved (Homepage count):', topFeatured.length);
  } catch (err) {
    console.error('DB Check Failed:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
