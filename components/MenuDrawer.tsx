"use client";

import { X, ShoppingBag, User, Package, Info, ShieldCheck, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  title: string;
  url: string;
}

interface ShopifyCollection {
  id: string | number;
  title: string;
  handle: string;
}

// Static fallback collections — always shown even if API auth fails
const FALLBACK_COLLECTIONS: ShopifyCollection[] = [
  { id: "acid-tees",      title: "Acid Tees",     handle: "acid-tees" },
  { id: "leather-room",   title: "Leather Room",  handle: "leather-room" },
  { id: "rogue-winter",   title: "Rogue Winter",  handle: "rogue-winter" },
  { id: "drip-denim",     title: "Drip Denim",    handle: "drip-denim" },
  { id: "jortsy",         title: "Jortsy",         handle: "jortsy" },
  { id: "vexee-shirts",   title: "Vexee Shirts",  handle: "vexee-shirts" },
  { id: "all-drips",      title: "All Drips",     handle: "all-drips" },
];

export default function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const [mainMenu, setMainMenu] = useState<MenuItem[]>([]);
  const [collections, setCollections] = useState<ShopifyCollection[]>(FALLBACK_COLLECTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Fetch menu and collections in parallel, with graceful fallback
      Promise.allSettled([
        fetch("/api/shopify/menu").then(res => res.ok ? res.json() : Promise.reject()),
        fetch("/api/shopify/collections?location=menu").then(res => res.ok ? res.json() : Promise.reject()),
      ]).then(([menuResult, collectionsResult]) => {
        // Menu items
        if (menuResult.status === "fulfilled") {
          const menuData = menuResult.value;
          const mainItems = Array.isArray(menuData.mainMenu?.items) ? menuData.mainMenu.items : [];
          const secondaryItems = Array.isArray(menuData.secondaryMenu?.items) ? menuData.secondaryMenu.items : [];
          setMainMenu([...mainItems, ...secondaryItems]);
        }
        // Collections — use API result if valid, otherwise keep fallback
        if (collectionsResult.status === "fulfilled") {
          const apiCollections = collectionsResult.value;
          if (Array.isArray(apiCollections) && apiCollections.length > 0) {
            setCollections(apiCollections);
          }
          // else: keep FALLBACK_COLLECTIONS already set via useState default
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  const cleanUrl = (url: string) => {
    if (!url) return "/";
    try {
      if (url.includes(".myshopify.com")) {
        const parts = url.split(".myshopify.com");
        return parts[parts.length - 1] || "/";
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-lg"
          />

          {/* Floating Glass Drawer — Left */}
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 220, mass: 0.9 }}
            className="fixed inset-y-3 left-3 w-[82vw] max-w-[350px] z-[100] flex flex-col rounded-[2rem] overflow-hidden pointer-events-auto"
            style={{
              background: "hsla(var(--glass-bg), 0.70)",
              backdropFilter: "blur(52px) saturate(230%) brightness(1.05)",
              WebkitBackdropFilter: "blur(52px) saturate(230%) brightness(1.05)",
              boxShadow: "inset 0 0 0 1px hsla(var(--glass-border), 0.12), inset 0 1px 0 hsla(255,255,255,0.08), 0 32px 80px -8px rgba(0,0,0,0.4)",
            }}
          >
            {/* ─── ZONE 1: TOP BAR ─────────────────── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <span
                className="text-[9px] tracking-[0.6em] uppercase opacity-20"
                style={{ fontFamily: "ui-monospace, SF Mono, Menlo, monospace", fontWeight: 300 }}
              >
                ZB · Menu
              </span>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-foreground/[0.06] bg-foreground/[0.03] hover:bg-foreground/[0.07] transition-all active:scale-90"
              >
                <X className="w-3 h-3 text-foreground/30" />
              </button>
            </div>

            {/* ─── ZONE 2: DISCOVERY NAV ───────────── */}
            <nav className="px-6 pt-2 pb-2 flex flex-col">
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-7 w-1/2 bg-foreground/[0.02] rounded-lg animate-pulse" />)}
                </div>
              ) : (mainMenu.length > 0 ? mainMenu : [
                  { title: "Community",      url: "/community" },
                  { title: "Collaborations", url: "/collections" },
                  { title: "Blogs",          url: "/blogs" },
                ]).map((item, idx) => (
                <Link
                  key={`${item.title}-${idx}`}
                  href={cleanUrl(item.url)}
                  onClick={onClose}
                  className="group flex items-baseline gap-2 py-0.5"
                >
                  <span
                    className="text-[20px] leading-snug tracking-[-0.025em] text-foreground/20 group-hover:text-foreground/75 transition-all duration-400"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 300 }}
                  >
                    {item.title}
                  </span>
                  <span
                    className="text-[7px] text-foreground/10 group-hover:text-foreground/30 transition-colors duration-500 opacity-0 group-hover:opacity-100 uppercase tracking-widest"
                    style={{ fontFamily: "ui-monospace, monospace" }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </Link>
              ))}
            </nav>

            {/* ─── SEPARATOR ─────────────────────── */}
            <div className="mx-6 h-[0.5px] bg-foreground/[0.04]" />

            {/* ─── ZONE 3: 2-COL LAYOUT — Collections | Essentials ─── */}
            <div className="flex flex-1 min-h-0 gap-0">

              {/* Collections — left col */}
              <div className="flex-1 px-6 pt-4 pb-2 flex flex-col min-h-0 overflow-hidden">
                <p
                  className="text-[6px] tracking-[0.5em] uppercase text-foreground/15 mb-3"
                  style={{ fontFamily: "ui-monospace, monospace" }}
                >
                  Collections
                </p>
                <div className="flex flex-col gap-0 flex-1 min-h-0">
                  {collections.slice(0, 7).map((c) => (
                    <Link
                      key={c.id}
                      href={`/collections/${c.handle}`}
                      onClick={onClose}
                      className="group py-1.5"
                    >
                      <span
                        className="text-[11px] leading-tight text-foreground/30 group-hover:text-foreground/80 transition-colors duration-300 uppercase"
                        style={{ fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)", fontWeight: 300, letterSpacing: "0.04em" }}
                      >
                        {c.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Thin separator */}
              <div className="w-[0.5px] bg-foreground/[0.04] my-4" />

              {/* Essentials — right col */}
              <div className="w-[40%] pt-4 pb-2 px-4 flex flex-col">
                <p
                  className="text-[6px] tracking-[0.5em] uppercase text-foreground/15 mb-3"
                  style={{ fontFamily: "ui-monospace, monospace" }}
                >
                  Shop
                </p>
                <div className="flex flex-col gap-1.5">
                  {["T-shirt", "Jeans", "Pants", "Trousers", "Jorts", "Shirts"].map((term) => (
                    <Link
                      key={term}
                      href={`/search?q=${term}`}
                      onClick={onClose}
                      className="group"
                    >
                      <span
                        className="text-[10px] text-foreground/25 group-hover:text-foreground/65 transition-colors"
                        style={{ fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)", fontWeight: 200 }}
                      >
                        {term}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>

            {/* ─── ZONE 4: BOTTOM ICON BAR ─────────── */}
            <div className="mx-4 my-3 p-2 rounded-2xl flex items-center justify-around gap-1" style={{ background: "hsla(var(--glass-bg), 0.3)", border: "1px solid hsla(var(--glass-border), 0.06)" }}>
              <Link href="/login" onClick={onClose} className="group flex flex-col items-center gap-1 flex-1 py-2 rounded-xl hover:bg-foreground/[0.04] transition-all">
                <User className="w-4 h-4 text-foreground/25 group-hover:text-foreground/60 transition-colors" />
                <span className="text-[7px] tracking-widest uppercase text-foreground/20 group-hover:text-foreground/50 transition-colors" style={{ fontFamily: "ui-monospace, monospace" }}>Profile</span>
              </Link>
              <div className="w-[0.5px] h-8 bg-foreground/[0.06]" />
              <Link href="/orders" onClick={onClose} className="group flex flex-col items-center gap-1 flex-1 py-2 rounded-xl hover:bg-foreground/[0.04] transition-all">
                <Package className="w-4 h-4 text-foreground/25 group-hover:text-foreground/60 transition-colors" />
                <span className="text-[7px] tracking-widest uppercase text-foreground/20 group-hover:text-foreground/50 transition-colors" style={{ fontFamily: "ui-monospace, monospace" }}>Orders</span>
              </Link>
              <div className="w-[0.5px] h-8 bg-foreground/[0.06]" />
              <Link href="/our-story" onClick={onClose} className="group flex flex-col items-center gap-1 flex-1 py-2 rounded-xl hover:bg-foreground/[0.04] transition-all">
                <Info className="w-4 h-4 text-foreground/25 group-hover:text-foreground/60 transition-colors" />
                <span className="text-[7px] tracking-widest uppercase text-foreground/20 group-hover:text-foreground/50 transition-colors" style={{ fontFamily: "ui-monospace, monospace" }}>Story</span>
              </Link>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
