"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export interface RingItem {
  id: string;
  image: string;
  link?: string;
  title?: string;
  price?: string;
}

const DEFAULT_RINGS: RingItem[] = [
  { id: "1", image: "https://images.unsplash.com/photo-1605100804763-247f67b2548e?q=80&w=600" },
  { id: "2", image: "https://images.unsplash.com/photo-1599643477874-ce4fcdfeff2b?q=80&w=600" },
];

interface RingCarouselSectionProps {
  title?: string;
  itemsConfig?: string;
}

export default function RingCarouselSection({ title = "RING COLLECTION", itemsConfig }: RingCarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<RingItem[]>(DEFAULT_RINGS);

  useEffect(() => {
    if (itemsConfig) {
      try {
        const parsed = JSON.parse(itemsConfig);
        if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
      } catch (e) {
        // keep defaults
      }
    }
  }, [itemsConfig]);

  return (
    <section className="w-full mt-1 mb-1">
      <div className="px-1.5">
        {/* Apple Liquid Glass Card */}
        <div
          className="relative rounded-[1.75rem] overflow-hidden py-5 px-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.10)",
          }}
        >
          {/* Inner top glow */}
          <div
            className="absolute inset-0 rounded-[1.75rem] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 70%)" }}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1.5 relative z-10">
            <h2 className="text-[7.5px] font-semibold tracking-[0.4em] text-foreground/35 uppercase">
              {title}
            </h2>
            <a
              href="/collections/accessories"
              className="flex items-center gap-0.5 group"
              aria-label="View all accessories"
            >
              <ArrowRight
                className="w-3 h-3 text-foreground/22 group-hover:text-foreground/50 transition-colors"
                strokeWidth={1.5}
              />
            </a>
          </div>

          {/* Carousel */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-0.5 touch-pan-x scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
          >
            {items.map((item, i) => (
              <motion.a
                key={item.id}
                href={item.link || `/collections/accessories`}
                draggable={false}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="snap-center shrink-0 group block"
                style={{ width: 110 }}
              >
                {/* Just the image — no box, no price, no label */}
                <div className="w-full aspect-[4/5] flex items-center justify-center">
                  <img
                    src={item.image}
                    alt="ring"
                    draggable={false}
                    className="w-[95%] h-[95%] object-contain mix-blend-multiply dark:mix-blend-normal select-none"
                  />
                </div>
              </motion.a>
            ))}
            <div className="shrink-0 w-1" />
          </div>
        </div>
      </div>
    </section>
  );
}
