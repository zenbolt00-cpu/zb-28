"use client";

import { X, User, Package, Info, Users, BookOpen, Handshake } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShopifyCollection {
  id: string | number;
  title: string;
  handle: string;
}

// Static fallback collections — always shown even if API auth fails
const FALLBACK_COLLECTIONS: ShopifyCollection[] = [
  { id: "acid-tees",    title: "Acid Tees",    handle: "acid-tees" },
  { id: "leather-room", title: "Leather Room", handle: "leather-room" },
  { id: "rogue-winter", title: "Rogue Winter", handle: "rogue-winter" },
  { id: "drip-denim",   title: "Drip Denim",   handle: "drip-denim" },
  { id: "jortsy",       title: "Jortsy",        handle: "jortsy" },
  { id: "vexee-shirts", title: "Vexee Shirts", handle: "vexee-shirts" },
  { id: "all-drips",    title: "All Drips",    handle: "all-drips" },
];

// These are ALWAYS shown in the bottom nav — not from Shopify
const PRIMARY_NAV = [
  { title: "Community",      url: "/community",   icon: Users },
  { title: "Collaborations", url: "/collections", icon: Handshake },
  { title: "Blogs",          url: "/blogs",       icon: BookOpen },
];

const SHOP_TERMS = ["T-shirt", "Jeans", "Pants", "Trousers", "Jorts", "Shirts"];

export default function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const [collections, setCollections] = useState<ShopifyCollection[]>(FALLBACK_COLLECTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/shopify/collections?location=menu")
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) setCollections(data);
        })
        .catch(() => {/* keep FALLBACK_COLLECTIONS */})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

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
            className="fixed inset-y-3 left-3 w-[82vw] max-w-[340px] z-[100] flex flex-col rounded-[2rem] overflow-hidden pointer-events-auto"
            style={{
              background: "hsla(var(--glass-bg), 0.72)",
              backdropFilter: "blur(52px) saturate(230%) brightness(1.05)",
              WebkitBackdropFilter: "blur(52px) saturate(230%) brightness(1.05)",
              boxShadow: "inset 0 0 0 1px hsla(var(--glass-border), 0.12), inset 0 1px 0 rgba(255,255,255,0.07), 0 32px 80px -8px rgba(0,0,0,0.4)",
            }}
          >
            {/* ─── TOP BAR ─────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2 flex-shrink-0">
              <span
                className="text-[8px] tracking-[0.55em] uppercase opacity-15"
                style={{ fontFamily: "ui-monospace, SF Mono, Menlo, monospace", fontWeight: 300 }}
              >
                ZB · MENU
              </span>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-foreground/[0.06] bg-foreground/[0.03] hover:bg-foreground/[0.08] transition-all active:scale-90"
              >
                <X className="w-3 h-3 text-foreground/30" />
              </button>
            </div>

            {/* ─── ZONE A: Collections + Shop (TOP) ─── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

              {/* Collections — left col */}
              <div className="flex-1 px-6 pt-3 pb-2 flex flex-col min-h-0 overflow-hidden">
                <p
                  className="text-[6px] tracking-[0.5em] uppercase text-foreground/15 mb-2 flex-shrink-0"
                  style={{ fontFamily: "ui-monospace, monospace" }}
                >
                  Collections
                </p>
                <div className="flex flex-col min-h-0 overflow-hidden">
                  {loading
                    ? [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-5 w-3/4 bg-foreground/[0.02] rounded-md animate-pulse mb-2" />
                      ))
                    : collections.slice(0, 7).map((c) => (
                        <Link
                          key={c.id}
                          href={`/collections/${c.handle}`}
                          onClick={onClose}
                          className="group py-1"
                        >
                          <span
                            className="text-[11px] leading-tight text-foreground/55 group-hover:text-foreground/95 transition-colors duration-200 uppercase"
                            style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 400, letterSpacing: "0.05em" }}
                          >
                            {c.title}
                          </span>
                        </Link>
                      ))}
                </div>
              </div>

              {/* Thin divider */}
              <div className="w-[0.5px] bg-foreground/[0.04] my-4 flex-shrink-0" />

              {/* Shop terms — right col */}
              <div className="w-[42%] pt-3 pb-2 px-4 flex flex-col flex-shrink-0">
                <p
                  className="text-[6px] tracking-[0.5em] uppercase text-foreground/15 mb-2"
                  style={{ fontFamily: "ui-monospace, monospace" }}
                >
                  Shop
                </p>
                <div className="flex flex-col gap-1">
                  {SHOP_TERMS.map((term) => (
                    <Link key={term} href={`/search?q=${term}`} onClick={onClose} className="group">
                      <span
                        className="text-[10px] text-foreground/45 group-hover:text-foreground/85 transition-colors"
                        style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 300 }}
                      >
                        {term}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── THIN SEPARATOR ──────────────────── */}
            <div className="mx-5 h-[0.5px] bg-foreground/[0.05] flex-shrink-0" />

            {/* ─── ZONE B: Primary Nav (BOTTOM) ─────── */}
            <nav className="px-6 pt-3 pb-2 flex flex-col flex-shrink-0">
              <p
                className="text-[6px] tracking-[0.5em] uppercase text-foreground/15 mb-2"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                Discover
              </p>
              {PRIMARY_NAV.map(({ title, url }, idx) => (
                <Link
                  key={title}
                  href={url}
                  onClick={onClose}
                  className="group flex items-center justify-between py-0.5"
                >
                  <span
                    className="text-[17px] leading-snug tracking-[0.02em] font-heading text-foreground/70 group-hover:text-foreground transition-all duration-300 uppercase"
                  >
                    {title}
                  </span>
                  <span
                    className="text-[7px] opacity-0 group-hover:opacity-60 text-foreground/40 transition-opacity duration-300 uppercase tracking-widest"
                    style={{ fontFamily: "ui-monospace, monospace" }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </Link>
              ))}
            </nav>

            {/* ─── ZONE C: Icon Dock (VERY BOTTOM) ──── */}
            <div
              className="mx-4 mb-3 mt-2 p-1.5 rounded-2xl flex items-center justify-around flex-shrink-0"
              style={{
                background: "hsla(var(--glass-bg), 0.25)",
                border: "1px solid hsla(var(--glass-border), 0.07)",
              }}
            >
              <Link href="/login" onClick={onClose} className="group flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl hover:bg-foreground/[0.04] transition-all">
                <User className="w-3.5 h-3.5 text-foreground/20 group-hover:text-foreground/55 transition-colors" />
                <span className="text-[6px] tracking-widest uppercase text-foreground/18 group-hover:text-foreground/45" style={{ fontFamily: "ui-monospace, monospace" }}>Profile</span>
              </Link>
              <div className="w-[0.5px] h-7 bg-foreground/[0.06]" />
              <Link href="/orders" onClick={onClose} className="group flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl hover:bg-foreground/[0.04] transition-all">
                <Package className="w-3.5 h-3.5 text-foreground/20 group-hover:text-foreground/55 transition-colors" />
                <span className="text-[6px] tracking-widest uppercase text-foreground/18 group-hover:text-foreground/45" style={{ fontFamily: "ui-monospace, monospace" }}>Orders</span>
              </Link>
              <div className="w-[0.5px] h-7 bg-foreground/[0.06]" />
              <Link href="/our-story" onClick={onClose} className="group flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl hover:bg-foreground/[0.04] transition-all">
                <Info className="w-3.5 h-3.5 text-foreground/20 group-hover:text-foreground/55 transition-colors" />
                <span className="text-[6px] tracking-widest uppercase text-foreground/18 group-hover:text-foreground/45" style={{ fontFamily: "ui-monospace, monospace" }}>Story</span>
              </Link>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
