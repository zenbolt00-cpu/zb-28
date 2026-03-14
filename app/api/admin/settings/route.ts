import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { clearShopConfigCache } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

// GET: Fetch settings for the primary shop
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const domainOverride = url.searchParams.get('shop');

    let shop =
      domainOverride
        ? await prisma.shop.findFirst({ where: { domain: domainOverride } })
        : await prisma.shop.findFirst();

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found. Run /api/shopify/sync first.' },
        { status: 404 },
      );
    }

    const shopData = shop as any;

    // Return raw values; the UI is responsible for masking/secrecy.
    return NextResponse.json({
      shopDomain: shopData.domain,
      accessToken: shopData.accessToken || '',
      delhiveryApiKey: shopData.delhiveryApiKey || '',
      razorpayKeyId: shopData.razorpayKeyId || '',
      razorpayKeySecret: shopData.razorpayKeySecret || '',
      shiprocketEmail: shopData.shiprocketEmail || '',
      shiprocketToken: shopData.shiprocketToken || '',
      webhookSecret: shopData.webhookSecret || '',
      heroImage: shopData.heroImage || '',
      heroVideo: shopData.heroVideo || '',
      heroTitle: shopData.heroTitle || '',
      heroSubtitle: shopData.heroSubtitle || '',
      heroButtonText: shopData.heroButtonText || 'Discover',
      latestCurationTitle: shopData.latestCurationTitle || 'Latest curation',
      latestCurationSubtitle: shopData.latestCurationSubtitle || 'Season Drop',
      archiveTitle: shopData.archiveTitle || 'The Archive',
      archiveSubtitle: shopData.archiveSubtitle || 'Organic Evolution',
      blueprintTitle: shopData.blueprintTitle || 'The blueprint of Zica Bella',
      blueprintSubtitle: shopData.blueprintSubtitle || 'Technique & Motion',
      showProductVideo: !!shopData.showProductVideo,
      showSizeChart: !!shopData.showSizeChart,
      showBrand: !!shopData.showBrand,
      showShippingReturn: !!shopData.showShippingReturn,
      showCare: !!shopData.showCare,
      showSizeFit: !!shopData.showSizeFit,
      showDetails: !!shopData.showDetails,
      pdpBackground: shopData.pdpBackground || '',
      showHeroText: !!shopData.showHeroText,
      showLatestCuration: !!shopData.showLatestCuration,
      showArchive: !!shopData.showArchive,
      showBlueprint: !!shopData.showBlueprint,
      instagramUrl: shopData.instagramUrl || '',
      appleUrl: shopData.appleUrl || '',
      spotifyUrl: shopData.spotifyUrl || '',
      youtubeUrl: shopData.youtubeUrl || '',
      featuredMedia: shopData.featuredMedia || '',
      featuredMediaImage: shopData.featuredMediaImage || '',
      collectionsMedia: shopData.collectionsMedia || '',
      kineticMeshProducts: shopData.kineticMeshProducts || '',
      footerVideo: shopData.footerVideo || '',
      mainMenuHandle: shopData.mainMenuHandle || '',
      secondaryMenuHandle: shopData.secondaryMenuHandle || '',
      showTreeText: !!shopData.showTreeText,
      showCommunity: !!shopData.showCommunity,
      communityTitle: shopData.communityTitle || 'Featured Looks',
      communitySubtitle: shopData.communitySubtitle || 'Community',
      spotlightTitle: shopData.spotlightTitle || 'AUTHENTIC STREETWEAR',
      spotlightSubtitle: shopData.spotlightSubtitle || 'Luxury Indian streetwear for modern men. Redefining bold everyday style.',
      kineticMeshTitle: shopData.kineticMeshTitle || 'ARCHIVE EDITION',
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 },
    );
  }
}

// PATCH: Update integration settings for the primary shop (including domain)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { shopDomain, ...updates } = body;

    let shop;
    if (shopDomain) {
      shop = await prisma.shop.findUnique({ where: { domain: shopDomain } });
    }
    
    if (!shop) {
      shop = await prisma.shop.findFirst();
    }

    if (!shop) {
      const defaultDomain = shopDomain || process.env.SHOPIFY_STORE_DOMAIN || '8tiahf-bk.myshopify.com';
      shop = await prisma.shop.create({
        data: {
          domain: defaultDomain,
          accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || 'shpat_required',
        }
      });
    }

    const data: any = {};

    console.log('[Settings API] Received PATCH body keys:', Object.keys(updates));

    const allowedKeys = [
      'accessToken',
      'delhiveryApiKey',
      'razorpayKeyId',
      'razorpayKeySecret',
      'shiprocketEmail',
      'shiprocketToken',
      'webhookSecret',
      'heroImage',
      'heroVideo',
      'heroTitle',
      'heroSubtitle',
      'heroButtonText',
      'latestCurationTitle',
      'latestCurationSubtitle',
      'archiveTitle',
      'archiveSubtitle',
      'blueprintTitle',
      'blueprintSubtitle',
      'showHeroText',
      'showLatestCuration',
      'showArchive',
      'showBlueprint',
      'showProductVideo',
      'showSizeChart',
      'showBrand',
      'showShippingReturn',
      'showCare',
      'showSizeFit',
      'showDetails',
      'pdpBackground',
      'instagramUrl',
      'appleUrl',
      'spotifyUrl',
      'youtubeUrl',
      'featuredMedia',
      'featuredMediaImage',
      'collectionsMedia',
      'kineticMeshProducts',
      'footerVideo',
      'mainMenuHandle',
      'secondaryMenuHandle',
      'showTreeText',
      'showCommunity',
      'communityTitle',
      'communitySubtitle',
      'spotlightTitle',
      'spotlightSubtitle',
      'kineticMeshTitle'
    ] as const;

    const booleanKeys = [
      'showHeroText', 'showLatestCuration', 'showArchive', 'showBlueprint',
      'showProductVideo', 'showSizeChart', 'showBrand', 'showShippingReturn',
      'showCare', 'showSizeFit', 'showDetails', 'showTreeText', 'showCommunity'
    ];

    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        if (booleanKeys.includes(key)) {
          // Robust boolean casting
          data[key] = updates[key] === true || updates[key] === 1 || updates[key] === 'true';
        } else {
          data[key] = updates[key];
        }
      }
    }

    console.log('[Settings API] Attempting database update for shop:', shop.domain);
    
    // Split data into regular fields and fields that sometimes cause Prisma Client errors (if stale)
    const prismaFields: any = {};
    const rawFields: any = {};
    const rawKeys = ['featuredMediaImage', 'kineticMeshProducts'];

    for (const key of Object.keys(data)) {
      if (rawKeys.includes(key)) {
        rawFields[key] = data[key];
      } else {
        prismaFields[key] = data[key];
      }
    }

    // 1. Update regular fields via Prisma Client
    if (Object.keys(prismaFields).length > 0) {
      await prisma.shop.update({
        where: { id: shop.id },
        data: prismaFields,
      });
    }

    // 2. Update problematic fields via Raw SQL to bypass stale Prisma Client
    let i = 1;
    for (const key of rawKeys) {
      if (rawFields[key] !== undefined) {
        // PostgreSQL: Use $n placeholders
        await prisma.$executeRawUnsafe(
          `UPDATE "Shop" SET "${key}" = $1 WHERE id = $2`,
          rawFields[key],
          shop.id
        );
        console.log(`[Settings API] Raw SQL updated ${key} for shop ${shop.domain}`);
      }
    }
    
    // Invalidate the Shopify Config cache to ensure the new settings take effect immediately
    clearShopConfigCache();

    console.log(`[Settings API] Successfully updated shop ${shop.domain}`);
    return NextResponse.json({ success: true, shopDomain: shop.domain });
  } catch (e: any) {
    console.error('[Settings API PATCH Error]:', e.message);
    return NextResponse.json(
      { error: `Failed to save settings: ${e.message}` },
      { status: 500 },
    );
  }
}
