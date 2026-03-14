"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { Bookmark, ShoppingBag, Plus } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useCart } from "@/lib/cart-context";
import MenuDrawer from "./MenuDrawer";
import CartDrawer from "./CartDrawer";
import BookmarkDrawer from "./BookmarkDrawer";
import { useBookmarks } from "@/lib/bookmark-context";

export default function StorefrontHeader({ collections: initialCollections = [] }: { collections?: any[] }) {
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

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 px-4 py-4 flex justify-between items-center pointer-events-none">
        {/* Left: Menu/Logo Island */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="h-10 w-10 flex items-center justify-center rounded-full glass-vibrancy active:scale-90 transition-all shadow-xl group border border-foreground/[0.08]"
            aria-label="Menu"
          >
            <Plus className="w-4 h-4 text-foreground/70 group-hover:rotate-90 transition-transform duration-300" />
          </button>
          
          <Link 
            href="/" 
            className="h-10 flex items-center gap-2 px-5 rounded-full glass-vibrancy active:scale-95 transition-transform shadow-xl border border-foreground/[0.08]"
          >
            <div className="relative w-5 h-5 flex-shrink-0">
              <NextImage
                src="/zica-bella-logo_8.png"
                alt="Zica Bella"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-rocaston text-[11px] tracking-[0.05em] text-foreground mt-0.5 uppercase whitespace-nowrap">ZICA BELLA</span>
          </Link>
        </div>

        {/* Right: Actions Island */}
        <div 
          className="flex items-center gap-1 h-10 p-1 px-1.5 rounded-full glass-vibrancy pointer-events-auto border border-foreground/[0.08] shadow-xl"
        >
          <ThemeToggle />
          <button 
            onClick={() => setIsBookmarkOpen(true)}
            aria-label="Bookmarks"
            className="relative h-8 w-8 flex items-center justify-center text-foreground/50 hover:text-foreground transition-all active:scale-90"
          >
            <Bookmark className="w-4 h-4" />
            {bookmarks.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setIsCartOpen(true)}
            aria-label="Cart"
            className="relative h-8 w-8 flex items-center justify-center text-foreground/50 hover:text-foreground transition-all active:scale-90"
          >
            <ShoppingBag className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            )}
          </button>
        </div>
      </header>

      {/* Drawers */}
      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <BookmarkDrawer isOpen={isBookmarkOpen} onClose={() => setIsBookmarkOpen(false)} />
    </>
  );
}
