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

    let shop = await prisma.shop.findFirst({
      where: domainOverride ? { domain: domainOverride } : {}
    });

    if (!shop) {
      // If still not found, try getting ANY shop
      shop = await prisma.shop.findFirst();
    }

    if (!shop && domainOverride) {
      // Create shop if missing and we have a domain
      shop = await prisma.shop.create({
        data: {
          domain: domainOverride,
          accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || 'shpat_required',
        }
      });
    }

    if (!shop) {
      // Final fallback: create a default shop record if DB is completely empty
      shop = await prisma.shop.create({
        data: {
          domain: 'zica-bella.myshopify.com',
          accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || 'shpat_required',
        }
      });
    }

    const shopData = shop as any;

    // Check for mock status (connection failure)
    const isMock = (prisma as any)._isMock || false;

    return NextResponse.json({
      id: shop.id,
      dbStatus: isMock ? 'mock_failure' : 'connected',
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
    const { shopId, shopDomain: bodyDomain, ...updates } = body;

    const envDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const targetDomain = envDomain || bodyDomain;

    let shop = null;

    // 1. Try finding by ID if provided (most reliable)
    if (shopId) {
      shop = await prisma.shop.findUnique({ where: { id: shopId } });
    }

    // 2. Try finding by domain
    if (!shop && targetDomain) {
      shop = await prisma.shop.findFirst({ where: { domain: targetDomain } });
    }

    // 3. Try finding ANY shop record
    if (!shop) {
      shop = await prisma.shop.findFirst();
    }

    // 4. Create a record if none exist at all
    if (!shop) {
      console.log('[Settings API] No shop found, initializing new record...');
      shop = await prisma.shop.create({
        data: {
          domain: targetDomain || 'zica-bella.myshopify.com',
          accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || 'shpat_required',
        }
      });
    }

    // FINAL GUARD: Ensure shop is definitely not null before accessing .id
    if (!shop || !shop.id) {
      console.error('[Settings API] Critical Failure: Could not resolve or initialize a shop record.');
      return NextResponse.json({ error: 'System error: Shop record could not be resolved.' }, { status: 500 });
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

    // FAIL EXPLICITLY if database is in mock mode (production safety)
    if ((prisma as any)._isMock) {
      throw new Error("Database connection is currently MOCKED (missing DATABASE_URL). Cannot persist changes to permanent storage.");
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data,
    });
    
    clearShopConfigCache();

    console.log(`[Settings API] Successfully persisted settings for ${updatedShop.domain}`);
    return NextResponse.json({ success: true, shopDomain: updatedShop.domain });
  } catch (e: any) {
    console.error('[Settings API PATCH Error]:', e);
    return NextResponse.json({ error: `Save failed: ${e.message}` }, { status: 500 });
  }
}
