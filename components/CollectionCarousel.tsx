"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";

interface Collection {
  id: string | number;
  title: string;
  handle: string;
  image?: { src: string } | null;
}

const FALLBACKS = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552346154-21d328109967?q=80&w=800&auto=format&fit=crop",
];

export default function CollectionCarousel({ collections }: { collections: Collection[] }) {
  const [index, setIndex] = useState(0);
  const x = useMotionValue(0);
  const total = collections.length;

  // Handle Drag / Swipe Snapping
  const onDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      setIndex((i) => (i + 1) % total);
    } else if (info.offset.x > threshold) {
      setIndex((i) => (i - 1 + total) % total);
    }
  };

  if (!total) return null;

  return (
    <div className="relative w-full overflow-hidden py-10 touch-none">
      <div className="relative h-[85vw] max-h-[460px] w-full flex items-center justify-center">
        {/* The Drag Container */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={onDragEnd}
          className="relative w-full h-full flex items-center justify-center"
          style={{ x, perspective: "1200px", transformStyle: "preserve-3d" }}
        >
          {collections.map((col, i) => {
            // Virtual indices for circular behavior
            let diff = i - index;
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            return (
              <CollectionCard
                key={col.id}
                collection={col}
                diff={diff}
                isActive={Math.abs(diff) < 0.1} // Use threshold for float-like index math if needed
                fallback={FALLBACKS[i % FALLBACKS.length]}
              />
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

function CollectionCard({
  collection,
  diff,
  isActive,
  fallback
}: {
  collection: Collection;
  diff: number;
  isActive: boolean;
  fallback: string;
}) {
  // Calculate visibility
  const isVisible = Math.abs(diff) <= 2;

  if (!isVisible) return null;

  return (
    <motion.div
      initial={false}
      animate={{
        x: diff * 220, // Horizontal offset
        scale: isActive ? 1 : 0.8,
        rotateY: diff * 35, // 3D Tilt
        z: isActive ? 0 : -150, // Depth
        opacity: Math.abs(diff) > 1 ? 0 : 1 - Math.abs(diff) * 0.4,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 32,
        mass: 1
      }}
      className="absolute w-[72vw] max-w-[320px] aspect-[3/4.2] rounded-[2.5rem] overflow-hidden shadow-2xl origin-center"
      style={{
        zIndex: 10 - Math.round(Math.abs(diff)),
        pointerEvents: isActive ? "auto" : "none",
        backfaceVisibility: "hidden",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <Link href={`/collections/${collection.handle}`} className="block w-full h-full relative">
        <Image
          src={collection.image?.src || fallback}
          alt={collection.title}
          fill
          sizes="(max-width: 768px) 80vw, 320px"
          className="object-cover"
          priority={isActive}
        />
        
        {/* Dynamic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />
        
        {/* Title Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-8 text-center">
          <motion.p 
            animate={{ 
              y: isActive ? 0 : 10,
              opacity: isActive ? 1 : 0
            }}
            className="font-heading text-[12px] uppercase tracking-[0.3em] text-white"
          >
            {collection.title}
          </motion.p>
        </div>

        {/* Glass Edge Highlight */}
        <div className="absolute inset-0 border border-white/10 rounded-[2.5rem] pointer-events-none" />
      </Link>
    </motion.div>
  );
}
