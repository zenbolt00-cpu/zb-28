"use client";

import { X, User, Package, Info, Users, BookOpen, Handshake, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

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
  { id: "accessories",  title: "Accessories",  handle: "accessories" },
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
  { title: "Collaborations", url: "/collaborations", icon: Handshake },
  { title: "Blogs",          url: "/blogs",       icon: BookOpen },
  { title: "FAQ",            url: "/faq",         icon: Info },
  { title: "Community",      url: "/community",   icon: Users },
];

const SHOP_TERMS = ["T-shirt", "Jeans", "Pants", "Trousers", "Jorts", "Shirts"];

export default function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const [collections, setCollections] = useState<ShopifyCollection[]>(FALLBACK_COLLECTIONS);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const profileImage = session?.user?.image || (session as any)?.customer?.image;

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
            className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-2xl"
          />

          {/* Floating Glass Drawer — Left */}
          <motion.div
            initial={{ x: "-100%", opacity: 0, scale: 0.96 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: "-100%", opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 36, stiffness: 260, mass: 0.8 }}
            className="fixed inset-y-3 left-3 w-[88vw] max-w-[340px] z-[100] flex flex-col rounded-[2rem] overflow-hidden pointer-events-auto"
            style={{
              background: "rgba(8, 8, 8, 0.72)",
              backdropFilter: "blur(60px) saturate(200%)",
              WebkitBackdropFilter: "blur(60px) saturate(200%)",
              border: "1px solid rgba(255, 255, 255, 0.04)",
              boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            {/* ─── TOP BAR ─────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3 flex-shrink-0">
              <span className="text-[6.5px] tracking-[0.6em] uppercase text-white/15 font-extralight">
                ZICA BELLA
              </span>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-all active:scale-90"
              >
                <X className="w-3 h-3 text-white/25" strokeWidth={1.5} />
              </button>
            </div>

            {/* ─── ZONE A: Collections + Shop (TOP) ─── */}
            <div className="flex flex-1 min-h-0">
              <div className="flex-1 px-6 pt-3 pb-2 flex flex-col min-h-0">
                <p className="text-[5.5px] tracking-[0.5em] uppercase text-white/[0.08] mb-4 font-extralight">Collections</p>
                <div className="flex flex-col gap-2.5 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                  {loading
                    ? [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-3.5 w-3/4 bg-white/[0.02] rounded-md animate-pulse" />
                      ))
                    : collections.map((c) => (
                        <Link
                          key={c.id}
                          href={`/collections/${c.handle}`}
                          onClick={onClose}
                          className="group flex items-center justify-between"
                        >
                          <span className="text-[11px] text-white/35 group-hover:text-white/90 transition-colors duration-300 font-extralight uppercase tracking-[0.12em]">
                            {c.title}
                          </span>
                          <ChevronRight className="w-2.5 h-2.5 text-white/0 group-hover:text-white/30 transition-all duration-300 group-hover:translate-x-0.5" strokeWidth={1} />
                        </Link>
                      ))}
                </div>
              </div>

              <div className="w-[1px] bg-white/[0.02] my-8" />

              <div className="w-[32%] pt-3 pb-2 px-4 flex flex-col">
                <p className="text-[5.5px] tracking-[0.5em] uppercase text-white/[0.08] mb-4 font-extralight">Shop</p>
                <div className="flex flex-col gap-2.5">
                  {SHOP_TERMS.map((term) => (
                    <Link key={term} href={`/search?q=${term}`} onClick={onClose} className="group">
                      <span className="text-[10px] text-white/25 group-hover:text-white/70 transition-colors font-extralight tracking-[0.08em]">
                        {term}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── ZONE B: Primary Nav (BOTTOM) ─────── */}
            <nav className="px-6 pt-5 pb-3 flex flex-col border-t border-white/[0.02]">
              {PRIMARY_NAV.map(({ title, url }) => (
                <Link
                  key={title}
                  href={url}
                  onClick={onClose}
                  className="group flex items-center justify-between py-1.5"
                >
                  <span className="text-[18px] font-extralight text-white/45 group-hover:text-white transition-all duration-500 uppercase tracking-tight">
                    {title}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
              ))}
            </nav>

            {/* ─── ZONE C: Icon Dock (VERY BOTTOM) ──── */}
            <div className="mx-5 mb-5 mt-1 p-0.5 rounded-[1.5rem] flex items-center justify-around bg-white/[0.02] border border-white/[0.02]">
              <Link href={session ? "/profile" : "/login"} onClick={onClose} className="group flex flex-col items-center gap-0.5 flex-1 py-2.5 rounded-[1.3rem] hover:bg-white/[0.04] transition-all">
                {profileImage ? (
                  <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10 group-hover:border-white/30 transition-all">
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <User className="w-4 h-4 text-white/15 group-hover:text-white/50 transition-colors" strokeWidth={1} />
                )}
                <span className="text-[5.5px] font-extralight tracking-[0.3em] uppercase text-white/15 group-hover:text-white/40 transition-colors">Profile</span>
              </Link>
              <div className="w-[1px] h-5 bg-white/[0.02]" />
              <Link href="/orders" onClick={onClose} className="group flex flex-col items-center gap-0.5 flex-1 py-2.5 hover:bg-white/[0.04] rounded-[1.3rem] transition-all">
                <Package className="w-4 h-4 text-white/15 group-hover:text-white/50 transition-colors" strokeWidth={1} />
                <span className="text-[5.5px] font-extralight tracking-[0.3em] uppercase text-white/15 group-hover:text-white/40 transition-colors">Orders</span>
              </Link>
              <div className="w-[1px] h-5 bg-white/[0.02]" />
              <Link href="/story" onClick={onClose} className="group flex flex-col items-center gap-0.5 flex-1 py-2.5 hover:bg-white/[0.04] rounded-[1.3rem] transition-all">
                <Info className="w-4 h-4 text-white/15 group-hover:text-white/50 transition-colors" strokeWidth={1} />
                <span className="text-[5.5px] font-extralight tracking-[0.3em] uppercase text-white/15 group-hover:text-white/40 transition-colors">Story</span>
              </Link>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
