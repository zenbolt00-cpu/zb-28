"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { Bookmark, ShoppingBag, Plus, X, ChevronLeft } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useCart } from "@/lib/cart-context";
import MenuDrawer from "./MenuDrawer";
import CartDrawer from "./CartDrawer";
import BookmarkDrawer from "./BookmarkDrawer";
import { useBookmarks } from "@/lib/bookmark-context";
import { useRouter, usePathname } from "next/navigation";

export default function StorefrontHeader({ collections: initialCollections = [] }: { collections?: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useCart();
  const { bookmarks, isOpen: isBookmarkOpen, setIsOpen: setIsBookmarkOpen } = useBookmarks();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [collections, setCollections] = useState(initialCollections);

  useEffect(() => {
    if (initialCollections.length === 0) {
      fetch("/api/shopify/collections?location=header", { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCollections(data);
          }
        })
        .catch(err => console.error("Error fetching collections:", err));
    } else {
      setCollections(initialCollections);
    }
  }, [initialCollections]);

  const isHome = pathname === "/";
  const getPageTitle = () => {
    if (!pathname) return "ZICA BELLA";
    if (isHome) return "ZICA BELLA";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Zica Bella";
    let title = segments[segments.length - 1];
    // Convert slugs like "products-name" to "Products Name"
    title = title.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    return title;
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-1 flex items-center justify-between gap-2 pointer-events-none">
        
        {/* Box 1: Left Action Capsule (Circular Logo) */}
        <div className="flex-none pointer-events-auto">
          {isHome ? (
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-full glass-vibrancy shadow-lg border border-white/5 group active:scale-95 transition-all"
              aria-label="Menu"
            >
              <div className="relative w-6 h-6 opacity-80 group-hover:opacity-100 transition-opacity">
                <NextImage
                  src="/zb-logo-220px.png"
                  alt="Zica Bella"
                  fill
                  className="object-contain dark:invert"
                />
              </div>
            </button>
          ) : (
            <button 
              onClick={() => router.back()}
              className="h-9 w-9 flex items-center justify-center rounded-full glass-vibrancy shadow-lg border border-white/5 active:scale-95 transition-all group"
              aria-label="Back"
            >
              <ChevronLeft strokeWidth={1.5} className="w-5 h-5 text-foreground/60 transition-transform duration-300 group-hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Box 2: Center Identity Capsule (Minimalist Typography) */}
        <div className="flex-1 min-w-0 pointer-events-auto">
          <Link 
            href="/"
            className="h-9 flex items-center justify-center px-6 rounded-full glass-vibrancy shadow-lg border border-white/5 active:scale-[0.98] transition-all max-w-full"
          >
            <span className="text-[10px] sm:text-[11px] font-rocaston tracking-[0.08em] text-foreground/90 uppercase truncate pt-0.5">
              {getPageTitle()}
            </span>
          </Link>
        </div>

        {/* Box 3: Right Actions Capsule (Consolidated Island) */}
        <div className="flex-none pointer-events-auto">
          <div className="flex items-center gap-0 h-9 p-0.5 px-1 rounded-full glass-vibrancy shadow-lg border border-white/5">
            <ThemeToggle />

            <button 
              onClick={() => setIsBookmarkOpen(true)}
              aria-label="Bookmarks"
              className="relative h-8 w-8 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all active:scale-90"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarks.length > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_6px_hsla(var(--primary),0.5)]" />
              )}
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              aria-label="Cart"
              className="relative h-8 w-8 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all active:scale-90"
            >
              <ShoppingBag className="w-4 h-4" />
              {count > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_6px_hsla(var(--primary),0.5)]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Drawers */}
      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <BookmarkDrawer isOpen={isBookmarkOpen} onClose={() => setIsBookmarkOpen(false)} />
    </>
  );
}
