import { NextResponse } from 'next/server';
import { fetchMenu, fetchMenus } from '@/lib/shopify-admin';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const shop = await prisma.shop.findFirst() as any;
    if (!shop) {
      console.error('[Menu API] No shop record found in database');
      return NextResponse.json({ mainMenu: null, secondaryMenu: null });
    }

    const mainHandle = shop.mainMenuHandle;
    const secondaryHandle = shop.secondaryMenuHandle;
    
    const allMenus = await fetchMenus();
    
    // Get enabled menu handles
    const enabledMenuHandles = shop.enabledCollectionsMenu ? JSON.parse(shop.enabledCollectionsMenu) : [];
    const hasSpecificMenuConfig = enabledMenuHandles.length > 0;

    // Helper to filter menu items based on collection visibility
    const filterMenuItems = (items: any[]) => {
      if (!items) return [];
      return items.filter(item => {
        const url = item.url || '';
        // If it's a collection link, check visibility
        if (url.includes('/collections/')) {
          const handle = url.split('/collections/')[1]?.split('?')[0]?.split('#')[0];
          if (handle && hasSpecificMenuConfig && !enabledMenuHandles.includes(handle)) {
            return false;
          }
        }
        // Recursively filter sub-items
        if (item.items) {
          item.items = filterMenuItems(item.items);
        }
        return true;
      });
    };

    const mainMenu = mainHandle ? allMenus.find(m => m.handle === mainHandle) : null;
    const secondaryMenu = secondaryHandle ? allMenus.find(m => m.handle === secondaryHandle) : null;
    
    if (mainMenu) mainMenu.items = filterMenuItems(mainMenu.items);
    if (secondaryMenu) secondaryMenu.items = filterMenuItems(secondaryMenu.items);
    
    // Fallback logic if nothing found
    if (!mainMenu && !secondaryMenu && allMenus.length > 0) {
      const fallbackMain = { ...allMenus[0] };
      fallbackMain.items = filterMenuItems(fallbackMain.items);
      return NextResponse.json({ 
        mainMenu: fallbackMain, 
        secondaryMenu: allMenus[1] ? { ...allMenus[1], items: filterMenuItems(allMenus[1].items) } : null 
      });
    }

    return NextResponse.json({ mainMenu, secondaryMenu }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    console.error('[Menu API] Fatal error fetching menus:', error);
    return NextResponse.json({ 
      mainMenu: { items: [{ title: 'Home', url: '/' }, { title: 'Catalog', url: '/search' }] },
      secondaryMenu: null 
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  }
}
