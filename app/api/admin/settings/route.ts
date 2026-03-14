import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { clearShopConfigCache } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

// GET: Fetch settings for the primary shop
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const envDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const domainOverride = url.searchParams.get('shop') || envDomain;

    let shop = domainOverride
      ? await prisma.shop.findFirst({ where: { domain: domainOverride } })
      : await prisma.shop.findFirst();

    if (!shop && domainOverride) {
      shop = await prisma.shop.create({
        data: {
          domain: domainOverride,
          accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || 'shpat_required',
        }
      });
    }

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not initialized. Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN.' },
        { status: 404 },
      );
    }

    const shopData = shop as any;

    return NextResponse.json({
      shopDomain: envDomain || shopData.domain,
      accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || shopData.accessToken || '',
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
    console.error('[Settings API GET Error]:', e);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PATCH: Update integration settings for the primary shop
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { shopDomain: bodyDomain, ...updates } = body;

    const envDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const targetDomain = envDomain || bodyDomain;

    let shop = targetDomain 
      ? await prisma.shop.findFirst({ where: { domain: targetDomain } })
      : await prisma.shop.findFirst();

    if (!shop && targetDomain) {
      shop = await prisma.shop.create({
        data: {
          domain: targetDomain,
          accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || 'shpat_required',
        }
      });
    }

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found and could not be initialized' }, { status: 404 });
    }

    const data: any = {};
    const allowedKeys = [
      'delhiveryApiKey', 'razorpayKeyId', 'razorpayKeySecret',
      'shiprocketEmail', 'shiprocketToken', 'webhookSecret',
      'heroImage', 'heroVideo', 'heroTitle', 'heroSubtitle', 'heroButtonText',
      'latestCurationTitle', 'latestCurationSubtitle', 'archiveTitle', 'archiveSubtitle',
      'blueprintTitle', 'blueprintSubtitle', 'showHeroText', 'showLatestCuration',
      'showArchive', 'showBlueprint', 'showProductVideo', 'showSizeChart',
      'showBrand', 'showShippingReturn', 'showCare', 'showSizeFit', 'showDetails',
      'pdpBackground', 'instagramUrl', 'appleUrl', 'spotifyUrl', 'youtubeUrl',
      'featuredMedia', 'featuredMediaImage', 'collectionsMedia', 'kineticMeshProducts',
      'footerVideo', 'mainMenuHandle', 'secondaryMenuHandle', 'showTreeText',
      'showCommunity', 'communityTitle', 'communitySubtitle', 'spotlightTitle',
      'spotlightSubtitle', 'kineticMeshTitle'
    ] as const;

    const booleanKeys = [
      'showHeroText', 'showLatestCuration', 'showArchive', 'showBlueprint',
      'showProductVideo', 'showSizeChart', 'showBrand', 'showShippingReturn',
      'showCare', 'showSizeFit', 'showDetails', 'showTreeText', 'showCommunity'
    ];

    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        if (booleanKeys.includes(key as any)) {
          data[key] = updates[key] === true || updates[key] === 'true';
        } else {
          data[key] = updates[key];
        }
      }
    }

    // Standard Prisma update for all fields to ensure persistence and compatibility
    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data,
    });
    
    clearShopConfigCache();

    console.log(`[Settings API] Successfully persisted settings for ${updatedShop.domain}`);
    return NextResponse.json({ success: true, shopDomain: updatedShop.domain });
  } catch (e: any) {
    console.error('[Settings API PATCH Error]:', e);
    return NextResponse.json({ error: `Failed to save: ${e.message}` }, { status: 500 });
  }
}
