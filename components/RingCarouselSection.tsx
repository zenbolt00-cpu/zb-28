"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { handleImageError } from "./ImagePlaceholder";

export interface RingItem {
  id: string;
  image: string;
  link?: string;
  title?: string;
  price?: string;
  handle?: string;
}

interface RingCarouselSectionProps {
  title?: string;
  itemsConfig?: string;
}

export default function RingCarouselSection({ title = "RING COLLECTION", itemsConfig }: RingCarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<RingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try parsing configured items first
    if (itemsConfig) {
      try {
        const parsed = JSON.parse(itemsConfig);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        // fall through to API fetch
      }
    }

    // Fetch real products from the configured collection
    const fetchRings = async () => {
      try {
        let handle = "accessories";
        if (itemsConfig && itemsConfig !== "[]") {
          try {
             const parsed = JSON.parse(itemsConfig);
             if (Array.isArray(parsed) && parsed.length > 0) return; // Handled above
          } catch(e) {
             handle = itemsConfig; // Use as raw handle
          }
        }
        const res = await fetch(`/api/shopify/products?collection=${handle}&limit=12`);
        if (res.ok) {
          const data = await res.json();
          let products = Array.isArray(data) ? data : data.products || [];
          
          // Fallback if the specific collection is empty
          if (products.length === 0) {
            const fallbackRes = await fetch("/api/shopify/products?limit=6");
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              products = Array.isArray(fallbackData) ? fallbackData : fallbackData.products || [];
            }
          }

          if (products.length > 0) {
            const mapped: RingItem[] = products.map((p: any) => ({
              id: p.id?.toString() || `ring-${Math.random()}`,
              image: p.images?.[0]?.src || p.image?.src || "",
              link: `/products/${p.handle || p.id}`,
              title: p.title,
              price: p.variants?.[0]?.price,
              handle: p.handle || p.id?.toString(),
            })).filter((r: RingItem) => r.image);
            if (mapped.length > 0) {
              setItems(mapped.slice(0, 10)); // Limit to 10 for minimalist look
              setLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch ring products:", e);
      }
      setLoading(false);
    };

    fetchRings();
  }, [itemsConfig]);

  // Don't render section if no items and not loading
  if (!loading && items.length === 0) return null;

  return (
    <section className="w-full mt-1 mb-1">
      <div className="px-1.5">
        <div
          className="relative rounded-[1.25rem] overflow-hidden py-4 px-2.5"
          style={{
            background: "rgba(255, 255, 255, 0.01)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Inner top glow - removed for maximum minimalism if needed, or subtle glass */}
          <div
            className="absolute inset-0 rounded-[1.75rem] pointer-events-none"
            style={{ 
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
              backdropFilter: "blur(20px)"
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-2.5 px-1 relative z-10">
            <h2 className="text-[7.5px] font-semibold tracking-[0.3em] text-foreground/40 uppercase">
              {title}
            </h2>
            <Link
              href="/collections/accessories"
              className="flex items-center gap-0.5 group"
              aria-label="View all accessories"
            >
              <ArrowRight
                className="w-3 h-3 text-foreground/20 group-hover:text-foreground/40 transition-colors"
                strokeWidth={1.5}
              />
            </Link>
          </div>

          {/* Carousel */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-foreground/10" />
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex items-center gap-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory touch-pan-x ios-scroll hide-scrollbar scroll-pl-1.5"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.03, ease: [0.23, 1, 0.32, 1] }}
                  className="snap-center shrink-0 w-[95px] h-[95px]"
                >
                  <Link
                    href={`/products/${item.handle || item.id}`}
                    className="group block relative"
                    prefetch={false}
                  >
                    {/* Glass Image Container */}
                    <div 
                      className="w-[95px] h-[95px] rounded-2xl overflow-hidden relative transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-black/20"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.title || "ring"}
                        draggable={false}
                        loading="lazy"
                        onError={handleImageError}
                        className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      
                      {/* Subtle overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    </div>
                  </Link>
                </motion.div>
              ))}
              <div className="shrink-0 w-1" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
