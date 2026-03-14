import prisma from '../lib/db';

async function main() {
  console.log('--- SEEDING COMMUNITY DATA ---');
  
  // 1. Ensure a Shop exists
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || '8tiahf-bk.myshopify.com';
  let shop = await prisma.shop.findUnique({ where: { domain: shopDomain } });
  
  if (!shop) {
    console.log('Creating shop record...');
    shop = await prisma.shop.create({
      data: {
        domain: shopDomain,
        accessToken: 'shpat_placeholder',
        heroTitle: 'Redefine The Standard',
        showCommunity: true,
        communityTitle: 'Featured Looks',
        communitySubtitle: 'Community',
        spotlightTitle: 'AUTHENTIC STREETWEAR',
        spotlightSubtitle: 'Luxury Indian streetwear for modern men.',
        kineticMeshTitle: 'ARCHIVE EDITION'
      }
    });
  } else {
    console.log('Shop record exists. Updating community settings...');
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        showCommunity: true,
        communityTitle: 'Featured Looks',
      }
    });
  }

  // 2. Add sample Featured Users
  const count = await prisma.featuredUser.count();
  if (count === 0) {
    console.log('Creating sample featured users...');
    await prisma.featuredUser.createMany({
      data: [
        {
          name: 'Alex Rivera',
          email: 'alex@example.com',
          imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
          styleDescription: 'Relaxed fit with the signature Zica Bella oversized hoodie. Effortless street style.',
          status: 'APPROVED',
          isTopFeatured: true
        },
        {
          name: 'Jordan Smith',
          email: 'jordan@example.com',
          imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop',
          styleDescription: 'The tech-wear aesthetic combined with premium fabrics. A true daily driver.',
          status: 'APPROVED',
          isTopFeatured: true
        },
        {
          name: 'Casey Wang',
          email: 'casey@example.com',
          imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
          styleDescription: 'Clean lines and a minimalist approach. Perfect for the modern creative.',
          status: 'PENDING',
          isTopFeatured: false
        }
      ]
    });
    console.log('Seed completed successfully.');
  } else {
    console.log('Featured users already exist. Skipping seed.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
